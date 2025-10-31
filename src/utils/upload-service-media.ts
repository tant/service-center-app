"use client";

import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import type { WizardProductAttachment } from "@/hooks/use-service-request-wizard";
import { MAX_ATTACHMENT_SIZE_BYTES, MAX_ATTACHMENTS_PER_PRODUCT } from "@/hooks/use-service-request-wizard";

export interface UploadTask {
  attachmentId: string;
  productId: string;
  file: File;
}

export interface UploadResult {
  attachmentId: string;
  productId: string;
  path: string;
  fileSize: number;
  fileType: string;
}

interface UploadController {
  abort: () => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex !== -1 ? filename.slice(lastDotIndex).toLowerCase() : "";
  const sanitized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `${sanitized || "attachment"}${ext}`;
}

export function validateAttachmentCount(attachments: WizardProductAttachment[]) {
  if (attachments.length >= MAX_ATTACHMENTS_PER_PRODUCT) {
    throw new Error(`Tối đa ${MAX_ATTACHMENTS_PER_PRODUCT} ảnh cho mỗi sản phẩm.`);
  }
}

export function validateAttachmentFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Chỉ chấp nhận file ảnh JPEG, PNG, GIF hoặc WebP.");
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("Kích thước ảnh vượt quá giới hạn 10 MiB.");
  }
}

export function createUploadTask(productId: string, file: File): UploadTask {
  const attachmentId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  validateAttachmentFile(file);
  return { attachmentId, productId, file };
}

export function uploadAttachment(task: UploadTask, onProgress?: (progress: number) => void): { promise: Promise<UploadResult>; controller: UploadController } {
  const supabase = createClient();
  const controller = new AbortController();

  const promise = new Promise<UploadResult>(async (resolve, reject) => {
    try {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      const fileName = sanitizeFilename(task.file.name);
      const path = `${task.productId}/${timestamp}-${randomSuffix}-${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("service_media")
        .upload(path, task.file, {
          cacheControl: "3600",
          upsert: false,
          signal: controller.signal,
        });

      if (uploadError) {
        reject(new Error(uploadError.message));
        return;
      }

      if (!data?.path) {
        reject(new Error("Không thể lấy đường dẫn file sau khi upload."));
        return;
      }

      onProgress?.(100);
      resolve({
        attachmentId: task.attachmentId,
        productId: task.productId,
        path: data.path,
        fileSize: task.file.size,
        fileType: task.file.type,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        reject(new Error("Upload đã bị hủy"));
      } else {
        reject(error instanceof Error ? error : new Error("Upload thất bại"));
      }
    }
  });

  return { promise, controller: { abort: () => controller.abort() } };
}

export function handleUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : "Upload ảnh thất bại.";
  toast.error(message);
}
