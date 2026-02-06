/**
 * Task Action Dialogs
 *
 * Dialogs for task actions: complete and block.
 * Start and unblock actions happen immediately without dialog.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => void;
  taskName: string;
  isLoading?: boolean;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  taskName,
  isLoading,
}: CompleteTaskDialogProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (notes.trim()) {
      onConfirm(notes);
      setNotes(""); // Reset for next use
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hoàn thành công việc</DialogTitle>
          <DialogDescription>{taskName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="completion-notes">
              Ghi chú hoàn thành <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="completion-notes"
              placeholder="Mô tả công việc đã thực hiện, kết quả, hoặc bất kỳ thông tin quan trọng nào..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              maxLength={5000}
            />
            <p className="text-sm text-muted-foreground">
              {notes.length}/5000 ký tự
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!notes.trim() || isLoading}>
            {isLoading ? "Đang xử lý..." : "Hoàn thành"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BlockTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  taskName: string;
  isLoading?: boolean;
}

export function BlockTaskDialog({
  open,
  onOpenChange,
  onConfirm,
  taskName,
  isLoading,
}: BlockTaskDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason(""); // Reset for next use
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo chặn công việc</DialogTitle>
          <DialogDescription>{taskName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="blocked-reason">
              Lý do bị chặn <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="blocked-reason"
              placeholder="Ví dụ: Đang chờ linh kiện thay thế từ nhà cung cấp..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground">
              {reason.length}/1000 ký tự
            </p>
          </div>

          <div className="rounded-lg border bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Công việc sẽ được đánh dấu là bị chặn. Manager sẽ được thông báo
              để hỗ trợ giải quyết.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Báo chặn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
