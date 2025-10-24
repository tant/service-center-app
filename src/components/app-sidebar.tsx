"use client";

import {
  IconClipboardList,
  IconComponents,
  IconDashboard,
  IconDevices,
  IconHelp,
  IconInnerShadowTop,
  IconPhone,
  IconPlus,
  IconReport,
  IconSettings,
  IconUser,
  IconUsers,
  IconChecklist,
  IconBuildingWarehouse,
  IconPackage,
} from "@tabler/icons-react";
import type * as React from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { NavWorkflows } from "@/components/nav-workflows";
import { SidebarSkeleton } from "@/components/sidebar-skeleton";
import { trpc } from "@/components/providers/trpc-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type UserRole = "admin" | "manager" | "technician" | "reception";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

const baseData = {
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
      url: "https://widata.app",
      icon: IconPhone,
    },
  ],
  workflows: [
    {
      title: "Workflows",
      icon: IconChecklist,
      allowedRoles: ["admin", "manager", "technician"] as UserRole[],
      items: [
        {
          title: "Công việc của tôi",
          url: "/my-tasks",
        },
        {
          title: "Mẫu công việc",
          url: "/workflows/templates",
        },
        {
          title: "Loại công việc",
          url: "/workflows/task-types",
        },
      ],
    },
  ],
  documents: [
    {
      name: "Sản phẩm dịch vụ",
      url: "/products",
      icon: IconDevices,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      name: "Kho linh kiện",
      url: "/parts",
      icon: IconComponents,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      name: "Quản lý kho",
      url: "/warehouses",
      icon: IconBuildingWarehouse,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      name: "Kho sản phẩm",
      url: "/dashboard/inventory/products",
      icon: IconPackage,
      allowedRoles: ["admin", "manager", "technician"] as UserRole[],
    },
    {
      name: "Mức tồn kho",
      url: "/dashboard/inventory/stock-levels",
      icon: IconPackage,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      name: "Quản lý RMA",
      url: "/dashboard/inventory/rma",
      icon: IconPackage,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      name: "Quản lý nhãn hàng",
      url: "/brands",
      icon: IconComponents,
      allowedRoles: [
        "admin",
        "manager",
        "technician",
        "reception",
      ] as UserRole[],
    },
    {
      name: "Quản lý nhân sự",
      url: "/team",
      icon: IconUsers,
      allowedRoles: ["admin"] as UserRole[],
    },
  ],
};

function getFilteredData(userRole: UserRole = "reception") {
  return {
    ...baseData,
    workflows: baseData.workflows.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    documents: baseData.documents.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
  };
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  // Fetch current user profile to get role
  const { data: profile, isLoading } = trpc.profile.getCurrentUser.useQuery();

  // Determine user role from profile
  const userRole = (profile?.role as UserRole) || "reception";

  const data = getFilteredData(userRole);
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
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
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            <NavMain items={data.navMain} />
            {data.workflows.length > 0 && <NavWorkflows items={data.workflows} />}
            <NavDocuments items={data.documents} />
            <NavSecondary items={data.navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
