"use client";

/**
 * Story 1.6: Warehouse Hierarchy Setup
 * AC 5.1: Physical warehouses table with CRUD operations
 */

import { useState } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconBuildingWarehouse,
  IconMapPin,
} from "@tabler/icons-react";
import {
  usePhysicalWarehouses,
  useDeletePhysicalWarehouse,
} from "@/hooks/use-warehouse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WarehouseFormModal } from "./warehouse-form-modal";
import type { PhysicalWarehouse } from "@/types/warehouse";

export function PhysicalWarehouseTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<PhysicalWarehouse | null>(null);

  const { warehouses, isLoading } = usePhysicalWarehouses({ is_active: true });
  const { deleteWarehouse, isDeleting } = useDeletePhysicalWarehouse();

  const filteredWarehouses = warehouses.filter((warehouse) => {
    const query = searchQuery.toLowerCase();
    return (
      warehouse.name.toLowerCase().includes(query) ||
      warehouse.location.toLowerCase().includes(query)
    );
  });

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa kho này?")) {
      deleteWarehouse({ id });
    }
  };

  const handleEdit = (warehouse: PhysicalWarehouse) => {
    setEditingWarehouse(warehouse);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingWarehouse(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconBuildingWarehouse className="h-5 w-5" />
                Kho Vật Lý
              </CardTitle>
              <CardDescription>
                Quản lý các địa điểm kho vật lý trong hệ thống
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Thêm Kho Mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Tìm kiếm theo tên kho hoặc địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? "Không tìm thấy kho phù hợp" : "Chưa có kho nào"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Kho</TableHead>
                    <TableHead>Địa Điểm</TableHead>
                    <TableHead>Mô Tả</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IconBuildingWarehouse className="h-4 w-4 text-muted-foreground" />
                          {warehouse.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconMapPin className="h-4 w-4 text-muted-foreground" />
                          {warehouse.location}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {warehouse.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                          {warehouse.is_active ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(warehouse.id)}
                            disabled={isDeleting}
                          >
                            <IconTrash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <WarehouseFormModal
        open={showCreateModal || !!editingWarehouse}
        onClose={handleCloseModal}
        warehouse={editingWarehouse}
      />
    </>
  );
}
