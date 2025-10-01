"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { IconSend, IconMessageCircle, IconLock, IconUser, IconRobot } from "@tabler/icons-react";

interface Comment {
  id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  created_by: string;
  profiles?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

interface TicketCommentsProps {
  ticketId: string;
  initialComments: Comment[];
}

export function TicketComments({ ticketId, initialComments }: TicketCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const addCommentMutation = trpc.tickets.addComment.useMutation({
    onSuccess: (result) => {
      toast.success("Đã thêm bình luận");
      setNewComment("");
      setIsInternal(false);
      router.refresh();

      // Optimistically update UI
      if (result.comment) {
        setComments((prev) => [...prev, result.comment as Comment]);
      }
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }

    addCommentMutation.mutate({
      ticket_id: ticketId,
      comment: newComment.trim(),
      is_internal: isInternal,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if a comment is auto-generated based on emoji prefixes
  const isAutoComment = (commentText: string) => {
    const autoCommentPrefixes = ['🔄', '➕', '✏️', '➖', '💵', '🔍', '🎁', '⚠️', '📋', '👤', '📝', '📌', '🎫'];
    return autoCommentPrefixes.some(prefix => commentText.startsWith(prefix));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMessageCircle className="h-5 w-5" />
          Bình luận
        </CardTitle>
        <CardDescription>
          Trao đổi và cập nhật thông tin về phiếu dịch vụ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isAuto = isAutoComment(comment.comment);
              return (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg border ${
                    isAuto
                      ? "bg-blue-50/50 border-blue-200/50"
                      : comment.is_internal
                      ? "bg-amber-50 border-amber-200"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        isAuto ? "bg-blue-100" : "bg-primary/10"
                      }`}>
                        {isAuto ? (
                          <IconRobot className="h-4 w-4 text-blue-600" />
                        ) : (
                          <IconUser className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {isAuto ? (
                            <span className="flex items-center gap-1">
                              {comment.profiles?.name || "Hệ thống"}
                              <Badge variant="outline" className="text-xs">
                                Tự động
                              </Badge>
                            </span>
                          ) : (
                            comment.profiles?.name || "Unknown User"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    </div>
                    {comment.is_internal && !isAuto && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <IconLock className="h-3 w-3" />
                        Nội bộ
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap ml-10">{comment.comment}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <IconMessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có bình luận nào</p>
          </div>
        )}

        <Separator />

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-comment">Thêm bình luận mới</Label>
            <Textarea
              id="new-comment"
              placeholder="Nhập nội dung bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
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

            <Button
              type="submit"
              disabled={addCommentMutation.isPending || !newComment.trim()}
            >
              <IconSend className="h-4 w-4" />
              {addCommentMutation.isPending ? "Đang gửi..." : "Gửi bình luận"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
