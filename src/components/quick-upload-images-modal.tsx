"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { IconUpload, IconX, IconPhoto } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";

interface QuickUploadImagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketNumber: string;
}

export function QuickUploadImagesModal({
  open,
  onOpenChange,
  ticketId,
  ticketNumber,
}: QuickUploadImagesModalProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const addAttachmentMutation = trpc.tickets.addAttachment.useMutation({
    onSuccess: () => {
      // Success handled in handleUpload
    },
    onError: (error) => {
      toast.error(`Lỗi khi lưu thông tin ảnh: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast.warning("Chỉ chấp nhận file ảnh");
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ảnh");
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Generate unique file path
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filePath = `${ticketId}/${timestamp}_${randomString}_${file.name}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("service_media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Upload failed for ${file.name}: ${uploadError.message}`,
          );
        }

        // Save attachment record to database
        await addAttachmentMutation.mutateAsync({
          ticket_id: ticketId,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          description: description || undefined,
        });

        return uploadData;
      });

      await Promise.all(uploadPromises);

      toast.success(`Đã tải lên ${selectedFiles.length} ảnh thành công`);
      setSelectedFiles([]);
      setDescription("");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tải ảnh lên",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setDescription("");
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Tải ảnh lên</DialogTitle>
          <DialogDescription>
            Thêm ảnh cho phiếu dịch vụ {ticketNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Chọn ảnh</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isUploading}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <IconPhoto className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Chấp nhận: JPG, PNG, GIF, WebP
            </p>
          </div>

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Ảnh đã chọn ({selectedFiles.length})</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <IconPhoto className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Thêm mô tả cho các ảnh..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isUploading}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
          >
            <IconUpload className="h-4 w-4" />
            {isUploading
              ? "Đang tải lên..."
              : `Tải lên (${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
