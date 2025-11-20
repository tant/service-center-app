export const TASK_MEDIA_BUCKET = "service_media";
export const TASK_VIDEO_BUCKET = "service_videos";

export const TASK_ATTACHMENT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export const TASK_ATTACHMENT_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const TASK_ATTACHMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const TASK_VIDEO_MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

export const TASK_ATTACHMENT_IMAGE_PATH_PREFIX = "task-attachments";
export const TASK_ATTACHMENT_VIDEO_PATH_PREFIX = "task-videos";
