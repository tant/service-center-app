/**
 * Product Serial Input Component
 * Smart input field with real-time serial lookup and validation
 *
 * Features:
 * - Debounced API calls (500ms)
 * - Real-time warranty status display
 * - Product information lookup
 * - Error handling
 *
 * Based on spec: docs/front-end-spec-serial-lookup.md
 */

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { trpc } from "@/components/providers/trpc-provider";
import { useDebounce } from "@/hooks/useDebounce";
import { SerialLookupResult } from "./serial-lookup-result";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

type LookupStatus = 'idle' | 'checking' | 'found' | 'not_found' | 'error';
type ServiceOption = "warranty" | "paid";

interface ProductSerialInputProps {
  index: number;
  serial: string;
  serviceOption: ServiceOption;
  serviceOptionManual: boolean;
  onSerialChange: (serial: string) => void;
  onServiceOptionAutoSelect: (option: ServiceOption) => void;
  onServiceOptionManualChange: (option: ServiceOption) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  totalProducts: number;
}

export function ProductSerialInput({
  index,
  serial,
  serviceOption,
  serviceOptionManual,
  onSerialChange,
  onServiceOptionAutoSelect,
  onServiceOptionManualChange,
  onRemove,
  canRemove,
  disabled = false,
  totalProducts,
}: ProductSerialInputProps) {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const debouncedSerial = useDebounce(serial, 500);

  // tRPC query for serial lookup
  const { data: lookupResult, isLoading, error } = trpc.serviceRequest.lookupSerial.useQuery(
    { serial_number: debouncedSerial },
    {
      enabled: debouncedSerial.length >= 5, // Only lookup if serial is at least 5 chars
      retry: 1,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Update lookup status based on query state
  useEffect(() => {
    if (debouncedSerial.length < 5) {
      setLookupStatus('idle');
      onServiceOptionAutoSelect('paid');
      return;
    }

    if (isLoading) {
      setLookupStatus('checking');
    } else if (error) {
      setLookupStatus('error');
      onServiceOptionAutoSelect('paid');
    } else if (lookupResult) {
      setLookupStatus(lookupResult.found ? 'found' : 'not_found');
      if (lookupResult.found && lookupResult.product) {
        const status = lookupResult.product.warranty_status;
        const option: ServiceOption =
          status === 'active' || status === 'expiring_soon' ? 'warranty' : 'paid';
        onServiceOptionAutoSelect(option);
      } else {
        onServiceOptionAutoSelect('paid');
      }
    }
  }, [debouncedSerial, isLoading, error, lookupResult, onServiceOptionAutoSelect]);

  return (
    <div className="space-y-2 p-4 border rounded-lg bg-card">
      {/* Header with index and remove button */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`serial-${index}`} className="text-sm font-medium">
          Serial Number #{index + 1} <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            ({index + 1}/{totalProducts})
          </span>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <IconTrash className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {/* Serial input field */}
      <Input
        id={`serial-${index}`}
        type="text"
        value={serial}
        onChange={(e) => onSerialChange(e.target.value)}
        placeholder="VD: ZT-RTX4090-001234"
        disabled={disabled}
        className="font-mono uppercase"
        autoComplete="off"
      />

      {/* Lookup result display */}
      <SerialLookupResult
        status={lookupStatus}
        product={lookupResult?.product || null}
        error={error?.message || (lookupResult && 'error' in lookupResult ? lookupResult.error : undefined)}
        serviceOption={serviceOption}
        serviceOptionManual={serviceOptionManual}
      />

      {/* Service option selector */}
      <div className="space-y-2 rounded-md border border-dashed bg-muted/30 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium uppercase tracking-wide text-muted-foreground">
            Phương án dịch vụ
          </span>
          <Badge
            variant={serviceOptionManual ? "secondary" : serviceOption === "warranty" ? "resolved" : "default"}
            className="text-[10px]"
          >
            {serviceOption === "warranty" ? "Bảo hành" : "Thu phí"}
          </Badge>
        </div>
        <RadioGroup
          value={serviceOption}
          onValueChange={(value) => onServiceOptionManualChange(value as ServiceOption)}
          className="grid gap-3"
        >
          <div className="flex items-start gap-3 rounded-md border bg-background p-3">
            <RadioGroupItem
              id={`service-option-warranty-${index}`}
              value="warranty"
              disabled={disabled}
            />
            <div className="space-y-1">
              <Label htmlFor={`service-option-warranty-${index}`} className="font-medium">
                Bảo hành
              </Label>
              <p className="text-xs text-muted-foreground">
                Áp dụng khi sản phẩm vẫn còn hạn bảo hành hợp lệ.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border bg-background p-3">
            <RadioGroupItem
              id={`service-option-paid-${index}`}
              value="paid"
              disabled={disabled}
            />
            <div className="space-y-1">
              <Label htmlFor={`service-option-paid-${index}`} className="font-medium">
                Thu phí
              </Label>
              <p className="text-xs text-muted-foreground">
                Áp dụng khi bảo hành đã hết hạn hoặc không tra cứu được.
              </p>
            </div>
          </div>
        </RadioGroup>
        {!serviceOptionManual && (
          <p className="text-[11px] text-muted-foreground">
            Hệ thống tự đề xuất dựa trên trạng thái bảo hành. Bạn có thể chỉnh tay nếu cần.
          </p>
        )}
        {serviceOptionManual && (
          <p className="text-[11px] text-muted-foreground">
            Giá trị đã được chỉnh tay và sẽ không tự thay đổi cho tới khi cập nhật serial.
          </p>
        )}
      </div>
    </div>
  );
}
