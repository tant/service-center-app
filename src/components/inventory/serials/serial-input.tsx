"use client";

/**
 * Serial Input Component
 * Single serial number input field with validation
 * Features: auto-save, duplicate detection, format validation
 */

import {
  AlertCircle,
  Camera,
  Check,
  Clipboard,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SerialInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  onScan?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoSave?: boolean;
  showScanButton?: boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    checkDuplicate?: boolean;
  };
}

type ValidationState =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "duplicate"
  | "saving";

export function SerialInput({
  id,
  value,
  onChange,
  onRemove,
  onScan,
  placeholder = "Nhập số serial...",
  disabled = false,
  autoSave = true,
  showScanButton = false,
  validationRules = {
    minLength: 8,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/i,
  },
}: SerialInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [validationState, setValidationState] =
    useState<ValidationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Validate format
  const validateFormat = (
    val: string,
  ): { isValid: boolean; error?: string } => {
    if (!val) return { isValid: false };

    const { minLength, maxLength, pattern } = validationRules;

    if (minLength && val.length < minLength) {
      return {
        isValid: false,
        error: `Quá ngắn (tối thiểu ${minLength} ký tự)`,
      };
    }

    if (maxLength && val.length > maxLength) {
      return { isValid: false, error: `Quá dài (tối đa ${maxLength} ký tự)` };
    }

    if (pattern && !pattern.test(val)) {
      return { isValid: false, error: "Định dạng không hợp lệ" };
    }

    return { isValid: true };
  };

  // Handle input change with debounced save
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim().toUpperCase();
    setLocalValue(newValue);

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Validate format
    const validation = validateFormat(newValue);

    if (!validation.isValid) {
      setValidationState("invalid");
      setErrorMessage(validation.error || "");
      return;
    }

    // If valid, set validating state and debounce save
    if (autoSave && newValue) {
      setValidationState("validating");
      setErrorMessage("");

      saveTimeoutRef.current = setTimeout(async () => {
        setValidationState("saving");
        try {
          await onChange(newValue);
          setValidationState("valid");
        } catch (error: any) {
          if (
            error.message?.includes("duplicate") ||
            error.message?.includes("trùng")
          ) {
            setValidationState("duplicate");
            setErrorMessage("Serial đã tồn tại trong hệ thống");
          } else {
            setValidationState("invalid");
            setErrorMessage(error.message || "Lỗi khi lưu");
          }
        }
      }, 500);
    }
  };

  // Handle remove
  const handleRemove = async () => {
    if (onRemove) {
      setValidationState("saving");
      try {
        await onRemove();
        setLocalValue("");
        setValidationState("idle");
      } catch (error: any) {
        setValidationState("invalid");
        setErrorMessage(error.message || "Lỗi khi xóa");
      }
    }
  };

  // Get input border color based on state
  const getInputClassName = () => {
    if (disabled) return "";
    switch (validationState) {
      case "valid":
        return "border-green-500 focus-visible:ring-green-500";
      case "invalid":
      case "duplicate":
        return "border-red-500 focus-visible:ring-red-500";
      case "validating":
      case "saving":
        return "border-yellow-500 focus-visible:ring-yellow-500";
      default:
        return "";
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (validationState) {
      case "valid":
        return <Check className="h-4 w-4 text-green-600" />;
      case "invalid":
      case "duplicate":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "validating":
      case "saving":
        return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />;
      default:
        return null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Input Field */}
        <div className="relative flex-1">
          <Input
            id={id}
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pr-10 font-mono", getInputClassName())}
          />
          {/* Status Icon */}
          {!disabled && getStatusIcon() && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getStatusIcon()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!disabled && (
          <div className="flex items-center gap-1">
            {showScanButton && onScan && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onScan}
                title="Scan barcode"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}

            {value && onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                title="Xóa serial"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error/Warning Message */}
      {errorMessage &&
        (validationState === "invalid" || validationState === "duplicate") && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errorMessage}
            {validationState === "duplicate" && (
              <button
                type="button"
                className="underline ml-2"
                onClick={() => {
                  // Allow keeping anyway (for manual override)
                  setValidationState("valid");
                  setErrorMessage("");
                }}
              >
                Giữ lại
              </button>
            )}
          </p>
        )}

      {/* Saving Indicator */}
      {validationState === "saving" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Đang lưu...
        </p>
      )}

      {/* Success Message */}
      {validationState === "valid" && localValue && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Đã lưu
        </p>
      )}
    </div>
  );
}
