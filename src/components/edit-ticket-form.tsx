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
import { IconTrash, IconPlus, IconEdit } from "@tabler/icons-react";

interface EditTicketFormProps {
  ticket: any;
}

export function EditTicketForm({ ticket }: EditTicketFormProps) {
  const router = useRouter();
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

  const updateTicketMutation = trpc.tickets.updateTicket.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật phiếu dịch vụ thành công");
      router.push(`/tickets/${ticket.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const addPartMutation = trpc.tickets.addTicketPart.useMutation({
    onSuccess: () => {
      toast.success("Thêm linh kiện thành công");
      router.refresh();
      setSelectedNewPart("");
      setNewPartQuantity(1);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const updatePartMutation = trpc.tickets.updateTicketPart.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật linh kiện thành công");
      setEditingPartId(null);
      setEditingPartData(null);
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const deletePartMutation = trpc.tickets.deleteTicketPart.useMutation({
    onSuccess: () => {
      toast.success("Xóa linh kiện thành công");
      router.refresh();
    },
    onError: (error) => {
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

  const partsTotal = parts.reduce((sum: number, part: any) => sum + (part.total_price || 0), 0);
  const totalCost = Number(formData.service_fee) + Number(formData.diagnosis_fee) + partsTotal - Number(formData.discount_amount);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {/* Customer and Product Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Thông tin khách hàng và sản phẩm (không thể chỉnh sửa)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Khách hàng</Label>
            <Input value={ticket.customers?.name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Số điện thoại</Label>
            <Input value={ticket.customers?.phone || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Sản phẩm</Label>
            <Input value={ticket.products?.name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Loại sản phẩm</Label>
            <Input value={ticket.products?.type || ""} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết phiếu dịch vụ</CardTitle>
          <CardDescription>Cập nhật thông tin phiếu dịch vụ {ticket.ticket_number}</CardDescription>
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
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="in_progress">Đang xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
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
      </Card>

      {/* Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Chi phí dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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
        </CardContent>
      </Card>

      {/* Parts Management */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý linh kiện</CardTitle>
          <CardDescription>
            Thêm, sửa hoặc xóa linh kiện sử dụng trong phiếu dịch vụ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Part */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Thêm linh kiện mới</h4>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
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
              <div>
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
                  <IconPlus className="h-4 w-4 mr-2" />
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

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          type="button"
          onClick={handleCancel}
          disabled={updateTicketMutation.isPending}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={updateTicketMutation.isPending}>
          {updateTicketMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
