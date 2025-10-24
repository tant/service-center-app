/**
 * Story 1.17: Dynamic Template Switching
 * Client component for ticket detail actions
 * Includes Edit and Switch Template buttons
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconEdit, IconArrowsRightLeft } from "@tabler/icons-react";
import Link from "next/link";
import { SwitchTemplateModal } from "@/components/modals/switch-template-modal";

interface TicketActionsProps {
  ticketId: string;
  ticketStatus: string;
  currentTemplateId?: string;
  currentTemplateName?: string;
}

export function TicketActions({
  ticketId,
  ticketStatus,
  currentTemplateId,
  currentTemplateName,
}: TicketActionsProps) {
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  // Only show switch template button if ticket is not completed/cancelled
  const canSwitchTemplate = !["completed", "cancelled"].includes(ticketStatus);

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Link href={`/tickets/${ticketId}/edit`}>
        <Button variant="outline" size="sm">
          <IconEdit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </Link>

      {/* Switch Template Button */}
      {canSwitchTemplate && currentTemplateId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSwitchModalOpen(true)}
        >
          <IconArrowsRightLeft className="h-4 w-4" />
          Đổi Template
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
    </div>
  );
}
