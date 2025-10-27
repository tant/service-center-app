"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
  table: Table<any>;
  pageSizeOptions?: number[];
  labelId?: string;
}

export function TablePagination({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  labelId = "rows-per-page",
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-4">
      {/* Page Info */}
      <div className="flex w-fit items-center justify-center text-sm font-medium">
        Trang {table.getState().pagination.pageIndex + 1} trên{" "}
        {table.getPageCount()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-8">
        {/* Page Size Selector */}
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor={labelId} className="text-sm font-medium">
            Số dòng mỗi trang
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-20" id={labelId}>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* First Page (desktop only) */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Đến trang đầu</span>
            <IconChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Trang trước</span>
            <IconChevronLeft className="h-4 w-4" />
          </Button>

          {/* Next Page */}
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Trang tiếp</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page (desktop only) */}
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Đến trang cuối</span>
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
