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
import { Combobox } from "@/components/ui/combobox";
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
  product_id: z.string().nullable(),
  name: z.string(),
  part_number: z.string().nullable(),
  sku: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  products: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    brand: z.string().nullable(),
  }).nullable().optional(),
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

const columns: ColumnDef<z.infer<typeof partSchema>>[] = [
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
    header: "Linh kiện",
    cell: ({ row }) => {
      return <PartViewer part={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "part_number",
    header: "Mã linh kiện",
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.original.part_number || (
          <span className="text-muted-foreground italic">No part number</span>
        )}
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
    accessorKey: "products",
    header: "Sản phẩm",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.products ? (
          <>
            <Badge variant="outline" className="text-xs">
              {row.original.products.type}
            </Badge>
            <span className="font-medium">{row.original.products.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground italic">No product</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Giá",
    cell: ({ row }) => (
      <div className="font-medium">
        {new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(row.original.price)}
      </div>
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
    cell: ({ row }) => <QuickActions part={row.original} />,
  },
];

function QuickActions({ part }: { part: z.infer<typeof partSchema> }) {
  const handleClone = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: `Cloning ${part.name}...`,
      success: "Part cloned successfully",
      error: "Failed to clone part",
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Edit Part */}
      <PartsModal
        part={part}
        mode="edit"
        trigger={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 text-muted-foreground hover:text-foreground"
              >
                <IconEdit className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Part</p>
            </TooltipContent>
          </Tooltip>
        }
        onSuccess={() => window.location.reload()}
      />

      {/* Clone Part */}
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
          <p>Clone Part</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function DraggableRow({ row }: { row: Row<z.infer<typeof partSchema>> }) {
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

export function PartsTable({
  data: initialData,
}: {
  data: z.infer<typeof partSchema>[];
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
        item.part_number?.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower) ||
        item.products?.name.toLowerCase().includes(searchLower)
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
            <SelectValue placeholder="Select a view" />
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
          <PartsModal
            mode="add"
            trigger={
              <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">Thêm linh kiện</span>
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>
      <TabsContent
        value="parts-list"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên, mã linh kiện, SKU hoặc sản phẩm..."
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
                      No parts found.
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
            {table.getFilteredRowModel().rows.length} part(s) selected.
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
      <TabsContent value="inventory" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

function PartViewer({
  part,
}: {
  part: z.infer<typeof partSchema>;
}) {
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
            <div className="text-sm text-muted-foreground">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(part.price)}
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

function PartsModal({
  part,
  mode,
  trigger,
  onSuccess,
}: PartsModalProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    product_id: "",
    name: "",
    part_number: "",
    sku: "",
    description: "",
    price: 0,
    image_url: "",
  });

  // tRPC queries and mutations
  const { data: products } = trpc.parts.getProducts.useQuery();

  const createPartMutation = trpc.parts.createPart.useMutation({
    onSuccess: () => {
      toast.success("Part created successfully");
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create part");
    },
  });

  const updatePartMutation = trpc.parts.updatePart.useMutation({
    onSuccess: () => {
      toast.success("Part updated successfully");
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update part");
    },
  });

  const isLoading = createPartMutation.status === "pending" || updatePartMutation.status === "pending";

  // Reset form when modal opens or mode/part changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        product_id: part?.product_id || "",
        name: part?.name || "",
        part_number: part?.part_number || "",
        sku: part?.sku || "",
        description: part?.description || "",
        price: part?.price || 0,
        image_url: part?.image_url || "",
      });
    }
  }, [open, part]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a part name");
      return;
    }

    if (!formData.product_id) {
      toast.error("Please select a product");
      return;
    }

    if (formData.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (mode === "add") {
      createPartMutation.mutate({
        product_id: formData.product_id,
        name: formData.name,
        part_number: formData.part_number || null,
        sku: formData.sku || null,
        description: formData.description || null,
        price: formData.price,
        image_url: formData.image_url || null,
      });
    } else if (part) {
      updatePartMutation.mutate({
        id: part.id,
        product_id: formData.product_id,
        name: formData.name,
        part_number: formData.part_number || null,
        sku: formData.sku || null,
        description: formData.description || null,
        price: formData.price,
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
            {mode === "add" ? "Add New Part" : part?.name}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "add"
              ? "Create a new part with the required information."
              : "Part details and management options"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="product_id">Product *</Label>
              <Combobox
                value={formData.product_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, product_id: value })
                }
                options={
                  products?.map((product) => ({
                    value: product.id,
                    label: (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {product.type}
                        </Badge>
                        {product.name}
                        {product.brand && (
                          <span className="text-muted-foreground text-xs">
                            - {product.brand}
                          </span>
                        )}
                      </div>
                    ),
                  })) || []
                }
                placeholder="Select product"
                searchPlaceholder="Search products..."
                emptyMessage="No products found."
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Part Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter part name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="part_number">Part Number</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) =>
                    setFormData({ ...formData, part_number: e.target.value })
                  }
                  placeholder="Enter part number (optional)"
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
                  placeholder="Enter SKU (optional)"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                placeholder="Enter price in VND"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter part description (optional)"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="Enter image URL (optional)"
              />
            </div>
            {mode === "edit" && part && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Part ID</Label>
                    <div className="font-mono text-xs">{part.id}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Price</Label>
                    <div>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(part.price)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <div>
                      {new Date(part.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Updated</Label>
                    <div>
                      {new Date(part.updated_at).toLocaleDateString()}
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
                ? "Create Part"
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