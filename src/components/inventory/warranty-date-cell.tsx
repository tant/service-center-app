/**
 * Warranty Date Cell Component
 * Displays warranty date with color coding (red for expired, gray for no data)
 */

interface WarrantyDateCellProps {
  date: string | null | undefined;
}

export function WarrantyDateCell({ date }: WarrantyDateCellProps) {
  if (!date) {
    return <span className="text-muted-foreground">—</span>;
  }

  const endDate = new Date(date);
  const isExpired = endDate < new Date();

  return (
    <div className={isExpired ? "text-destructive" : "text-foreground"}>
      {endDate.toLocaleDateString("vi-VN")}
    </div>
  );
}
