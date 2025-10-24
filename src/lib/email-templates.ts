// Email Template System
// Story 1.15: Email Notification System - 6 Key Moments

export type EmailType =
  | 'request_submitted'
  | 'request_received'
  | 'request_rejected'
  | 'ticket_created'
  | 'service_completed'
  | 'delivery_confirmed';

export interface EmailTemplateContext {
  customerName: string;
  trackingToken?: string;
  ticketNumber?: string;
  productName?: string;
  serialNumber?: string;
  rejectionReason?: string;
  completedDate?: string;
  deliveryDate?: string;
  unsubscribeUrl: string;
}

/**
 * Base HTML email layout
 */
function createEmailLayout(content: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSTC Service Center</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      color: #374151;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #2563eb;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-label {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 18px;
      color: #2563eb;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .unsubscribe {
      margin-top: 16px;
      font-size: 11px;
    }
    .unsubscribe a {
      color: #6b7280;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">SSTC Service Center</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>SSTC Service Center - Trung tâm Bảo hành Dịch vụ</p>
      <p>Hotline: <a href="tel:+84123456789">+84 123 456 789</a> | Email: <a href="mailto:support@sstc.vn">support@sstc.vn</a></p>
      <div class="unsubscribe">
        <p>Không muốn nhận email thông báo nữa? <a href="${unsubscribeUrl}">Hủy đăng ký</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email Template 1: Service Request Submitted
 */
export function requestSubmittedTemplate(ctx: EmailTemplateContext): { html: string; text: string; subject: string } {
  const html = createEmailLayout(`
    <h2>Yêu cầu dịch vụ đã được tiếp nhận</h2>
    <p>Xin chào <strong>${ctx.customerName}</strong>,</p>
    <p>Cảm ơn bạn đã gửi yêu cầu dịch vụ tại SSTC Service Center. Chúng tôi đã tiếp nhận yêu cầu của bạn.</p>

    <div class="info-box">
      <div class="info-label">Mã theo dõi của bạn:</div>
      <div class="info-value">${ctx.trackingToken}</div>
    </div>

    ${ctx.productName ? `<p><strong>Sản phẩm:</strong> ${ctx.productName}</p>` : ''}
    ${ctx.serialNumber ? `<p><strong>Serial:</strong> ${ctx.serialNumber}</p>` : ''}

    <p><strong>Các bước tiếp theo:</strong></p>
    <ul>
      <li>Nhân viên của chúng tôi sẽ xem xét yêu cầu trong vòng 24 giờ</li>
      <li>Bạn sẽ nhận được email thông báo khi yêu cầu được xử lý</li>
      <li>Sử dụng mã theo dõi để kiểm tra tình trạng bất cứ lúc nào</li>
    </ul>

    <a href="https://service.sstc.vn/service-request/track?token=${ctx.trackingToken}" class="button">
      Theo dõi yêu cầu
    </a>

    <p>Nếu có thắc mắc, vui lòng liên hệ hotline của chúng tôi.</p>
  `, ctx.unsubscribeUrl);

  const text = `
Yêu cầu dịch vụ đã được tiếp nhận

Xin chào ${ctx.customerName},

Cảm ơn bạn đã gửi yêu cầu dịch vụ tại SSTC Service Center. Chúng tôi đã tiếp nhận yêu cầu của bạn.

Mã theo dõi: ${ctx.trackingToken}
${ctx.productName ? `Sản phẩm: ${ctx.productName}` : ''}
${ctx.serialNumber ? `Serial: ${ctx.serialNumber}` : ''}

Các bước tiếp theo:
- Nhân viên của chúng tôi sẽ xem xét yêu cầu trong vòng 24 giờ
- Bạn sẽ nhận được email thông báo khi yêu cầu được xử lý
- Sử dụng mã theo dõi để kiểm tra tình trạng bất cứ lúc nào

Theo dõi yêu cầu tại: https://service.sstc.vn/service-request/track?token=${ctx.trackingToken}

---
SSTC Service Center
Hotline: +84 123 456 789
Email: support@sstc.vn

Hủy đăng ký: ${ctx.unsubscribeUrl}
  `.trim();

  return {
    html,
    text,
    subject: `Yêu cầu dịch vụ #${ctx.trackingToken} đã được tiếp nhận`,
  };
}

/**
 * Email Template 2: Request Received by Staff
 */
export function requestReceivedTemplate(ctx: EmailTemplateContext): { html: string; text: string; subject: string } {
  const html = createEmailLayout(`
    <h2>Yêu cầu của bạn đã được tiếp nhận</h2>
    <p>Xin chào <strong>${ctx.customerName}</strong>,</p>
    <p>Nhân viên của chúng tôi đã xem xét và tiếp nhận yêu cầu dịch vụ của bạn.</p>

    <div class="info-box">
      <div class="info-label">Mã theo dõi:</div>
      <div class="info-value">${ctx.trackingToken}</div>
    </div>

    <p><strong>Trạng thái hiện tại:</strong> Đã tiếp nhận</p>

    <p><strong>Các bước tiếp theo:</strong></p>
    <ul>
      <li>Chúng tôi đang xử lý yêu cầu của bạn</li>
      <li>Bạn sẽ nhận được thông báo khi có cập nhật</li>
      <li>Phiếu dịch vụ sẽ được tạo trong thời gian sớm nhất</li>
    </ul>

    <a href="https://service.sstc.vn/service-request/track?token=${ctx.trackingToken}" class="button">
      Theo dõi yêu cầu
    </a>
  `, ctx.unsubscribeUrl);

  const text = `
Yêu cầu của bạn đã được tiếp nhận

Xin chào ${ctx.customerName},

Nhân viên của chúng tôi đã xem xét và tiếp nhận yêu cầu dịch vụ của bạn.

Mã theo dõi: ${ctx.trackingToken}
Trạng thái: Đã tiếp nhận

Theo dõi yêu cầu tại: https://service.sstc.vn/service-request/track?token=${ctx.trackingToken}

---
SSTC Service Center
Hủy đăng ký: ${ctx.unsubscribeUrl}
  `.trim();

  return {
    html,
    text,
    subject: `Yêu cầu #${ctx.trackingToken} đã được tiếp nhận`,
  };
}

/**
 * Email Template 3: Request Rejected
 */
export function requestRejectedTemplate(ctx: EmailTemplateContext): { html: string; text: string; subject: string } {
  const html = createEmailLayout(`
    <h2>Yêu cầu dịch vụ không được chấp nhận</h2>
    <p>Xin chào <strong>${ctx.customerName}</strong>,</p>
    <p>Rất tiếc, chúng tôi không thể chấp nhận yêu cầu dịch vụ của bạn vào lúc này.</p>

    <div class="info-box">
      <div class="info-label">Mã theo dõi:</div>
      <div class="info-value">${ctx.trackingToken}</div>
    </div>

    <p><strong>Lý do:</strong></p>
    <p style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px;">
      ${ctx.rejectionReason || 'Không đáp ứng điều kiện bảo hành'}
    </p>

    <p><strong>Bạn có thể:</strong></p>
    <ul>
      <li>Liên hệ hotline để được tư vấn thêm</li>
      <li>Gửi yêu cầu mới với thông tin đầy đủ hơn</li>
      <li>Đến trực tiếp trung tâm để được hỗ trợ</li>
    </ul>

    <p>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ ngay với chúng tôi.</p>

    <a href="https://service.sstc.vn/service-request" class="button">
      Gửi yêu cầu mới
    </a>
  `, ctx.unsubscribeUrl);

  const text = `
Yêu cầu dịch vụ không được chấp nhận

Xin chào ${ctx.customerName},

Rất tiếc, chúng tôi không thể chấp nhận yêu cầu dịch vụ của bạn.

Mã theo dõi: ${ctx.trackingToken}
Lý do: ${ctx.rejectionReason || 'Không đáp ứng điều kiện bảo hành'}

Bạn có thể liên hệ hotline hoặc gửi yêu cầu mới tại: https://service.sstc.vn/service-request

---
SSTC Service Center
Hotline: +84 123 456 789
Hủy đăng ký: ${ctx.unsubscribeUrl}
  `.trim();

  return {
    html,
    text,
    subject: `Yêu cầu #${ctx.trackingToken} không được chấp nhận`,
  };
}

/**
 * Email Template 4: Ticket Created / Service Started
 */
export function ticketCreatedTemplate(ctx: EmailTemplateContext): { html: string; text: string; subject: string } {
  const html = createEmailLayout(`
    <h2>Phiếu dịch vụ đã được tạo</h2>
    <p>Xin chào <strong>${ctx.customerName}</strong>,</p>
    <p>Chúng tôi đã tạo phiếu dịch vụ và bắt đầu xử lý sản phẩm của bạn.</p>

    <div class="info-box">
      <div class="info-label">Số phiếu dịch vụ:</div>
      <div class="info-value">${ctx.ticketNumber}</div>
    </div>

    ${ctx.trackingToken ? `<p><strong>Mã theo dõi gốc:</strong> ${ctx.trackingToken}</p>` : ''}
    ${ctx.productName ? `<p><strong>Sản phẩm:</strong> ${ctx.productName}</p>` : ''}

    <p><strong>Trạng thái hiện tại:</strong> Đang xử lý</p>

    <p><strong>Các bước tiếp theo:</strong></p>
    <ul>
      <li>Kỹ thuật viên sẽ kiểm tra và chẩn đoán sản phẩm</li>
      <li>Bạn sẽ nhận được cập nhật khi có tiến triển</li>
      <li>Thời gian xử lý dự kiến: 3-7 ngày làm việc</li>
    </ul>

    <p>Bạn có thể sử dụng số phiếu dịch vụ để theo dõi tiến độ.</p>
  `, ctx.unsubscribeUrl);

  const text = `
Phiếu dịch vụ đã được tạo

Xin chào ${ctx.customerName},

Chúng tôi đã tạo phiếu dịch vụ và bắt đầu xử lý sản phẩm của bạn.

Số phiếu: ${ctx.ticketNumber}
${ctx.trackingToken ? `Mã theo dõi: ${ctx.trackingToken}` : ''}
${ctx.productName ? `Sản phẩm: ${ctx.productName}` : ''}

Trạng thái: Đang xử lý
Thời gian dự kiến: 3-7 ngày làm việc

---
SSTC Service Center
Hủy đăng ký: ${ctx.unsubscribeUrl}
  `.trim();

  return {
    html,
    text,
    subject: `Phiếu dịch vụ ${ctx.ticketNumber} đã được tạo`,
  };
}

/**
 * Email Template 5: Service Completed / Ready for Pickup
 */
export function serviceCompletedTemplate(ctx: EmailTemplateContext): { html: string; text: string; subject: string } {
  const html = createEmailLayout(`
    <h2>Dịch vụ đã hoàn tất</h2>
    <p>Xin chào <strong>${ctx.customerName}</strong>,</p>
    <p>Chúng tôi đã hoàn tất việc xử lý sản phẩm của bạn. Sản phẩm đã sẵn sàng để bàn giao.</p>

    <div class="info-box">
      <div class="info-label">Số phiếu dịch vụ:</div>
      <div class="info-value">${ctx.ticketNumber}</div>
    </div>

    ${ctx.completedDate ? `<p><strong>Ngày hoàn thành:</strong> ${ctx.completedDate}</p>` : ''}
    ${ctx.productName ? `<p><strong>Sản phẩm:</strong> ${ctx.productName}</p>` : ''}

    <p><strong>Trạng thái:</strong> Hoàn thành - Sẵn sàng bàn giao</p>

    <p><strong>Các bước tiếp theo:</strong></p>
    <ul>
      <li>Vui lòng đến trung tâm để nhận sản phẩm</li>
      <li>Nhớ mang theo giấy tờ tùy thân</li>
      <li>Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)</li>
    </ul>

    <p>Cảm ơn bạn đã tin tưởng SSTC Service Center!</p>
  `, ctx.unsubscribeUrl);

  const text = `
Dịch vụ đã hoàn tất

Xin chào ${ctx.customerName},

Chúng tôi đã hoàn tất việc xử lý sản phẩm của bạn.

Số phiếu: ${ctx.ticketNumber}
${ctx.completedDate ? `Hoàn thành: ${ctx.completedDate}` : ''}
Trạng thái: Sẵn sàng bàn giao

Vui lòng đến trung tâm để nhận sản phẩm.
Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)

---
SSTC Service Center
Hotline: +84 123 456 789
Hủy đăng ký: ${ctx.unsubscribeUrl}
  `.trim();

  return {
    html,
    text,
    subject: `Phiếu ${ctx.ticketNumber} đã hoàn thành - Sẵn sàng bàn giao`,
  };
}

/**
 * Email Template 6: Delivery Confirmed
 */
export function deliveryConfirmedTemplate(ctx: EmailTemplateContext): { html: string; text: string; subject: string } {
  const html = createEmailLayout(`
    <h2>Xác nhận đã giao hàng</h2>
    <p>Xin chào <strong>${ctx.customerName}</strong>,</p>
    <p>Sản phẩm của bạn đã được giao thành công.</p>

    <div class="info-box">
      <div class="info-label">Số phiếu dịch vụ:</div>
      <div class="info-value">${ctx.ticketNumber}</div>
    </div>

    ${ctx.deliveryDate ? `<p><strong>Ngày giao:</strong> ${ctx.deliveryDate}</p>` : ''}
    ${ctx.productName ? `<p><strong>Sản phẩm:</strong> ${ctx.productName}</p>` : ''}

    <p><strong>Trạng thái:</strong> Đã giao hàng</p>

    <p><strong>Lưu ý:</strong></p>
    <ul>
      <li>Vui lòng kiểm tra sản phẩm ngay khi nhận</li>
      <li>Nếu có vấn đề, liên hệ trong vòng 24 giờ</li>
      <li>Giữ phiếu dịch vụ để tra cứu sau này</li>
    </ul>

    <p>Cảm ơn bạn đã sử dụng dịch vụ của SSTC Service Center. Chúng tôi hy vọng được phục vụ bạn lần sau!</p>
  `, ctx.unsubscribeUrl);

  const text = `
Xác nhận đã giao hàng

Xin chào ${ctx.customerName},

Sản phẩm của bạn đã được giao thành công.

Số phiếu: ${ctx.ticketNumber}
${ctx.deliveryDate ? `Ngày giao: ${ctx.deliveryDate}` : ''}

Vui lòng kiểm tra sản phẩm ngay. Nếu có vấn đề, liên hệ trong vòng 24 giờ.

Cảm ơn bạn đã tin tưởng SSTC Service Center!

---
SSTC Service Center
Hotline: +84 123 456 789
Hủy đăng ký: ${ctx.unsubscribeUrl}
  `.trim();

  return {
    html,
    text,
    subject: `Phiếu ${ctx.ticketNumber} - Xác nhận đã giao hàng`,
  };
}

/**
 * Get template by type
 */
export function getEmailTemplate(
  type: EmailType,
  context: EmailTemplateContext
): { html: string; text: string; subject: string } {
  switch (type) {
    case 'request_submitted':
      return requestSubmittedTemplate(context);
    case 'request_received':
      return requestReceivedTemplate(context);
    case 'request_rejected':
      return requestRejectedTemplate(context);
    case 'ticket_created':
      return ticketCreatedTemplate(context);
    case 'service_completed':
      return serviceCompletedTemplate(context);
    case 'delivery_confirmed':
      return deliveryConfirmedTemplate(context);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
