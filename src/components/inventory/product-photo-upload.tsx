/**
 * Story 1.7: Physical Product Master Data with Serial Tracking
 * Component for uploading and managing product photos
 */

"use client";

import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface ProductPhotoUploadProps {
  photoUrls: string[];
  onPhotosChange: (urls: string[]) => void;
  maxPhotos?: number;
}

export function ProductPhotoUpload({
  photoUrls,
  onPhotosChange,
  maxPhotos = 5,
}: ProductPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  // Sanitize filename to remove Vietnamese characters and special chars
  const sanitizeFilename = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf(".");
    const name =
      lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;
    const ext = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : "";

    const vietnameseMap: Record<string, string> = {
      à: "a",
      á: "a",
      ả: "a",
      ã: "a",
      ạ: "a",
      ă: "a",
      ằ: "a",
      ắ: "a",
      ẳ: "a",
      ẵ: "a",
      ặ: "a",
      â: "a",
      ầ: "a",
      ấ: "a",
      ẩ: "a",
      ẫ: "a",
      ậ: "a",
      đ: "d",
      è: "e",
      é: "e",
      ẻ: "e",
      ẽ: "e",
      ẹ: "e",
      ê: "e",
      ề: "e",
      ế: "e",
      ể: "e",
      ễ: "e",
      ệ: "e",
      ì: "i",
      í: "i",
      ỉ: "i",
      ĩ: "i",
      ị: "i",
      ò: "o",
      ó: "o",
      ỏ: "o",
      õ: "o",
      ọ: "o",
      ô: "o",
      ồ: "o",
      ố: "o",
      ổ: "o",
      ỗ: "o",
      ộ: "o",
      ơ: "o",
      ờ: "o",
      ớ: "o",
      ở: "o",
      ỡ: "o",
      ợ: "o",
      ù: "u",
      ú: "u",
      ủ: "u",
      ũ: "u",
      ụ: "u",
      ư: "u",
      ừ: "u",
      ứ: "u",
      ử: "u",
      ữ: "u",
      ự: "u",
      ỳ: "y",
      ý: "y",
      ỷ: "y",
      ỹ: "y",
      ỵ: "y",
    };

    let sanitized = name.toLowerCase();
    for (const [viet, latin] of Object.entries(vietnameseMap)) {
      sanitized = sanitized.replaceAll(viet, latin);
      sanitized = sanitized.replaceAll(viet.toUpperCase(), latin.toUpperCase());
    }

    sanitized = sanitized.replace(/[^a-z0-9_-]/g, "_");
    sanitized = sanitized.replace(/_+/g, "_");
    sanitized = sanitized.replace(/^_+|_+$/g, "");

    return `${sanitized}${ext}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast.warning("Chỉ chấp nhận file ảnh");
    }

    if (photoUrls.length + imageFiles.length > maxPhotos) {
      toast.error(`Chỉ được tải tối đa ${maxPhotos} ảnh`);
      return;
    }

    if (imageFiles.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const sanitizedName = sanitizeFilename(file.name);
        const filePath = `serial-photos/${Date.now()}_${sanitizedName}`;

        const { data, error } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw new Error(`Lỗi upload ${file.name}: ${error.message}`);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("ticket-attachments").getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      onPhotosChange([...photoUrls, ...uploadedUrls]);
      toast.success(`Đã tải lên ${imageFiles.length} ảnh`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tải ảnh");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newUrls = photoUrls.filter((_, i) => i !== index);
    onPhotosChange(newUrls);
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div>
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading || photoUrls.length >= maxPhotos}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("photo-upload")?.click()}
          disabled={isUploading || photoUrls.length >= maxPhotos}
          className="w-full"
        >
          <IconUpload className="mr-2 h-4 w-4" />
          {isUploading
            ? "Đang tải lên..."
            : photoUrls.length >= maxPhotos
              ? `Đã đạt giới hạn ${maxPhotos} ảnh`
              : "Tải ảnh lên"}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Tối đa {maxPhotos} ảnh. Đã tải: {photoUrls.length}/{maxPhotos}
        </p>
      </div>

      {/* Photo preview grid */}
      {photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Product photo ${index + 1}`}
                fill
                className="object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {photoUrls.length === 0 && (
        <div className="border-2 border-dashed rounded-md p-6 text-center text-muted-foreground">
          <IconPhoto className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Chưa có ảnh nào</p>
          <p className="text-xs">Nhấn nút trên để tải ảnh lên</p>
        </div>
      )}
    </div>
  );
}
