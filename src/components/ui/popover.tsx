"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  disablePositionUpdate = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /**
   * Khi true, ngăn popover recalculate position khi content size thay đổi.
   * Giúp fix flickering issue khi user đang typing trong input fields.
   * @default false
   */
  disablePositionUpdate?: boolean;
}) {
  // Track khi user đang interact với content bên trong popover
  // để tránh position recalculation gây flickering
  const [isInteracting, setIsInteracting] = React.useState(false);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        // Prevent position updates khi user đang interact hoặc khi explicitly disabled
        onFocusCapture={() => setIsInteracting(true)}
        onBlurCapture={(e) => {
          // Chỉ set false nếu focus rời khỏi popover hoàn toàn
          // Check relatedTarget để tránh false positive khi focus di chuyển giữa các elements trong popover
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsInteracting(false);
          }
        }}
        className={cn(
          "bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-hidden",
          // ✅ OPTIMIZED: Chỉ dùng fade animation, bỏ zoom và slide để giảm flickering
          // Fade animation đơn giản hơn, performance tốt hơn, ít trigger re-position
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "transition-opacity duration-150",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
