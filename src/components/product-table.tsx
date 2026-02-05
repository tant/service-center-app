"use client";

import {
  IconChevronDown,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDrawer } from "@/components/ui/form-drawer";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  physical_products_count: z.number().default(0),
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
  // Issue #9: Hidden - Parts feature is disabled for MVP
  // {
  //   accessorKey: "parts_count",
  //   header: "Linh kiện",
  //   cell: ({ row }) => (
  //     <div className="flex items-center gap-1.5">
  //       <IconPackage className="h-4 w-4 text-muted-foreground" />
  //       <span className="font-medium">{row.original.parts_count}</span>
  //       <span className="text-xs text-muted-foreground">parts</span>
  //     </div>
  //   ),
  // },
  {
    accessorKey: "physical_products_count",
    header: "Tồn kho",
    cell: ({ row }) => {
      const count = row.original.physical_products_count;
      return (
        <div className="flex items-center gap-1.5">
          <IconPackage className="h-4 w-4 text-muted-foreground" />
          <span
            className={`font-semibold ${count > 0 ? "text-green-600" : "text-muted-foreground"}`}
          >
            {count}
          </span>
          <span className="text-xs text-muted-foreground">units</span>
        </div>
      );
    },
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
      suppressHydrationWarning
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
                    // parts_count: "Linh kiện", // Issue #9: Hidden - Parts feature is disabled for MVP
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
          {["admin", "manager"].includes(currentUserRole) && (
            <ProductModal
              mode="add"
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="add-product-button"
                >
                  <IconPlus />
                  <span className="hidden lg:inline">Thêm sản phẩm</span>
                </Button>
              }
              onSuccess={() => window.location.reload()}
            />
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
          <TablePagination table={table} labelId="rows-per-page-products" />
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
  const [open, setOpen] = React.useState(false);
  // Issue #10: State for duplicate name warning dialog
  const [showDuplicateNameAlert, setShowDuplicateNameAlert] =
    React.useState(false);
  const [duplicateNameMessage, setDuplicateNameMessage] = React.useState("");

  const [formData, setFormData] = React.useState({
    name: "",
    sku: "",
    short_description: "",
    brand_id: null as string | null,
    model: "",
    type: "VGA" as "VGA" | "MiniPC" | "SSD" | "RAM" | "Mainboard" | "Other",
    primary_image: "",
    selected_parts: [] as string[],
    // Issue #10: Flag to skip duplicate name warning
    skipDuplicateNameWarning: false,
  });

  // Issue #9: Hidden - Parts feature is disabled for MVP
  // Fetch parts data for selection
  // const { data: parts } = trpc.parts.getParts.useQuery();

  // Fetch brands data for selection
  const { data: brands } = trpc.brands.getBrands.useQuery();

  // Fetch product details with parts for edit mode
  const { data: productWithParts } = trpc.products.getProduct.useQuery(
    { id: product?.id || "" },
    { enabled: mode === "edit" && !!product?.id },
  );

  const createProductMutation = trpc.products.createProduct.useMutation({
    onSuccess: (data) => {
      const successMessage = "✅ Đã tạo sản phẩm thành công";
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

      // Issue #10: Handle duplicate name warning (show confirmation dialog)
      if (errorMessage.startsWith("DUPLICATE_NAME:")) {
        const cleanMessage = errorMessage.replace("DUPLICATE_NAME: ", "");
        console.log("[Products] Duplicate name warning:", cleanMessage);
        setDuplicateNameMessage(cleanMessage);
        setShowDuplicateNameAlert(true);
        return; // Don't show toast for warning
      }

      // Issue #10: Handle duplicate SKU validation (block creation)
      if (errorMessage.startsWith("DUPLICATE_SKU:")) {
        const cleanMessage = errorMessage.replace("DUPLICATE_SKU: ", "");
        console.log("[Products] Duplicate SKU blocked:", cleanMessage);
        toast.error(cleanMessage);
        return;
      }

      // Other errors
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
      // Issue #9: Hidden - Parts feature is disabled for MVP
      // const existingPartIds =
      //   mode === "edit" && productWithParts?.parts
      //     ? productWithParts.parts.map((part: { id: string }) => part.id)
      //     : [];

      setFormData({
        name: product?.name || "",
        sku: product?.sku || "",
        short_description: product?.short_description || "",
        brand_id: product?.brand_id || null,
        model: product?.model || "",
        type: product?.type || "VGA",
        primary_image: product?.primary_image || "",
        selected_parts: [], // Issue #9: Always empty array
        skipDuplicateNameWarning: false, // Issue #10: Reset flag
      });
    }
  }, [open, product, productWithParts, mode]);

  // Issue #9: Hidden - Parts feature is disabled for MVP
  // Prepare parts options for multi-select
  // const partsOptions: MultiSelectOption[] = React.useMemo(
  //   () =>
  //     parts?.map((part) => ({
  //       label: part.name,
  //       value: part.id,
  //       part_number: part.part_number || "N/A",
  //       stock_quantity: part.stock_quantity,
  //       price: part.price,
  //       disabled: part.stock_quantity === 0,
  //     })) || [],
  //   [parts],
  // );

  const handleSubmit = async () => {
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
        // Issue #10: Include flag to skip duplicate name warning
        skipDuplicateNameWarning: formData.skipDuplicateNameWarning,
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

  const title =
    mode === "edit" && product ? (
      <div className="flex items-center gap-3">
        <ProductImage
          src={product.primary_image}
          alt={product.name || "Product"}
          className="w-10 h-10"
        />
        <span>{product.name}</span>
      </div>
    ) : (
      "Thêm Sản Phẩm Mới"
    );

  return (
    <>
      {/* Issue #10: Alert dialog for duplicate name warning */}
      <AlertDialog
        open={showDuplicateNameAlert}
        onOpenChange={setShowDuplicateNameAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Cảnh báo: Tên sản phẩm trùng</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateNameMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // User confirmed - retry with flag set to true
                setFormData({ ...formData, skipDuplicateNameWarning: true });
                setShowDuplicateNameAlert(false);
                // Trigger submission again
                handleSubmit();
              }}
            >
              Tiếp tục tạo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        trigger={trigger}
        titleElement={title}
        description={
          mode === "add"
            ? "Tạo sản phẩm mới với các thông tin bắt buộc."
            : "Chi tiết và tùy chọn quản lý sản phẩm"
        }
        isSubmitting={isLoading}
        onSubmit={handleSubmit}
        submitLabel={
          isLoading
            ? mode === "add"
              ? "Đang tạo..."
              : "Đang cập nhật..."
            : mode === "add"
              ? "Tạo sản phẩm"
              : "Lưu thay đổi"
        }
        headerClassName="gap-1"
      >
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
          {/* Issue #9: Hidden - Parts feature is disabled for MVP */}
          {/* <div className="flex flex-col gap-3">
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
            </div> */}
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
                  <div>{new Date(product.created_at).toLocaleDateString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Cập nhật lúc</Label>
                  <div>{new Date(product.updated_at).toLocaleDateString()}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </FormDrawer>
    </>
  );
}
