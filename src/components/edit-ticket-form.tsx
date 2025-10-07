"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { IconTrash, IconPlus, IconEdit, IconPhoto, IconX, IconDownload, IconEye } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STATUS_FLOW } from "@/lib/constants/ticket-status";
import { createClient } from "@/utils/supabase/client";

interface EditTicketFormProps {
  ticket: any;
}

export function EditTicketForm({ ticket }: EditTicketFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    issue_description: ticket.issue_description || "",
    priority_level: ticket.priority_level || "normal",
    warranty_type: ticket.warranty_type || "paid",
    status: ticket.status || "pending",
    service_fee: ticket.service_fee || 0,
    diagnosis_fee: ticket.diagnosis_fee || 0,
    discount_amount: ticket.discount_amount || 0,
    notes: ticket.notes || "",
  });

  const [parts, setParts] = useState(
    ticket.service_ticket_parts?.map((item: any) => ({
      id: item.id,
      part_id: item.part_id,
      part_name: item.parts?.name || "",
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    })) || []
  );

  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingPartData, setEditingPartData] = useState<{ quantity: number; unit_price: number } | null>(null);

  const { data: availableParts } = trpc.parts.getParts.useQuery();
  const [selectedNewPart, setSelectedNewPart] = useState<string>("");
  const [newPartQuantity, setNewPartQuantity] = useState(1);

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { data: attachments, refetch: refetchAttachments } = trpc.tickets.getAttachments.useQuery({ ticket_id: ticket.id });

  // Image view modal state
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);

  const updateTicketMutation = trpc.tickets.updateTicket.useMutation({
    onSuccess: () => {
      console.log("[EditTicketForm] Update ticket success:", {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        timestamp: new Date().toISOString(),
      });
      toast.success("Cập nhật phiếu dịch vụ thành công");
      router.push(`/tickets/${ticket.id}`);
      router.refresh();
    },
    onError: (error) => {
      console.error("[EditTicketForm] Update ticket error:", {
        ticketId: ticket.id,
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const addPartMutation = trpc.tickets.addTicketPart.useMutation({
    onSuccess: (data) => {
      console.log("[EditTicketForm] Add part success:", {
        ticketId: ticket.id,
        partId: selectedNewPart,
        quantity: newPartQuantity,
        addedPartData: data,
        timestamp: new Date().toISOString(),
      });

      // Update local parts state immediately
      const part = availableParts?.find(p => p.id === selectedNewPart);
      if (part && data.part) {
        setParts((prev: any[]) => [...prev, {
          id: data.part.id,
          part_id: selectedNewPart,
          part_name: part.name,
          quantity: newPartQuantity,
          unit_price: part.price,
          total_price: part.price * newPartQuantity,
        }]);
      }

      toast.success("Thêm linh kiện thành công");
      setSelectedNewPart("");
      setNewPartQuantity(1);
      router.refresh();
    },
    onError: (error) => {
      console.error("[EditTicketForm] Add part error:", {
        ticketId: ticket.id,
        partId: selectedNewPart,
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const updatePartMutation = trpc.tickets.updateTicketPart.useMutation({
    onSuccess: (data, variables) => {
      console.log("[EditTicketForm] Update part success:", {
        ticketId: ticket.id,
        ticketPartId: editingPartId,
        updatedData: variables,
        timestamp: new Date().toISOString(),
      });

      // Update local parts state immediately
      if (editingPartId && editingPartData) {
        setParts((prev: any[]) => prev.map(part =>
          part.id === editingPartId
            ? {
                ...part,
                quantity: editingPartData.quantity,
                unit_price: editingPartData.unit_price,
                total_price: editingPartData.quantity * editingPartData.unit_price,
              }
            : part
        ));
      }

      toast.success("Cập nhật linh kiện thành công");
      setEditingPartId(null);
      setEditingPartData(null);
      router.refresh();
    },
    onError: (error) => {
      console.error("[EditTicketForm] Update part error:", {
        ticketId: ticket.id,
        ticketPartId: editingPartId,
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const deletePartMutation = trpc.tickets.deleteTicketPart.useMutation({
    onSuccess: (data, variables) => {
      console.log("[EditTicketForm] Delete part success:", {
        ticketId: ticket.id,
        ticketPartId: variables.id,
        timestamp: new Date().toISOString(),
      });

      // Update local parts state immediately
      setParts((prev: any[]) => prev.filter(part => part.id !== variables.id));

      toast.success("Xóa linh kiện thành công");
      router.refresh();
    },
    onError: (error, variables) => {
      console.error("[EditTicketForm] Delete part error:", {
        ticketId: ticket.id,
        ticketPartId: variables.id,
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const addAttachmentMutation = trpc.tickets.addAttachment.useMutation({
    onSuccess: (data) => {
      console.log("[EditTicketForm] Add attachment success:", {
        ticketId: ticket.id,
        attachmentId: data.attachment?.id,
        attachmentData: data,
        timestamp: new Date().toISOString(),
      });
      refetchAttachments();
    },
    onError: (error) => {
      console.error("[EditTicketForm] Add attachment error:", {
        ticketId: ticket.id,
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi khi lưu thông tin ảnh: ${error.message}`);
    },
  });

  const deleteAttachmentMutation = trpc.tickets.deleteAttachment.useMutation({
    onSuccess: (data, variables) => {
      console.log("[EditTicketForm] Delete attachment success:", {
        ticketId: ticket.id,
        attachmentId: variables.id,
        timestamp: new Date().toISOString(),
      });
      toast.success("Xóa ảnh thành công");
      refetchAttachments();
    },
    onError: (error, variables) => {
      console.error("[EditTicketForm] Delete attachment error:", {
        ticketId: ticket.id,
        attachmentId: variables.id,
        error: error.message,
        errorData: error.data,
        timestamp: new Date().toISOString(),
      });
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateTicketMutation.mutate({
      id: ticket.id,
      issue_description: formData.issue_description,
      priority_level: formData.priority_level as "low" | "normal" | "high" | "urgent",
      warranty_type: formData.warranty_type as "warranty" | "paid" | "goodwill",
      status: formData.status as "pending" | "in_progress" | "completed" | "cancelled",
      service_fee: Number(formData.service_fee),
      diagnosis_fee: Number(formData.diagnosis_fee),
      discount_amount: Number(formData.discount_amount),
      notes: formData.notes || null,
    });
  };

  const handleCancel = () => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleAddPart = () => {
    if (!selectedNewPart) {
      console.warn("[EditTicketForm] Add part validation failed: No part selected", {
        ticketId: ticket.id,
        timestamp: new Date().toISOString(),
      });
      toast.error("Vui lòng chọn linh kiện");
      return;
    }

    const part = availableParts?.find((p) => p.id === selectedNewPart);
    if (!part) return;

    addPartMutation.mutate({
      ticket_id: ticket.id,
      part_id: selectedNewPart,
      quantity: newPartQuantity,
      unit_price: part.price,
    });
  };

  const handleStartEdit = (part: any) => {
    setEditingPartId(part.id);
    setEditingPartData({
      quantity: part.quantity,
      unit_price: part.unit_price,
    });
  };

  const handleSaveEdit = () => {
    if (!editingPartId || !editingPartData) return;

    updatePartMutation.mutate({
      id: editingPartId,
      quantity: editingPartData.quantity,
      unit_price: editingPartData.unit_price,
    });
  };

  const handleCancelEdit = () => {
    setEditingPartId(null);
    setEditingPartData(null);
  };

  const handleDeletePart = (partId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa linh kiện này?")) {
      deletePartMutation.mutate({ id: partId });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      console.warn("[EditTicketForm] File type validation:", {
        ticketId: ticket.id,
        totalFiles: files.length,
        imageFiles: imageFiles.length,
        rejectedCount: files.length - imageFiles.length,
        timestamp: new Date().toISOString(),
      });
      toast.warning("Chỉ chấp nhận file ảnh");
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;

    console.log("[EditTicketForm] Starting image upload:", {
      ticketId: ticket.id,
      fileCount: selectedFiles.length,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString(),
    });

    setIsUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filePath = `${ticket.id}/${timestamp}_${randomString}_${file.name}`;

        console.log("[EditTicketForm] Uploading file to storage:", {
          ticketId: ticket.id,
          fileName: file.name,
          filePath,
          fileSize: file.size,
          bucket: "service_media",
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("service_media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("[EditTicketForm] Storage upload failed:", {
            ticketId: ticket.id,
            fileName: file.name,
            error: uploadError.message,
            errorDetails: uploadError,
          });
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
        }

        console.log("[EditTicketForm] Storage upload success, saving attachment:", {
          ticketId: ticket.id,
          fileName: file.name,
          storagePath: uploadData.path,
        });

        await addAttachmentMutation.mutateAsync({
          ticket_id: ticket.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
        });

        return uploadData;
      });

      await Promise.all(uploadPromises);

      console.log("[EditTicketForm] All images uploaded successfully:", {
        ticketId: ticket.id,
        uploadedCount: selectedFiles.length,
        timestamp: new Date().toISOString(),
      });

      toast.success(`Đã tải lên ${selectedFiles.length} ảnh thành công`);
      setSelectedFiles([]);
    } catch (error) {
      console.error("[EditTicketForm] Upload error:", {
        ticketId: ticket.id,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      toast.error(error instanceof Error ? error.message : "Lỗi khi tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("service_media")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete from database
      await deleteAttachmentMutation.mutateAsync({ id: attachmentId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("service_media")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const partsTotal = parts.reduce((sum: number, part: any) => sum + (part.total_price || 0), 0);
  const totalCost = Number(formData.service_fee) + Number(formData.diagnosis_fee) + partsTotal - Number(formData.discount_amount);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {/* Customer Info + Ticket Details cùng cột, Fees cùng hàng và chiếm 3 dòng */}
      <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-3">
        {/* Customer and Product Info (Read-only) - dòng 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            {/* <CardDescription>Thông tin khách hàng và sản phẩm</CardDescription> */}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm font-medium text-muted-foreground">Khách hàng</div>
              <div className="text-sm font-medium">{ticket.customers?.name || ""}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm font-medium text-muted-foreground">Số điện thoại</div>
              <div className="text-sm font-medium">{ticket.customers?.phone || ""}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm font-medium text-muted-foreground">Sản phẩm</div>
              <div className="text-sm font-medium">{ticket.products?.name || ""}</div>
            </div>
          </CardContent>
        </Card>

        {/* Fees - chiếm 3 dòng */}
        <Card className="lg:row-span-3">
          <CardHeader>
            <CardTitle>Chi phí dịch vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_fee">Giá dịch vụ (₫)</Label>
                <Input
                  id="service_fee"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.service_fee}
                  onChange={(e) => setFormData({ ...formData, service_fee: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis_fee">Phí kiểm tra (₫)</Label>
                <Input
                  id="diagnosis_fee"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.diagnosis_fee}
                  onChange={(e) => setFormData({ ...formData, diagnosis_fee: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_amount">Giảm giá (₫)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                />
              </div>

              {/* Cost Summary */}
              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giá dịch vụ:</span>
                  <span>{Number(formData.service_fee).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí kiểm tra:</span>
                  <span>{Number(formData.diagnosis_fee).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Linh kiện:</span>
                  <span>{partsTotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                {formData.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giảm giá:</span>
                    <span className="text-red-600">-{Number(formData.discount_amount).toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{totalCost.toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
              </div>
            </CardContent>
            {/* Actions for Fees */}
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button 
                type="button" 
                disabled={updateTicketMutation.isPending}
                onClick={() => toast.success("Đã lưu thông tin chi phí dịch vụ")}
              >
                {updateTicketMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>

        {/* Ticket Details - dòng 2 và 3 */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Chi tiết phiếu dịch vụ</CardTitle>
            {/* <CardDescription>Cập nhật thông tin phiếu dịch vụ {ticket.ticket_number}</CardDescription> */}
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Priority */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Current status - always shown */}
                  <SelectItem value={ticket.status}>
                    {STATUS_FLOW[ticket.status as keyof typeof STATUS_FLOW]?.label || ticket.status}
                  </SelectItem>
                  {/* Valid next statuses */}
                  {STATUS_FLOW[ticket.status as keyof typeof STATUS_FLOW]?.next.map((nextStatus) => (
                    <SelectItem key={nextStatus} value={nextStatus}>
                      {STATUS_FLOW[nextStatus as keyof typeof STATUS_FLOW]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <Select
                value={formData.priority_level}
                onValueChange={(value) => setFormData({ ...formData, priority_level: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">Loại bảo hành</Label>
              <Select
                value={formData.warranty_type}
                onValueChange={(value) => setFormData({ ...formData, warranty_type: value })}
              >
                <SelectTrigger id="warranty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warranty">Bảo hành</SelectItem>
                  <SelectItem value="paid">Trả phí</SelectItem>
                  <SelectItem value="goodwill">Thiện chí</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả vấn đề</Label>
            <Textarea
              id="description"
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Ghi chú thêm về phiếu dịch vụ..."
            />
          </div>
        </CardContent>
        {/* Actions for Ticket Details */}
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button 
            type="button" 
            disabled={updateTicketMutation.isPending}
            onClick={() => toast.success("Đã lưu chi tiết phiếu dịch vụ")}
          >
            {updateTicketMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </Card>
      </div>

      {/* Parts Management */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý linh kiện</CardTitle>
          {/* <CardDescription>
            Thêm, sửa hoặc xóa linh kiện sử dụng trong phiếu dịch vụ
          </CardDescription> */}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Part */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Thêm linh kiện mới</h4>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="new-part">Linh kiện</Label>
                <Select value={selectedNewPart} onValueChange={setSelectedNewPart}>
                  <SelectTrigger id="new-part">
                    <SelectValue placeholder="Chọn linh kiện" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParts?.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} - {part.price.toLocaleString("vi-VN")} ₫
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-quantity">Số lượng</Label>
                <Input
                  id="new-quantity"
                  type="number"
                  min="1"
                  value={newPartQuantity}
                  onChange={(e) => setNewPartQuantity(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddPart}
                  disabled={addPartMutation.isPending}
                  className="w-full"
                >
                  <IconPlus className="h-4 w-4" />
                  Thêm
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Parts List */}
          {parts.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium">Linh kiện đã sử dụng</h4>
              {parts.map((part: any) => (
                <div key={part.id} className="flex items-center gap-2 border-b pb-2">
                  {editingPartId === part.id ? (
                    // Edit mode
                    <>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-sm font-medium">{part.part_name}</p>
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="1"
                            value={editingPartData?.quantity}
                            onChange={(e) =>
                              setEditingPartData({
                                ...editingPartData!,
                                quantity: Number(e.target.value),
                              })
                            }
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            value={editingPartData?.unit_price}
                            onChange={(e) =>
                              setEditingPartData({
                                ...editingPartData!,
                                unit_price: Number(e.target.value),
                              })
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updatePartMutation.isPending}
                        >
                          Lưu
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Hủy
                        </Button>
                      </div>
                    </>
                  ) : (
                    // View mode
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{part.part_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {part.quantity} × {part.unit_price.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-medium">
                          {part.total_price.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(part)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePart(part.id)}
                          disabled={deletePartMutation.isPending}
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có linh kiện nào được sử dụng
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments/Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPhoto className="h-5 w-5" />
            Hình ảnh đính kèm
          </CardTitle>
          <CardDescription>
            Tải lên hình ảnh liên quan đến phiếu dịch vụ (trước/sau sửa chữa, vấn đề phát hiện, v.v.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing images */}
          {attachments && attachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {attachments.map((attachment: any) => (
                <div key={attachment.id} className="relative group">
                  <img
                    src={getPublicUrl(attachment.file_path)}
                    alt={attachment.file_name}
                    className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                    onClick={() => setViewingImage({ url: getPublicUrl(attachment.file_path), name: attachment.file_name })}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={() => setViewingImage({ url: getPublicUrl(attachment.file_path), name: attachment.file_name })}
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={() => window.open(getPublicUrl(attachment.file_path), "_blank")}
                    >
                      <IconDownload className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteAttachment(attachment.id, attachment.file_path)}
                      disabled={deleteAttachmentMutation.isPending}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Upload new images */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
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
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              >
                <IconPhoto className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Ảnh đã chọn ({selectedFiles.length})</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-2 border rounded-md p-2">
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
                        onClick={() => removeSelectedFile(index)}
                        disabled={isUploading}
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={handleUploadImages}
                  disabled={isUploading}
                  className="w-full"
                >
                  <IconPhoto className="h-4 w-4" />
                  {isUploading ? "Đang tải lên..." : `Tải lên (${selectedFiles.length})`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image View Modal */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <img
              src={viewingImage?.url}
              alt={viewingImage?.name}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
