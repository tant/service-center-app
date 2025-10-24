/**
 * Story 1.15: Email Notification System
 * Modal to view email content
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface EmailContentModalProps {
  email: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailContentModal({
  email,
  open,
  onOpenChange,
}: EmailContentModalProps) {
  const statusColor =
    email.status === "sent"
      ? "bg-green-500"
      : email.status === "failed"
      ? "bg-red-500"
      : email.status === "pending"
      ? "bg-yellow-500"
      : "bg-gray-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chi tiết email</DialogTitle>
          <DialogDescription>
            ID: {email.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm font-medium mb-1">Người nhận</div>
              <div className="text-sm">{email.recipient_name}</div>
              <div className="text-sm text-muted-foreground">
                {email.recipient_email}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Trạng thái</div>
              <Badge className={statusColor}>
                {email.status === "pending" && "Đang chờ"}
                {email.status === "sent" && "Đã gửi"}
                {email.status === "failed" && "Thất bại"}
                {email.status === "bounced" && "Bị trả lại"}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Loại email</div>
              <div className="text-sm">{email.email_type}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Thời gian</div>
              <div className="text-sm">
                {email.sent_at
                  ? format(new Date(email.sent_at), "PPpp", { locale: vi })
                  : format(new Date(email.created_at), "PPpp", { locale: vi })}
              </div>
            </div>
            {email.error_message && (
              <div className="col-span-2">
                <div className="text-sm font-medium mb-1 text-red-600">
                  Lỗi
                </div>
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {email.error_message}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium mb-1">Số lần thử lại</div>
              <div className="text-sm">
                {email.retry_count} / {email.max_retries}
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div>
            <div className="text-sm font-medium mb-2">Chủ đề</div>
            <div className="p-3 bg-muted rounded-lg">
              {email.subject}
            </div>
          </div>

          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="mt-4">
              <div className="h-[400px] w-full rounded-lg border overflow-auto">
                <div
                  className="p-4"
                  dangerouslySetInnerHTML={{ __html: email.html_body }}
                />
              </div>
            </TabsContent>
            <TabsContent value="text" className="mt-4">
              <div className="h-[400px] w-full rounded-lg border overflow-auto">
                <pre className="p-4 text-sm whitespace-pre-wrap">
                  {email.text_body}
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          {/* Context Data */}
          {email.context && Object.keys(email.context).length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Dữ liệu ngữ cảnh</div>
              <div className="h-[150px] w-full rounded-lg border overflow-auto">
                <pre className="p-4 text-xs">
                  {JSON.stringify(email.context, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
