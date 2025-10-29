"use client";

/**
 * Serial Entry Card Component
 * Main container for serial entry status and interface per receipt
 * Shows progress, last updated, task assignment, and primary action
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SerialProgressBar } from "./serial-progress-bar";
import { AlertTriangle, CheckCircle2, Clock, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export type SerialEntryStatus = "pending" | "in-progress" | "complete" | "overdue";

interface SerialEntryCardProps {
  receiptId: string;
  status: SerialEntryStatus;
  progress: {
    current: number;
    total: number;
  };
  lastUpdated?: Date;
  assignedTo: {
    id: string;
    full_name: string;
  };
  taskAge: number; // days
  onContinue?: () => void;
  canEdit: boolean;
  children?: React.ReactNode;
}

export function SerialEntryCard({
  receiptId,
  status,
  progress,
  lastUpdated,
  assignedTo,
  taskAge,
  onContinue,
  canEdit,
  children,
}: SerialEntryCardProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  // Determine background color based on status
  const getStatusStyles = () => {
    switch (status) {
      case "complete":
        return {
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-200 dark:border-green-800",
          text: "text-green-700 dark:text-green-300",
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: "Hoàn thành",
        };
      case "overdue":
        return {
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-800 animate-pulse",
          text: "text-red-700 dark:text-red-300",
          icon: <Flame className="h-5 w-5" />,
          label: `Quá hạn (${taskAge} ngày)`,
        };
      case "in-progress":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-700 dark:text-yellow-300",
          icon: <Clock className="h-5 w-5" />,
          label: "Đang tiến hành",
        };
      case "pending":
      default:
        return {
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-300",
          icon: <AlertTriangle className="h-5 w-5" />,
          label: "Chưa bắt đầu",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <Card className={`${styles.bg} ${styles.border}`}>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={styles.text}>{styles.icon}</div>
            <h3 className={`font-semibold ${styles.text}`}>
              TRẠNG THÁI NHẬP SERIAL
            </h3>
          </div>
          <span className={`text-sm font-medium ${styles.text}`}>
            {styles.label}
          </span>
        </div>

        {/* Progress Bar */}
        <SerialProgressBar
          current={progress.current}
          total={progress.total}
          variant="linear"
          showPercentage
          showCount
        />

        {/* Additional Info */}
        <div className="space-y-2 text-sm">
          {status === "complete" ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã hoàn thành tất cả serial!</span>
            </div>
          ) : (
            <>
              {lastUpdated && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Cập nhật lần cuối:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(lastUpdated, {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Người phụ trách:</span>
                <span className="font-medium">{assignedTo.full_name}</span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Thời gian:</span>
                <span className="font-medium">
                  {taskAge === 0 ? "Hôm nay" : `${taskAge} ngày trước`}
                </span>
              </div>

              {status === "overdue" && (
                <div className="rounded-md bg-red-100 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
                  <div className="flex items-start gap-2">
                    <Flame className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Đã quá hạn!</p>
                      <p className="text-xs mt-1">
                        Quản lý đã được thông báo. Vui lòng hoàn thành sớm.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Section - Different display based on edit permission */}
        {status !== "complete" && (
          <>
            {canEdit && onContinue ? (
              // Editable: Show clickable button
              <Button
                onClick={onContinue}
                className="w-full"
                size="lg"
                variant="default"
              >
                {status === "pending" ? "Bắt đầu nhập serial" : "Tiếp tục nhập serial"} →
              </Button>
            ) : (
              // Not editable: Show informational text instead of button
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground text-center">
                <p>Người phụ trách: <span className="font-medium text-foreground">{assignedTo.full_name}</span></p>
              </div>
            )}
          </>
        )}

        {/* Stock Update Info */}
        {(status === "in-progress" || status === "overdue") && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
            <p className="flex items-center gap-2">
              <span>💡</span>
              <span>
                Tồn kho đã được cập nhật. Đang tiếp tục nhập serial để đảm bảo truy xuất nguồn gốc.
              </span>
            </p>
          </div>
        )}

        {/* Children (Product list) */}
        {children && (
          <div className="mt-4 pt-4 border-t border-border/50">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
