"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { trpc } from "@/components/providers/trpc-provider";
import { IconClock, IconTicket, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import * as React from "react";

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
  backHref?: string;
}

export function PageHeader({ title, children, backHref }: PageHeaderProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const { data: pendingCount } = trpc.tickets.getPendingCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {backHref && (
          <>
            <Button variant="ghost" size="sm" asChild className="-ml-1">
              <Link href={backHref}>
                <IconArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
          </>
        )}
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-3">
          {children || (
            <>
              <div className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
                <IconClock className="size-4" />
                <span className="font-mono" suppressHydrationWarning>
                  {formatDate(currentTime)}
                </span>
                <span className="font-mono" suppressHydrationWarning>
                  {formatTime(currentTime)}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="h-4 hidden md:block"
              />
              <div className="hidden items-center gap-1.5 text-sm lg:flex">
                <IconTicket className="size-4 text-orange-500" />
                <span className="font-medium">{pendingCount ?? 0}</span>
                <span className="text-muted-foreground">phiếu đang xử lý</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
