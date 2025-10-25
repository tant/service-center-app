"use client";

import {
  IconBuilding,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDatabase,
  IconEdit,
  IconLayoutColumns,
  IconPlus,
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
import { z } from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { trpc } from "@/components/providers/trpc-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
});

type Brand = z.infer<typeof brandSchema>;

function QuickActions({ brand, onEdit }: { brand: Brand; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {/* Edit Brand */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            data-testid={`edit-brand-${brand.id}`}
          >
            <IconEdit className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Chỉnh sửa thương hiệu</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function BrandViewer({ brand }: { brand: Brand }) {
  return (
    <div className="flex items-center gap-3 p-2">
      <Avatar className="size-8">
        <AvatarFallback>
          <IconBuilding className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start">
        <div className="font-medium">{brand.name}</div>
        {brand.description && (
          <div className="text-sm text-muted-foreground line-clamp-1">
            {brand.description}
          </div>
        )}
      </div>
    </div>
  );
}

function BrandFormDialog({
  open,
  onOpenChange,
  brand,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [name, setName] = React.useState(brand?.name || "");
  const [description, setDescription] = React.useState(
    brand?.description || "",
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const createMutation = trpc.brands.createBrand.useMutation({
    onSuccess: () => {
      toast.success("Thương hiệu đã được tạo thành công");
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const updateMutation = trpc.brands.updateBrand.useMutation({
    onSuccess: () => {
      toast.success("Thương hiệu đã được cập nhật thành công");
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name,
          description: description || null,
        });
      } else if (brand) {
        await updateMutation.mutateAsync({
          id: brand.id,
          name,
          description: description || null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      setName(brand?.name || "");
      setDescription(brand?.description || "");
    }
  }, [open, brand]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]" data-testid="brand-form-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Thêm thương hiệu mới"
                : "Chỉnh sửa thương hiệu"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Nhập thông tin thương hiệu mới"
                : "Cập nhật thông tin thương hiệu"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Tên thương hiệu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: ASUS, MSI, Gigabyte..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về thương hiệu..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Đang tạo..."
                  : "Đang cập nhật..."
                : mode === "create"
                  ? "Tạo thương hiệu"
                  : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddSampleBrandsButton({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const createBrandMutation = trpc.brands.createBrand.useMutation({
    onSuccess: (data) => {
      console.log("[Brands] Sample brand created:", { response: data });
    },
    onError: (error) => {
      const errorMessage = error.message || "Lỗi khi tạo thương hiệu mẫu";
      console.error("[Brands] Sample brand creation error:", errorMessage, {
        error,
      });
      toast.error(errorMessage);
    },
  });

  // Sample computer hardware brands
  const sampleBrands = [
    {
      name: "ZOTAC",
      description: "Graphics cards and mini PCs manufacturer",
    },
    {
      name: "SSTC",
      description: "Computer hardware and components",
    },
    {
      name: "ASUS",
      description:
        "Motherboards, graphics cards, laptops, and gaming peripherals manufacturer",
    },
    {
      name: "MSI",
      description:
        "Micro-Star International - Gaming hardware and computer components",
    },
    {
      name: "Gigabyte",
      description: "Motherboards, graphics cards, and PC hardware components",
    },
    {
      name: "Corsair",
      description:
        "Gaming peripherals, memory, cooling systems, and PC components",
    },
    {
      name: "Kingston",
      description: "Memory modules, SSDs, and storage solutions",
    },
    {
      name: "Samsung",
      description: "SSDs, memory, and display technology",
    },
    {
      name: "Intel",
      description: "Processors, chipsets, and computing technology",
    },
    {
      name: "AMD",
      description: "Processors, graphics cards, and computing solutions",
    },
  ];

  const handleAddSampleBrands = async () => {
    setIsLoading(true);
    console.log("[Brands] Adding sample brands started:", {
      totalBrands: sampleBrands.length,
    });

    try {
      let successCount = 0;
      const totalBrands = sampleBrands.length;

      for (const brand of sampleBrands) {
        try {
          await createBrandMutation.mutateAsync(brand);
          successCount++;
        } catch (error) {
          console.error(
            `[Brands] Failed to create sample brand: ${brand.name}`,
            error,
          );
        }
      }

      if (successCount === totalBrands) {
        const successMessage = `Đã thêm thành công ${successCount} thương hiệu mẫu`;
        console.log(
          "[Brands] All sample brands added successfully:",
          successMessage,
          { successCount, totalBrands },
        );
        toast.success(successMessage);
      } else if (successCount > 0) {
        const successMessage = `Đã thêm thành công ${successCount}/${totalBrands} thương hiệu mẫu`;
        console.log("[Brands] Partial sample brands added:", successMessage, {
          successCount,
          totalBrands,
        });
        toast.success(successMessage);
      } else {
        const errorMessage = "Không thể thêm thương hiệu mẫu nào";
        console.error("[Brands] No sample brands added:", errorMessage, {
          successCount,
          totalBrands,
        });
        toast.error(errorMessage);
      }

      if (successCount > 0) {
        router.refresh();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      const errorMessage = "Lỗi khi thêm thương hiệu mẫu";
      console.error("[Brands] Sample brands addition error:", errorMessage, {
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
      onClick={handleAddSampleBrands}
      disabled={isLoading}
    >
      <IconDatabase />
      <span className="hidden lg:inline">
        {isLoading ? "Đang thêm..." : "Thêm sample"}
      </span>
    </Button>
  );
}

export function BrandsTable({ data: initialData }: { data: Brand[] }) {
  const [data, setData] = React.useState(() => initialData);
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
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const columns: ColumnDef<Brand>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
      header: "Thương hiệu",
      cell: ({ row }) => {
        return <BrandViewer brand={row.original} />;
      },
      enableHiding: false,
    },
    {
      accessorKey: "updated_at",
      header: "Cập nhật",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {new Date(row.original.updated_at).toLocaleDateString("vi-VN")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <QuickActions
          brand={row.original}
          onEdit={() => {
            setSelectedBrand(row.original);
            setEditDialogOpen(true);
          }}
        />
      ),
    },
  ];

  const filteredData = React.useMemo(() => {
    if (!searchValue) return data;

    return data.filter((item) => {
      const searchLower = searchValue.toLowerCase();
      return item.name.toLowerCase().includes(searchLower);
    });
  }, [data, searchValue]);

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
    <>
      <Tabs
        defaultValue="brands-list"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="text-lg font-semibold">DS Thương hiệu</div>
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
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              data-testid="add-brand-button"
            >
              <IconPlus />
              <span className="hidden lg:inline">Thêm thương hiệu</span>
            </Button>
            <AddSampleBrandsButton />
          </div>
        </div>
        <TabsContent
          value="brands-list"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm theo tên thương hiệu..."
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
                      Không tìm thấy thương hiệu nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
              {table.getFilteredRowModel().rows.length} thương hiệu.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Hàng trên trang
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
                Trang {table.getState().pagination.pageIndex + 1} của{" "}
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
      </Tabs>

      <BrandFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />

      <BrandFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        brand={selectedBrand || undefined}
        mode="edit"
      />
    </>
  );
}
