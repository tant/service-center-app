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

type LookupStatus = 'idle' | 'checking' | 'found' | 'not_found' | 'error';

interface ProductSerialInputProps {
  index: number;
  serial: string;
  onSerialChange: (serial: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  totalProducts: number;
}

export function ProductSerialInput({
  index,
  serial,
  onSerialChange,
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
      return;
    }

    if (isLoading) {
      setLookupStatus('checking');
    } else if (error) {
      setLookupStatus('error');
    } else if (lookupResult) {
      setLookupStatus(lookupResult.found ? 'found' : 'not_found');
    }
  }, [debouncedSerial, isLoading, error, lookupResult]);

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
      />
    </div>
  );
}
