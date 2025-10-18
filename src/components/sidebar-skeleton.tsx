import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <div className="px-3 py-2 space-y-4">
      {/* Navigation Main Items */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`nav-main-${i}`} className="flex items-center gap-3 p-2">
            <Skeleton className="w-5 h-5 rounded-sm bg-border" />
            <Skeleton className="h-4 w-24 rounded-sm bg-border" />
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="py-2">
        <Skeleton className="h-px w-full rounded-sm bg-border" />
      </div>

      {/* Documents Section */}
      <div className="space-y-3">
        {/* Section Title */}
        <div className="px-2">
          <Skeleton className="h-3 w-16 rounded-sm bg-border" />
        </div>

        {/* Document Items */}
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`doc-${i}`} className="flex items-center gap-3 p-2">
              <Skeleton className="w-4 h-4 rounded-sm bg-border" />
              <Skeleton className="h-4 w-28 rounded-sm bg-border" />
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="py-2">
        <Skeleton className="h-px w-full rounded-sm bg-border" />
      </div>

      {/* Secondary Navigation */}
      <div className="space-y-2 mt-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`nav-secondary-${i}`}
            className="flex items-center gap-3 p-2"
          >
            <Skeleton className="w-4 h-4 rounded-sm bg-border" />
            <Skeleton className="h-4 w-20 rounded-sm bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
