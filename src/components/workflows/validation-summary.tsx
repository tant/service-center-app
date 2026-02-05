/**
 * Validation Summary Component
 *
 * Displays validation errors and warnings for workflows
 */

import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type {
  ValidationIssue,
  WorkflowValidationResult,
} from "@/lib/workflow-validation";

interface ValidationSummaryProps {
  validation: WorkflowValidationResult;
  className?: string;
}

export function ValidationSummary({
  validation,
  className,
}: ValidationSummaryProps) {
  const { errors, warnings, isValid } = validation;

  if (isValid && warnings.length === 0) {
    return (
      <Alert variant="default" className={className}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Quy trình hợp lệ</AlertTitle>
        <AlertDescription>
          Quy trình đã sẵn sàng để lưu hoặc kích hoạt.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {errors.length === 1
              ? "Có 1 lỗi cần sửa"
              : `Có ${errors.length} lỗi cần sửa`}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error.message}
                  {error.taskIndex !== undefined && (
                    <span className="ml-1 text-xs opacity-75">
                      (Task {error.taskIndex + 1})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert
          variant="default"
          className="border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>
            {warnings.length === 1
              ? "Có 1 cảnh báo"
              : `Có ${warnings.length} cảnh báo`}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning.message}
                  {warning.taskIndex !== undefined && (
                    <span className="ml-1 text-xs opacity-75">
                      (Task {warning.taskIndex + 1})
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs opacity-75">
              Cảnh báo không chặn việc lưu, nhưng nên xem xét để cải thiện quy
              trình.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Compact validation indicator for inline display
 */
interface ValidationIndicatorProps {
  validation: WorkflowValidationResult;
}

export function ValidationIndicator({ validation }: ValidationIndicatorProps) {
  const { errors, warnings, isValid } = validation;

  if (isValid && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Hợp lệ</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {errors.length > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.length} lỗi</span>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertTriangle className="h-4 w-4" />
          <span>{warnings.length} cảnh báo</span>
        </div>
      )}
    </div>
  );
}
