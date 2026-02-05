"use client";

import { type Icon, IconCirclePlusFilled } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavOverview({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    badge?: number | string;
  }[];
}) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (pathname === url) {
      e.preventDefault();
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              asChild
              tooltip="Tạo phiếu yêu cầu"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <a
                href="/operations/service-requests/new"
                className="flex items-center gap-2"
                onClick={(e) =>
                  handleClick(e, "/operations/service-requests/new")
                }
              >
                <IconCirclePlusFilled />
                <span>Tạo phiếu yêu cầu</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a
                  href={item.url}
                  onClick={(e) => handleClick(e, item.url)}
                  className="flex items-center gap-2"
                >
                  {item.icon && <item.icon />}
                  <span className="flex-1">{item.title}</span>
                  {item.badge !== undefined && item.badge !== 0 && (
                    <Badge variant="default" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
