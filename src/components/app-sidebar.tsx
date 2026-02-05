"use client";

import {
  IconAdjustments,
  IconBuildingWarehouse,
  IconChecklist,
  IconClipboardList,
  IconComponents,
  IconDashboard,
  IconDevices,
  IconFileText,
  IconHelp,
  IconInbox,
  IconInnerShadowTop,
  IconPackage,
  IconPhone,
  IconReport,
  IconSettings,
  IconTruckDelivery,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import type * as React from "react";
import { NavOverview } from "@/components/nav-overview";
import { NavSecondary } from "@/components/nav-secondary";
import { NavSection } from "@/components/nav-section";
import { NavUser } from "@/components/nav-user";
import { NavWorkflows } from "@/components/nav-workflows";
import { trpc } from "@/components/providers/trpc-provider";
import { SidebarSkeleton } from "@/components/sidebar-skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePendingCount } from "@/hooks/use-service-request";

type UserRole = "admin" | "manager" | "technician" | "reception";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {}

const baseData = {
  // Overview section - Dashboard
  overview: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      title: "Quản lý công việc",
      url: "/my-tasks",
      icon: IconChecklist,
      allowedRoles: ["admin", "manager", "technician"] as UserRole[],
    },
  ],
  // Operations section - Daily work
  operations: [
    {
      title: "Phiếu dịch vụ",
      url: "/operations/tickets",
      icon: IconClipboardList,
      allowedRoles: [
        "admin",
        "manager",
        "technician",
        "reception",
      ] as UserRole[],
    },
    {
      title: "Yêu cầu dịch vụ",
      url: "/operations/service-requests",
      icon: IconInbox,
      allowedRoles: ["admin", "manager", "reception"] as UserRole[],
    },
    {
      title: "Giao hàng",
      url: "/operations/deliveries",
      icon: IconTruckDelivery,
      allowedRoles: ["admin", "manager", "reception"] as UserRole[],
    },
  ],
  // Inventory section - Stock & warehouse management
  inventory: [
    {
      title: "Tổng quan kho hàng",
      url: "/inventory/overview",
      icon: IconReport,
      allowedRoles: ["admin", "manager", "technician"] as UserRole[],
      readOnly: ["technician"] as UserRole[],
    },
    {
      title: "Phiếu xuất nhập kho",
      url: "/inventory/documents",
      icon: IconFileText,
      allowedRoles: ["admin", "manager", "technician"] as UserRole[],
    },
    {
      title: "Sản phẩm vật lý",
      url: "/inventory/products",
      icon: IconPackage,
      allowedRoles: ["admin", "manager", "technician"] as UserRole[],
      readOnly: ["technician"] as UserRole[],
    },
    {
      title: "Quản lý RMA",
      url: "/inventory/rma",
      icon: IconPackage,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
    {
      title: "Quản lý kho",
      url: "/inventory/warehouses",
      icon: IconBuildingWarehouse,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
  ],
  // Catalog section - Master data
  catalog: [
    {
      title: "Danh mục sản phẩm",
      url: "/catalog/products",
      icon: IconDevices,
      allowedRoles: [
        "admin",
        "manager",
        "technician",
        "reception",
      ] as UserRole[],
      readOnly: ["technician", "reception"] as UserRole[],
    },
    // Issue #9: Hidden - Parts feature is disabled for MVP
    // {
    //   title: "Danh mục linh kiện",
    //   url: "/catalog/parts",
    //   icon: IconComponents,
    //   allowedRoles: ["admin", "manager", "technician"] as UserRole[],
    //   readOnly: ["technician"] as UserRole[],
    // },
    {
      title: "Nhãn hàng",
      url: "/catalog/brands",
      icon: IconComponents,
      allowedRoles: [
        "admin",
        "manager",
        "technician",
        "reception",
      ] as UserRole[],
      readOnly: ["technician", "reception"] as UserRole[],
    },
  ],
  // Management section - Admin functions
  management: [
    {
      title: "Khách hàng",
      url: "/management/customers",
      icon: IconUser,
      allowedRoles: ["admin", "manager", "reception"] as UserRole[],
    },
    {
      title: "Nhân sự",
      url: "/management/team",
      icon: IconUsers,
      allowedRoles: ["admin", "manager"] as UserRole[],
    },
  ],
  // Issue #2: Workflows section hidden
  // workflows: [
  //   {
  //     title: "Workflows",
  //     icon: IconChecklist,
  //     allowedRoles: ["admin", "manager"] as UserRole[],
  //     items: [
  //       {
  //         title: "Quy trình",
  //         url: "/workflows",
  //       },
  //       {
  //         title: "Công việc",
  //         url: "/workflows/tasks",
  //       },
  //     ],
  //   },
  // ],
  workflows: [] as Array<{
    title: string;
    icon: any;
    allowedRoles: UserRole[];
    items?: Array<{ title: string; url: string }>;
  }>,
  // Settings section
  settings: [
    {
      title: "Tài khoản",
      url: "/settings/account",
      icon: IconSettings,
      allowedRoles: [
        "admin",
        "manager",
        "technician",
        "reception",
      ] as UserRole[],
    },
    {
      title: "Cài đặt ứng dụng",
      url: "/admin/app-settings",
      icon: IconAdjustments,
      allowedRoles: ["admin"] as UserRole[],
    },
  ],
  navSecondary: [
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
};

function getFilteredData(userRole: UserRole = "reception") {
  return {
    overview: baseData.overview.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    operations: baseData.operations.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    inventory: baseData.inventory.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    catalog: baseData.catalog.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    management: baseData.management.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    workflows: baseData.workflows.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    settings: baseData.settings.filter((item) =>
      item.allowedRoles.includes(userRole),
    ),
    navSecondary: baseData.navSecondary,
  };
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  // Fetch current user profile to get role
  const { data: profile, isLoading } = trpc.profile.getCurrentUser.useQuery();

  // Fetch pending service requests count for badge
  const { count: pendingCount } = usePendingCount();

  // Determine user role from profile
  const userRole = (profile?.role as UserRole) || "reception";

  const data = getFilteredData(userRole);

  // Add badge counters to navigation items
  const operationsWithBadge = data.operations.map((item) => {
    if (item.url === "/operations/service-requests") {
      return {
        ...item,
        badge: pendingCount,
      };
    }
    return item;
  });

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  SSTC Service Center
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {/* Overview - Dashboard */}
            {data.overview.length > 0 && <NavOverview items={data.overview} />}

            {/* Operations */}
            {data.operations.length > 0 && (
              <NavSection
                title="Vận hành"
                items={operationsWithBadge.map((item) => ({
                  name: item.title,
                  url: item.url,
                  icon: item.icon,
                  badge: "badge" in item ? item.badge : undefined,
                }))}
              />
            )}

            {/* Inventory */}
            {data.inventory.length > 0 && (
              <NavSection
                title="Kho hàng"
                items={data.inventory.map((item) => ({
                  name: item.title,
                  url: item.url,
                  icon: item.icon,
                }))}
              />
            )}

            {/* Catalog */}
            {data.catalog.length > 0 && (
              <NavSection
                title="Danh mục"
                items={data.catalog.map((item) => ({
                  name: item.title,
                  url: item.url,
                  icon: item.icon,
                }))}
              />
            )}

            {/* Management */}
            {data.management.length > 0 && (
              <NavSection
                title="Quản lý"
                items={data.management.map((item) => ({
                  name: item.title,
                  url: item.url,
                  icon: item.icon,
                }))}
              />
            )}

            {/* Issue #2: Workflows section hidden */}
            {/* {data.workflows.length > 0 && <NavWorkflows items={data.workflows} />} */}

            {/* Settings */}
            {data.settings.length > 0 && (
              <NavSection
                title="Cài đặt"
                items={data.settings.map((item) => ({
                  name: item.title,
                  url: item.url,
                  icon: item.icon,
                }))}
              />
            )}

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
