"use client";

import {
  IconCopy,
  IconDotsVertical,
  IconLoader2,
  IconPhotoUp,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { type ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAttachmentQueue } from "@/hooks/use-attachment-queue";
import {
  addWizardProduct,
  createEmptyWizardProduct,
  MAX_ATTACHMENTS_PER_PRODUCT,
  removeWizardProduct,
  setWizardIssueOverview,
  updateWizardProduct,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "@/hooks/use-service-request-wizard";

const MIN_SERIAL_LENGTH = 5;
const MIN_ISSUE_LENGTH = 10;

interface ProductCardProps {
  index: number;
  productId: string;
}

function ProductCard({ index, productId }: ProductCardProps) {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();
  const { getAttachments, selectFiles, removeAttachment, canAddMore } =
    useAttachmentQueue();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return null;
  }

  const attachments = getAttachments(productId);
  const serialValid = product.serialNumber.trim().length >= MIN_SERIAL_LENGTH;
  const issueValid = product.issueDescription.trim().length >= MIN_ISSUE_LENGTH;

  const handleDuplicateProduct = () => {
    const duplicate = {
      ...createEmptyWizardProduct(),
      productBrand: product.productBrand,
      productModel: product.productModel,
      purchaseDate: product.purchaseDate,
      issueDescription: product.issueDescription,
      warrantyRequested: product.warrantyRequested,
      serviceOption: product.serviceOption,
      serviceOptionNotes: product.serviceOptionNotes,
    };
    addWizardProduct(dispatch, duplicate);
    toast.success("Đã nhân bản sản phẩm. Vui lòng nhập serial mới.");
  };

  const handleRemoveProduct = () => {
    toast("Bạn có chắc muốn xóa sản phẩm này?", {
      description: "Thao tác này không thể hoàn tác.",
      action: {
        label: "Xóa",
        onClick: () => removeWizardProduct(dispatch, productId),
      },
      cancel: {
        label: "Giữ lại",
        onClick: () => undefined,
      },
    });
  };

  const handleSerialChange = (value: string) => {
    const formattedSerial = value.toUpperCase();
    if (formattedSerial === product.serialNumber) {
      return;
    }
    updateWizardProduct(dispatch, productId, {
      serialNumber: formattedSerial,
      warrantyCheck: { status: "idle", notFound: false },
    });
  };

  const handleIssueChange = (value: string) => {
    updateWizardProduct(dispatch, productId, { issueDescription: value });
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      selectFiles(productId, files).catch(() => undefined);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Sản phẩm #{index + 1}
          </span>
          {product.serialNumber.trim().length > 0 ? (
            <p className="font-medium tracking-wide">{product.serialNumber}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa nhập serial</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Tùy chọn sản phẩm</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                handleDuplicateProduct();
              }}
            >
              <IconCopy className="mr-2 h-4 w-4" />
              Nhân bản sản phẩm
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => {
                event.preventDefault();
                handleRemoveProduct();
              }}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Xóa sản phẩm
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`serial-${productId}`}>
            Serial <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`serial-${productId}`}
            value={product.serialNumber}
            placeholder="ABC123456"
            onChange={(event) => handleSerialChange(event.target.value)}
            onBlur={(event) => handleSerialChange(event.target.value.trim())}
            required
            minLength={MIN_SERIAL_LENGTH}
          />
          {!serialValid ? (
            <p className="text-xs text-destructive">
              Serial phải có tối thiểu {MIN_SERIAL_LENGTH} ký tự.
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`purchase-date-${productId}`}>
            Ngày mua (nếu có)
          </Label>
          <Input
            id={`purchase-date-${productId}`}
            type="date"
            value={product.purchaseDate ?? ""}
            onChange={(event) =>
              updateWizardProduct(dispatch, productId, {
                purchaseDate: event.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`issue-${productId}`}>
          Mô tả vấn đề <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={`issue-${productId}`}
          value={product.issueDescription}
          placeholder="Mô tả chi tiết triệu chứng gặp phải"
          onChange={(event) => handleIssueChange(event.target.value)}
          minLength={MIN_ISSUE_LENGTH}
          className="min-h-[120px]"
          required
        />
        {!issueValid ? (
          <p className="text-xs text-destructive">
            Cần ít nhất {MIN_ISSUE_LENGTH} ký tự để mô tả vấn đề.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore(productId)}
          >
            <IconPhotoUp className="mr-2 h-4 w-4" />
            Thêm ảnh
          </Button>
          <span className="text-xs text-muted-foreground">
            Tối đa {attachments.length}/{MAX_ATTACHMENTS_PER_PRODUCT} ảnh (10
            MiB mỗi ảnh).
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileInput}
        />
        {attachments.length === 0 ? (
          <p>Chưa có ảnh cho sản phẩm này.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative flex flex-col gap-2 rounded-md border bg-background p-2"
              >
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeAttachment(productId, attachment.id)}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {attachment.previewUrl ? (
                    <Image
                      src={attachment.previewUrl}
                      alt={attachment.fileName}
                      width={192}
                      height={108}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Không có preview
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium">{attachment.fileName}</p>
                  {attachment.status === "uploading" ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconLoader2 className="h-3 w-3 animate-spin" />
                      Đang tải lên... {Math.round(attachment.progress)}%
                    </div>
                  ) : null}
                  {attachment.status === "uploaded" ? (
                    <p className="text-xs text-green-600">Đã tải lên</p>
                  ) : null}
                  {attachment.status === "error" ? (
                    <p className="text-xs text-destructive">
                      {attachment.errorMessage || "Upload thất bại"}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StepProducts() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();

  const handleAddProduct = () => {
    addWizardProduct(dispatch, createEmptyWizardProduct());
  };

  const canAddMoreProducts = state.products.length < 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Bước 1: Sản phẩm và vấn đề</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={handleAddProduct}
            disabled={!canAddMoreProducts}
          >
            <IconPlus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="request-issue-overview">
            Mô tả tổng quát (tuỳ chọn)
          </Label>
          <Textarea
            id="request-issue-overview"
            placeholder="Tóm tắt vấn đề chung"
            value={state.requestIssueOverview}
            onChange={(event) =>
              setWizardIssueOverview(dispatch, event.target.value)
            }
            minLength={MIN_ISSUE_LENGTH}
            className="min-h-24"
          />
        </div>
        <div className="space-y-5">
          {state.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu.
            </p>
          ) : (
            state.products.map((product, index) => (
              <ProductCard
                key={product.id}
                index={index}
                productId={product.id}
              />
            ))
          )}
        </div>

        {!canAddMoreProducts ? (
          <p className="text-xs text-muted-foreground">
            Đã đạt giới hạn tối đa 10 sản phẩm cho mỗi yêu cầu.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
