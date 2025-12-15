/**
 * Story 1.17: Dynamic Template Switching
 * Story 01.22: Ticket Completion with Replacement Product
 * Client component for ticket detail actions
 * Includes Edit, Switch Template, and Complete Ticket buttons
 */

"use client";

import {
  IconArrowsRightLeft,
  IconCircleCheck,
  IconEdit,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { CompleteTicketModal } from "@/components/modals/complete-ticket-modal";
import { SwitchTemplateModal } from "@/components/modals/switch-template-modal";
import { Button } from "@/components/ui/button";

interface TicketActionsProps {
  ticketId: string;
  ticketNumber: string;
  ticketStatus: string;
  warrantyType: string;
  currentTemplateId?: string;
  currentTemplateName?: string;
}

export function TicketActions({
  ticketId,
  ticketNumber,
  ticketStatus,
  warrantyType,
  currentTemplateId,
  currentTemplateName,
}: TicketActionsProps) {
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  // Only show actions if ticket is not completed/cancelled
  const canModify = !["completed", "cancelled"].includes(ticketStatus);
  // Can complete if ticket is in_progress or ready_for_pickup
  const canComplete = ["in_progress", "ready_for_pickup"].includes(
    ticketStatus,
  );

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Link href={`/operations/tickets/${ticketId}/edit`}>
        <Button variant="outline" size="sm">
          <IconEdit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </Link>

      {/* Switch Template Button */}
      {canModify && currentTemplateId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSwitchModalOpen(true)}
        >
          <IconArrowsRightLeft className="h-4 w-4" />
          Đổi Template
        </Button>
      )}

      {/* Complete Ticket Button */}
      {canComplete && (
        <Button size="sm" onClick={() => setCompleteModalOpen(true)}>
          <IconCircleCheck className="h-4 w-4" />
          Hoàn thành phiếu
        </Button>
      )}

      {/* Switch Template Modal */}
      {currentTemplateId && (
        <SwitchTemplateModal
          open={switchModalOpen}
          onClose={() => setSwitchModalOpen(false)}
          ticketId={ticketId}
          currentTemplateId={currentTemplateId}
          currentTemplateName={currentTemplateName}
        />
      )}

      {/* Complete Ticket Modal */}
      <CompleteTicketModal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        ticketId={ticketId}
        ticketNumber={ticketNumber}
        warrantyType={warrantyType}
      />
    </div>
  );
}
