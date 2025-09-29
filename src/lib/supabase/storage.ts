import { createClient } from "@/utils/supabase/client";

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
  code?: string;
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
): Promise<UploadResult> {
  const supabase = createClient();

  // Upload the file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true, // Replace existing file
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Create signed URL with 1 year expiration
  const oneYearInSeconds = 365 * 24 * 60 * 60;
  const { data: urlData, error: urlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(uploadData.path, oneYearInSeconds);

  if (urlError) {
    throw new Error(`Failed to create signed URL: ${urlError.message}`);
  }

  return {
    url: urlData.signedUrl,
    path: uploadData.path,
  };
}

/**
 * Upload avatar for a specific user
 */
export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<UploadResult> {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.",
    );
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error(
      "File size too large. Please upload an image smaller than 5MB.",
    );
  }

  // Generate file path: userId/timestamp.extension
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.${fileExtension}`;

  return uploadFile(file, "avatars", filePath);
}

/**
 * Get avatar URL for display
 */
export async function getAvatarUrl(avatarPath: string): Promise<string> {
  if (!avatarPath) {
    throw new Error("Avatar path is required");
  }

  const supabase = createClient();
  const oneYearInSeconds = 365 * 24 * 60 * 60;

  const { data: urlData, error: urlError } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, oneYearInSeconds);

  if (urlError) {
    throw new Error(`Failed to get avatar URL: ${urlError.message}`);
  }

  return urlData.signedUrl;
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
