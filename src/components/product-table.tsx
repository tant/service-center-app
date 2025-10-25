"use client";

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDatabase,
  IconEdit,
  IconLayoutColumns,
  IconPackage,
  IconPlus,
  IconX,
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
import { trpc } from "@/components/providers/trpc-provider";
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
  MultiSelectCombobox,
  type MultiSelectOption,
} from "@/components/ui/multi-select-combobox";
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

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  short_description: z.string().nullable(),
  brand_id: z.string().nullable(),
  brand_name: z.string().nullable(),
  model: z.string().nullable(),
  type: z.enum(["VGA", "MiniPC", "SSD", "RAM", "Mainboard", "Other"]),
  primary_image: z.string().nullable(),
  parts_count: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
});

const columns: ColumnDef<z.infer<typeof productSchema>>[] = [
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
    header: "Sản phẩm",
    cell: ({ row }) => {
      return <ProductViewer product={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "parts_count",
    header: "Linh kiện",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <IconPackage className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.parts_count}</span>
        <span className="text-xs text-muted-foreground">parts</span>
      </div>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.original.sku || (
          <span className="text-muted-foreground italic">No SKU</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "brand_name",
    header: "Thương hiệu",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.brand_name || (
          <span className="text-muted-foreground italic">No brand</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.type === "VGA" || row.original.type === "MiniPC"
            ? "default"
            : row.original.type === "SSD" ||
                row.original.type === "RAM" ||
                row.original.type === "Mainboard"
              ? "secondary"
              : "outline"
        }
        className="text-xs"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Cập nhật",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm">
        {new Date(row.original.updated_at).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => <QuickActions product={row.original} />,
  },
];

function QuickActions({ product }: { product: z.infer<typeof productSchema> }) {
  return (
    <div className="flex items-center gap-1">
      {/* Edit Product */}
      <Tooltip>
        <ProductModal
          product={product}
          mode="edit"
          trigger={
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 text-muted-foreground hover:text-foreground"
                data-testid={`edit-product-${product.id}`}
              >
                <IconEdit className="size-5" />
              </Button>
            </TooltipTrigger>
          }
          onSuccess={() => window.location.reload()}
        />
        <TooltipContent>
          <p>Chỉnh sửa sản phẩm</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function ProductTable({
  data: initialData,
  currentUserRole,
}: {
  data: z.infer<typeof productSchema>[];
  currentUserRole: "admin" | "manager" | "technician" | "reception";
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
        item.brand_name?.toLowerCase().includes(searchLower) ||
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
      defaultValue="product-list"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="product-list">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn chế độ xem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product-list">DS Sản phẩm</SelectItem>
            <SelectItem value="categories">Danh mục</SelectItem>
            <SelectItem value="brands">Thương hiệu</SelectItem>
            <SelectItem value="inventory">Tồn kho</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="product-list">DS Sản phẩm</TabsTrigger>
          <TabsTrigger value="categories">
            Danh mục <Badge variant="secondary">5</Badge>
          </TabsTrigger>
          <TabsTrigger value="brands">
            Thương hiệu <Badge variant="secondary">8</Badge>
          </TabsTrigger>
          <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Columns</span>
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
                    name: "Sản phẩm",
                    parts_count: "Linh kiện",
                    brand_name: "Thương hiệu",
                    type: "Loại",
                    updated_at: "Cập nhật",
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
          {/* Only Admin and Manager can add products */}
          {['admin', 'manager'].includes(currentUserRole) && (
            <>
              <ProductModal
                mode="add"
                trigger={
                  <Button variant="outline" size="sm" data-testid="add-product-button">
                    <IconPlus />
                    <span className="hidden lg:inline">Thêm sản phẩm</span>
                  </Button>
                }
                onSuccess={() => window.location.reload()}
              />
              <AddSampleProductsButton onSuccess={() => window.location.reload()} />
            </>
          )}
        </div>
      </div>
      <TabsContent
        value="product-list"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên, thương hiệu hoặc SKU..."
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
                    Không tìm thấy sản phẩm.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
            {table.getFilteredRowModel().rows.length} sản phẩm
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Số dòng mỗi trang
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
                <span className="sr-only">Về trang đầu</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Về trang trước</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Đến trang sau</span>
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
      <TabsContent value="brands" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="inventory" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

function ProductImage({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={`relative bg-muted rounded-md overflow-hidden flex-shrink-0 ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconPackage className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function ProductViewer({
  product,
}: {
  product: z.infer<typeof productSchema>;
}) {
  return (
    <ProductModal
      product={product}
      mode="edit"
      trigger={
        <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto">
          <ProductImage
            src={product.primary_image}
            alt={product.name}
            className="w-10 h-8"
          />
          <div className="flex flex-col items-start">
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              {product.brand_name && product.model
                ? `${product.brand_name} - ${product.model}`
                : product.brand_name || product.model || product.type}
            </div>
          </div>
        </Button>
      }
      onSuccess={() => window.location.reload()}
    />
  );
}

interface ProductModalProps {
  product?: z.infer<typeof productSchema>;
  mode: "add" | "edit";
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

function ProductModal({
  product,
  mode,
  trigger,
  onSuccess,
}: ProductModalProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    sku: "",
    short_description: "",
    brand_id: null as string | null,
    model: "",
    type: "VGA" as "VGA" | "MiniPC" | "SSD" | "RAM" | "Mainboard" | "Other",
    primary_image: "",
    selected_parts: [] as string[],
  });

  // Fetch parts data for selection
  const { data: parts } = trpc.parts.getParts.useQuery();

  // Fetch brands data for selection
  const { data: brands } = trpc.brands.getBrands.useQuery();

  // Fetch product details with parts for edit mode
  const { data: productWithParts } = trpc.products.getProduct.useQuery(
    { id: product?.id || "" },
    { enabled: mode === "edit" && !!product?.id },
  );

  const createProductMutation = trpc.products.createProduct.useMutation({
    onSuccess: (data) => {
      const successMessage = "Tạo sản phẩm thành công";
      console.log("[Products] Create product success:", successMessage, {
        productData: formData,
        response: data,
      });
      toast.success(successMessage);
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errorMessage = error.message || "Tạo sản phẩm thất bại";
      console.error("[Products] Create product error:", errorMessage, {
        productData: formData,
        error,
      });
      toast.error(errorMessage);
    },
  });

  const updateProductMutation = trpc.products.updateProduct.useMutation({
    onSuccess: (data) => {
      const successMessage = "Cập nhật sản phẩm thành công";
      console.log("[Products] Update product success:", successMessage, {
        productId: product?.id,
        productData: formData,
        response: data,
      });
      toast.success(successMessage);
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errorMessage = error.message || "Cập nhật sản phẩm thất bại";
      console.error("[Products] Update product error:", errorMessage, {
        productId: product?.id,
        productData: formData,
        error,
      });
      toast.error(errorMessage);
    },
  });

  const isLoading =
    createProductMutation.status === "pending" ||
    updateProductMutation.status === "pending";

  // Reset form when modal opens or mode/product changes
  React.useEffect(() => {
    if (open) {
      const existingPartIds =
        mode === "edit" && productWithParts?.parts
          ? productWithParts.parts.map((part: { id: string }) => part.id)
          : [];

      setFormData({
        name: product?.name || "",
        sku: product?.sku || "",
        short_description: product?.short_description || "",
        brand_id: product?.brand_id || null,
        model: product?.model || "",
        type: product?.type || "VGA",
        primary_image: product?.primary_image || "",
        selected_parts: existingPartIds,
      });
    }
  }, [open, product, productWithParts, mode]);

  // Prepare parts options for multi-select
  const partsOptions: MultiSelectOption[] = React.useMemo(
    () =>
      parts?.map((part) => ({
        label: part.name,
        value: part.id,
        part_number: part.part_number || "N/A",
        stock_quantity: part.stock_quantity,
        price: part.price,
        disabled: part.stock_quantity === 0,
      })) || [],
    [parts],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      const errorMessage = "Vui lòng nhập tên sản phẩm";
      console.error("[Products] Validation error:", errorMessage, { formData });
      toast.error(errorMessage);
      return;
    }

    if (mode === "add") {
      createProductMutation.mutate({
        name: formData.name,
        sku: formData.sku || null,
        short_description: formData.short_description || null,
        brand_id: formData.brand_id || null,
        model: formData.model || null,
        type: formData.type,
        primary_image: formData.primary_image || null,
        part_ids: formData.selected_parts,
      });
    } else if (product) {
      updateProductMutation.mutate({
        id: product.id,
        name: formData.name,
        sku: formData.sku || null,
        short_description: formData.short_description || null,
        brand_id: formData.brand_id || null,
        model: formData.model || null,
        type: formData.type,
        primary_image: formData.primary_image || null,
        part_ids: formData.selected_parts,
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
              <ProductImage
                src={product?.primary_image}
                alt={product?.name || "Product"}
                className="w-10 h-10"
              />
            )}
            {mode === "add" ? "Thêm Sản Phẩm Mới" : product?.name}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "add"
              ? "Tạo sản phẩm mới với các thông tin bắt buộc."
              : "Chi tiết và tùy chọn quản lý sản phẩm"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Tên sản phẩm *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Loại sản phẩm *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(
                    value:
                      | "VGA"
                      | "MiniPC"
                      | "SSD"
                      | "RAM"
                      | "Mainboard"
                      | "Other",
                  ) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VGA">VGA</SelectItem>
                    <SelectItem value="MiniPC">MiniPC</SelectItem>
                    <SelectItem value="SSD">SSD</SelectItem>
                    <SelectItem value="RAM">RAM</SelectItem>
                    <SelectItem value="Mainboard">Mainboard</SelectItem>
                    <SelectItem value="Other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="brand">Thương hiệu</Label>
                <Select
                  value={formData.brand_id || ""}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, brand_id: value || null })
                  }
                >
                  <SelectTrigger id="brand" className="w-full">
                    <SelectValue placeholder="Chọn thương hiệu (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="Nhập model (tùy chọn)"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="short_description">Mô tả</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    short_description: e.target.value,
                  })
                }
                placeholder="Nhập mô tả sản phẩm (tùy chọn)"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="primary_image">Đường dẫn hình ảnh</Label>
              <Input
                id="primary_image"
                value={formData.primary_image}
                onChange={(e) =>
                  setFormData({ ...formData, primary_image: e.target.value })
                }
                placeholder="Nhập đường dẫn hình ảnh (tùy chọn)"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="parts">Linh kiện liên quan</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Chọn các linh kiện được sử dụng cho sản phẩm này (tùy chọn)
              </div>
              <MultiSelectCombobox
                options={partsOptions}
                selected={formData.selected_parts}
                onSelectionChange={(selected) =>
                  setFormData({ ...formData, selected_parts: selected })
                }
                placeholder="Chọn linh kiện..."
                searchPlaceholder="Tìm linh kiện theo tên hoặc mã..."
                emptyMessage="Không tìm thấy linh kiện nào."
                maxDisplayItems={2}
                renderOption={(option) => (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.part_number} • {option.stock_quantity} trong kho
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          option.stock_quantity > 0 ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {option.stock_quantity > 0 ? "Có sẵn" : "Hết hàng"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(option.price)}
                      </span>
                    </div>
                  </div>
                )}
                renderBadge={(option) => (
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal gap-1 pr-1 max-w-[200px]"
                  >
                    <span className="truncate">{option.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setFormData({
                            ...formData,
                            selected_parts: formData.selected_parts.filter(
                              (id) => id !== option.value,
                            ),
                          });
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          selected_parts: formData.selected_parts.filter(
                            (id) => id !== option.value,
                          ),
                        })
                      }
                      aria-label={`Remove ${option.label}`}
                    >
                      <IconX className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                )}
              />
            </div>
            {mode === "edit" && product && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">ID Sản phẩm</Label>
                    <div className="font-mono text-xs">{product.id}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Loại</Label>
                    <div>{product.type}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Ngày tạo</Label>
                    <div>
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">
                      Cập nhật lúc
                    </Label>
                    <div>
                      {new Date(product.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isLoading}
          >
            {isLoading
              ? mode === "add"
                ? "Đang tạo..."
                : "Đang cập nhật..."
              : mode === "add"
                ? "Tạo sản phẩm"
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

function AddSampleProductsButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch brands to get the ZOTAC brand ID
  const { data: brands } = trpc.brands.getBrands.useQuery();

  const createProductMutation = trpc.products.createProduct.useMutation({
    onSuccess: (data) => {
      // Success is handled in the batch operation
      console.log("[Products] Sample product created:", { response: data });
    },
    onError: (error) => {
      const errorMessage = error.message || "Lỗi khi tạo sản phẩm mẫu";
      console.error("[Products] Sample product creation error:", errorMessage, {
        error,
      });
      toast.error(errorMessage);
    },
  });

  // Get ZOTAC brand ID from brands list
  const zotacBrandId = React.useMemo(() => {
    return brands?.find((b) => b.name === "ZOTAC")?.id || null;
  }, [brands]);

  // Sample products from VGA data file (selected variety)
  const sampleProducts = React.useMemo(
    () => [
      {
        name: "GAMING GeForce RTX 3050 ECO Edition 8GB",
        sku: "14-500-567",
        short_description:
          "ZOTAC GAMING GeForce RTX 3050 ECO Edition 8GB GDDR6 128-bit 14 Gbps PCIE 4.0 Gaming Graphics Card, Active Fan Control, FREEZE Fan Stop, ZT-A30500K-10M",
        brand_id: zotacBrandId,
        model: "ZT-A30500K-10M",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-567-02.jpg",
      },
      {
        name: "ARCTICSTORM AIO Liquid Cooling GeForce RTX 5090 32GB",
        sku: "14-500-630",
        short_description:
          "ZOTAC ARCTICSTORM AIO Liquid Cooling GeForce RTX 5090 32GB GDDR7 PCI Express 5.0 x16 ATX Graphics Card RTX 5090 ARCTICSTORM AIO ZT-B50900K-30P",
        brand_id: zotacBrandId,
        model: "ZT-B50900K-30P",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-630-01.jpg",
      },
      {
        name: "SOLID CORE OC White Edition GeForce RTX 5070 Ti 16GB",
        sku: "14-500-631",
        short_description:
          "ZOTAC SOLID CORE OC White Edition GeForce RTX 5070 Ti 16GB GDDR7 PCI Express 5.0 x16 ATX Graphics Card RTX 5070 Ti SOLID CORE White Edition ZT-B50710Q2-10P",
        brand_id: zotacBrandId,
        model: "ZT-B50710Q2-10P",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-631-01.jpg",
      },
      {
        name: "AMP Extreme Infinity GeForce RTX 5080 16GB",
        sku: "14-500-595",
        short_description:
          "ZOTAC AMP Extreme Infinity GeForce RTX 5080 16GB 256-Bit GDDR7 PCI-Express 5.0 DLSS 4.0 Graphics Card ZT-B50800B-10P",
        brand_id: zotacBrandId,
        model: "ZT-B50800B-10P",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-595-02.jpg",
      },
      {
        name: "GAMING GeForce RTX 3060 Twin Edge 12GB",
        sku: "14-500-509",
        short_description:
          "ZOTAC GAMING GeForce RTX 3060 Twin Edge 12GB GDDR6 192-bit 15 Gbps PCIE 4.0 Gaming Graphics Card, IceStorm 2.0 Cooling, Active Fan Control, FREEZE Fan Stop, ZT-A30600E-10M",
        brand_id: zotacBrandId,
        model: "ZT-A30600E-10M",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-509-V08.jpg",
      },
      {
        name: "Twin Edge OC GeForce RTX 5060 Ti 16GB",
        sku: "14-500-612",
        short_description:
          "ZOTAC Twin Edge OC GeForce RTX 5060 Ti PCI Express 5.0 x8 16GB 128-Bit GDDR7 Graphics Card ZT-B50620H-10M",
        brand_id: zotacBrandId,
        model: "ZT-B50620H-10M",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-612-10.jpg",
      },
      {
        name: "AMP GeForce RTX 5070 12GB White Edition",
        sku: "14-500-617",
        short_description:
          "ZOTAC AMP GeForce RTX 5070 12GB 192-Bit GDDR7 PCI Express 5.0 x16 Graphics Card RTX 5070 AMP White Edition ZT-B50700FQ-10P",
        brand_id: zotacBrandId,
        model: "ZT-B50700FQ-10P",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-617-10.jpg",
      },
      {
        name: "SOLO GeForce RTX 5050 8GB",
        sku: "14-500-625",
        short_description:
          "ZOTAC SOLO GeForce RTX 5050 8GB GDDR6 PCI Express 5.0 x8 ATX Graphics Card GeForce RTX 5050 SOLO ZT-B50500G-10L",
        brand_id: zotacBrandId,
        model: "ZT-B50500G-10L",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-625-02.jpg",
      },
      {
        name: "GAMING GeForce RTX 5060 Twin Edge OC 8GB",
        sku: "14-500-623",
        short_description:
          "ZOTAC GAMING GeForce RTX 5060 Twin Edge OC DLSS 4 8GB GDDR7 128-bit 28 Gbps PCIE 5.0 Gaming Graphics Card, SFF-ready compact card, ZT-B50600H-10M",
        brand_id: zotacBrandId,
        model: "ZT-B50600H-10M",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-623-02.jpg",
      },
      {
        name: "GAMING GeForce GTX 1660 SUPER Twin Fan 6GB",
        sku: "9SIADT2KAU1283",
        short_description:
          "ZOTAC GAMING GeForce GTX 1660 SUPER Twin Fan Black 6GB GDDR6 192-bit Gaming Graphics Card, ZT-T16620J-10M",
        brand_id: zotacBrandId,
        model: "ZT-T16620J-10M",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/1FT-000M-003U0-S08.jpg",
      },
      {
        name: "GAMING GeForce RTX 3090 Trinity OC 24GB",
        sku: "9SIABKXKBC4109",
        short_description:
          "ZOTAC GAMING GeForce RTX 3090 Trinity OC 24GB GDDR6X 384-bit 19.5 Gbps PCIE 4.0 Gaming Graphics Card, IceStorm 2.0 Advanced Cooling, SPECTRA 2.0 RGB Lighting, ZT-A30900J-10P",
        brand_id: zotacBrandId,
        model: "ZT-A30900J-10P",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-510-V01.jpg",
      },
      {
        name: "GAMING GeForce RTX 4060 8GB Solo",
        sku: "9SIBTK0KCK4538",
        short_description:
          "ZOTAC GAMING GeForce RTX 4060 8GB Solo DLSS 3 8GB GDDR6 128-bit 17 Gbps PCIE 4.0 Super Compact Gaming Graphics Card, ZT-D40600G-10L",
        brand_id: zotacBrandId,
        model: "ZT-D40600G-10L",
        type: "VGA" as const,
        primary_image:
          "https://c1.neweggimages.com/productimage/nb300/14-500-558-S09.jpg",
      },
    ],
    [zotacBrandId],
  );

  const handleAddSampleProducts = async () => {
    setIsLoading(true);
    console.log("[Products] Adding sample products started:", {
      totalProducts: sampleProducts.length,
    });

    try {
      let successCount = 0;
      const totalProducts = sampleProducts.length;

      for (const product of sampleProducts) {
        try {
          await createProductMutation.mutateAsync(product);
          successCount++;
        } catch (error) {
          console.error(
            `[Products] Failed to create sample product: ${product.name}`,
            error,
          );
        }
      }

      if (successCount === totalProducts) {
        const successMessage = `Đã thêm thành công ${successCount} sản phẩm mẫu`;
        console.log(
          "[Products] All sample products added successfully:",
          successMessage,
          { successCount, totalProducts },
        );
        toast.success(successMessage);
      } else if (successCount > 0) {
        const successMessage = `Đã thêm thành công ${successCount}/${totalProducts} sản phẩm mẫu`;
        console.log(
          "[Products] Partial sample products added:",
          successMessage,
          { successCount, totalProducts },
        );
        toast.success(successMessage);
      } else {
        const errorMessage = "Không thể thêm sản phẩm mẫu nào";
        console.error("[Products] No sample products added:", errorMessage, {
          successCount,
          totalProducts,
        });
        toast.error(errorMessage);
      }

      if (successCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = "Lỗi khi thêm sản phẩm mẫu";
      console.error(
        "[Products] Sample products addition error:",
        errorMessage,
        { error },
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddSampleProducts}
      disabled={isLoading}
    >
      <IconDatabase />
      <span className="hidden lg:inline">
        {isLoading ? "Đang thêm..." : "Thêm mẫu"}
      </span>
    </Button>
  );
}
