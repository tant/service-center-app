"use client";

import { IconNotes, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface TaskNotesSectionProps {
  taskId: string;
  currentNotes?: string;
  isRequired?: boolean;
  isCompleted?: boolean;
}

export function TaskNotesSection({
  taskId,
  currentNotes = "",
  isRequired = false,
  isCompleted = false,
}: TaskNotesSectionProps) {
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const utils = trpc.useContext();

  const addNotesMutation = trpc.tasks.addTaskNotes.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm ghi chú");
      setNewNote("");
      setIsAdding(false);
      // Refetch task data to show updated notes
      utils.tasks.getTask.invalidate({ taskId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddNote = () => {
    if (newNote.trim().length === 0) {
      toast.error("Ghi chú không được để trống");
      return;
    }

    addNotesMutation.mutate({
      taskId,
      notes: newNote.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconNotes className="h-5 w-5" />
            <CardTitle className="text-base">Ghi chú công việc</CardTitle>
            {isRequired && <Badge variant="destructive">Bắt buộc</Badge>}
          </div>
          {!isCompleted && !isAdding && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
            >
              <IconPlus className="h-4 w-4 mr-1" />
              Thêm ghi chú
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Existing Notes */}
        {currentNotes && (
          <div className="space-y-4">
            {currentNotes.split("\n\n").map((entry, idx) => {
              // Parse format: [timestamp] username: note
              // Use [\s\S]* instead of /s flag for compatibility
              const match = entry.match(/^\[(.*?)\]\s+(.*?):\s+([\s\S]*)$/);

              if (!match) {
                // Fallback for unparseable entries
                return (
                  <p key={idx} className="text-sm whitespace-pre-wrap">
                    {entry}
                  </p>
                );
              }

              const [, timestamp, userName, note] = match;

              return (
                <div
                  key={idx}
                  className="bg-card/50 border border-border/50 rounded-lg p-4 shadow-sm"
                >
                  {/* Metadata line: timestamp + username badge */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timestamp}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {userName}
                    </span>
                  </div>
                  {/* Note content */}
                  <p className="text-sm text-foreground leading-relaxed">
                    {note}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Note Form */}
        {isAdding && (
          <div className="space-y-2 border rounded-md p-4">
            <Textarea
              placeholder="Nhập ghi chú của bạn..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              disabled={addNotesMutation.isPending}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                }}
                disabled={addNotesMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={
                  addNotesMutation.isPending || newNote.trim().length === 0
                }
              >
                {addNotesMutation.isPending ? "Đang lưu..." : "Lưu ghi chú"}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentNotes && !isAdding && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {isRequired
              ? "⚠️ Loại công việc này yêu cầu ghi chú. Vui lòng thêm ghi chú trước khi hoàn thành."
              : "Chưa có ghi chú. Click 'Thêm ghi chú' để bắt đầu."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
