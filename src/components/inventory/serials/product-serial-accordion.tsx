"use client";

/**
 * Product Serial Accordion Component
 * Expandable product row with serial entry fields
 * Features: auto-save, bulk paste, validation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SerialInput } from "./serial-input";
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Clipboard, Camera } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  serials: string[];
  serialComplete: boolean;
}

interface ProductSerialAccordionProps {
  product: Product;
  onSerialAdd: (serial: string) => Promise<void>;
  onSerialRemove: (index: number) => Promise<void>;
  onBulkPaste?: () => void;
  onScan?: () => void;
  allowBulk?: boolean;
  allowScan?: boolean;
  autoSave?: boolean;
}

export function ProductSerialAccordion({
  product,
  onSerialAdd,
  onSerialRemove,
  onBulkPaste,
  onScan,
  allowBulk = true,
  allowScan = false,
  autoSave = true,
}: ProductSerialAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(!product.serialComplete);
  const serialCount = product.serials.length;
  const percentage = product.quantity > 0 ? Math.round((serialCount / product.quantity) * 100) : 0;

  // Create array of serial slots
  const serialSlots = Array.from({ length: product.quantity }, (_, index) => ({
    index,
    serial: product.serials[index] || "",
    isFilled: index < serialCount,
  }));

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusIcon = () => {
    if (product.serialComplete) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (serialCount > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  const getStatusText = () => {
    if (product.serialComplete) return "text-green-600";
    if (serialCount > 0) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="border rounded-lg">
      {/* Collapsed Header */}
      <button
        onClick={toggleExpanded}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="text-left">
            <div className="font-medium">{product.name}</div>
            {product.sku && (
              <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium">
              Quantity: {product.quantity}
            </div>
            <div className={`text-sm font-medium ${getStatusText()}`}>
              Serials: {serialCount}/{product.quantity} ({percentage}%)
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {product.serialComplete
                ? "Tất cả serial đã được nhập ✓"
                : `Còn ${product.quantity - serialCount} serial cần nhập`}
            </span>
            {!product.serialComplete && (
              <div className="flex items-center gap-2">
                {allowBulk && onBulkPaste && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkPaste}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Dán nhiều serial
                  </Button>
                )}
                {allowScan && onScan && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onScan}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Serial Input Fields */}
          <div className="space-y-3">
            {serialSlots.map((slot) => (
              <div key={slot.index} className="grid gap-2">
                <label
                  htmlFor={`serial-${product.id}-${slot.index}`}
                  className="text-sm font-medium"
                >
                  Serial {slot.index + 1}:
                </label>
                <SerialInput
                  id={`serial-${product.id}-${slot.index}`}
                  value={slot.serial}
                  onChange={async (value) => {
                    if (value && autoSave) {
                      await onSerialAdd(value);
                    }
                  }}
                  onRemove={
                    slot.isFilled
                      ? async () => await onSerialRemove(slot.index)
                      : undefined
                  }
                  placeholder="Nhập số serial..."
                  disabled={slot.isFilled}
                  autoSave={autoSave}
                  showScanButton={allowScan && !slot.isFilled}
                  onScan={onScan}
                />
              </div>
            ))}
          </div>

          {!product.serialComplete && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
              <p>
                💡 <strong>Tip:</strong> Bạn có thể dán nhiều serial cùng lúc bằng nút "Dán nhiều serial" ở trên.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
