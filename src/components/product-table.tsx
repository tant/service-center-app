"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCopy,
  IconEdit,
  IconGripVertical,
  IconLayoutColumns,
  IconPackage,
  IconPlus,
  IconTrash,
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
  type Row,
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

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  short_description: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  type: z.enum(["hardware", "software", "accessory"]),
  primary_image: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
});

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof productSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
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
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
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
    accessorKey: "brand",
    header: "Thương hiệu",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.brand || (
          <span className="text-muted-foreground italic">No brand</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.model || (
          <span className="text-muted-foreground italic">No model</span>
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
          row.original.type === "hardware"
            ? "default"
            : row.original.type === "software"
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
    header: "Actions",
    cell: ({ row }) => <QuickActions product={row.original} />,
  },
];

function QuickActions({ product }: { product: z.infer<typeof productSchema> }) {
  const handleEdit = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Opening editor for ${product.name}...`,
      success: "Product editor opened",
      error: "Failed to open editor",
    });
  };

  const handleClone = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Cloning ${product.name}...`,
      success: "Product cloned successfully",
      error: "Failed to clone product",
    });
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Deleting ${product.name}...`,
      success: "Product deleted successfully",
      error: "Failed to delete product",
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Edit Product */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <IconEdit className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit Product</p>
        </TooltipContent>
      </Tooltip>

      {/* Clone Product */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleClone}
          >
            <IconCopy className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clone Product</p>
        </TooltipContent>
      </Tooltip>

      {/* Delete Product */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-9 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <IconTrash className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete Product</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function DraggableRow({ row }: { row: Row<z.infer<typeof productSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function ProductTable({
  data: initialData,
}: {
  data: z.infer<typeof productSchema>[];
}) {
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
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const filteredData = React.useMemo(() => {
    if (!searchValue) return data;

    return data.filter((item) => {
      const searchLower = searchValue.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.model?.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchValue]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ id }) => id) || [],
    [filteredData],
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((currentData) => {
        const oldIndex = currentData.findIndex((item) => item.id === active.id);
        const newIndex = currentData.findIndex((item) => item.id === over.id);
        return arrayMove(currentData, oldIndex, newIndex);
      });
    }
  }

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
            <SelectValue placeholder="Select a view" />
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
          <ProductModal
            mode="add"
            trigger={
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Thêm sản phẩm</span>
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>
      <TabsContent
        value="product-list"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên, thương hiệu, model hoặc SKU..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
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
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} product(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
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

function ProductViewer({
  product,
}: {
  product: z.infer<typeof productSchema>;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto">
          <Avatar className="size-8">
            <AvatarImage src={product.primary_image || ""} />
            <AvatarFallback>
              <IconPackage className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <div className="font-medium">{product.name}</div>
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={product.primary_image || ""} />
              <AvatarFallback>
                <IconPackage className="size-5" />
              </AvatarFallback>
            </Avatar>
            {product.name}
          </DrawerTitle>
          <DrawerDescription>
            Product details and management options
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" defaultValue={product.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" defaultValue={product.sku || ""} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={product.type}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" defaultValue={product.brand || ""} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="model">Model</Label>
                <Input id="model" defaultValue={product.model || ""} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                defaultValue={product.short_description || ""}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" defaultValue={product.primary_image || ""} />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Product ID</Label>
                <div className="font-mono text-xs">{product.id}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div>{product.type}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <div>{new Date(product.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Updated</Label>
                <div>{new Date(product.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={() =>
              toast.promise(
                new Promise((resolve) => setTimeout(resolve, 1000)),
                {
                  loading: `Updating ${product.name}...`,
                  success: "Product updated successfully",
                  error: "Failed to update product",
                },
              )
            }
          >
            Save Changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    sku: "",
    short_description: "",
    brand: "",
    model: "",
    type: "hardware" as "hardware" | "software" | "accessory",
    primary_image: "",
  });

  // Reset form when modal opens or mode/product changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: product?.name || "",
        sku: product?.sku || "",
        short_description: product?.short_description || "",
        brand: product?.brand || "",
        model: product?.model || "",
        type: product?.type || "hardware",
        primary_image: product?.primary_image || "",
      });
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a product name");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "add") {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            sku: formData.sku || null,
            short_description: formData.short_description || null,
            brand: formData.brand || null,
            model: formData.model || null,
            type: formData.type,
            primary_image: formData.primary_image || null,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        toast.success("Product created successfully");
      } else {
        // TODO: Implement update functionality
        toast.success("Update functionality coming soon");
      }

      setOpen(false);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
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
                <AvatarImage src={product?.primary_image || ""} />
                <AvatarFallback>
                  <IconPackage className="size-5" />
                </AvatarFallback>
              </Avatar>
            )}
            {mode === "add" ? "Add New Product" : product?.name}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "add"
              ? "Create a new product with the required information."
              : "Product details and management options"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
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
                  placeholder="Enter SKU (optional)"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "hardware" | "software" | "accessory") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="Enter brand (optional)"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="Enter model (optional)"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="short_description">Description</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
                placeholder="Enter product description (optional)"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="primary_image">Image URL</Label>
              <Input
                id="primary_image"
                value={formData.primary_image}
                onChange={(e) =>
                  setFormData({ ...formData, primary_image: e.target.value })
                }
                placeholder="Enter image URL (optional)"
              />
            </div>
            {mode === "edit" && product && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Product ID</Label>
                    <div className="font-mono text-xs">{product.id}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <div>{product.type}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <div>
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Updated</Label>
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
                ? "Creating..."
                : "Updating..."
              : mode === "add"
                ? "Create Product"
                : "Save Changes"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
