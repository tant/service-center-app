"use client";

import {
  IconCamera,
  IconClipboardList,
  IconComponents,
  IconDashboard,
  IconDatabase,
  IconDevices,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPhone,
  IconReport,
  IconSearch,
  IconSettings,
  IconTool,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import type * as React from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Phiếu dịch vụ",
      url: "/tickets",
      icon: IconClipboardList,
    },
    {
      title: "Khách hàng",
      url: "/customers",
      icon: IconUser,
    },
  ],
  navSecondary: [
    {
      title: "Thiết lập",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Hướng dẫn",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Gọi hỗ trợ",
      url: "#",
      icon: IconPhone,
    },
  ],
  documents: [
    {
      name: "Sản phẩm",
      url: "/products",
      icon: IconDevices,
    },
    {
      name: "Linh kiện",
      url: "/parts",
      icon: IconComponents,
    },
    {
      name: "Nhân sự",
      url: "/team",
      icon: IconUsers,
    },
    {
      name: "Báo cáo",
      url: "/report",
      icon: IconReport,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  SSTC Service Center
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
