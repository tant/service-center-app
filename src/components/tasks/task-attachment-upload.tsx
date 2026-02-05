/**
 * Task Attachment Upload Component
 * Used in task detail pages for uploading photos/documents and videos
 */

"use client";

import {
  IconCopy,
  IconFile,
  IconLoader2,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TASK_ATTACHMENT_IMAGE_MIME_TYPES,
  TASK_ATTACHMENT_IMAGE_PATH_PREFIX,
  TASK_ATTACHMENT_MAX_SIZE_BYTES,
  TASK_ATTACHMENT_VIDEO_MIME_TYPES,
  TASK_ATTACHMENT_VIDEO_PATH_PREFIX,
  TASK_MEDIA_BUCKET,
  TASK_VIDEO_BUCKET,
  TASK_VIDEO_MAX_SIZE_BYTES,
} from "@/constants/task-attachments";
import { createClient } from "@/utils/supabase/client";

interface TaskAttachmentUploadProps {
  taskId: string;
  onUploadComplete?: () => void;
}

export function TaskAttachmentUpload({
  taskId,
  onUploadComplete,
}: TaskAttachmentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [fileProgress, setFileProgress] = useState<{
    total: number;
    done: number;
  }>({ total: 0, done: 0 });
  const [videoProgress, setVideoProgress] = useState<{
    total: number;
    done: number;
  }>({ total: 0, done: 0 });

  const supabase = useMemo(() => createClient(), []);
  const uploadMutation = trpc.tasks.uploadAttachment.useMutation();
  const deleteMutation = trpc.tasks.deleteAttachment.useMutation();
  const attachmentsQuery = trpc.tasks.getTaskAttachments.useQuery({ taskId });

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    if (uploadingFiles || uploadingVideos) {
      window.addEventListener("beforeunload", warnBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, [uploadingFiles, uploadingVideos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types (images and PDFs only)
    const validFiles = files.filter((file) => {
      const isValid = TASK_ATTACHMENT_IMAGE_MIME_TYPES.includes(
        file.type as any,
      );
      const isUnderLimit = file.size <= TASK_ATTACHMENT_MAX_SIZE_BYTES; // 5MB limit

      if (!isValid) {
        toast.error(`${file.name} không phải là file hình ảnh hoặc PDF`);
      }
      if (!isUnderLimit) {
        toast.error(
          `${file.name} vượt quá ${(TASK_ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB`,
        );
      }
      return isValid && isUnderLimit;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validVideos = files.filter((file) => {
      const isValid = TASK_ATTACHMENT_VIDEO_MIME_TYPES.includes(
        file.type as any,
      );
      const isUnderLimit = file.size <= TASK_VIDEO_MAX_SIZE_BYTES;

      if (!isValid) {
        toast.error(`${file.name} không phải là định dạng video được hỗ trợ`);
      }
      if (!isUnderLimit) {
        toast.error(
          `${file.name} vượt quá ${(TASK_VIDEO_MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB`,
        );
      }
      return isValid && isUnderLimit;
    });

    setSelectedVideos((prev) => [...prev, ...validVideos]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 file");
      return;
    }

    setUploadingFiles(true);
    setFileProgress({ total: selectedFiles.length, done: 0 });

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${TASK_ATTACHMENT_IMAGE_PATH_PREFIX}/${taskId}/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from(TASK_MEDIA_BUCKET)
          .upload(filePath, file);

        if (storageError) {
          throw new Error(
            `Failed to upload ${file.name}: ${storageError.message}`,
          );
        }

        // Record in database
        await uploadMutation.mutateAsync({
          taskId,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          mimeType: file.type as any,
          storageBucket: TASK_MEDIA_BUCKET,
        });

        setFileProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }

      toast.success(`Đã tải lên ${selectedFiles.length} file`);
      setSelectedFiles([]);
      attachmentsQuery.refetch();
      onUploadComplete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tải file lên",
      );
      console.error(error);
    } finally {
      setUploadingFiles(false);
      setFileProgress({ total: 0, done: 0 });
    }
  };

  const handleUploadVideos = async () => {
    if (selectedVideos.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 video");
      return;
    }

    setUploadingVideos(true);
    setVideoProgress({ total: selectedVideos.length, done: 0 });

    try {
      for (const file of selectedVideos) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${TASK_ATTACHMENT_VIDEO_PATH_PREFIX}/${taskId}/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from(TASK_VIDEO_BUCKET)
          .upload(filePath, file);

        if (storageError) {
          throw new Error(
            `Failed to upload ${file.name}: ${storageError.message}`,
          );
        }

        await uploadMutation.mutateAsync({
          taskId,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          mimeType: file.type as any,
          storageBucket: TASK_VIDEO_BUCKET,
        });

        setVideoProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }

      toast.success(`Đã tải lên ${selectedVideos.length} video`);
      setSelectedVideos([]);
      attachmentsQuery.refetch();
      onUploadComplete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi tải video lên",
      );
      console.error(error);
    } finally {
      setUploadingVideos(false);
      setVideoProgress({ total: 0, done: 0 });
    }
  };

  const handleDelete = async (
    attachmentId: string,
    filePath: string,
    mimeType: string,
  ) => {
    try {
      const isVideo = mimeType?.startsWith("video/");
      const bucket = isVideo ? TASK_VIDEO_BUCKET : TASK_MEDIA_BUCKET;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
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

  const getPublicUrl = (bucket: string, filePath: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã copy liên kết");
    } catch (error) {
      console.error("Copy link failed", error);
      toast.error("Không copy được liên kết");
    }
  };

  const attachments = attachmentsQuery.data || [];
  const mediaAttachments = attachments.filter(
    (attachment: any) => !attachment.mime_type?.startsWith("video/"),
  );
  const videoAttachments = attachments.filter((attachment: any) =>
    attachment.mime_type?.startsWith("video/"),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tài liệu đính kèm</CardTitle>
        <CardDescription>
          Tải lên hình ảnh, tài liệu hoặc video liên quan đến công việc này
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Image/PDF upload */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Ảnh/PDF (tối đa 5MB mỗi file)</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                disabled={uploadingFiles}
              />
            </div>

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
                        {file.type.startsWith("image/") ? (
                          <IconPhoto className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <IconFile className="h-4 w-4 text-gray-500 shrink-0" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploadingFiles}
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleUploadFiles}
              disabled={selectedFiles.length === 0 || uploadingFiles}
              className="w-full"
            >
              {uploadingFiles ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải ảnh/tài liệu... {fileProgress.done}/
                  {fileProgress.total}
                </>
              ) : (
                <>
                  <IconUpload className="h-4 w-4 mr-2" />
                  Tải lên {selectedFiles.length} file
                </>
              )}
            </Button>
          </div>

          {/* Video upload */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="video-upload">
                Video (mp4/mov/webm, tối đa 200MB)
              </Label>
              <Input
                id="video-upload"
                type="file"
                multiple
                accept={TASK_ATTACHMENT_VIDEO_MIME_TYPES.join(",")}
                onChange={handleVideoSelect}
                disabled={uploadingVideos}
              />
            </div>

            {selectedVideos.length > 0 && (
              <div className="space-y-2">
                <Label>Video đã chọn ({selectedVideos.length})</Label>
                <div className="grid grid-cols-1 gap-2">
                  {selectedVideos.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconVideo className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVideo(index)}
                        disabled={uploadingVideos}
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleUploadVideos}
              disabled={selectedVideos.length === 0 || uploadingVideos}
              className="w-full"
            >
              {uploadingVideos ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải video... {videoProgress.done}/{videoProgress.total}
                </>
              ) : (
                <>
                  <IconUpload className="h-4 w-4 mr-2" />
                  Tải lên {selectedVideos.length} video
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Existing Attachments */}
        {attachmentsQuery.isLoading && (
          <div className="flex items-center justify-center py-4">
            <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {mediaAttachments.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <Label>Ảnh/Tài liệu đã tải lên ({mediaAttachments.length})</Label>
            <div className="grid grid-cols-1 gap-2">
              {mediaAttachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <a
                      href={getPublicUrl(
                        TASK_MEDIA_BUCKET,
                        attachment.file_path,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 flex-1 min-w-0 hover:underline"
                    >
                      {attachment.mime_type.startsWith("image/") ? (
                        <IconPhoto className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <IconFile className="h-4 w-4 text-gray-500 shrink-0" />
                      )}
                      <span className="text-sm truncate">
                        {attachment.file_name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(attachment.file_size_bytes / 1024).toFixed(1)} KB)
                      </span>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopyLink(
                          getPublicUrl(TASK_MEDIA_BUCKET, attachment.file_path),
                        )
                      }
                      className="shrink-0"
                    >
                      <IconCopy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDelete(
                        attachment.id,
                        attachment.file_path,
                        attachment.mime_type,
                      )
                    }
                    disabled={deleteMutation.isPending}
                  >
                    <IconTrash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {videoAttachments.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <Label>Video đã tải lên ({videoAttachments.length})</Label>
            <div className="grid grid-cols-1 gap-2">
              {videoAttachments.map((attachment: any) => {
                const videoUrl = getPublicUrl(
                  TASK_VIDEO_BUCKET,
                  attachment.file_path,
                );
                return (
                  <div
                    key={attachment.id}
                    className="space-y-2 p-2 border rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconVideo className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="text-sm truncate">
                          {attachment.file_name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          (
                          {(attachment.file_size_bytes / (1024 * 1024)).toFixed(
                            1,
                          )}{" "}
                          MB)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(videoUrl)}
                          className="shrink-0"
                        >
                          <IconCopy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(
                              attachment.id,
                              attachment.file_path,
                              attachment.mime_type,
                            )
                          }
                          disabled={deleteMutation.isPending}
                        >
                          <IconTrash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {videoUrl ? (
                      <video
                        controls
                        className="w-full rounded-md border bg-black/5"
                        src={videoUrl}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Không tạo được liên kết xem trước video
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
