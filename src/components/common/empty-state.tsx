/**
 * Reusable empty/not found state component
 */

import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  backHref,
  backLabel = "Quay lại",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {action}
        {!action && backHref && (
          <Button asChild variant="outline">
            <Link href={backHref}>
              <IconArrowLeft className="h-4 w-4 mr-2" />
              {backLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}