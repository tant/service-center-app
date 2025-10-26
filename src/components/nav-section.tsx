"use client";

import type { Icon } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavSection({
  title = "Dữ liệu",
  items,
}: {
  title?: string;
  items: {
    name: string;
    url: string;
    icon: Icon;
    badge?: number | string;
  }[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (pathname === url) {
      e.preventDefault();
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url} onClick={(e) => handleClick(e, item.url)} className="flex items-center gap-2">
                <item.icon />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge !== 0 && (
                  <Badge variant="default" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </SidebarMenuButton>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <IconFolder />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconShare3 />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <IconTrash />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </SidebarMenuItem>
        ))}
        {/* <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem> */}
      </SidebarMenu>
    </SidebarGroup>
  );
}
