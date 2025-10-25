"use client";

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconEdit,
  IconLayoutColumns,
  IconPackage,
  IconPlus,
  IconDatabase,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/components/providers/trpc-provider";

export const partSchema = z.object({
  id: z.string(),
  name: z.string(),
  part_number: z.string().nullable(),
  sku: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number(),
  cost_price: z.number(),
  stock_quantity: z.number(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
});

const columns: ColumnDef<z.infer<typeof partSchema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Linh kiện",
    cell: ({ row }) => {
      return <PartViewer part={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.original.sku || (
          <span className="text-muted-foreground italic">Không có SKU</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Giá bán",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(row.original.price)}
      </div>
    ),
  },
  {
    accessorKey: "cost_price",
    header: "Giá vốn",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(row.original.cost_price)}
      </div>
    ),
  },
  {
    accessorKey: "stock_quantity",
    header: "Tồn kho",
    cell: ({ row }) => (
      <div className="text-center">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            row.original.stock_quantity > 10
              ? "bg-green-100 text-green-800"
              : row.original.stock_quantity > 0
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.stock_quantity}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => <QuickActions part={row.original} />,
  },
];

function QuickActions({ part }: { part: z.infer<typeof partSchema> }) {
  return (
    <div className="flex items-center gap-1">
      {/* Edit Part */}
      <Tooltip>
        <PartsModal
          part={part}
          mode="edit"
          trigger={
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 text-muted-foreground hover:text-foreground"
                data-testid={`edit-part-${part.id}`}
              >
                <IconEdit className="size-5" />
              </Button>
            </TooltipTrigger>
          }
          onSuccess={() => window.location.reload()}
        />
        <TooltipContent>
          <p>Chỉnh sửa linh kiện</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function PartsTable({
  data: initialData,
}: {
  data: z.infer<typeof partSchema>[];
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchValue, setSearchValue] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchValue) return initialData;

    return initialData.filter((item) => {
      const searchLower = searchValue.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower)
      );
    });
  }, [initialData, searchValue]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs
      defaultValue="parts-list"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="parts-list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parts-list">DS Linh kiện</SelectItem>
            <SelectItem value="categories">Danh mục</SelectItem>
            <SelectItem value="inventory">Tồn kho</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="parts-list">DS Linh kiện</TabsTrigger>
          <TabsTrigger value="categories">
            Danh mục <Badge variant="secondary">5</Badge>
          </TabsTrigger>
          <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Cột</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  const columnDisplayNames: Record<string, string> = {
                    sku: "SKU",
                    name: "Linh kiện",
                    price: "Giá bán",
                    cost_price: "Giá vốn",
                    stock_quantity: "Tồn kho",
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnDisplayNames[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <PartsModal
            mode="add"
            trigger={
              <Button variant="outline" size="sm" data-testid="add-part-button">
                <IconPlus />
                <span className="hidden lg:inline">Thêm linh kiện</span>
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
          <AddSamplePartsButton onSuccess={() => window.location.reload()} />
        </div>
      </div>
      <TabsContent
        value="parts-list"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên hoặc SKU..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không tìm thấy linh kiện nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
            {table.getFilteredRowModel().rows.length} linh kiện.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Số hàng trên trang
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Trang {table.getState().pagination.pageIndex + 1} trên{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Đến trang đầu</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang trước</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang tiếp</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Đến trang cuối</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="categories" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="inventory" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

function PartViewer({ part }: { part: z.infer<typeof partSchema> }) {
  return (
    <PartsModal
      part={part}
      mode="edit"
      trigger={
        <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto">
          <Avatar className="size-8">
            <AvatarImage src={part.image_url || ""} />
            <AvatarFallback>
              <IconPackage className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <div className="font-medium">{part.name}</div>
            <div className="text-sm text-muted-foreground font-mono">
              {part.part_number || (
                <span className="italic">Không có mã linh kiện</span>
              )}
            </div>
          </div>
        </Button>
      }
      onSuccess={() => window.location.reload()}
    />
  );
}

interface PartsModalProps {
  part?: z.infer<typeof partSchema>;
  mode: "add" | "edit";
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

function PartsModal({ part, mode, trigger, onSuccess }: PartsModalProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    part_number: "",
    sku: "",
    description: "",
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    image_url: "",
  });

  const createPartMutation = trpc.parts.createPart.useMutation({
    onSuccess: (data) => {
      const successMessage = "Tạo linh kiện thành công";
      console.log("[Parts] Create part success:", successMessage, {
        partData: formData,
        response: data,
      });
      toast.success(successMessage);
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errorMessage = error.message || "Tạo linh kiện thất bại";
      console.error("[Parts] Create part error:", errorMessage, {
        partData: formData,
        error,
      });
      toast.error(errorMessage);
    },
  });

  const updatePartMutation = trpc.parts.updatePart.useMutation({
    onSuccess: (data) => {
      const successMessage = "Cập nhật linh kiện thành công";
      console.log("[Parts] Update part success:", successMessage, {
        partId: part?.id,
        partData: formData,
        response: data,
      });
      toast.success(successMessage);
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errorMessage = error.message || "Cập nhật linh kiện thất bại";
      console.error("[Parts] Update part error:", errorMessage, {
        partId: part?.id,
        partData: formData,
        error,
      });
      toast.error(errorMessage);
    },
  });

  const isLoading =
    createPartMutation.status === "pending" ||
    updatePartMutation.status === "pending";

  // Reset form when modal opens or mode/part changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: part?.name || "",
        part_number: part?.part_number || "",
        sku: part?.sku || "",
        description: part?.description || "",
        price: part?.price || 0,
        cost_price: part?.cost_price || 0,
        stock_quantity: part?.stock_quantity || 0,
        image_url: part?.image_url || "",
      });
    }
  }, [open, part]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      const errorMessage = "Vui lòng nhập tên linh kiện";
      console.error("[Parts] Validation error:", errorMessage, { formData });
      toast.error(errorMessage);
      return;
    }

    if (formData.price <= 0) {
      const errorMessage = "Vui lòng nhập giá hợp lệ";
      console.error("[Parts] Validation error:", errorMessage, {
        price: formData.price,
        formData,
      });
      toast.error(errorMessage);
      return;
    }

    if (formData.cost_price < 0) {
      const errorMessage = "Giá vốn không thể âm";
      console.error("[Parts] Validation error:", errorMessage, {
        cost_price: formData.cost_price,
        formData,
      });
      toast.error(errorMessage);
      return;
    }

    if (formData.stock_quantity < 0) {
      const errorMessage = "Số lượng tồn kho không thể âm";
      console.error("[Parts] Validation error:", errorMessage, {
        stock_quantity: formData.stock_quantity,
        formData,
      });
      toast.error(errorMessage);
      return;
    }

    if (mode === "add") {
      createPartMutation.mutate({
        name: formData.name,
        part_number: formData.part_number || null,
        sku: formData.sku || null,
        description: formData.description || null,
        price: formData.price,
        cost_price: formData.cost_price,
        stock_quantity: formData.stock_quantity,
        image_url: formData.image_url || null,
      });
    } else if (part) {
      updatePartMutation.mutate({
        id: part.id,
        name: formData.name,
        part_number: formData.part_number || null,
        sku: formData.sku || null,
        description: formData.description || null,
        price: formData.price,
        cost_price: formData.cost_price,
        stock_quantity: formData.stock_quantity,
        image_url: formData.image_url || null,
      });
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-3">
            {mode === "edit" && (
              <Avatar className="size-10">
                <AvatarImage src={part?.image_url || ""} />
                <AvatarFallback>
                  <IconPackage className="size-5" />
                </AvatarFallback>
              </Avatar>
            )}
            {mode === "add" ? "Thêm linh kiện mới" : part?.name}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "add"
              ? "Tạo linh kiện mới với thông tin cần thiết."
              : "Chi tiết linh kiện và tùy chọn quản lý"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Tên linh kiện *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên linh kiện"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="part_number">Mã linh kiện</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) =>
                    setFormData({ ...formData, part_number: e.target.value })
                  }
                  placeholder="Nhập mã linh kiện (tùy chọn)"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="Nhập SKU (tùy chọn)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="price">Giá bán * (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  placeholder="Nhập giá bán"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="cost_price">Giá vốn * (VND)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.cost_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost_price: Number(e.target.value),
                    })
                  }
                  placeholder="Nhập giá vốn"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="stock_quantity">Số lượng tồn kho *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                step="1"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_quantity: Number(e.target.value),
                  })
                }
                placeholder="Nhập số lượng tồn kho"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Nhập mô tả linh kiện (tùy chọn)"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="image_url">Đường dẫn hình ảnh</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="Nhập đường dẫn hình ảnh (tùy chọn)"
              />
            </div>
            {mode === "edit" && part && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      ID Linh kiện
                    </Label>
                    <div className="font-mono text-xs">{part.id}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Giá bán</Label>
                    <div>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(part.price)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Giá vốn</Label>
                    <div>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(part.cost_price)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Số lượng tồn kho
                    </Label>
                    <div className="flex items-center gap-2">
                      <span>{part.stock_quantity}</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          part.stock_quantity > 10
                            ? "bg-green-100 text-green-800"
                            : part.stock_quantity > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {part.stock_quantity > 10
                          ? "Còn hàng"
                          : part.stock_quantity > 0
                            ? "Sắp hết hàng"
                            : "Hết hàng"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Giá trị tồn kho
                    </Label>
                    <div>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(part.cost_price * part.stock_quantity)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Tỷ lệ lợi nhuận
                    </Label>
                    <div>
                      {part.price > 0 ? (
                        <span
                          className={`font-medium ${
                            (
                              ((part.price - part.cost_price) / part.price) *
                                100
                            ) > 20
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {(
                            ((part.price - part.cost_price) / part.price) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Ngày tạo</Label>
                    <div>{new Date(part.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Ngày cập nhật
                    </Label>
                    <div>{new Date(part.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? mode === "add"
                ? "Đang tạo..."
                : "Đang cập nhật..."
              : mode === "add"
                ? "Tạo linh kiện"
                : "Lưu thay đổi"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Hủy bỏ
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function AddSamplePartsButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const createPartMutation = trpc.parts.createPart.useMutation({
    onSuccess: (data) => {
      // Success is handled in the batch operation
      console.log("[Parts] Sample part created:", { response: data });
    },
    onError: (error) => {
      const errorMessage = error.message || "Lỗi khi tạo linh kiện mẫu";
      console.error("[Parts] Sample part creation error:", errorMessage, {
        error,
      });
      toast.error(errorMessage);
    },
  });

  const sampleParts = [
    {
      name: "Ốc GPU - Ốc lò xo (6.8mm)",
      part_number: "OC-GPU-6.8",
      sku: "SKU-001",
      description: "Ốc lò xo cho GPU, kích thước 6.8mm",
      price: Math.floor(Math.random() * 50000) + 10000, // 10k-60k VND
      cost_price: Math.floor(Math.random() * 30000) + 5000, // 5k-35k VND
      stock_quantity: Math.floor(Math.random() * 100) + 10, // 10-110
      image_url: null,
    },
    {
      name: "Ốc Backplate - Ốc tròn 5.7x2.2mm",
      part_number: "OC-BP-5.7x2.2",
      sku: "SKU-002",
      description: "Ốc tròn cho backplate, kích thước 5.7x2.2mm",
      price: Math.floor(Math.random() * 40000) + 8000,
      cost_price: Math.floor(Math.random() * 25000) + 4000,
      stock_quantity: Math.floor(Math.random() * 80) + 15,
      image_url: null,
    },
    {
      name: "Ốc gắn FE - Ốc dù 4.6x2.2mm",
      part_number: "OC-FE-4.6x2.2-DU",
      sku: "SKU-003",
      description: "Ốc dù cho FE, kích thước 4.6x2.2mm",
      price: Math.floor(Math.random() * 35000) + 12000,
      cost_price: Math.floor(Math.random() * 20000) + 6000,
      stock_quantity: Math.floor(Math.random() * 60) + 20,
      image_url: null,
    },
    {
      name: "Ốc gắn FE - Ốc dù 3.3x1.8mm",
      part_number: "OC-FE-3.3x1.8-DU",
      sku: "SKU-004",
      description: "Ốc dù cho FE, kích thước 3.3x1.8mm",
      price: Math.floor(Math.random() * 30000) + 10000,
      cost_price: Math.floor(Math.random() * 18000) + 5000,
      stock_quantity: Math.floor(Math.random() * 70) + 15,
      image_url: null,
    },
    {
      name: "Ốc gắn FE - Ốc tròn 4.6x2.2mm",
      part_number: "OC-FE-4.6x2.2-TRON",
      sku: "SKU-005",
      description: "Ốc tròn cho FE, kích thước 4.6x2.2mm",
      price: Math.floor(Math.random() * 32000) + 11000,
      cost_price: Math.floor(Math.random() * 19000) + 5500,
      stock_quantity: Math.floor(Math.random() * 90) + 10,
      image_url: null,
    },
    {
      name: "Tấm backplate - Backplate Zotac ZT-B50620H-10M",
      part_number: "BP-ZOTAC-ZT-B50620H-10M",
      sku: "SKU-006",
      description: "Tấm backplate cho card đồ họa Zotac ZT-B50620H-10M",
      price: Math.floor(Math.random() * 200000) + 150000,
      cost_price: Math.floor(Math.random() * 120000) + 80000,
      stock_quantity: Math.floor(Math.random() * 30) + 5,
      image_url: null,
    },
    {
      name: "Miếng FE - FE Zotac Gaming mã 144600",
      part_number: "FE-ZOTAC-144600",
      sku: "SKU-007",
      description: "Miếng FE cho card đồ họa Zotac Gaming mã 144600",
      price: Math.floor(Math.random() * 180000) + 120000,
      cost_price: Math.floor(Math.random() * 100000) + 70000,
      stock_quantity: Math.floor(Math.random() * 25) + 8,
      image_url: null,
    },
    {
      name: "Cụm Tản Nhiệt + ốp - Bộ tản nhiệt Zotac mã 251-20927-732TF",
      part_number: "TN-ZOTAC-251-20927-732TF",
      sku: "SKU-008",
      description:
        "Bộ tản nhiệt hoàn chỉnh cho card đồ họa Zotac mã 251-20927-732TF",
      price: Math.floor(Math.random() * 500000) + 300000,
      cost_price: Math.floor(Math.random() * 300000) + 180000,
      stock_quantity: Math.floor(Math.random() * 20) + 3,
      image_url: null,
    },
    {
      name: "Quạt tản nhiệt - Quạt VGA 87.5mm 12V-0.6A (TF90S12H-15DAA)",
      part_number: "FAN-TF90S12H-15DAA",
      sku: "SKU-009",
      description: "Quạt tản nhiệt VGA 87.5mm 12V-0.6A model TF90S12H-15DAA",
      price: Math.floor(Math.random() * 250000) + 100000,
      cost_price: Math.floor(Math.random() * 150000) + 60000,
      stock_quantity: Math.floor(Math.random() * 40) + 12,
      image_url: null,
    },
  ];

  const handleAddSampleParts = async () => {
    setIsLoading(true);
    console.log("[Parts] Adding sample parts started:", {
      totalParts: sampleParts.length,
    });

    try {
      let successCount = 0;
      const totalParts = sampleParts.length;

      for (const part of sampleParts) {
        try {
          await createPartMutation.mutateAsync(part);
          successCount++;
        } catch (error) {
          console.error(
            `[Parts] Failed to create sample part: ${part.name}`,
            error,
          );
        }
      }

      if (successCount === totalParts) {
        const successMessage = `Đã thêm thành công ${successCount} linh kiện mẫu`;
        console.log(
          "[Parts] All sample parts added successfully:",
          successMessage,
          { successCount, totalParts },
        );
        toast.success(successMessage);
      } else if (successCount > 0) {
        const successMessage = `Đã thêm thành công ${successCount}/${totalParts} linh kiện mẫu`;
        console.log("[Parts] Partial sample parts added:", successMessage, {
          successCount,
          totalParts,
        });
        toast.success(successMessage);
      } else {
        const errorMessage = "Không thể thêm linh kiện mẫu nào";
        console.error("[Parts] No sample parts added:", errorMessage, {
          successCount,
          totalParts,
        });
        toast.error(errorMessage);
      }

      if (successCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = "Lỗi khi thêm linh kiện mẫu";
      console.error("[Parts] Sample parts addition error:", errorMessage, {
        error,
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddSampleParts}
      disabled={isLoading}
    >
      <IconDatabase />
      <span className="hidden lg:inline">
        {isLoading ? "Đang thêm..." : "Thêm mẫu"}
      </span>
    </Button>
  );
}
