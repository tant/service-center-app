"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  IconChevronDown,
  IconCopy,
  IconEdit,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const partSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable(),
  name: z.string(),
  part_number: z.string().nullable(),
  sku: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  updated_by: z.string(),
});

export type Part = z.infer<typeof partSchema>;

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

function DraggableRow<TData extends { id: string }>({ row }: { row: Row<TData> }) {
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


interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  searchValue,
  sensors,
  sortableId,
  dataIds,
}: DataTableProps<TData, TValue> & {
  searchValue: string;
  sensors: any;
  sortableId: string;
  dataIds: UniqueIdentifier[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [tableData, setTableData] = React.useState<TData[]>(data);

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTableData((data) => {
        const oldIndex = data.findIndex((item: any) => item.id === active.id);
        const newIndex = data.findIndex((item: any) => item.id === over.id);

        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
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
                    <DraggableRow<TData> key={row.id} row={row} />
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
    );
  }

interface PartsTableProps {
  data: Part[];
}

export function PartsTable({ data: initialData }: PartsTableProps) {
  const [data, setData] = React.useState(() => initialData);
  const [searchValue, setSearchValue] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const handleEdit = (part: Part) => {
    toast.success(`Chỉnh sửa phụ kiện: ${part.name}`);
  };

  const handleClone = (part: Part) => {
    toast.success(`Sao chép phụ kiện: ${part.name}`);
  };

  const handleDelete = (part: Part) => {
    toast.success(`Xóa phụ kiện: ${part.name}`);
  };

  const columns: ColumnDef<Part>[] = [
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
      header: "Tên phụ kiện",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "part_number",
      header: "Mã phụ kiện",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("part_number") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue("sku") || "—"}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Giá",
      cell: ({ row }) => {
        const price = row.getValue("price") as number | null;
        return (
          <div className="text-sm">
            {price ? `${price.toLocaleString("vi-VN")} ₫` : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Ngày tạo",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div className="text-sm">{date.toLocaleDateString("vi-VN")}</div>;
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const part = row.original;

        return (
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(part)}
              className="h-8 w-8 p-0"
            >
              <IconEdit className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClone(part)}
              className="h-8 w-8 p-0"
            >
              <IconCopy className="h-5 w-5" />
              <span className="sr-only">Sao chép</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(part)}
              className="h-8 w-8 p-0"
            >
              <IconTrash className="h-5 w-5" />
              <span className="sr-only">Xóa</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const partNumber = item.part_number?.toLowerCase() || "";
      const sku = item.sku?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      const search = searchValue.toLowerCase();

      return name.includes(search) ||
             partNumber.includes(search) ||
             sku.includes(search) ||
             description.includes(search);
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
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parts-list">Danh sách phụ kiện</SelectItem>
            <SelectItem value="inventory">Quản lý tồn kho</SelectItem>
            <SelectItem value="suppliers">Nhà cung cấp</SelectItem>
            <SelectItem value="reports">Báo cáo</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="parts-list">Danh sách phụ kiện</TabsTrigger>
          <TabsTrigger value="inventory">
            Quản lý tồn kho <Badge variant="secondary">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            Nhà cung cấp <Badge variant="secondary">5</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
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
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Thêm phụ kiện</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="parts-list"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên, mã phụ kiện, SKU hoặc mô tả..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          data={data}
          searchValue={searchValue}
          sensors={sensors}
          sortableId={sortableId}
          dataIds={dataIds}
        />
      </TabsContent>
      <TabsContent
        value="inventory"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Quản lý tồn kho</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Theo dõi số lượng tồn kho, cảnh báo hết hàng và quản lý nhập xuất kho.
            </p>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="suppliers"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Nhà cung cấp</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Quản lý thông tin nhà cung cấp, đơn đặt hàng và lịch sử giao dịch.
            </p>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="reports"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="flex h-[200px] shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Báo cáo</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Báo cáo chi tiết về tình trạng phụ kiện, doanh thu và xu hướng sử dụng.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}