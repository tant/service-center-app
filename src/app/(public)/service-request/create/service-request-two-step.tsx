"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { IconChevronLeft, IconCircleCheck, IconPlus, IconX } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomerLookup } from "@/hooks/use-customer-lookup";
import { useSubmitServiceRequest } from "@/hooks/use-service-request";
import { createClient } from "@/utils/supabase/client";

type WarrantyStatus = "active" | "expiring_soon" | "expired" | "no_warranty";

interface SerialLookupProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  warranty_status: WarrantyStatus;
  warranty_end_date: string | null;
  manufacturer_warranty_end_date: string | null;
  user_warranty_end_date: string | null;
  days_remaining: number | null;
  current_ticket_id: string | null;
  current_ticket_number: string | null;
}

type SerialStatus = "idle" | "checking" | "valid" | "invalid" | "error";

interface SerialEntry {
  id: string;
  value: string;
  status: SerialStatus;
  errorMessage?: string;
  product?: SerialLookupProduct;
}

interface FormSubmitPayload {
  phone: string;
  name: string;
  email: string;
  address: string;
  description: string;
  files: File[];
}

type UploadedAttachment = {
  path: string;
  file_name: string;
  file_size: number;
  file_type: string;
};

interface RequestFormProps {
  serials: SerialEntry[];
  serviceType: "warranty" | "paid";
  onBack: () => void;
  onSubmit: (payload: FormSubmitPayload) => Promise<void>;
  isSubmitting: boolean;
}

export function ServiceRequestTwoStep() {
  const router = useRouter();
  const { submitRequestAsync } = useSubmitServiceRequest();
  const [currentStep, setCurrentStep] = useState<"serial" | "form">("serial");
  const [serialEntries, setSerialEntries] = useState<SerialEntry[]>([
    createSerialEntry(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duplicateSerials = useMemo(() => {
    const normalized = serialEntries
      .map((entry) => entry.value.trim().toUpperCase())
      .filter((value) => value.length > 0);
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    normalized.forEach((value) => {
      if (seen.has(value)) {
        duplicates.add(value);
      } else {
        seen.add(value);
      }
    });
    return duplicates;
  }, [serialEntries]);

  const canProceedToForm = useMemo(() => {
    if (serialEntries.length === 0) {
      return false;
    }
    const allValid = serialEntries.every(
      (entry) => entry.status === "valid" && entry.product,
    );
    if (!allValid) {
      return false;
    }
    if (duplicateSerials.size > 0) {
      return false;
    }
    return true;
  }, [serialEntries, duplicateSerials]);

  const serviceType = useMemo<"warranty" | "paid">(() => {
    const statuses = serialEntries
      .map((entry) => entry.product?.warranty_status)
      .filter(Boolean) as WarrantyStatus[];
    if (statuses.length === 0) {
      return "paid";
    }
    const allWarrantyEligible = statuses.every((status) =>
      status === "active" || status === "expiring_soon",
    );
    return allWarrantyEligible ? "warranty" : "paid";
  }, [serialEntries]);

  const handleSerialValueChange = useCallback(
    (id: string, value: string) => {
      const trimmed = value.trim();
      const nextStatus: SerialStatus =
        trimmed.length === 0 ? "idle" : trimmed.length >= 5 ? "checking" : "idle";

      setSerialEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                value,
                status: nextStatus,
                product: undefined,
                errorMessage: undefined,
              }
            : entry,
        ),
      );
    },
    [],
  );

  const handleSerialStatusChange = useCallback(
    (
      id: string,
      status: SerialStatus,
      extras?: { product?: SerialLookupProduct; errorMessage?: string },
    ) => {
      setSerialEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status,
                product: extras?.product,
                errorMessage: extras?.errorMessage,
              }
            : entry,
        ),
      );
    },
    [],
  );

  const handleAddSerial = () => {
    setSerialEntries((prev) => [...prev, createSerialEntry()]);
  };

  const handleRemoveSerial = (id: string) => {
    setSerialEntries((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const handleSubmit = async (formPayload: FormSubmitPayload) => {
    const normalizedPhone = formPayload.phone.replace(/\D/g, "");
    const normalizedEmail = formPayload.email.trim().toLowerCase();
    const address = formPayload.address.trim();
    const description = formPayload.description.trim();

    if (normalizedPhone.length < 10) {
      toast.error("Số điện thoại cần tối thiểu 10 chữ số.");
      return;
    }
    if (description.length < 10) {
      toast.error("Vui lòng mô tả vấn đề chi tiết tối thiểu 10 ký tự.");
      return;
    }
    if (address.length === 0) {
      toast.error("Vui lòng nhập địa chỉ giao nhận.");
      return;
    }
    if (formPayload.name.trim().length < 2) {
      toast.error("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }
    if (
      normalizedEmail.length > 0 &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      toast.error("Email không hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);

      const attachments = await uploadAttachments(formPayload.files);

      const items = serialEntries.map((entry) => ({
        serial_number: entry.value.trim().toUpperCase(),
        issue_description: description,
        service_option: serviceType,
        attachments,
      }));

      const payload = {
        customer_name: formPayload.name.trim(),
        customer_email: normalizedEmail.length > 0 ? normalizedEmail : undefined,
        customer_phone: normalizedPhone,
        customer_address: address,
        issue_overview: description,
        items,
        delivery_method: "delivery" as const,
        delivery_address: address,
        receipt_status: "pending_receipt" as const,
      };

      const result = await submitRequestAsync(payload);
      if (result?.tracking_token) {
        router.push(`/service-request/success?token=${result.tracking_token}`);
      } else {
        router.push("/service-request/success");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể gửi yêu cầu. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {currentStep === "serial" ? (
        <Card>
          <CardHeader>
            <CardTitle>Nhập serial sản phẩm</CardTitle>
            <CardDescription>
              Vui lòng nhập serial của từng sản phẩm. Chỉ khi tất cả serial tồn tại
              trong hệ thống thì bạn mới có thể tiếp tục tạo phiếu yêu cầu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {serialEntries.map((entry, index) => (
              <SerialInputRow
              key={entry.id}
              index={index}
              entry={entry}
              onValueChange={handleSerialValueChange}
              onStatusChange={handleSerialStatusChange}
              onRemove={handleRemoveSerial}
              disableRemove={serialEntries.length === 1}
              isDuplicate={
                entry.value.trim().length > 0 &&
                duplicateSerials.has(entry.value.trim().toUpperCase())
              }
            />
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddSerial}
            className="flex items-center gap-2"
          >
            <IconPlus className="h-4 w-4" />
            Thêm serial khác
          </Button>

          {duplicateSerials.size > 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                Mỗi serial chỉ được nhập một lần. Vui lòng kiểm tra và cập nhật lại.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!canProceedToForm}
              onClick={() => setCurrentStep("form")}
            >
              Bước tiếp theo
            </Button>
          </div>
        </CardContent>
        </Card>
      ) : null}

      {currentStep === "form" ? (
        <RequestFormStep
          serials={serialEntries}
          serviceType={serviceType}
          onBack={() => setCurrentStep("serial")}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  );
}

interface SerialInputRowProps {
  index: number;
  entry: SerialEntry;
  disableRemove: boolean;
  isDuplicate: boolean;
  onValueChange: (id: string, value: string) => void;
  onStatusChange: (
    id: string,
    status: SerialStatus,
    extras?: { product?: SerialLookupProduct; errorMessage?: string },
  ) => void;
  onRemove: (id: string) => void;
}

function SerialInputRow({
  index,
  entry,
  disableRemove,
  isDuplicate,
  onValueChange,
  onStatusChange,
  onRemove,
}: SerialInputRowProps) {
  const debouncedSerial = useDebounce(entry.value.trim().toUpperCase(), 400);

  const lookupQuery = trpc.serviceRequest.lookupSerial.useQuery(
    { serial_number: debouncedSerial },
    {
      enabled: debouncedSerial.length >= 5,
      retry: 1,
    },
  );

  useEffect(() => {
    if (debouncedSerial.length < 5) {
      onStatusChange(entry.id, "idle");
      return;
    }

    if (lookupQuery.isLoading) {
      onStatusChange(entry.id, "checking");
      return;
    }

    if (lookupQuery.error) {
      onStatusChange(entry.id, "error", {
        errorMessage:
          lookupQuery.error.message || "Không thể kiểm tra serial. Vui lòng thử lại.",
      });
      return;
    }

    const result = lookupQuery.data;
    if (!result) {
      return;
    }

    if (!result.found || !result.product) {
      const errorMessage =
        "error" in result && typeof result.error === "string"
          ? result.error
          : "Serial không tồn tại trong cơ sở dữ liệu.";
      onStatusChange(entry.id, "invalid", {
        errorMessage,
      });
      return;
    }

    onStatusChange(entry.id, "valid", {
      product: {
        id: result.product.id,
        name: result.product.name,
        sku: result.product.sku,
        brand: result.product.brand,
        warranty_status: result.product.warranty_status,
        warranty_end_date: result.product.warranty_end_date,
        manufacturer_warranty_end_date:
          result.product.manufacturer_warranty_end_date,
        user_warranty_end_date: result.product.user_warranty_end_date,
        days_remaining: result.product.days_remaining,
        current_ticket_id: result.product.current_ticket_id,
        current_ticket_number: result.product.current_ticket_number,
      },
    });
  }, [
    debouncedSerial,
    lookupQuery.data,
    lookupQuery.error,
    lookupQuery.isLoading,
    entry.id,
    entry.value,
    onStatusChange,
  ]);

  const statusMessage = getSerialStatusMessage(entry.status, entry.product);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor={`serial-${entry.id}`} className="text-sm font-medium">
            Serial #{index + 1}
          </Label>
          <p className="text-xs text-muted-foreground">
            Nhập tối thiểu 5 ký tự. Hệ thống sẽ kiểm tra tự động.
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disableRemove}
          onClick={() => onRemove(entry.id)}
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>

      <Input
        id={`serial-${entry.id}`}
        value={entry.value}
        onChange={(event) =>
          onValueChange(entry.id, event.target.value.toUpperCase())
        }
        placeholder="VD: ABC123456"
        className="font-mono uppercase"
        autoComplete="off"
      />

      {isDuplicate ? (
        <Alert variant="destructive">
          <AlertDescription>Serial bị trùng. Vui lòng chỉ giữ lại một dòng.</AlertDescription>
        </Alert>
      ) : null}

      {entry.status === "checking" ? (
        <p className="text-xs text-muted-foreground">Đang kiểm tra serial...</p>
      ) : null}

      {entry.status === "invalid" || entry.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{entry.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {entry.status === "valid" && entry.product ? (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{entry.product.name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.product.brand} · SKU {entry.product.sku || "N/A"}
              </p>
            </div>
            <Badge variant={statusMessage.badgeVariant}>{statusMessage.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {statusMessage.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function getSerialStatusMessage(
  status: SerialStatus,
  product?: SerialLookupProduct,
) {
  if (status !== "valid" || !product) {
    return {
      label: "Chưa xác định",
      description: "Vui lòng nhập serial để kiểm tra trạng thái bảo hành.",
      badgeVariant: "secondary" as const,
    };
  }

  switch (product.warranty_status) {
    case "active":
      return {
        label: "Bảo hành còn hiệu lực",
        description: "Sản phẩm vẫn đang trong thời hạn bảo hành.",
        badgeVariant: "resolved" as const,
      };
    case "expiring_soon":
      return {
        label: "Bảo hành sắp hết",
        description: "Khuyến nghị gửi bảo hành sớm để tránh phát sinh phí.",
        badgeVariant: "processing" as const,
      };
    case "expired":
      return {
        label: "Bảo hành đã hết hạn",
        description: "Phiếu yêu cầu sẽ mặc định ở chế độ thu phí.",
        badgeVariant: "secondary" as const,
      };
    default:
      return {
        label: "Không có dữ liệu bảo hành",
        description: "Phiếu yêu cầu sẽ mặc định ở chế độ thu phí.",
        badgeVariant: "secondary" as const,
      };
  }
}

function RequestFormStep({
  serials,
  serviceType,
  onBack,
  onSubmit,
  isSubmitting,
}: RequestFormProps) {
  const [issueDescription, setIssueDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isCustomerLocked, setIsCustomerLocked] = useState(false);

  const { enable, disable, data, isLoading, error } = useCustomerLookup(phone);

  useEffect(() => {
    const lookup = data as
      | {
          found: boolean;
          customer?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            address?: string | null;
          } | null;
        }
      | undefined;
    if (!lookup?.found || !lookup.customer) {
      setIsCustomerLocked(false);
      return;
    }
    setName((prev) => prev || lookup.customer?.name || "");
    setEmail((prev) => prev || lookup.customer?.email || "");
    setAddress((prev) => prev || lookup.customer?.address || "");
    setIsCustomerLocked(true);
  }, [data]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    const nextFiles = Array.from(selectedFiles);
    const totalFiles = files.length + nextFiles.length;
    if (totalFiles > 5) {
      toast.error("Tối đa 5 ảnh cho mỗi phiếu yêu cầu.");
      return;
    }
    const validFiles = nextFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} không phải định dạng hình ảnh.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá giới hạn 10 MiB.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      phone,
      name,
      email,
      address,
      description: issueDescription,
      files,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo phiếu yêu cầu</CardTitle>
        <CardDescription>
          Loại dịch vụ được xác định tự động dựa trên trạng thái bảo hành và không thể chỉnh sửa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmitForm}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <IconChevronLeft className="h-4 w-4" />
              Quay lại bước serial
            </button>
            <Badge variant="outline" className="gap-2">
              <IconCircleCheck className="h-4 w-4" />
              {serviceType === "warranty" ? "Bảo hành" : "Thu phí"}
            </Badge>
          </div>

          <div className="rounded-md border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Serial đã xác nhận</p>
            <Separator />
            <ul className="space-y-2">
              {serials.map((serial) => (
                <li key={serial.id} className="flex items-center justify-between text-sm">
                  <span className="font-mono uppercase">{serial.value}</span>
                  <Badge variant="secondary">
                    {serial.product?.warranty_status === "active" ||
                    serial.product?.warranty_status === "expiring_soon"
                      ? "Còn bảo hành"
                      : "Hết bảo hành"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            <Label htmlFor="issue-description">
              Mô tả vấn đề <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="issue-description"
              value={issueDescription}
              onChange={(event) => setIssueDescription(event.target.value)}
              placeholder="Mô tả chi tiết hiện tượng, lỗi và thời điểm phát sinh."
              rows={4}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Hình ảnh đính kèm (tối đa 5 ảnh)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            {files.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isSubmitting}
                    >
                      Xóa
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ưu tiên ảnh rõ nét của sản phẩm, tem bảo hành hoặc màn hình lỗi (nếu có).
              </p>
            )}
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setIsCustomerLocked(false);
                }}
                onBlur={() => enable()}
                onFocus={() => disable()}
                inputMode="tel"
                required
              />
              <p className="text-xs text-muted-foreground">
                Hệ thống sẽ tự điền thông tin nếu số điện thoại đã từng tạo yêu cầu.
              </p>
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Đang tra cứu khách hàng...</p>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error.message || "Không thể tra cứu khách hàng."}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isCustomerLocked}
              />
              {isCustomerLocked ? (
                <p className="text-xs text-muted-foreground">
                  Thông tin được khóa vì tìm thấy hồ sơ khách hàng trùng khớp.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isCustomerLocked}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">
                Địa chỉ nhận hàng <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={3}
                required
              />
            </div>
          </div>

          <input type="hidden" name="deliveryMethod" value="delivery" readOnly />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi yêu cầu..." : "Hoàn tất và gửi yêu cầu"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function createSerialEntry(): SerialEntry {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return { id, value: "", status: "idle" };
}

async function uploadAttachments(
  files: File[],
): Promise<UploadedAttachment[] | undefined> {
  if (!files || files.length === 0) {
    return undefined;
  }

  const supabase = createClient();
  const uploads: UploadedAttachment[] = [];

  for (const file of files) {
    const sanitized = sanitizeFilename(file.name);
    const path = `requests/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${sanitized}`;
    const { data, error } = await supabase.storage
      .from("service_media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data?.path) {
      throw new Error(
        error?.message || "Không thể upload ảnh. Vui lòng thử lại.",
      );
    }

    uploads.push({
      path: data.path,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    });
  }

  return uploads;
}

function sanitizeFilename(filename: string) {
  const lastDotIndex = filename.lastIndexOf(".");
  const base = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex !== -1 ? filename.slice(lastDotIndex).toLowerCase() : "";
  const normalized = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `${normalized || "attachment"}${ext}`;
}
