/**
 * Serial Validation Display Component
 * Shows validation results with visual feedback
 */

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationResult {
  serialNumber: string;
  isValid: boolean;
  existsIn?: "physical_products" | "stock_receipt_serials";
  message?: string;
}

interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  allValid: boolean;
}

interface SerialValidationDisplayProps {
  validation: {
    results: ValidationResult[];
    summary: ValidationSummary;
  };
  className?: string;
}

export function SerialValidationDisplay({
  validation,
  className = "",
}: SerialValidationDisplayProps) {
  const { results, summary } = validation;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Alert */}
      {summary.allValid ? (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            Tất cả số serial hợp lệ
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            {summary.total} số serial đã được xác thực thành công. Sẵn sàng để
            thêm!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Phát hiện lỗi xác thực</AlertTitle>
          <AlertDescription>
            {summary.invalid} trong số {summary.total} số serial không hợp lệ.
            Vui lòng sửa các lỗi bên dưới.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Results */}
      {summary.invalid > 0 && (
        <div className="rounded-md border">
          <div className="bg-muted px-4 py-2 font-medium text-sm">
            Chi tiết xác thực
          </div>
          <div className="h-[200px] overflow-y-auto">
            <div className="divide-y">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 px-4 py-2 ${
                    result.isValid
                      ? "bg-green-50 dark:bg-green-950/20"
                      : "bg-red-50 dark:bg-red-950/20"
                  }`}
                >
                  {result.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">
                      {result.serialNumber}
                    </p>
                    {result.message && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <p className="font-medium text-2xl">{summary.total}</p>
          <p className="text-muted-foreground">Tổng</p>
        </div>
        <div>
          <p className="font-medium text-2xl text-green-600">{summary.valid}</p>
          <p className="text-muted-foreground">Hợp lệ</p>
        </div>
        <div>
          <p className="font-medium text-2xl text-red-600">{summary.invalid}</p>
          <p className="text-muted-foreground">Không hợp lệ</p>
        </div>
      </div>
    </div>
  );
}
