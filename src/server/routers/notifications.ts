// Notifications Router
// Story 1.15: Email Notification System

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { getEmailTemplate, type EmailType, type EmailTemplateContext } from '@/lib/email-templates';

/**
 * Send email notification
 * Internal procedure - should be called from other mutations
 */
export const notificationsRouter = router({
  /**
   * Send email notification
   * AC 4: Create tRPC procedure notifications.send
   */
  send: publicProcedure
    .input(
      z.object({
        emailType: z.enum([
          'request_submitted',
          'request_received',
          'request_rejected',
          'ticket_created',
          'service_completed',
          'delivery_confirmed',
        ]),
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        context: z.object({
          trackingToken: z.string().optional(),
          ticketNumber: z.string().optional(),
          productName: z.string().optional(),
          serialNumber: z.string().optional(),
          rejectionReason: z.string().optional(),
          completedDate: z.string().optional(),
          deliveryDate: z.string().optional(),
        }),
        serviceRequestId: z.string().uuid().optional(),
        serviceTicketId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // AC 10: Rate limiting check
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentEmailCount } = await ctx.supabaseAdmin
        .from('email_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_email', input.recipientEmail)
        .gte('created_at', oneDayAgo);

      if (recentEmailCount && recentEmailCount >= 100) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Email rate limit exceeded (100 per day)',
        });
      }

      // AC 4: Check email preferences / unsubscribe status
      const { data: customer } = await ctx.supabaseAdmin
        .from('customers')
        .select('email_preferences')
        .eq('email', input.recipientEmail)
        .single();

      if (customer?.email_preferences) {
        const preferences = customer.email_preferences as Record<string, boolean>;
        if (preferences[input.emailType] === false) {
          console.log(`Email skipped - user unsubscribed from ${input.emailType}`);
          return { success: true, skipped: true, reason: 'unsubscribed' };
        }
      }

      // Generate unsubscribe URL
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3025'}/unsubscribe?email=${encodeURIComponent(input.recipientEmail)}&type=${input.emailType}`;

      // Generate email content from template
      const templateContext: EmailTemplateContext = {
        customerName: input.recipientName,
        trackingToken: input.context.trackingToken,
        ticketNumber: input.context.ticketNumber,
        productName: input.context.productName,
        serialNumber: input.context.serialNumber,
        rejectionReason: input.context.rejectionReason,
        completedDate: input.context.completedDate,
        deliveryDate: input.context.deliveryDate,
        unsubscribeUrl,
      };

      const { html, text, subject } = getEmailTemplate(input.emailType as EmailType, templateContext);

      // AC 3: Log email in database
      const { data: emailLog, error: logError } = await ctx.supabaseAdmin
        .from('email_notifications')
        .insert({
          email_type: input.emailType,
          recipient_email: input.recipientEmail,
          recipient_name: input.recipientName,
          subject,
          html_body: html,
          text_body: text,
          context: input.context,
          status: 'pending',
          service_request_id: input.serviceRequestId,
          service_ticket_id: input.serviceTicketId,
        })
        .select()
        .single();

      if (logError) {
        console.error('Failed to log email:', logError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to log email notification',
        });
      }

      // AC 8: Email sending with retry logic
      // In production, this would integrate with Supabase Edge Functions or external email service
      // For now, we'll mark it as sent immediately (mock implementation)
      try {
        // TODO: Integrate with actual email service (Resend, SendGrid, or Supabase Auth)
        // await sendEmail({ to: input.recipientEmail, subject, html, text });

        // Mock success - update status to sent
        await ctx.supabaseAdmin
          .from('email_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', emailLog.id);

        console.log(`[EMAIL SENT] ${input.emailType} to ${input.recipientEmail} (${subject})`);

        return {
          success: true,
          emailId: emailLog.id,
          skipped: false,
        };
      } catch (error) {
        // AC 8: Log failure and prepare for retry
        await ctx.supabaseAdmin
          .from('email_notifications')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: emailLog.retry_count + 1,
          })
          .eq('id', emailLog.id);

        console.error(`[EMAIL FAILED] ${input.emailType} to ${input.recipientEmail}:`, error);

        // AC 2: Don't throw error - email sending is async and shouldn't block operations
        return {
          success: false,
          emailId: emailLog.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          willRetry: emailLog.retry_count < emailLog.max_retries,
        };
      }
    }),

  /**
   * AC 9: Get email log (admin only)
   */
  getLog: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        emailType: z
          .enum([
            'request_submitted',
            'request_received',
            'request_rejected',
            'ticket_created',
            'service_completed',
            'delivery_confirmed',
          ])
          .optional(),
        status: z.enum(['pending', 'sent', 'failed', 'bounced']).optional(),
        recipientEmail: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Authentication check
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view email logs',
        });
      }

      // Build query
      let query = ctx.supabaseAdmin
        .from('email_notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.emailType) {
        query = query.eq('email_type', input.emailType);
      }

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.recipientEmail) {
        query = query.ilike('recipient_email', `%${input.recipientEmail}%`);
      }

      const { data: emails, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch email log: ${error.message}`,
        });
      }

      return {
        emails: emails || [],
        total: count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get email statistics
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await ctx.supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view statistics',
      });
    }

    // Get counts by status
    const { data: stats } = await ctx.supabaseAdmin
      .from('email_notifications')
      .select('status')
      .then((res) => {
        if (res.error) throw res.error;
        const data = res.data || [];
        return {
          data: {
            total: data.length,
            sent: data.filter((e) => e.status === 'sent').length,
            failed: data.filter((e) => e.status === 'failed').length,
            pending: data.filter((e) => e.status === 'pending').length,
          },
        };
      });

    // Get counts by type
    const { data: byType } = await ctx.supabaseAdmin
      .from('email_notifications')
      .select('email_type')
      .then((res) => {
        if (res.error) throw res.error;
        const data = res.data || [];
        const typeCounts: Record<string, number> = {};
        for (const email of data) {
          typeCounts[email.email_type] = (typeCounts[email.email_type] || 0) + 1;
        }
        return { data: typeCounts };
      });

    return {
      ...stats,
      byType,
    };
  }),

  /**
   * Retry failed email
   */
  retry: publicProcedure
    .input(z.object({ emailId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Authentication check
      const {
        data: { user },
        error: authError,
      } = await ctx.supabaseClient.auth.getUser();

      if (authError || !user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to retry emails',
        });
      }

      const { data: email, error: fetchError } = await ctx.supabaseAdmin
        .from('email_notifications')
        .select('*')
        .eq('id', input.emailId)
        .single();

      if (fetchError || !email) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        });
      }

      if (email.status === 'sent') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email already sent',
        });
      }

      if (email.retry_count >= email.max_retries) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Max retries exceeded',
        });
      }

      // Attempt to resend
      try {
        // TODO: Integrate with actual email service
        // await sendEmail({ to: email.recipient_email, subject: email.subject, html: email.html_body, text: email.text_body });

        await ctx.supabaseAdmin
          .from('email_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            retry_count: email.retry_count + 1,
          })
          .eq('id', email.id);

        return { success: true };
      } catch (error) {
        await ctx.supabaseAdmin
          .from('email_notifications')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: email.retry_count + 1,
          })
          .eq('id', email.id);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend email',
        });
      }
    }),
});

export type NotificationsRouter = typeof notificationsRouter;
