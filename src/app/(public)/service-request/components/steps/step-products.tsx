"use client";

import { Fragment, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IconPlus, IconTrash, IconPhotoUp, IconX, IconLoader2 } from "@tabler/icons-react";
import {
  MAX_ATTACHMENTS_PER_PRODUCT,
  addWizardProduct,
  createEmptyWizardProduct,
  removeWizardProduct,
  setWizardIssueOverview,
  updateWizardProduct,
  useServiceRequestWizardDispatch,
  useServiceRequestWizardState,
} from "@/hooks/use-service-request-wizard";
import {
  createUploadTask,
  handleUploadError,
  uploadAttachment,
  validateAttachmentCount,
  validateAttachmentFile,
} from "@/utils/upload-service-media";
import Image from "next/image";

const MIN_SERIAL_LENGTH = 5;
const MIN_ISSUE_LENGTH = 10;

export function StepProducts() {
  const state = useServiceRequestWizardState();
  const dispatch = useServiceRequestWizardDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const handleAddProduct = () => {
    addWizardProduct(dispatch, createEmptyWizardProduct());
  };

  const handleUpdateSerial = (id: string, value: string) => {
    const formatted = value.toUpperCase();
    updateWizardProduct(dispatch, id, { serialNumber: formatted });
  };

  const handleUpdateIssue = (id: string, value: string) => {
    updateWizardProduct(dispatch, id, { issueDescription: value });
  };

  const handleUpdateProductField = (id: string, field: "productBrand" | "productModel" | "purchaseDate") => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      updateWizardProduct(dispatch, id, { [field]: event.target.value });
    };
  };

  const canAddMoreProducts = state.products.length < 10;

  const handleSelectAttachment = async (productId: string | null, files: FileList | null) => {
    if (!productId) {
      return;
    }
    const product = state.products.find((item) => item.id === productId);
    if (!product || !files?.length) {
      return;
    }

    let currentAttachments = [...product.attachments];

    for (const file of files) {
      try {
        validateAttachmentCount(currentAttachments);
        validateAttachmentFile(file);

        const task = createUploadTask(productId, file);
        const previewUrl = URL.createObjectURL(file);

        const nextAttachments = [
          ...currentAttachments,
          {
            id: task.attachmentId,
            fileName: file.name,
            size: file.size,
            type: file.type,
            status: "uploading" as const,
            progress: 0,
            previewUrl,
          },
        ];

        updateWizardProduct(dispatch, productId, {
          attachments: nextAttachments,
        });

        currentAttachments = nextAttachments;

        const { promise } = uploadAttachment(task, (progress) => {
          updateWizardProduct(dispatch, productId, {
            attachments:
              state.products
                .find((p) => p.id === productId)
                ?.attachments.map((attachment) =>
                  attachment.id === task.attachmentId ? { ...attachment, progress } : attachment
                ) ?? [],
          });
        });

        promise
          .then((result) => {
            updateWizardProduct(dispatch, productId, {
              attachments:
                state.products
                  .find((p) => p.id === productId)
                  ?.attachments.map((attachment) =>
                    attachment.id === result.attachmentId
                      ? {
                          ...attachment,
                          status: "uploaded",
                          progress: 100,
                          path: result.path,
                        }
                      : attachment
                  ) ?? [],
            });
          })
          .catch((error) => {
            handleUploadError(error);
            updateWizardProduct(dispatch, productId, {
              attachments:
                state.products
                  .find((p) => p.id === productId)
                  ?.attachments.map((attachment) =>
                    attachment.id === task.attachmentId
                      ? {
                          ...attachment,
                          status: "error",
                          progress: 0,
                          errorMessage: error instanceof Error ? error.message : "Upload thất bại",
                        }
                      : attachment
                  ) ?? [],
            });
          });
      } catch (error) {
        handleUploadError(error);
      }
    }

    setActiveProductId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (productId: string, attachmentId: string) => {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;

    const target = product.attachments.find((attachment) => attachment.id === attachmentId);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }

    updateWizardProduct(dispatch, productId, {
      attachments: product.attachments.filter((attachment) => attachment.id !== attachmentId),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Bước 1: Sản phẩm và vấn đề</CardTitle>
          <Button type="button" size="sm" onClick={handleAddProduct} disabled={!canAddMoreProducts}>
            <IconPlus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="request-issue-overview">Mô tả tổng quát (tuỳ chọn)</Label>
          <Textarea
            id="request-issue-overview"
            placeholder="Tóm tắt vấn đề chung"
            value={state.requestIssueOverview}
            onChange={(event) => setWizardIssueOverview(dispatch, event.target.value)}
            minLength={MIN_ISSUE_LENGTH}
            className="min-h-[96px]"
          />
        </div>

        <div className="space-y-5">
          {state.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu.
            </p>
          ) : (
            state.products.map((product, index) => {
              const hasSerial = product.serialNumber.trim().length > 0;
              const serialValid = product.serialNumber.trim().length >= MIN_SERIAL_LENGTH;
              const issueValid = product.issueDescription.trim().length >= MIN_ISSUE_LENGTH;

              return (
                <div key={product.id} className="space-y-4 rounded-lg border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Sản phẩm #{index + 1}
                      </span>
                      {hasSerial ? (
                        <p className="font-medium tracking-wide">{product.serialNumber}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Chưa nhập serial</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeWizardProduct(dispatch, product.id)}
                    >
                      <IconTrash className="mr-1 h-4 w-4" />
                      Xóa
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`serial-${product.id}`}>Serial *</Label>
                      <Input
                        id={`serial-${product.id}`}
                        value={product.serialNumber}
                        placeholder="ABC123456"
                        onChange={(event) => handleUpdateSerial(product.id, event.target.value)}
                        onBlur={(event) => handleUpdateSerial(product.id, event.target.value.trim())}
                        required
                        minLength={MIN_SERIAL_LENGTH}
                      />
                      {hasSerial && !serialValid ? (
                        <p className="text-xs text-destructive">
                          Serial phải có tối thiểu {MIN_SERIAL_LENGTH} ký tự.
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`purchase-date-${product.id}`}>Ngày mua (nếu có)</Label>
                      <Input
                        id={`purchase-date-${product.id}`}
                        type="date"
                        value={product.purchaseDate ?? ""}
                        onChange={handleUpdateProductField(product.id, "purchaseDate")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`brand-${product.id}`}>Thương hiệu</Label>
                      <Input
                        id={`brand-${product.id}`}
                        value={product.productBrand ?? ""}
                        placeholder="VD: ACME"
                        onChange={handleUpdateProductField(product.id, "productBrand")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`model-${product.id}`}>Model</Label>
                      <Input
                        id={`model-${product.id}`}
                        value={product.productModel ?? ""}
                        placeholder="VD: ZX-1000"
                        onChange={handleUpdateProductField(product.id, "productModel")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`issue-${product.id}`}>Mô tả vấn đề *</Label>
                    <Textarea
                      id={`issue-${product.id}`}
                      value={product.issueDescription}
                      placeholder="Mô tả chi tiết triệu chứng gặp phải"
                      onChange={(event) => handleUpdateIssue(product.id, event.target.value)}
                      minLength={MIN_ISSUE_LENGTH}
                      className="min-h-[120px]"
                      required
                    />
                    {product.issueDescription.trim().length > 0 && !issueValid ? (
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
                        onClick={() => {
                          setActiveProductId(product.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <IconPhotoUp className="mr-2 h-4 w-4" />
                        Thêm ảnh
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Tối đa {product.attachments.length}/{MAX_ATTACHMENTS_PER_PRODUCT} ảnh (10 MiB mỗi ảnh).
                      </span>
                    </div>
                    {product.attachments.length === 0 ? (
                      <p>Chưa có ảnh cho sản phẩm này.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {product.attachments.map((attachment) => (
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
                                onClick={() => handleRemoveAttachment(product.id, attachment.id)}
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
            })
          )}
        </div>

        {!canAddMoreProducts ? (
          <p className="text-xs text-muted-foreground">
            Đã đạt giới hạn tối đa 10 sản phẩm cho mỗi yêu cầu.
          </p>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={(event) => {
            void handleSelectAttachment(activeProductId, event.target.files);
          }}
        />
      </CardContent>
    </Card>
  );
}
