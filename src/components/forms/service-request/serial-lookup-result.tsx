/**
 * Serial Lookup Result Component
 * Displays product lookup results with 4 visual states:
 * - idle: Not checked yet
 * - checking: API call in progress
 * - found: Product found with warranty info
 * - not_found: Serial doesn't exist in system
 *
 * Based on spec: docs/front-end-spec-serial-lookup.md
 */

import { IconLoader2, IconCircleCheck, IconAlertCircle, IconCircleX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type LookupStatus = 'idle' | 'checking' | 'found' | 'not_found' | 'error';

type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'no_warranty';

interface ProductLookupResult {
  id: string;
  name: string;
  sku: string;
  brand: string;
  warranty_status: WarrantyStatus;
  warranty_end_date: string | null;
  manufacturer_warranty_end_date: string | null;
  user_warranty_end_date: string | null;
  days_remaining: number | null;
  last_customer: {
    id: string;
    name: string;
  } | null;
  current_location: {
    physical_warehouse: string;
    virtual_warehouse: string;
    warehouse_type: string;
  };
  service_history_count: number;
  current_ticket_id: string | null;
  current_ticket_number: string | null;
}

interface SerialLookupResultProps {
  status: LookupStatus;
  product: ProductLookupResult | null;
  error?: string;
}

export function SerialLookupResult({ status, product, error }: SerialLookupResultProps) {
  // State 1: Idle - No display needed
  if (status === 'idle') {
    return null;
  }

  // State 2: Checking - Loading spinner
  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-md animate-pulse">
        <IconLoader2 className="h-4 w-4 animate-spin" />
        <span>Đang kiểm tra...</span>
      </div>
    );
  }

  // State 4: Not Found - Error display
  if (status === 'not_found') {
    return (
      <div className="flex items-center gap-2 text-sm p-3 bg-destructive/10 border border-destructive/30 rounded-md">
        <IconCircleX className="h-4 w-4 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-destructive">Serial không tìm thấy trong kho hàng đã bán</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chỉ sản phẩm đã bán cho khách hàng mới có thể tạo phiếu yêu cầu dịch vụ
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-sm p-3 bg-orange-500/10 border border-orange-500/30 rounded-md">
        <IconAlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-orange-700 dark:text-orange-400">Lỗi kết nối</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {error || "Không thể kiểm tra serial. Vui lòng thử lại."}
          </p>
        </div>
      </div>
    );
  }

  // State 3: Found - Show product info
  if (status === 'found' && product) {
    // Determine warranty display
    const getWarrantyDisplay = () => {
      if (product.current_ticket_id) {
        // In Service - Special case
        return {
          icon: <IconAlertCircle className="h-4 w-4 flex-shrink-0" />,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          label: `Đang sửa (${product.current_ticket_number})`,
          message: '⚠️ Sản phẩm đang được sửa chữa',
        };
      }

      switch (product.warranty_status) {
        case 'active':
          const months = product.days_remaining ? Math.floor(product.days_remaining / 30) : 0;
          return {
            icon: <IconCircleCheck className="h-4 w-4 flex-shrink-0" />,
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/30',
            textColor: 'text-green-700 dark:text-green-400',
            label: `BH: Còn ${months} tháng`,
            message: null,
          };

        case 'expiring_soon':
          const days = product.days_remaining || 0;
          return {
            icon: <IconAlertCircle className="h-4 w-4 flex-shrink-0" />,
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/30',
            textColor: 'text-yellow-700 dark:text-yellow-400',
            label: `BH: Còn ${days} ngày`,
            message: '⚠️ Bảo hành sắp hết hạn',
          };

        case 'expired':
          const expiredDate = product.warranty_end_date
            ? format(new Date(product.warranty_end_date), 'dd/MM/yyyy', { locale: vi })
            : '';
          return {
            icon: <IconCircleX className="h-4 w-4 flex-shrink-0" />,
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/30',
            textColor: 'text-red-700 dark:text-red-400',
            label: `BH: Hết hạn (${expiredDate})`,
            message: '💡 Sửa chữa có phí - Vui lòng thông báo khách hàng',
          };

        case 'no_warranty':
        default:
          return {
            icon: <IconAlertCircle className="h-4 w-4 flex-shrink-0" />,
            bgColor: 'bg-gray-500/10',
            borderColor: 'border-gray-500/30',
            textColor: 'text-gray-700 dark:text-gray-400',
            label: 'Không có thông tin BH',
            message: '💡 Cần xác nhận với khách hàng',
          };
      }
    };

    const warrantyDisplay = getWarrantyDisplay();

    return (
      <div
        className={cn(
          "flex items-start gap-3 text-sm p-3 rounded-md border",
          warrantyDisplay.bgColor,
          warrantyDisplay.borderColor
        )}
      >
        {warrantyDisplay.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn("font-semibold", warrantyDisplay.textColor)}>
              {product.name}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className={cn("text-xs font-medium", warrantyDisplay.textColor)}>
              {warrantyDisplay.label}
            </span>
          </div>

          {warrantyDisplay.message && (
            <p className="text-xs text-muted-foreground mt-1">{warrantyDisplay.message}</p>
          )}

          <div className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
            <div>SKU: {product.sku} • {product.brand}</div>

            {/* Warranty dates display */}
            {(product.manufacturer_warranty_end_date || product.user_warranty_end_date) && (
              <div className="space-y-0.5">
                {product.manufacturer_warranty_end_date && (
                  <div>
                    BH nhà sản xuất: {format(new Date(product.manufacturer_warranty_end_date), 'dd/MM/yyyy', { locale: vi })}
                    {(() => {
                      const endDate = new Date(product.manufacturer_warranty_end_date);
                      const today = new Date();
                      const daysRemaining = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysRemaining < 0) {
                        const daysExpired = Math.abs(daysRemaining);
                        return ` - đã hết ${Math.floor(daysExpired / 30)} tháng ${daysExpired % 30} ngày`;
                      }

                      const months = Math.floor(daysRemaining / 30);
                      const days = daysRemaining % 30;
                      return ` - còn ${months} tháng ${days} ngày`;
                    })()}
                  </div>
                )}
                {product.user_warranty_end_date && (
                  <div>
                    BH người dùng: {format(new Date(product.user_warranty_end_date), 'dd/MM/yyyy', { locale: vi })}
                    {(() => {
                      const endDate = new Date(product.user_warranty_end_date);
                      const today = new Date();
                      const daysRemaining = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysRemaining < 0) {
                        const daysExpired = Math.abs(daysRemaining);
                        return ` - đã hết ${Math.floor(daysExpired / 30)} tháng ${daysExpired % 30} ngày`;
                      }

                      const months = Math.floor(daysRemaining / 30);
                      const days = daysRemaining % 30;
                      return ` - còn ${months} tháng ${days} ngày`;
                    })()}
                  </div>
                )}
              </div>
            )}

            {product.last_customer && (
              <div>Khách hàng: {product.last_customer.name}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
