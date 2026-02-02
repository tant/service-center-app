/**
 * Outcome Selection Modal
 * Modal for selecting outcome and transitioning to ready_for_pickup
 * Supports warranty replacement flow with product selection
 */

"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/components/providers/trpc-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type TicketOutcome = "repaired" | "warranty_replacement" | "unrepairable";

interface CompleteTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: string;
  warrantyType: string;
  currentOutcome?: string | null;
}

const OUTCOME_CONFIG: Record<
  TicketOutcome,
  { label: string; description: string; icon: React.ReactNode; color: string }
> = {
  repaired: {
    label: "Đã sửa chữa",
    description: "Sản phẩm đã được sửa chữa thành công, trả lại cho khách",
    icon: <IconCircleCheck className="h-5 w-5 text-green-600" />,
    color: "border-green-200 bg-green-50",
  },
  warranty_replacement: {
    label: "Đổi bảo hành",
    description: "Thay thế bằng sản phẩm mới từ kho bảo hành",
    icon: <IconRefresh className="h-5 w-5 text-blue-600" />,
    color: "border-blue-200 bg-blue-50",
  },
  unrepairable: {
    label: "Không thể sửa",
    description: "Sản phẩm không thể sửa chữa hoặc thay thế",
    icon: <IconX className="h-5 w-5 text-red-600" />,
    color: "border-red-200 bg-red-50",
  },
};

export function CompleteTicketModal({
  open,
  onClose,
  ticketId,
  ticketNumber,
  warrantyType,
  currentOutcome,
}: CompleteTicketModalProps) {
  const [outcome, setOutcome] = useState<TicketOutcome | "">(
    (currentOutcome as TicketOutcome) || "",
  );
  const [replacementProductId, setReplacementProductId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const router = useRouter();

  // Fetch replacement products when warranty_replacement is selected
  const { data: replacements, isLoading: loadingReplacements } =
    trpc.tickets.getAvailableReplacements.useQuery(
      { ticket_id: ticketId },
      {
        enabled: open && outcome === "warranty_replacement",
      },
    );

  // Set outcome mutation - transitions to ready_for_pickup
  const setOutcomeMutation = trpc.tickets.setOutcome.useMutation({
    onSuccess: () => {
      toast.success(`Phiếu ${ticketNumber} sẵn sàng bàn giao!`);
      onClose();
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setOutcome((currentOutcome as TicketOutcome) || "");
      setReplacementProductId("");
      setNotes("");
      setValidationError("");
    }
  }, [open, currentOutcome]);

  const handleSubmit = () => {
    // Validation
    if (!outcome) {
      setValidationError("Vui lòng chọn kết quả xử lý");
      return;
    }

    if (outcome === "warranty_replacement" && !replacementProductId) {
      setValidationError("Vui lòng chọn sản phẩm thay thế");
      return;
    }

    setValidationError("");

    setOutcomeMutation.mutate({
      ticket_id: ticketId,
      outcome,
      replacement_product_id:
        outcome === "warranty_replacement" ? replacementProductId : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setOutcome("");
    setReplacementProductId("");
    setNotes("");
    setValidationError("");
    onClose();
  };

  const isWarrantyTicket = warrantyType === "warranty";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chọn kết quả xử lý</DialogTitle>
          <DialogDescription>
            Chọn kết quả xử lý cho phiếu {ticketNumber}. Sau khi xác nhận, phiếu
            sẽ chuyển sang trạng thái sẵn sàng bàn giao.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning for warranty tickets */}
          {isWarrantyTicket && (
            <Alert>
              <IconAlertTriangle className="h-4 w-4" />
              <AlertTitle>Phiếu bảo hành</AlertTitle>
              <AlertDescription>
                Nếu chọn "Đổi bảo hành", sản phẩm thay thế sẽ được tự động
                chuyển từ kho bảo hành sang khách hàng.
              </AlertDescription>
            </Alert>
          )}

          {/* Outcome Selection */}
          <div className="space-y-3">
            <Label>
              Kết quả xử lý <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={outcome}
              onValueChange={(value) => {
                setOutcome(value as TicketOutcome);
                setReplacementProductId("");
                if (validationError) setValidationError("");
              }}
              className="space-y-2"
            >
              {Object.entries(OUTCOME_CONFIG).map(([key, config]) => {
                // Hide warranty_replacement option for non-warranty tickets
                if (key === "warranty_replacement" && !isWarrantyTicket) {
                  return null;
                }

                return (
                  <label
                    key={key}
                    htmlFor={key}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      outcome === key ? config.color : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={key} id={key} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Replacement Product Selection */}
          {outcome === "warranty_replacement" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="replacement-select">
                  Chọn sản phẩm thay thế{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={replacementProductId}
                  onValueChange={(value) => {
                    setReplacementProductId(value);
                    if (validationError) setValidationError("");
                  }}
                  disabled={loadingReplacements || setOutcomeMutation.isPending}
                >
                  <SelectTrigger id="replacement-select">
                    <SelectValue
                      placeholder={
                        loadingReplacements
                          ? "Đang tải..."
                          : "-- Chọn sản phẩm --"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!replacements || replacements.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Không có sản phẩm thay thế trong kho bảo hành
                      </div>
                    ) : (
                      replacements.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {product.serial_number}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {product.condition}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {replacements && replacements.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Có {replacements.length} sản phẩm thay thế trong kho bảo
                    hành
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú thêm về kết quả xử lý..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={setOutcomeMutation.isPending}
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={setOutcomeMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              setOutcomeMutation.isPending ||
              !outcome ||
              (outcome === "warranty_replacement" && !replacementProductId)
            }
          >
            {setOutcomeMutation.isPending
              ? "Đang xử lý..."
              : "Xác nhận kết quả"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
