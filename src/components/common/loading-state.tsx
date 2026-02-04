/**
 * Reusable loading state component
 */

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Đang tải..." }: LoadingStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}