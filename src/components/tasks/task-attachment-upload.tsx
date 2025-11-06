/**
 * Task Attachment Upload Component
 * Used in task detail pages for uploading photos/documents
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUpload, IconX, IconPhoto, IconFile, IconTrash, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { createClient } from "@/utils/supabase/client";

interface TaskAttachmentUploadProps {
  taskId: string;
  onUploadComplete?: () => void;
}

export function TaskAttachmentUpload({
  taskId,
  onUploadComplete
}: TaskAttachmentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();
  const uploadMutation = trpc.tasks.uploadAttachment.useMutation();
  const deleteMutation = trpc.tasks.deleteAttachment.useMutation();
  const attachmentsQuery = trpc.tasks.getTaskAttachments.useQuery({ taskId });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types (images and PDFs only)
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isUnder5MB = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValid) {
        toast.error(`${file.name} không phải là file hình ảnh hoặc PDF`);
      }
      if (!isUnder5MB) {
        toast.error(`${file.name} vượt quá 5MB`);
      }
      return isValid && isUnder5MB;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 file");
      return;
    }

    setUploading(true);

    try {
      // Upload files to Supabase Storage
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `task-attachments/${taskId}/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from('service_media')
          .upload(filePath, file);

        if (storageError) {
          throw new Error(`Failed to upload ${file.name}: ${storageError.message}`);
        }

        // Record in database
        await uploadMutation.mutateAsync({
          taskId,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          mimeType: file.type as any,
        });

        return fileName;
      });

      await Promise.all(uploadPromises);

      toast.success(`Đã tải lên ${selectedFiles.length} file`);
      setSelectedFiles([]);
      attachmentsQuery.refetch();
      onUploadComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tải file lên");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('service_media')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      await deleteMutation.mutateAsync({ attachmentId });

      toast.success("Đã xóa file");
      attachmentsQuery.refetch();
    } catch (error) {
      toast.error("Lỗi khi xóa file");
      console.error(error);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('service_media')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tài liệu đính kèm</CardTitle>
        <CardDescription>
          Tải lên hình ảnh hoặc tài liệu liên quan đến công việc này
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Chọn file (hình ảnh hoặc PDF, tối đa 5MB)</Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>File đã chọn ({selectedFiles.length})</Label>
            <div className="grid grid-cols-1 gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {file.type.startsWith('image/') ? (
                      <IconPhoto className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <IconFile className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang tải lên...
            </>
          ) : (
            <>
              <IconUpload className="h-4 w-4 mr-2" />
              Tải lên {selectedFiles.length} file
            </>
          )}
        </Button>

        {/* Existing Attachments */}
        {attachmentsQuery.isLoading && (
          <div className="flex items-center justify-center py-4">
            <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {attachmentsQuery.data && attachmentsQuery.data.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <Label>File đã tải lên ({attachmentsQuery.data.length})</Label>
            <div className="grid grid-cols-1 gap-2">
              {attachmentsQuery.data.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
                >
                  <a
                    href={getPublicUrl(attachment.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 flex-1 min-w-0 hover:underline"
                  >
                    {attachment.mime_type.startsWith('image/') ? (
                      <IconPhoto className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <IconFile className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">
                      {attachment.file_name}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(attachment.file_size_bytes / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id, attachment.file_path)}
                    disabled={deleteMutation.isPending}
                  >
                    <IconTrash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
