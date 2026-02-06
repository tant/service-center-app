/**
 * Story 1.17: Dynamic Template Switching
 * Story 01.22: Ticket Completion with Replacement Product
 * Outcome Checkpoint: Separate task completion from outcome selection
 * Client component for ticket detail actions
 */

"use client";

import {
  IconArrowsRightLeft,
  IconCircleCheck,
  IconEdit,
  IconPackage,
  IconPlayerPlay,
  IconTarget,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CompleteTicketModal } from "@/components/modals/complete-ticket-modal";
import { ConfirmDeliveryModal } from "@/components/modals/confirm-delivery-modal";
import { SwitchTemplateModal } from "@/components/modals/switch-template-modal";
import { trpc } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";

interface TicketActionsProps {
  ticketId: string;
  ticketNumber: string;
  ticketStatus: string;
  warrantyType: string;
  currentTemplateId?: string;
  currentTemplateName?: string;
  tasksCompletedAt?: string | null;
  outcome?: string | null;
  hasTasks?: boolean;
}

export function TicketActions({
  ticketId,
  ticketNumber,
  ticketStatus,
  warrantyType,
  currentTemplateId,
  currentTemplateName,
  tasksCompletedAt,
  outcome,
  hasTasks = false,
}: TicketActionsProps) {
  const router = useRouter();
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

  const startTicketMutation = trpc.tickets.updateTicket.useMutation({
    onSuccess: () => {
      toast.success("Đã bắt đầu xử lý phiếu");
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });

  // Ticket is already completed or cancelled
  const isFinished = ["completed", "cancelled"].includes(ticketStatus);
  // Only show modify actions if ticket is not completed/cancelled
  const canModify = !isFinished;

  // Can select outcome if:
  // - Status is in_progress AND
  // - (Tasks completed OR no tasks)
  // Note: outcome may already be pre-set (default warranty_replacement), so we don't check !outcome
  const canSelectOutcome =
    ticketStatus === "in_progress" && (!hasTasks || tasksCompletedAt);

  // Can confirm delivery if status is ready_for_pickup
  const canConfirmDelivery = ticketStatus === "ready_for_pickup";

  // Get disabled reason for outcome button
  const getOutcomeDisabledReason = () => {
    if (ticketStatus !== "in_progress")
      return "Phiếu không ở trạng thái đang xử lý";
    if (hasTasks && !tasksCompletedAt)
      return "Phải hoàn thành tất cả công việc trước";
    return "";
  };

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Link href={`/operations/tickets/${ticketId}/edit`}>
        <Button variant="outline" size="sm">
          <IconEdit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </Link>

      {/* Start Processing Button - Show when pending */}
      {ticketStatus === "pending" && (
        <Button
          size="sm"
          onClick={() =>
            startTicketMutation.mutate({ id: ticketId, status: "in_progress" })
          }
          disabled={startTicketMutation.isPending}
        >
          <IconPlayerPlay className="h-4 w-4" />
          {startTicketMutation.isPending ? "Đang xử lý..." : "Bắt đầu xử lý"}
        </Button>
      )}

      {/* Switch Template Button */}
      {canModify && currentTemplateId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSwitchModalOpen(true)}
        >
          <IconArrowsRightLeft className="h-4 w-4" />
          Đổi Template
        </Button>
      )}

      {/* Select Outcome Button - Show when tasks done but no outcome yet */}
      {canSelectOutcome && (
        <Button size="sm" onClick={() => setOutcomeModalOpen(true)}>
          <IconTarget className="h-4 w-4" />
          Chọn kết quả
        </Button>
      )}

      {/* Show disabled button with reason when in_progress but can't select outcome */}
      {ticketStatus === "in_progress" && !canSelectOutcome && (
        <Button size="sm" disabled title={getOutcomeDisabledReason()}>
          <IconTarget className="h-4 w-4" />
          Chọn kết quả
        </Button>
      )}

      {/* Confirm Delivery Button - Show when ready_for_pickup */}
      {canConfirmDelivery && (
        <Button size="sm" onClick={() => setDeliveryModalOpen(true)}>
          <IconPackage className="h-4 w-4" />
          Xác nhận bàn giao
        </Button>
      )}

      {/* Switch Template Modal */}
      {currentTemplateId && (
        <SwitchTemplateModal
          open={switchModalOpen}
          onClose={() => setSwitchModalOpen(false)}
          ticketId={ticketId}
          currentTemplateId={currentTemplateId}
          currentTemplateName={currentTemplateName}
        />
      )}

      {/* Outcome Selection Modal */}
      <CompleteTicketModal
        open={outcomeModalOpen}
        onClose={() => setOutcomeModalOpen(false)}
        ticketId={ticketId}
        ticketNumber={ticketNumber}
        warrantyType={warrantyType}
        currentOutcome={outcome}
      />

      {/* Confirm Delivery Modal */}
      <ConfirmDeliveryModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        ticketId={ticketId}
        ticketNumber={ticketNumber}
      />
    </div>
  );
}
