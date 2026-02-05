/**
 * Story 1.15: Email Notification System
 * Table component for email notifications log
 * AC 9: Admin can view email notification log with filters
 */

"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Eye, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmailContentModal } from "@/components/modals/email-content-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmailLog, useRetryEmail } from "@/hooks/use-notifications";

const EMAIL_TYPE_LABELS: Record<string, string> = {
  request_submitted: "Yêu cầu đã gửi",
  request_received: "Đã tiếp nhận",
  request_rejected: "Đã từ chối",
  ticket_created: "Tạo phiếu dịch vụ",
  service_completed: "Hoàn thành dịch vụ",
  delivery_confirmed: "Xác nhận giao hàng",
};

const STATUS_COLORS: Record<
  string,
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "pending"
  | "processing"
  | "resolved"
  | "closed"
> = {
  pending: "processing",
  sent: "resolved",
  failed: "destructive",
  bounced: "destructive",
};

export function EmailNotificationsTable() {
  const [emailType, setEmailType] = useState<
    | "request_submitted"
    | "request_received"
    | "request_rejected"
    | "ticket_created"
    | "service_completed"
    | "delivery_confirmed"
    | ""
  >("");
  const [status, setStatus] = useState<
    "pending" | "sent" | "failed" | "bounced" | ""
  >("");
  const [search, setSearch] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const limit = 50;

  const { data, isLoading, refetch } = useEmailLog({
    limit,
    offset,
    emailType: emailType || undefined,
    status: status || undefined,
    recipientEmail: search || undefined,
  });

  const retryMutation = useRetryEmail();

  const handleRetry = async (emailId: string) => {
    try {
      await retryMutation.mutateAsync({ emailId });
      toast.success("Email đã được gửi lại");
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi lại email",
      );
    }
  };

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    if (data && offset + limit < data.total) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={emailType}
          onValueChange={(value) => setEmailType(value as typeof emailType)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Loại email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả loại</SelectItem>
            {Object.entries(EMAIL_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as typeof status)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
            <SelectItem value="sent">Đã gửi</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="bounced">Bị trả lại</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại email</TableHead>
              <TableHead>Người nhận</TableHead>
              <TableHead>Chủ đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Thử lại</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : !data || data.emails.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không có email nào
                </TableCell>
              </TableRow>
            ) : (
              data.emails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>
                    <span className="text-sm">
                      {EMAIL_TYPE_LABELS[email.email_type] || email.email_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{email.recipient_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {email.recipient_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {email.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[email.status]}>
                      {email.status === "pending" && "Đang chờ"}
                      {email.status === "sent" && "Đã gửi"}
                      {email.status === "failed" && "Thất bại"}
                      {email.status === "bounced" && "Bị trả lại"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {email.sent_at
                        ? formatDistanceToNow(new Date(email.sent_at), {
                            addSuffix: true,
                            locale: vi,
                          })
                        : formatDistanceToNow(new Date(email.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {email.retry_count}/{email.max_retries}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(email.status === "failed" ||
                        email.status === "pending") &&
                        email.retry_count < email.max_retries && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(email.id)}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Gửi lại
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {offset + 1} - {Math.min(offset + limit, data.total)} trong
            tổng số {data.total} email
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={offset === 0}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={offset + limit >= data.total}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Email Content Modal */}
      {selectedEmail && (
        <EmailContentModal
          email={selectedEmail}
          open={!!selectedEmail}
          onOpenChange={(open) => !open && setSelectedEmail(null)}
        />
      )}
    </div>
  );
}
