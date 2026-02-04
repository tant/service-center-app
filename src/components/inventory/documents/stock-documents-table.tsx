"use client";

/**
 * Stock Documents Table Component
 * Displays all stock documents (receipts, issues, transfers) in a unified view
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/components/providers/trpc-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, ChevronRight, Layers, PackagePlus, PackageMinus, ArrowLeftRight, Search } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type DocumentType = "all" | "receipt" | "issue" | "transfer";

export function StockDocumentsTable() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<DocumentType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Reset page when documentType or status changes
  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value as DocumentType);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  // Fetch all three document types
  const { data: receiptsData, isLoading: receiptsLoading } = trpc.inventory.receipts.list.useQuery(
    { page, pageSize },
    { enabled: documentType === "all" || documentType === "receipt" }
  );

  const { data: issuesData, isLoading: issuesLoading } = trpc.inventory.issues.list.useQuery(
    { page, pageSize },
    { enabled: documentType === "all" || documentType === "issue" }
  );

  const { data: transfersData, isLoading: transfersLoading } = trpc.inventory.transfers.list.useQuery(
    { page, pageSize },
    { enabled: documentType === "all" || documentType === "transfer" }
  );

  // Combine and sort documents
  const allDocuments = (() => {
    const docs: any[] = [];

    if (documentType === "all" || documentType === "receipt") {
      receiptsData?.receipts.forEach((r) => {
        docs.push({
          ...r,
          documentType: "receipt" as const,
          documentNumber: r.receipt_number,
          date: r.receipt_date,
        });
      });
    }

    if (documentType === "all" || documentType === "issue") {
      issuesData?.issues.forEach((i) => {
        docs.push({
          ...i,
          documentType: "issue" as const,
          documentNumber: i.issue_number,
          date: i.issue_date,
        });
      });
    }

    if (documentType === "all" || documentType === "transfer") {
      transfersData?.transfers.forEach((t) => {
        docs.push({
          ...t,
          documentType: "transfer" as const,
          documentNumber: t.transfer_number,
          date: t.transfer_date,
        });
      });
    }

    // Filter by search
    let filtered = docs;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = docs.filter((doc) => {
        return (
          doc.documentNumber?.toLowerCase().includes(searchLower) ||
          doc.notes?.toLowerCase().includes(searchLower) ||
          doc.created_by?.full_name?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by created_at descending
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  })();

  const isLoading = receiptsLoading || issuesLoading || transfersLoading;

  const handleRowClick = (doc: any) => {
    const docType = doc.documentType === "receipt" ? "receipts" : doc.documentType === "issue" ? "issues" : "transfers";
    router.push(`/inventory/documents/${docType}/${doc.id}`);
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "receipt":
        return "Phiếu nhập";
      case "issue":
        return "Phiếu xuất";
      case "transfer":
        return "Phiếu chuyển";
      default:
        return "";
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors = {
      receipt: "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
      issue: "bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
      transfer: "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    };

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colors[type as keyof typeof colors]}`}>
        {getDocumentTypeLabel(type)}
      </span>
    );
  };

  const renderTable = () => (
    <>
      {/* Search Input */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm số chứng từ, ghi chú..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 lg:pl-6">Số chứng từ</TableHead>
              {documentType === "all" && <TableHead>Loại</TableHead>}
              <TableHead>Ngày</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Serial thiếu</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right pr-4 lg:pr-6">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={documentType === "all" ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : allDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={documentType === "all" ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy chứng từ nào.
                </TableCell>
              </TableRow>
            ) : (
              allDocuments.map((doc) => (
                <TableRow
                  key={`${doc.documentType}-${doc.id}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(doc)}
                >
                  <TableCell className="font-medium pl-4 lg:pl-6">{doc.documentNumber}</TableCell>
                  {documentType === "all" && <TableCell>{getDocumentTypeBadge(doc.documentType)}</TableCell>}
                  <TableCell className="text-muted-foreground">
                    {doc.date ? format(new Date(doc.date), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.created_by?.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        doc.missingSerialsCount > 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {doc.missingSerialsCount > 0 ? `${doc.missingSerialsCount} serial` : "Hoàn thành"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {doc.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right pr-4 lg:pr-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(doc);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {allDocuments.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {allDocuments.length} chứng từ
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Trang {page + 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={allDocuments.length < pageSize}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <Tabs value={documentType} onValueChange={handleDocumentTypeChange} className="w-full flex-col justify-start gap-6">
      {/* Tab Header with Actions and Status Filter */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Tất cả</span>
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Phiếu chuyển</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Phiếu nhập</span>
          </TabsTrigger>
          <TabsTrigger value="issue" className="flex items-center gap-2">
            <PackageMinus className="h-4 w-4" />
            <span className="hidden sm:inline">Phiếu xuất</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <Link href="/inventory/documents/transfers/new">
            <Button variant="outline" size="sm">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden lg:inline">Tạo phiếu chuyển</span>
            </Button>
          </Link>
          <Link href="/inventory/documents/receipts/new">
            <Button variant="outline" size="sm">
              <PackagePlus className="h-4 w-4" />
              <span className="hidden lg:inline">Tạo phiếu nhập</span>
            </Button>
          </Link>
          <Link href="/inventory/documents/issues/new">
            <Button variant="outline" size="sm">
              <PackageMinus className="h-4 w-4" />
              <span className="hidden lg:inline">Tạo phiếu xuất</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Contents */}
      <TabsContent value="all" className="relative flex flex-col gap-4 px-4 lg:px-6">
        {renderTable()}
      </TabsContent>

      <TabsContent value="receipt" className="relative flex flex-col gap-4 px-4 lg:px-6">
        {renderTable()}
      </TabsContent>

      <TabsContent value="issue" className="relative flex flex-col gap-4 px-4 lg:px-6">
        {renderTable()}
      </TabsContent>

      <TabsContent value="transfer" className="relative flex flex-col gap-4 px-4 lg:px-6">
        {renderTable()}
      </TabsContent>
    </Tabs>
  );
}
