"use client";

import * as React from "react";
import {
  IconEdit,
  IconTrash,
  IconFileText,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconDatabase,
  IconEye,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteTemplate } from "@/hooks/use-workflow";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";

interface Template {
  id: string;
  name: string;
  description?: string;
  service_type: "warranty" | "paid" | "replacement";
  strict_sequence: boolean;
  is_active: boolean;
  created_at: string;
  tasks?: Array<{
    id: string;
    sequence_order: number;
    is_required: boolean;
    task_type: {
      id: string;
      name: string;
      category?: string;
    };
  }>;
}

interface TemplateListTableInterface {
  templates: Template[];
  isLoading: boolean;
  onEdit: (templateId: string) => void;
  onPreview: (templateId: string) => void;
  onCreateNew: () => void;
}

const SERVICE_TYPE_LABELS = {
  warranty: "Bảo hành",
  paid: "Trả phí",
  replacement: "Đổi mới",
};

const SERVICE_TYPE_COLORS = {
  warranty: "bg-blue-500",
  paid: "bg-green-500",
  replacement: "bg-orange-500",
};

export function TemplateListTable({
  templates,
  isLoading,
  onEdit,
  onPreview,
  onCreateNew,
}: TemplateListTableInterface) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const { deleteTemplate, isDeleting } = useDeleteTemplate();

  const columns: ColumnDef<Template>[] = React.useMemo(
    () => [
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
        header: "Tên mẫu",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            className="h-auto p-2 font-medium hover:bg-accent"
            onClick={() => onEdit(row.original.id)}
          >
            {row.original.name}
          </Button>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "service_type",
        header: "Loại dịch vụ",
        cell: ({ row }) => (
          <Badge
            className={SERVICE_TYPE_COLORS[row.original.service_type]}
          >
            {SERVICE_TYPE_LABELS[row.original.service_type]}
          </Badge>
        ),
      },
      {
        accessorKey: "tasks",
        header: "Công việc",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <IconFileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {row.original.tasks?.length || 0}
            </span>
            {row.original.strict_sequence && (
              <Badge variant="outline" className="text-xs">
                Tuần tự
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Hành động</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Hành động
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPreview(row.original.id)}>
                  <IconEye className="mr-2 h-4 w-4" />
                  Xem trước
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(row.original.id)}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    deleteTemplate({
                      template_id: row.original.id,
                      soft_delete: true,
                    })
                  }
                  disabled={isDeleting}
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEdit, onPreview, deleteTemplate, isDeleting]
  );

  const table = useReactTable({
    data: templates,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Đang tải mẫu...</div>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue="all-templates"
      className="w-full flex-col justify-start gap-6"
    >
      {/* Row 1: Tabs + Buttons */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="all-templates">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Chọn hiển thị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-templates">Tất cả mẫu</SelectItem>
            <SelectItem value="active">Đang hoạt động</SelectItem>
            <SelectItem value="archived">Đã lưu trữ</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all-templates">Tất cả mẫu</TabsTrigger>
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="archived">Đã lưu trữ</TabsTrigger>
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
                    column.getCanHide()
                )
                .map((column) => {
                  const columnDisplayNames: Record<string, string> = {
                    name: "Tên mẫu",
                    service_type: "Loại dịch vụ",
                    tasks: "Công việc",
                    created_at: "Ngày tạo",
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
          <Button onClick={onCreateNew} size="sm" variant="outline">
            <IconPlus />
            <span className="hidden lg:inline">Tạo mẫu</span>
          </Button>
          <AddSampleTemplatesButton onSuccess={() => window.location.reload()} />
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent
        value="all-templates"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        {/* Row 2: Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm mẫu..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Row 3: Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
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
                    Không tìm thấy mẫu nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            Đã chọn {table.getFilteredSelectedRowModel().rows.length} trong{" "}
            {table.getFilteredRowModel().rows.length} mẫu
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

      {/* Additional tab contents (can be implemented later) */}
      <TabsContent value="active" className="px-4 lg:px-6">
        <div className="text-muted-foreground py-8 text-center">
          Hiển thị mẫu đang hoạt động - sắp ra mắt
        </div>
      </TabsContent>
      <TabsContent value="archived" className="px-4 lg:px-6">
        <div className="text-muted-foreground py-8 text-center">
          Hiển thị mẫu đã lưu trữ - sắp ra mắt
        </div>
      </TabsContent>
    </Tabs>
  );
}

function AddSampleTemplatesButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch task types to use their IDs
  const { data: taskTypes } = trpc.workflow.taskType.list.useQuery();

  const createTemplateMutation = trpc.workflow.template.create.useMutation({
    onSuccess: (data) => {
      console.log("[Templates] Sample template created:", { response: data });
    },
    onError: (error) => {
      const errorMessage = error.message || "Lỗi khi tạo mẫu quy trình";
      console.error("[Templates] Sample template creation error:", errorMessage, {
        error,
      });
      toast.error(errorMessage);
    },
  });

  // Define basic production templates based on ZOTAC & SSTC workflow
  // These are the foundation templates that users will actually use and customize
  const getSampleTemplates = React.useCallback(() => {
    if (!taskTypes || taskTypes.length === 0) return [];

    // Helper to find task type by name
    const findTaskType = (name: string) =>
      taskTypes.find(tt => tt.name === name);

    // Get IDs for all task types (Vietnamese descriptions in database)
    const productReceiving = findTaskType("Product Receiving");
    const serialVerification = findTaskType("Serial Verification");
    const initialInspection = findTaskType("Initial Inspection");
    const customerInterview = findTaskType("Customer Interview");
    const runDiagnostic = findTaskType("Run Diagnostic Tests");
    const identifyRootCause = findTaskType("Identify Root Cause");
    const componentTesting = findTaskType("Component Testing");
    const warrantyCheck = findTaskType("Warranty Check");
    const managerApproval = findTaskType("Manager Approval");
    const quoteCreation = findTaskType("Quote Creation");
    const customerDecision = findTaskType("Customer Decision");
    const replaceComponent = findTaskType("Replace Component");
    const repairComponent = findTaskType("Repair Component");
    const cleanService = findTaskType("Clean/Service");
    const firmwareUpdate = findTaskType("Firmware Update");
    const warehouseOut = findTaskType("Warehouse Out");
    const warehouseIn = findTaskType("Warehouse In");
    const rmaProcessing = findTaskType("RMA Processing");
    const qualityCheck = findTaskType("Quality Check");
    const functionalTest = findTaskType("Functional Test");
    const burnInTest = findTaskType("Burn-In Test");
    const finalInspection = findTaskType("Final Inspection");
    const customerNotification = findTaskType("Customer Notification");
    const paymentCollection = findTaskType("Payment Collection");
    const documentationUpdate = findTaskType("Documentation Update");
    const packageDelivery = findTaskType("Package for Delivery");

    return [
      // =============================================================
      // TEMPLATE 1: Bảo hành - Sửa chữa (Warranty Repair)
      // Use case: Sản phẩm CÓ THỂ SỬA (GPU quạt hỏng, Mini PC, Barebone)
      // Flow: Reception → Diagnosis → Warranty Check → Repair → QA → Return
      // =============================================================
      {
        name: "Bảo hành - Sửa chữa",
        description: "Quy trình bảo hành cho sản phẩm có thể sửa chữa (GPU lỗi quạt/thermal, Mini PC, Barebone PC). Áp dụng khi: còn BH, seal nguyên vẹn, có thể sửa được.",
        service_type: "warranty" as const,
        strict_sequence: true,
        is_active: true,
        tasks: [
          // INTAKE - Tiếp nhận
          ...(productReceiving ? [{
            task_type_id: productReceiving.id,
            sequence_order: 1,
            is_required: true,
            custom_instructions: "Tiếp nhận sản phẩm: chụp ảnh bao bì, kiểm tra phụ kiện đi kèm (dây nguồn, adapter, v.v.). Scan mã vận đơn nếu gửi từ xa.",
          }] : []),
          ...(serialVerification ? [{
            task_type_id: serialVerification.id,
            sequence_order: 2,
            is_required: true,
            custom_instructions: "Scan serial number trên sản phẩm, đối chiếu với phiếu yêu cầu. Verify với database nhà sản xuất (ZOTAC/SSTC).",
          }] : []),
          ...(initialInspection ? [{
            task_type_id: initialInspection.id,
            sequence_order: 3,
            is_required: true,
            custom_instructions: "Kiểm tra vật lý: seal còn nguyên vẹn, không dấu hiệu va đập/rơi/nước, vỏ ngoài không trầy xước lớn, connector không cong/gãy. Chụp ảnh 360° sản phẩm.",
          }] : []),

          // DIAGNOSIS - Chẩn đoán
          ...(runDiagnostic ? [{
            task_type_id: runDiagnostic.id,
            sequence_order: 4,
            is_required: true,
            custom_instructions: "Chạy test chuyên sâu: GPU (Furmark 30 phút), SSD (CrystalDiskMark, SMART), RAM (Memtest86), Mini PC (full system stress). Ghi lại nhiệt độ, tốc độ quạt, điện áp, clock speeds.",
          }] : []),
          ...(componentTesting ? [{
            task_type_id: componentTesting.id,
            sequence_order: 5,
            is_required: true,
            custom_instructions: "Test từng linh kiện riêng lẻ: quạt (RPM), thermal sensor, power delivery, VRAM (memory test), PCIe connection. Xác định chính xác linh kiện nào lỗi.",
          }] : []),
          ...(identifyRootCause ? [{
            task_type_id: identifyRootCause.id,
            sequence_order: 6,
            is_required: true,
            custom_instructions: "Xác định nguyên nhân gốc: quạt bearing hỏng, thermal paste khô, capacitor phồng/rò, solder joint lỏng, driver IC lỗi. Đánh giá có thể sửa được không.",
          }] : []),
          ...(warrantyCheck ? [{
            task_type_id: warrantyCheck.id,
            sequence_order: 7,
            is_required: true,
            custom_instructions: "Kiểm tra điều kiện BH: serial hợp lệ, thời hạn còn hiệu lực, seal nguyên vẹn (chưa can thiệp), không dấu hiệu lạm dụng/vận hành sai. Chụp ảnh seal + serial + bảo hành card.",
          }] : []),

          // APPROVAL - Phê duyệt
          ...(managerApproval ? [{
            task_type_id: managerApproval.id,
            sequence_order: 8,
            is_required: true,
            custom_instructions: "Manager review: xác nhận đủ điều kiện BH, phê duyệt phương án sửa chữa, ước tính thời gian & chi phí (0đ cho BH). Lưu ý case goodwill nếu cần.",
          }] : []),

          // REPAIR - Sửa chữa
          ...(replaceComponent ? [{
            task_type_id: replaceComponent.id,
            sequence_order: 9,
            is_required: true,
            custom_instructions: "Thay thế linh kiện lỗi: quạt (fan assembly), thermal paste/pad, capacitor, power connector. Sử dụng linh kiện chính hãng/tương đương. Ghi rõ part number đã thay.",
          }] : []),
          ...(cleanService ? [{
            task_type_id: cleanService.id,
            sequence_order: 10,
            is_required: false,
            custom_instructions: "Vệ sinh bảo dưỡng: thổi bụi heatsink/fan, lau PCB bằng isopropyl alcohol, kiểm tra thermal pad ở VRAM/VRM. Cải thiện hiệu suất tản nhiệt.",
          }] : []),

          // QA - Kiểm tra chất lượng
          ...(burnInTest ? [{
            task_type_id: burnInTest.id,
            sequence_order: 11,
            is_required: true,
            custom_instructions: "Burn-in test: GPU (Furmark + game benchmark 2h), SSD (write endurance test), RAM (Memtest 4 pass). Đảm bảo ổn định dài hạn, không throttle, nhiệt độ trong ngưỡng.",
          }] : []),
          ...(functionalTest ? [{
            task_type_id: functionalTest.id,
            sequence_order: 12,
            is_required: true,
            custom_instructions: "Test toàn bộ chức năng: tất cả output ports (HDMI/DP), RGB lighting, software control (GPU-Z, Afterburner), BIOS detection. Đảm bảo 100% chức năng hoạt động.",
          }] : []),
          ...(qualityCheck ? [{
            task_type_id: qualityCheck.id,
            sequence_order: 13,
            is_required: true,
            custom_instructions: "QC cuối: kiểm tra ốc vít đầy đủ, không trầy xước thêm, thermal paste không tràn, fan cable cắm chắc chắn. So sánh kết quả test với baseline.",
          }] : []),
          ...(finalInspection ? [{
            task_type_id: finalInspection.id,
            sequence_order: 14,
            is_required: true,
            custom_instructions: "Kiểm tra cuối cùng: chụp ảnh kết quả test, screenshot benchmark, verify tất cả screws/seals. Vệ sinh vỏ ngoài, đóng gói lại vào túi chống tĩnh điện.",
          }] : []),

          // CLOSING - Hoàn tất
          ...(documentationUpdate ? [{
            task_type_id: documentationUpdate.id,
            sequence_order: 15,
            is_required: true,
            custom_instructions: "Cập nhật hồ sơ: ghi rõ linh kiện đã thay, part number, kết quả test before/after, thời gian sửa chữa thực tế. Upload ảnh/video vào hệ thống.",
          }] : []),
          ...(customerNotification ? [{
            task_type_id: customerNotification.id,
            sequence_order: 16,
            is_required: true,
            custom_instructions: "Thông báo khách: gửi email/SMS kèm kết quả test, ảnh sản phẩm đã sửa xong, video benchmark. Hỏi khách muốn ship về hay lấy tại trung tâm.",
          }] : []),
          ...(packageDelivery ? [{
            task_type_id: packageDelivery.id,
            sequence_order: 17,
            is_required: true,
            custom_instructions: "Đóng gói giao hàng: bọc bubble wrap, hộp carton chắc chắn, dán nhãn FRAGILE. Nếu ship: tạo mã vận đơn, cập nhật tracking cho khách.",
          }] : []),
        ].filter(task => task.task_type_id),
      },

      // =============================================================
      // TEMPLATE 2: Bảo hành - Đổi mới (Warranty Replacement)
      // Use case: Sản phẩm KHÔNG SỬA ĐƯỢC (SSD controller lỗi, RAM chip hỏng, GPU core/VRAM chết)
      // Flow: Reception → Diagnosis → Warranty Check → Warehouse Replace → QA → Return
      // =============================================================
      {
        name: "Bảo hành - Đổi sản phẩm mới",
        description: "Quy trình bảo hành cho sản phẩm không thể sửa chữa (SSD lỗi controller, RAM lỗi chip, GPU core/VRAM chết). Sản phẩm lỗi sẽ được đổi mới và gửi RMA về hãng.",
        service_type: "warranty" as const,
        strict_sequence: true,
        is_active: true,
        tasks: [
          // INTAKE
          ...(productReceiving ? [{
            task_type_id: productReceiving.id,
            sequence_order: 1,
            is_required: true,
            custom_instructions: "Tiếp nhận sản phẩm: chụp ảnh bao bì, kiểm tra phụ kiện. Đặc biệt chú ý với SSD/RAM (dễ vỡ/cong), kiểm tra connector cẩn thận.",
          }] : []),
          ...(serialVerification ? [{
            task_type_id: serialVerification.id,
            sequence_order: 2,
            is_required: true,
            custom_instructions: "Scan serial: SSD (trên label), RAM (trên sticker), GPU (trên PCB). Verify với database nhà sản xuất, check thời hạn BH còn bao lâu.",
          }] : []),
          ...(initialInspection ? [{
            task_type_id: initialInspection.id,
            sequence_order: 3,
            is_required: true,
            custom_instructions: "Kiểm tra: label còn nguyên, không bong tróc, PCB không cháy/nứt, connector không cong, chip không nứt/vỡ. Đặc biệt chú ý SSD/RAM dễ bị ESD damage.",
          }] : []),

          // DIAGNOSIS
          ...(runDiagnostic ? [{
            task_type_id: runDiagnostic.id,
            sequence_order: 4,
            is_required: true,
            custom_instructions: "Test chuyên sâu: SSD (CrystalDiskInfo SMART, secure erase test), RAM (Memtest86 full pass), GPU (stress test core/VRAM). Xác định lỗi hardware không thể sửa.",
          }] : []),
          ...(identifyRootCause ? [{
            task_type_id: identifyRootCause.id,
            sequence_order: 5,
            is_required: true,
            custom_instructions: "Xác định: SSD controller failure (not detected/disappeared), RAM chip dead (errors persist), GPU core/VRAM failure (artifacts/crashes). Kết luận: KHÔNG THỂ SỬA, CẦN ĐỔI MỚI.",
          }] : []),
          ...(warrantyCheck ? [{
            task_type_id: warrantyCheck.id,
            sequence_order: 6,
            is_required: true,
            custom_instructions: "Kiểm tra BH: serial hợp lệ, thời hạn còn, không dấu hiệu physical damage/ESD/overvoltage. Chụp ảnh SMART log (SSD), error log (RAM), test results.",
          }] : []),

          // APPROVAL
          ...(managerApproval ? [{
            task_type_id: managerApproval.id,
            sequence_order: 7,
            is_required: true,
            custom_instructions: "Manager phê duyệt: xác nhận đủ điều kiện BH, approve đổi sản phẩm mới. Kiểm tra kho còn hàng không, chuẩn bị RMA paperwork gửi hãng.",
          }] : []),

          // WAREHOUSE - Đổi sản phẩm
          ...(warehouseOut ? [{
            task_type_id: warehouseOut.id,
            sequence_order: 8,
            is_required: true,
            custom_instructions: "Xuất sản phẩm mới từ kho: kiểm tra model/capacity/spec giống hệt sản phẩm lỗi (hoặc cao hơn nếu hết hàng). Scan serial sản phẩm mới, ghi nhận vào hệ thống.",
          }] : []),
          ...(warehouseIn ? [{
            task_type_id: warehouseIn.id,
            sequence_order: 9,
            is_required: true,
            custom_instructions: "Nhập sản phẩm lỗi vào kho RMA: gắn tag RMA, đóng gói cẩn thận (anti-static bag), ghi rõ lỗi, chụp ảnh. Chuẩn bị gửi về hãng theo batch RMA hàng tháng.",
          }] : []),
          ...(rmaProcessing ? [{
            task_type_id: rmaProcessing.id,
            sequence_order: 10,
            is_required: false,
            custom_instructions: "Xử lý RMA: điền form RMA của hãng (ZOTAC/SSTC), đính kèm test logs, ảnh sản phẩm lỗi. Tạo RMA ticket, theo dõi claim status.",
          }] : []),

          // QA - Test sản phẩm mới
          ...(functionalTest ? [{
            task_type_id: functionalTest.id,
            sequence_order: 11,
            is_required: true,
            custom_instructions: "Test sản phẩm mới: đảm bảo hoạt động 100%. SSD (full SMART check, write speed test), RAM (Memtest 2 pass), GPU (3DMark benchmark). Zero tolerance for DOA replacement.",
          }] : []),
          ...(qualityCheck ? [{
            task_type_id: qualityCheck.id,
            sequence_order: 12,
            is_required: true,
            custom_instructions: "QC sản phẩm mới: seal nguyên, hộp không móp méo, phụ kiện đầy đủ. So sánh spec với sản phẩm cũ, đảm bảo khách không bị thiệt.",
          }] : []),
          ...(finalInspection ? [{
            task_type_id: finalInspection.id,
            sequence_order: 13,
            is_required: true,
            custom_instructions: "Kiểm tra cuối: chụp ảnh sản phẩm mới + kết quả test, screenshot benchmark. In phiếu bảo hành mới (thời hạn kéo dài theo chính sách hãng).",
          }] : []),

          // CLOSING
          ...(documentationUpdate ? [{
            task_type_id: documentationUpdate.id,
            sequence_order: 14,
            is_required: true,
            custom_instructions: "Cập nhật hồ sơ: ghi rõ 'WARRANTY REPLACEMENT', serial cũ → serial mới, lý do đổi, RMA ticket number. Lưu test logs sản phẩm cũ + mới.",
          }] : []),
          ...(customerNotification ? [{
            task_type_id: customerNotification.id,
            sequence_order: 15,
            is_required: true,
            custom_instructions: "Thông báo khách: 'Sản phẩm của quý khách không thể sửa, chúng tôi đã đổi sản phẩm mới hoàn toàn miễn phí (BH)'. Gửi ảnh sản phẩm mới + serial + test results.",
          }] : []),
          ...(packageDelivery ? [{
            task_type_id: packageDelivery.id,
            sequence_order: 16,
            is_required: true,
            custom_instructions: "Đóng gói: sản phẩm mới trong hộp nguyên sealed hoặc bọc kỹ (nếu loose unit). Kèm phiếu bảo hành mới, hướng dẫn sử dụng. Ship cẩn thận.",
          }] : []),
        ].filter(task => task.task_type_id),
      },

      // =============================================================
      // TEMPLATE 3: Sửa chữa trả phí (Paid Repair)
      // Use case: Hết BH, seal broken, physical damage, customer declined warranty but want repair
      // Flow: Reception → Diagnosis → Quote → Customer Accept → Repair → Payment → Return
      // =============================================================
      {
        name: "Sửa chữa trả phí",
        description: "Quy trình sửa chữa có tính phí cho sản phẩm hết bảo hành, seal bị mở, có vết va đập/nước, hoặc khách hàng muốn sửa dù không đủ điều kiện BH. Yêu cầu báo giá và chấp thuận trước khi sửa.",
        service_type: "paid" as const,
        strict_sequence: true,
        is_active: true,
        tasks: [
          // INTAKE
          ...(productReceiving ? [{
            task_type_id: productReceiving.id,
            sequence_order: 1,
            is_required: true,
            custom_instructions: "Tiếp nhận: chụp kỹ ảnh tình trạng (seal broken, dent, scratch, water damage). Ghi chú rõ ràng để tránh tranh chấp sau này.",
          }] : []),
          ...(serialVerification ? [{
            task_type_id: serialVerification.id,
            sequence_order: 2,
            is_required: true,
            custom_instructions: "Scan serial: verify sản phẩm genuine (không phải fake/clone). Check BH còn hay hết để tư vấn khách chính xác.",
          }] : []),
          ...(initialInspection ? [{
            task_type_id: initialInspection.id,
            sequence_order: 3,
            is_required: true,
            custom_instructions: "Kiểm tra: ghi rõ lý do không đủ điều kiện BH (seal broken/expired/physical damage). Chụp ảnh bằng chứng rõ ràng, lưu vào hồ sơ.",
          }] : []),

          // DIAGNOSIS
          ...(runDiagnostic ? [{
            task_type_id: runDiagnostic.id,
            sequence_order: 4,
            is_required: true,
            custom_instructions: "Chẩn đoán: xác định chính xác lỗi, nguyên nhân, mức độ hư hỏng. Đánh giá có thể sửa được không, nếu sửa thì tỷ lệ thành công bao nhiêu.",
          }] : []),
          ...(identifyRootCause ? [{
            task_type_id: identifyRootCause.id,
            sequence_order: 5,
            is_required: true,
            custom_instructions: "Xác định: linh kiện nào cần thay, linh kiện nào có thể reuse, mức độ phức tạp của việc sửa (easy/medium/hard). Ước tính thời gian sửa.",
          }] : []),
          ...(warrantyCheck ? [{
            task_type_id: warrantyCheck.id,
            sequence_order: 6,
            is_required: true,
            custom_instructions: "Confirm lý do không BH: hết hạn (bao lâu rồi), seal broken (chụp ảnh), physical damage (nứt/vỡ/nước). Ghi rõ để tránh khách hàng không hiểu.",
          }] : []),

          // APPROVAL - Lập báo giá
          ...(quoteCreation ? [{
            task_type_id: quoteCreation.id,
            sequence_order: 7,
            is_required: true,
            custom_instructions: "Lập báo giá chi tiết: phí chẩn đoán (nếu có), linh kiện cần thay (tên, part number, giá), công sửa chữa, tổng cộng. Ước tính thời gian hoàn thành. Giải thích rõ ràng cho khách hiểu.",
          }] : []),
          ...(customerDecision ? [{
            task_type_id: customerDecision.id,
            sequence_order: 8,
            is_required: true,
            custom_instructions: "Chờ khách quyết định: gửi báo giá qua email/Zalo, giải thích kỹ. Nếu khách từ chối → cancel ticket, đóng gói trả lại (không sửa). Nếu chấp nhận → tiếp tục.",
          }] : []),
          ...(managerApproval ? [{
            task_type_id: managerApproval.id,
            sequence_order: 9,
            is_required: true,
            custom_instructions: "Manager approve: xác nhận khách đã chấp nhận báo giá (có email/chat confirmation). Approve phương án sửa, assign kỹ thuật viên, order linh kiện nếu cần.",
          }] : []),

          // REPAIR
          ...(repairComponent ? [{
            task_type_id: repairComponent.id,
            sequence_order: 10,
            is_required: true,
            custom_instructions: "Sửa chữa theo báo giá: thay linh kiện đã list, hàn/desolder nếu cần, thay thermal/cleaning. KHÔNG làm gì ngoài scope đã báo giá (phải ask khách nếu phát hiện thêm lỗi).",
          }] : []),
          ...(replaceComponent ? [{
            task_type_id: replaceComponent.id,
            sequence_order: 11,
            is_required: false,
            custom_instructions: "Thay linh kiện (nếu có): sử dụng linh kiện đã báo giá, ghi rõ part number. Nếu dùng linh kiện khác (hết hàng) → confirm với khách trước.",
          }] : []),

          // QA
          ...(functionalTest ? [{
            task_type_id: functionalTest.id,
            sequence_order: 12,
            is_required: true,
            custom_instructions: "Test chức năng: đảm bảo lỗi đã được sửa, tất cả chức năng hoạt động bình thường. Nếu còn lỗi → báo khách, thỏa thuận thêm.",
          }] : []),
          ...(qualityCheck ? [{
            task_type_id: qualityCheck.id,
            sequence_order: 13,
            is_required: true,
            custom_instructions: "QC: kiểm tra không làm hỏng thêm, không trầy xước thêm, vệ sinh sạch sẽ. Chụp ảnh before/after để khách thấy rõ đã sửa gì.",
          }] : []),
          ...(finalInspection ? [{
            task_type_id: finalInspection.id,
            sequence_order: 14,
            is_required: true,
            custom_instructions: "Kiểm tra cuối: screenshot test results, ảnh linh kiện đã thay (để khách biết đã thay thật). Chuẩn bị hóa đơn thanh toán.",
          }] : []),

          // CLOSING - Thu phí
          ...(paymentCollection ? [{
            task_type_id: paymentCollection.id,
            sequence_order: 15,
            is_required: true,
            custom_instructions: "Thu phí theo báo giá: chuyển khoản hoặc tiền mặt. Phí ship COD nếu khách không lấy trực tiếp. Xuất hóa đơn (VAT nếu khách yêu cầu).",
          }] : []),
          ...(documentationUpdate ? [{
            task_type_id: documentationUpdate.id,
            sequence_order: 16,
            is_required: true,
            custom_instructions: "Cập nhật hồ sơ: ghi 'PAID REPAIR', số tiền đã thu, linh kiện đã thay, test results. Lưu hóa đơn, email confirm của khách.",
          }] : []),
          ...(customerNotification ? [{
            task_type_id: customerNotification.id,
            sequence_order: 17,
            is_required: true,
            custom_instructions: "Thông báo hoàn tất: 'Sản phẩm đã sửa xong, đã thanh toán XXX VNĐ'. Gửi ảnh kết quả test, giải thích đã sửa gì. Hướng dẫn bảo quản để tránh hỏng lại.",
          }] : []),
          ...(packageDelivery ? [{
            task_type_id: packageDelivery.id,
            sequence_order: 18,
            is_required: true,
            custom_instructions: "Đóng gói giao hàng: kèm hóa đơn, phiếu bảo hành sau sửa chữa (nếu có warranty cho công sửa). Ship hoặc giao tận nơi.",
          }] : []),
        ].filter(task => task.task_type_id),
      },

      // =============================================================
      // TEMPLATE 4: Chẩn đoán nhanh (Quick Diagnosis)
      // Use case: Khách chỉ cần biết sản phẩm bị lỗi gì, chưa quyết định sửa hay không
      // Flow: Reception → Diagnosis → Report → Return (không sửa)
      // =============================================================
      {
        name: "Dịch vụ chẩn đoán nhanh",
        description: "Dịch vụ chẩn đoán để xác định sản phẩm bị lỗi gì, có sửa được không, ước tính chi phí. Khách hàng nhận báo cáo chi tiết nhưng KHÔNG sửa luôn, sẽ quyết định sau. Phù hợp khi khách muốn second opinion hoặc xem có đáng sửa không.",
        service_type: "paid" as const,
        strict_sequence: false,
        is_active: true,
        tasks: [
          // INTAKE
          ...(productReceiving ? [{
            task_type_id: productReceiving.id,
            sequence_order: 1,
            is_required: true,
            custom_instructions: "Tiếp nhận cho dịch vụ chẩn đoán: chụp ảnh tình trạng hiện tại. Giải thích rõ đây là dịch vụ CHẨN ĐOÁN, không bao gồm sửa chữa.",
          }] : []),
          ...(customerInterview ? [{
            task_type_id: customerInterview.id,
            sequence_order: 2,
            is_required: true,
            custom_instructions: "Phỏng vấn khách: triệu chứng lỗi gì, bao giờ bắt đầu, đã thử fix gì chưa, mục đích sử dụng sản phẩm. Ghi chi tiết để chẩn đoán chính xác.",
          }] : []),
          ...(initialInspection ? [{
            task_type_id: initialInspection.id,
            sequence_order: 3,
            is_required: true,
            custom_instructions: "Kiểm tra ban đầu: tình trạng vật lý, seal, signs of tampering/water/impact. Đánh giá sơ bộ mức độ nghiêm trọng.",
          }] : []),

          // DIAGNOSIS - Chuyên sâu
          ...(runDiagnostic ? [{
            task_type_id: runDiagnostic.id,
            sequence_order: 4,
            is_required: true,
            custom_instructions: "Chạy full diagnostic: stress test, benchmark, SMART check, error logs. Ghi lại tất cả kết quả, screenshot, video nếu cần minh chứng.",
          }] : []),
          ...(componentTesting ? [{
            task_type_id: componentTesting.id,
            sequence_order: 5,
            is_required: true,
            custom_instructions: "Test từng component: xác định CHÍNH XÁC linh kiện nào lỗi (fan 2 out of 3, VRAM module 1, RAM slot 2, v.v.). Chi tiết giúp khách hiểu rõ.",
          }] : []),
          ...(identifyRootCause ? [{
            task_type_id: identifyRootCause.id,
            sequence_order: 6,
            is_required: true,
            custom_instructions: "Root cause analysis: WHY it failed (design flaw, wear and tear, misuse, bad luck). Đánh giá: có thể sửa không, tỷ lệ thành công, ước tính chi phí & thời gian.",
          }] : []),
          ...(warrantyCheck ? [{
            task_type_id: warrantyCheck.id,
            sequence_order: 7,
            is_required: false,
            custom_instructions: "Check warranty status: còn BH không, đủ điều kiện claim không. Advice cho khách nên đi warranty hay sửa trả phí.",
          }] : []),

          // REPORT - Báo cáo
          ...(documentationUpdate ? [{
            task_type_id: documentationUpdate.id,
            sequence_order: 8,
            is_required: true,
            custom_instructions: "Viết báo cáo chẩn đoán chi tiết: Issue Found, Root Cause, Repair Options (warranty/paid/replace), Cost Estimate, Time Estimate, Recommendation. Kèm ảnh/screenshot/video.",
          }] : []),
          ...(customerNotification ? [{
            task_type_id: customerNotification.id,
            sequence_order: 9,
            is_required: true,
            custom_instructions: "Gửi báo cáo cho khách: email PDF report + call giải thích. Tư vấn khách: sửa đáng giá không, warranty còn không, nên làm gì tiếp theo. Báo phí chẩn đoán (nếu có).",
          }] : []),
          ...(paymentCollection ? [{
            task_type_id: paymentCollection.id,
            sequence_order: 10,
            is_required: false,
            custom_instructions: "Thu phí chẩn đoán (nếu áp dụng): thường 100-300k VNĐ tùy độ phức tạp. Nếu khách quyết định sửa luôn → trừ vào phí sửa.",
          }] : []),
          ...(packageDelivery ? [{
            task_type_id: packageDelivery.id,
            sequence_order: 11,
            is_required: true,
            custom_instructions: "Trả lại sản phẩm: đóng gói nguyên trạng (chưa sửa). Kèm báo cáo chẩn đoán in ra. Nếu khách muốn sửa sau → tạo ticket mới hoặc convert ticket này.",
          }] : []),
        ].filter(task => task.task_type_id),
      },
    ].filter(template => template.tasks.length > 0);
  }, [taskTypes]);

  const handleAddSampleTemplates = async () => {
    setIsLoading(true);
    const sampleTemplates = getSampleTemplates();

    if (sampleTemplates.length === 0) {
      toast.error("Chưa có loại công việc nào. Vui lòng tạo loại công việc trước.");
      setIsLoading(false);
      return;
    }

    console.log("[Templates] Adding sample templates started:", {
      totalTemplates: sampleTemplates.length,
    });

    try {
      let successCount = 0;
      const totalTemplates = sampleTemplates.length;

      for (const template of sampleTemplates) {
        try {
          await createTemplateMutation.mutateAsync(template);
          successCount++;
        } catch (error) {
          console.error(
            `[Templates] Failed to create sample template: ${template.name}`,
            error,
          );
        }
      }

      if (successCount === totalTemplates) {
        const successMessage = `Đã thêm thành công ${successCount} mẫu quy trình`;
        console.log(
          "[Templates] All sample templates added successfully:",
          successMessage,
          { successCount, totalTemplates },
        );
        toast.success(successMessage);
      } else if (successCount > 0) {
        const successMessage = `Đã thêm thành công ${successCount}/${totalTemplates} mẫu quy trình`;
        console.log("[Templates] Partial sample templates added:", successMessage, {
          successCount,
          totalTemplates,
        });
        toast.success(successMessage);
      } else {
        const errorMessage = "Không thể thêm mẫu quy trình nào";
        console.error("[Templates] No sample templates added:", errorMessage, {
          successCount,
          totalTemplates,
        });
        toast.error(errorMessage);
      }

      if (successCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = "Lỗi khi thêm mẫu quy trình";
      console.error("[Templates] Sample templates addition error:", errorMessage, {
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
      onClick={handleAddSampleTemplates}
      disabled={isLoading || !taskTypes || taskTypes.length === 0}
    >
      <IconDatabase />
      <span className="hidden lg:inline">
        {isLoading ? "Đang thêm..." : "Thêm mẫu"}
      </span>
    </Button>
  );
}
