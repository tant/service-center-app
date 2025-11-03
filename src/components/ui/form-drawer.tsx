"use client";

import type * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  titleElement?: React.ReactNode;
  description?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  submitLabel: string;
  cancelLabel?: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  submitDisabled?: boolean;
  headerClassName?: string;
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  titleElement,
  description,
  isSubmitting,
  onSubmit,
  submitLabel,
  cancelLabel = "Hủy",
  children,
  trigger,
  submitDisabled = false,
  headerClassName,
}: FormDrawerProps) {
  const isMobile = useIsMobile();

  const drawerContent = (
    <DrawerContent className="overflow-visible">
      <DrawerHeader className={headerClassName}>
        <DrawerTitle>{titleElement || title}</DrawerTitle>
        {description && <DrawerDescription>{description}</DrawerDescription>}
      </DrawerHeader>

      {/* Form Content - Scrollable with better overflow handling for date pickers */}
      <div className="flex flex-col gap-4 px-4 text-sm max-h-[60vh] overflow-y-auto">
        {children}
      </div>

      <DrawerFooter>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || submitDisabled}
        >
          {submitLabel}
        </Button>
        <DrawerClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );

  // If trigger is provided, render with trigger
  if (trigger) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        direction={isMobile ? "bottom" : "right"}
      >
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        {drawerContent}
      </Drawer>
    );
  }

  // Otherwise, render without trigger (controlled)
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? "bottom" : "right"}
    >
      {drawerContent}
    </Drawer>
  );
}
