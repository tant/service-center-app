"use client";

import { IconLock, IconSend } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuickCommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketNumber: string;
}

export function QuickCommentModal({
  open,
  onOpenChange,
  ticketId,
  ticketNumber,
}: QuickCommentModalProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const addCommentMutation = trpc.tickets.addComment.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm bình luận");
      setComment("");
      setIsInternal(false);
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }

    addCommentMutation.mutate({
      ticket_id: ticketId,
      comment: comment.trim(),
      is_internal: isInternal,
    });
  };

  const handleCancel = () => {
    setComment("");
    setIsInternal(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Thêm bình luận nhanh</DialogTitle>
          <DialogDescription>
            Thêm bình luận cho phiếu dịch vụ {ticketNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Nội dung bình luận</Label>
              <Textarea
                id="comment"
                placeholder="Nhập nội dung bình luận..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                className="resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked as boolean)}
              />
              <Label
                htmlFor="is-internal"
                className="text-sm font-normal cursor-pointer flex items-center gap-1"
              >
                <IconLock className="h-3 w-3" />
                Bình luận nội bộ (không hiển thị cho khách hàng)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={addCommentMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={addCommentMutation.isPending || !comment.trim()}
            >
              <IconSend className="h-4 w-4" />
              {addCommentMutation.isPending ? "Đang gửi..." : "Gửi bình luận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
