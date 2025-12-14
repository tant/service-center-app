# Kế hoạch Agile: Tách UI ảnh/video trên trang chi tiết task (/my-tasks/:id)

## Mục tiêu
- Cho phép upload và quản lý video nhiệm vụ trong cùng card “Tài liệu đính kèm”, tách rõ workflow ảnh/PDF và video.
- Dùng bucket riêng cho video để quản lý truy cập/dung lượng, vẫn tái sử dụng API/bảng task_attachments.

## Hiện trạng rút gọn
- UI: `TaskAttachmentUpload` nhận ảnh/PDF (≤5MB), upload lên bucket `service_media`, render chung dưới dạng link/thumbnail.
- API: `tasks.uploadAttachment`/`deleteAttachment` ghi/xóa bản ghi `task_attachments`, validate mime ảnh/PDF, size 5MB, dùng `service_media` public URL.

## Phases (mỗi phase kết thúc có thể dùng được)
- **Phase 1 – Nền tảng video riêng**  
  - Kết quả: Có thể upload/xóa video cho task bằng UI riêng trong card; video lưu bucket riêng `service_videos` (private), ảnh/PDF không thay đổi. Playback video dùng signed URL thủ công trong danh sách đính kèm.
  - Việc chính: tạo bucket `service_videos` + policy, mở rộng API `uploadAttachment` nhận `bucket`|`type`, nới MIME/size cho video; client thêm khối upload video (accept video/*, limit 50–100MB), render video với signed URL. Delete chọn bucket đúng.
- **Phase 2 – Trải nghiệm tốt hơn**  
  - Kết quả: Người dùng xem danh sách tách nhóm “Ảnh/Tài liệu” và “Video” trong cùng card; có thông tin kích thước, tải/xóa hoạt động cho cả hai; copy/share link video vẫn qua signed URL an toàn.
  - Việc chính: nhóm hiển thị, copy link signed GET, label/tooltip rõ giới hạn; share code utils URL (public vs signed).
- **Phase 3 – Độ tin cậy & giám sát**  
  - Kết quả: Upload video ổn định hơn (progress, cảnh báo rời trang khi đang upload); lỗi được toast rõ ràng; validations đồng nhất client/server bằng constants dùng chung.
  - Việc chính: thêm progress per file, chặn rời trang khi uploading, constants MIME/size chung, logging lỗi upload.

## Phạm vi & kỹ thuật
- Không tạo bảng mới; bảng `task_attachments` thêm field `bucket` (hoặc suy ra từ prefix) để phân biệt storage.
- URL: ảnh/PDF dùng `getPublicUrl` (nếu bucket vẫn public); video dùng `createSignedUrl` khi render.
- Giới hạn: ảnh/PDF ≤5MB; video đề xuất ≤50–100MB; định dạng `mp4|mov|webm`.
- Path: ảnh/PDF `task-attachments/<taskId>/...`; video `task-videos/<taskId>/...`.

## Kiểm thử theo phase
- Phase 1: upload video hợp lệ, playback được; upload sai MIME/size bị chặn; ảnh/PDF vẫn hoạt động.
- Phase 2: danh sách tách nhóm, link video có hạn; xóa video/ảnh hoạt động đúng bucket.
- Phase 3: progress hiển thị, hủy upload/đổi trang được cảnh báo; constants MIME/size khớp server.
