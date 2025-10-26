# 🗂️ Proposed Navigation Structure with RBAC Analysis

**Date:** October 26, 2025
**Status:** Proposal for Review

---

## 🎨 Current Sidebar Design & CSS Documentation

### Layout Architecture

#### Component Hierarchy
```
<SidebarProvider>                    → Root context provider
  <AppSidebar variant="inset">       → Main sidebar container
    <SidebarHeader>                  → Logo & branding
    <SidebarContent>                 → Scrollable navigation area
      <NavMain />                    → Primary navigation items
      <NavWorkflows />               → Collapsible workflow section
      <NavDocuments />               → Documents/data section
      <NavSecondary className="mt-auto" /> → Bottom links (Settings, Help)
    </SidebarContent>
    <SidebarFooter>                  → User profile dropdown
      <NavUser />
    </SidebarFooter>
  </AppSidebar>
  <SidebarInset>                     → Main content area
    {children}
  </SidebarInset>
</SidebarProvider>
```

#### CSS Variables & Dimensions
```css
/* From src/app/(auth)/layout.tsx */
--sidebar-width: calc(var(--spacing) * 72);  /* 18rem / 288px desktop */
--header-height: calc(var(--spacing) * 12);  /* 3rem / 48px */

/* From src/components/ui/sidebar.tsx */
SIDEBAR_WIDTH = "16rem"              /* Base width */
SIDEBAR_WIDTH_MOBILE = "18rem"       /* Mobile sheet width */
SIDEBAR_WIDTH_ICON = "3rem"          /* Collapsed icon-only width */

/* Behavior */
collapsible="offcanvas"              /* Slides off-screen on collapse */
variant="inset"                      /* Inset style with border */
```

#### Color Tokens (Light Mode)
```css
/* From src/app/globals.css */
--sidebar: oklch(0.985 0 0);                          /* Near white background */
--sidebar-foreground: oklch(0.141 0.005 285.823);    /* Dark text */
--sidebar-primary: oklch(0.637 0.237 25.331);        /* Orange accent */
--sidebar-primary-foreground: oklch(0.971 0.013 17.38); /* Light text on primary */
--sidebar-accent: oklch(0.967 0.001 286.375);        /* Subtle hover background */
--sidebar-accent-foreground: oklch(0.21 0.006 285.885); /* Hover text */
--sidebar-border: oklch(0.92 0.004 286.32);          /* Separator lines */
--sidebar-ring: oklch(0.637 0.237 25.331);           /* Focus ring */
```

---

### Component-Specific Styling

#### 1. SidebarHeader (Logo Area)
```tsx
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
```

**Styling:**
- Padding: `!p-1.5` (6px custom padding override)
- Icon size: `!size-5` (20px × 20px)
- Text: `text-base font-semibold` (16px, 600 weight)
- Component: `SidebarMenuButton` with `asChild` pattern

---

#### 2. NavMain (Primary Navigation)
```tsx
<SidebarGroup>
  <SidebarGroupContent className="flex flex-col gap-2">
    {/* Quick Action Button */}
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2">
        <SidebarMenuButton
          asChild
          tooltip="Tạo phiếu nhanh"
          className="bg-primary text-primary-foreground 
                     hover:bg-primary/90 hover:text-primary-foreground 
                     active:bg-primary/90 active:text-primary-foreground 
                     min-w-8 duration-200 ease-linear"
        >
          <a href="/tickets/add">
            <IconCirclePlusFilled />
            <span>Tạo phiếu</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>

    {/* Regular Navigation Items */}
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild tooltip={item.title}>
            <a href={item.url} className="flex items-center gap-2">
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
```

**Key Features:**
1. **Quick Action Button:**
   - Full primary color background
   - Distinct from other items
   - Transitions: `duration-200 ease-linear`
   - Icon: `IconCirclePlusFilled`

2. **Navigation Items:**
   - Gap between groups: `gap-2` (8px)
   - Layout: `flex items-center gap-2`
   - Title spans full width: `flex-1`
   - Badge auto-positioned: `ml-auto`

3. **Badge Display:**
   - Only shows if `badge !== undefined && badge !== 0`
   - Uses shadcn `Badge` component
   - Variant: `default` (primary color)

4. **Tooltips:**
   - Enabled on all menu buttons
   - Shows on hover for collapsed state

---

#### 3. NavWorkflows (Collapsible Section)
```tsx
<SidebarGroup className="group-data-[collapsible=icon]:hidden">
  <SidebarGroupLabel>Quy trình</SidebarGroupLabel>
  <SidebarMenu>
    {items.map((item) => (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={item.items.some((subItem) => 
          pathname.startsWith(subItem.url)
        )}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <IconChevronRight className="ml-auto transition-transform 
                                           duration-200 
                                           group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.url}
                  >
                    <a href={subItem.url}>
                      <span>{subItem.title}</span>
                    </a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    ))}
  </SidebarMenu>
</SidebarGroup>
```

**Key Features:**
1. **Auto-expand:**
   - `defaultOpen` based on current pathname
   - Checks if any sub-item matches current route

2. **Chevron Animation:**
   - Rotates 90° when open
   - Smooth transition: `duration-200`
   - Uses group states: `group-data-[state=open]/collapsible:rotate-90`

3. **Active State:**
   - Sub-items use `isActive={pathname === subItem.url}`
   - Automatically styled by SidebarMenuSubButton

4. **Collapse Behavior:**
   - Hidden when sidebar collapses: `group-data-[collapsible=icon]:hidden`

---

#### 4. NavDocuments (Data Section)
```tsx
<SidebarGroup className="group-data-[collapsible=icon]:hidden">
  <SidebarGroupLabel>Dữ liệu</SidebarGroupLabel>
  <SidebarMenu>
    {items.map((item) => (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton asChild>
          <a href={item.url}>
            <item.icon />
            <span>{item.name}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))}
  </SidebarMenu>
</SidebarGroup>
```

**Key Features:**
1. **Group Label:**
   - Uses `SidebarGroupLabel` component
   - Text: "Dữ liệu" (Data)

2. **Simple List:**
   - No collapsible behavior
   - Icon + text layout
   - No badges

3. **Collapse Behavior:**
   - Hidden when sidebar collapses

---

#### 5. NavSecondary (Bottom Links)
```tsx
<SidebarGroup className="mt-auto">
  <SidebarGroupContent>
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
```

**Key Features:**
1. **Positioning:**
   - `mt-auto` pushes to bottom of SidebarContent
   - Always at bottom before footer

2. **Items:**
   - Settings (placeholder)
   - Help (placeholder)
   - Support link

---

#### 6. NavUser (Footer Profile)
```tsx
<SidebarFooter>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent 
                       data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="rounded-lg">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {profile.full_name}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {profile.email}
              </span>
            </div>
            <IconDotsVertical className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          {/* Menu items */}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

**Key Features:**
1. **Avatar:**
   - Size: `h-8 w-8` (32px × 32px)
   - Rounded: `rounded-lg`
   - Fallback: 2-letter initials

2. **User Info:**
   - Layout: `grid flex-1 text-left`
   - Name: `text-sm font-medium truncate`
   - Email: `text-xs text-muted-foreground truncate`
   - Leading: `leading-tight` for compact spacing

3. **Dropdown:**
   - Large button: `size="lg"`
   - Active state: Custom accent colors
   - Adaptive position: Right on desktop, bottom on mobile
   - Offset: `sideOffset={4}`

4. **Menu Items:**
   - Account link
   - Logout button with `data-testid`

---

### Responsive Behavior

#### Desktop (md and above)
```tsx
<Sidebar
  collapsible="offcanvas"
  variant="inset"
  className="fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) 
             transition-[left,right,width] duration-200 ease-linear md:flex"
>
```
- Width: `--sidebar-width` (288px)
- Fixed position: `fixed inset-y-0`
- Z-index: `z-10`
- Hidden on mobile: `hidden md:flex`
- Transitions: `duration-200 ease-linear`

#### Mobile
```tsx
<Sheet open={openMobile}>
  <SheetContent
    side="left"
    className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0"
    style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
  >
```
- Width: `18rem` (288px → 288px same as desktop)
- Implemented as Sheet (modal overlay)
- Slides from left
- No padding: `p-0`
- Custom width via CSS variable

#### Collapse States
1. **Expanded (default):**
   - Width: `16rem` (256px) or custom `calc(var(--spacing) * 72)`
   - All text visible
   - Groups expanded

2. **Collapsed (icon-only):**
   - Width: `3rem` (48px)
   - Only icons visible
   - Groups with labels hidden: `group-data-[collapsible=icon]:hidden`
   - Tooltips show on hover

3. **Offcanvas (mobile):**
   - Slides off-screen: `left-[calc(var(--sidebar-width)*-1)]`
   - Overlay backdrop
   - Swipe to close

---

### Interaction States

#### Navigation Items
```tsx
// Default state (from sidebar.tsx)
"group/menu-button flex w-full items-center gap-2 overflow-hidden 
 rounded-md p-2 text-left text-sm outline-none 
 ring-sidebar-ring transition-[width,height,padding] 
 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground 
 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground"

// Active state
"data-[active=true]:bg-sidebar-accent 
 data-[active=true]:text-sidebar-accent-foreground 
 data-[active=true]:font-medium"
```

**States:**
1. **Default:** Transparent background
2. **Hover:** `bg-sidebar-accent` (subtle gray)
3. **Active:** `bg-sidebar-accent` + `font-medium` (bold text)
4. **Focus:** `ring-2 ring-sidebar-ring` (keyboard navigation)
5. **Disabled:** Muted colors, no interaction

#### Quick Action Button (Create Ticket)
```css
bg-primary                        /* Orange background */
text-primary-foreground           /* White text */
hover:bg-primary/90               /* Slightly darker on hover */
active:bg-primary/90              /* Same on active */
min-w-8                           /* Minimum 32px width */
duration-200 ease-linear          /* Smooth transition */
```

---

### Spacing & Typography

#### Gaps & Padding
```tsx
<SidebarGroupContent className="flex flex-col gap-2">  /* 8px between groups */
<SidebarMenuItem className="flex items-center gap-2">  /* 8px icon-text gap */
<SidebarMenuButton className="p-2">                   /* 8px padding */
<SidebarHeader className="!p-1.5">                    /* 6px custom padding */
```

#### Text Sizes
```css
/* Header logo */
text-base font-semibold           /* 16px, 600 weight */

/* Navigation items */
text-sm                           /* 14px */

/* User name */
text-sm font-medium               /* 14px, 500 weight */

/* User email */
text-xs text-muted-foreground     /* 12px, muted */

/* Group labels */
text-xs uppercase                 /* 12px, uppercase */
```

#### Icon Sizes
```css
/* Default icons */
size-4                            /* 16px × 16px */

/* Header logo */
!size-5                           /* 20px × 20px (override) */

/* User avatar */
h-8 w-8                           /* 32px × 32px */

/* Large button icons */
size-5                            /* 20px × 20px */
```

---

### Data Flow & State Management

#### Role-Based Filtering
```typescript
// src/components/app-sidebar.tsx
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

const data = getFilteredData(userRole);
```

**Process:**
1. Fetch user profile via tRPC
2. Extract role from profile
3. Filter navigation items by `allowedRoles`
4. Render only authorized items

#### Badge Counters
```typescript
// Dynamic badge addition
const navMainWithBadge = data.navMain.map((item) => {
  if (item.url === "/dashboard/service-requests") {
    return { ...item, badge: pendingCount };
  }
  if (item.url === "/dashboard/deliveries") {
    return { ...item, badge: deliveriesCount };
  }
  return item;
});
```

**Sources:**
- Service Requests: `usePendingCount()` hook
- Deliveries: `usePendingDeliveriesCount()` hook
- Real-time updates via tRPC subscriptions

#### Active State Detection
```typescript
const pathname = usePathname();

// In nav components
const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
  if (pathname === url) {
    e.preventDefault(); // Prevent navigation to same page
  }
};

// For active styling
isActive={pathname === subItem.url}
```

---

### Loading States

#### Sidebar Skeleton
```tsx
{isLoading ? (
  <SidebarSkeleton />
) : (
  <>{/* Normal content */}</>
)}
```

**SidebarSkeleton features:**
- Placeholder for logo
- 5 skeleton menu items
- Animated pulse effect
- Matches sidebar dimensions

#### User Profile Loading
```tsx
if (loading) {
  return (
    <SidebarMenuButton size="lg" disabled>
      <Avatar>
        <AvatarFallback>...</AvatarFallback>
      </Avatar>
      <div className="grid">
        <span>Loading...</span>
        <span className="text-muted-foreground">...</span>
      </div>
    </SidebarMenuButton>
  );
}
```

---

### Icon Library

**Source:** `@tabler/icons-react`

**Current Icons Used:**
```typescript
import {
  IconClipboardList,      // Tickets
  IconComponents,         // Parts
  IconDashboard,         // Dashboard
  IconDevices,           // Products
  IconHelp,              // Help
  IconInnerShadowTop,    // Logo
  IconPhone,             // Support
  IconSettings,          // Settings
  IconUser,              // Customers
  IconUsers,             // Team
  IconChecklist,         // Workflows
  IconBuildingWarehouse, // Warehouses
  IconPackage,           // Inventory
  IconInbox,             // Service Requests
  IconTruckDelivery,     // Deliveries
  IconCirclePlusFilled,  // Quick action
  IconChevronRight,      // Collapsible indicator
  IconDotsVertical,      // User menu
} from "@tabler/icons-react";
```

**Icon Guidelines:**
- Consistent style: Outline style from Tabler
- Size: 16px (size-4) for nav items
- Color: Inherits from parent text color
- Spacing: 8px gap from text

---

### Accessibility Features

#### Keyboard Navigation
```typescript
// Keyboard shortcut: Cmd/Ctrl + B
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

React.useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      toggleSidebar();
    }
  };
  // ...
});
```

#### ARIA & Test IDs
```tsx
<SidebarMenuButton
  asChild
  tooltip="Tạo phiếu nhanh"           // Accessible tooltip
  data-testid="user-menu-trigger"    // Test automation
>
```

#### Focus Management
```css
focus-visible:ring-2                 /* Keyboard focus indicator */
outline-none                         /* Remove default outline */
ring-sidebar-ring                    /* Custom ring color */
```

---

### Animation & Transitions

#### Sidebar Collapse
```css
transition-[width,height,padding]
duration-200
ease-linear
```

#### Chevron Rotation
```css
transition-transform
duration-200
group-data-[state=open]/collapsible:rotate-90
```

#### Hover Effects
```css
hover:bg-sidebar-accent
hover:text-sidebar-accent-foreground
duration-200
ease-linear
```

---

### Critical Implementation Notes

#### ⚠️ DO NOT CHANGE:
1. **Component hierarchy** - Order matters for styling
2. **CSS variable names** - Used across multiple files
3. **Spacing system** - `gap-2`, `p-2` maintains consistency
4. **Icon sizes** - Calibrated for visual balance
5. **Animation durations** - `duration-200` for smooth feel
6. **Collapse behavior** - `group-data-[collapsible=icon]:hidden` pattern
7. **Mobile Sheet** - Sheet component for mobile overlay

#### ✅ SAFE TO CHANGE:
1. **Navigation item content** - Text, URLs, icons
2. **Role-based filtering logic** - `allowedRoles` arrays
3. **Badge counters** - Add/remove badges as needed
4. **Group labels** - "Dữ liệu", "Quy trình" can be renamed
5. **Item order** - Reorder items within groups
6. **Add new groups** - Follow existing patterns

#### 🔧 WHEN REFACTORING:
1. Keep `SidebarGroup` → `SidebarMenu` → `SidebarMenuItem` hierarchy
2. Preserve `className` patterns for responsive behavior
3. Maintain `asChild` pattern for proper component composition
4. Keep tooltip props for collapsed state
5. Use `handleClick` pattern to prevent duplicate navigation
6. Preserve badge conditional rendering logic
7. Keep loading states and skeletons

---

## 📊 Current vs Proposed Structure

### Current Structure (Inconsistent)
```
/dashboard                          → Dashboard
/tickets                            → Tickets
/dashboard/service-requests         → Service Requests
/dashboard/deliveries               → Deliveries
/customers                          → Customers
/products                           → Products
/parts                              → Parts
/warehouses                         → Warehouses
/dashboard/inventory/products       → Physical Products
/dashboard/inventory/stock-levels   → Stock Levels
/dashboard/inventory/rma            → RMA
/brands                             → Brands
/team                               → Team
/my-tasks                           → My Tasks
/workflows/templates                → Templates
/workflows/task-types               → Task Types
```

### Proposed Structure (Option 2 - Grouped by Function)
```
📊 OVERVIEW
  /dashboard                        → Dashboard & Analytics

🎯 OPERATIONS (Daily Work)
  /operations/tickets               → Service Tickets
  /operations/service-requests      → Public Service Requests
  /operations/deliveries            → Delivery Management
  /operations/my-tasks              → My Tasks (Technician)

📦 INVENTORY (Stock & Warehouse)
  /inventory/products               → Physical Products Tracking
  /inventory/stock-levels           → Stock Levels & Alerts
  /inventory/rma                    → RMA Management
  /inventory/warehouses             → Warehouse Management

📚 CATALOG (Master Data)
  /catalog/products                 → Product Catalog/SKU
  /catalog/parts                    → Parts Catalog
  /catalog/brands                   → Brand Management

👥 MANAGEMENT (Admin Functions)
  /management/customers             → Customer Management
  /management/team                  → Team & Users

⚙️ WORKFLOWS (Templates)
  /workflows/templates              → Workflow Templates
  /workflows/task-types             → Task Type Definitions

🔧 SETTINGS (System Config)
  /settings/system                  → System Settings
  /settings/email                   → Email Configuration
  /settings/account                 → My Account
```

---

## 🎭 RBAC Analysis by Role

### 1️⃣ ADMIN - Full System Access

#### Sidebar Navigation
```
📊 OVERVIEW
  ✅ Dashboard

🎯 OPERATIONS
  ✅ Tickets
  ✅ Service Requests
  ✅ Deliveries
  ✅ My Tasks

📦 INVENTORY
  ✅ Physical Products
  ✅ Stock Levels
  ✅ RMA
  ✅ Warehouses

📚 CATALOG
  ✅ Products
  ✅ Parts
  ✅ Brands

👥 MANAGEMENT
  ✅ Customers
  ✅ Team                   [Can create ALL roles, change ANY role]

⚙️ WORKFLOWS
  ✅ Templates
  ✅ Task Types

🔧 SETTINGS
  ✅ System Settings        [Admin only]
  ✅ Email Configuration
  ✅ Audit Logs            [Admin only]
  ✅ My Account
```

**Total Pages Visible:** 18/18 (100%)

---

### 2️⃣ MANAGER - Oversight & Approval

#### Sidebar Navigation
```
📊 OVERVIEW
  ✅ Dashboard              [View all metrics, revenue, KPIs]

🎯 OPERATIONS
  ✅ Tickets                [View all, assign, change priority]
  ✅ Service Requests       [Convert to tickets]
  ✅ Deliveries             [Monitor delivery status]
  ✅ My Tasks               [View/manage tasks assigned to me]

📦 INVENTORY
  ✅ Physical Products      [View tracking, approve movements]
  ✅ Stock Levels           [Monitor stock, set alerts]
  ✅ RMA                    [Create RMA batches, approve returns]
  ✅ Warehouses             [Manage warehouse config]

📚 CATALOG
  ✅ Products               [Full CRUD on product catalog]
  ✅ Parts                  [Full CRUD on parts catalog]
  ✅ Brands                 [Manage brands]

👥 MANAGEMENT
  ✅ Customers              [Full CRUD except delete]
  ✅ Team                   [Can create Tech/Reception only]
                           [Can reset passwords for Tech/Reception]
                           [Can change roles: Tech ↔ Reception only]
                           [CANNOT create/edit Admin or Manager]

⚙️ WORKFLOWS
  ✅ Templates              [Create/modify workflows]
  ✅ Task Types             [Define task types]

🔧 SETTINGS
  ❌ System Settings        [Admin only]
  ✅ Email Configuration    [Configure templates]
  ❌ Audit Logs            [Admin only]
  ✅ My Account
```

**Total Pages Visible:** 16/18 (89%)
**Restrictions:**
- Cannot access System Settings
- Cannot access Audit Logs
- Team page: Limited to Tech/Reception management

---

### 3️⃣ TECHNICIAN - Task Execution

#### Sidebar Navigation
```
📊 OVERVIEW
  ❌ Dashboard              [No analytics access]

🎯 OPERATIONS
  ✅ Tickets                [View ONLY assigned tickets]
                           [Read-only ticket info]
                           [Can add comments to own tickets]
  ❌ Service Requests       [No access]
  ❌ Deliveries            [No access]
  ✅ My Tasks              ⭐ [PRIMARY PAGE - Default redirect]
                           [View/update own tasks]
                           [Upload photos, notes]
                           [Request parts]

📦 INVENTORY
  ✅ Physical Products      [Read-only: Serial verification]
  ✅ Stock Levels           [Read-only: Check availability]
  ❌ RMA                    [No access]
  ❌ Warehouses            [No access]

📚 CATALOG
  ✅ Products               [Read-only: Warranty check, specs]
  ✅ Parts                  [Read-only: Search parts info]
  ✅ Brands                 [Read-only: View brands]

👥 MANAGEMENT
  ❌ Customers              [View only for assigned tickets]
  ❌ Team                   [No access]

⚙️ WORKFLOWS
  ❌ Templates              [No access]
  ❌ Task Types             [No access]

🔧 SETTINGS
  ❌ System Settings
  ❌ Email Configuration
  ❌ Audit Logs
  ✅ My Account            [Can update own profile only]
```

**Total Pages Visible:** 7/18 (39%)
**Primary Focus:** My Tasks page
**UI Simplifications:**
- Hide pricing/cost fields
- Simplified navigation
- Task-focused dashboard
- Quick serial verification tool

---

### 4️⃣ RECEPTION - Customer Intake

#### Sidebar Navigation
```
📊 OVERVIEW
  ❌ Dashboard              [No analytics access]

🎯 OPERATIONS
  ✅ Tickets                [View all tickets]
                           [Create new tickets]
                           [Update customer info]
                           [CANNOT assign techs or change status]
  ✅ Service Requests       ⭐ [Convert public requests to tickets]
  ✅ Deliveries             ⭐ [Mark ready, confirm pickup/delivery]
  ❌ My Tasks               [Not applicable]

📦 INVENTORY
  ❌ Physical Products      [No access]
  ❌ Stock Levels           [No access]
  ❌ RMA                    [No access]
  ❌ Warehouses            [No access]

📚 CATALOG
  ✅ Products               [Read-only: Warranty check by serial]
  ❌ Parts                  [No access]
  ✅ Brands                 [Read-only: View brands]

👥 MANAGEMENT
  ✅ Customers              ⭐ [Full CRUD except delete]
                           [Primary focus: Customer search/create]
  ❌ Team                   [No access]

⚙️ WORKFLOWS
  ❌ Templates              [No access - but can SELECT during ticket creation]
  ❌ Task Types             [No access]

🔧 SETTINGS
  ❌ System Settings
  ❌ Email Configuration
  ❌ Audit Logs
  ✅ My Account
```

**Total Pages Visible:** 6/18 (33%)
**Primary Focus:** Customer intake, ticket creation, delivery confirmation
**UI Simplifications:**
- Large search bar for customers
- Recent tickets board
- Simplified ticket form
- No technical task details

---

## 📋 Navigation Groups in Sidebar

### Proposed Sidebar Structure

```typescript
// src/components/app-sidebar.tsx

const navigationGroups = [
  {
    id: 'overview',
    title: 'Tổng quan',
    allowedRoles: ['admin', 'manager', 'technician'],
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
      {
        title: 'Công việc của tôi',
        url: '/my-tasks',
        icon: IconChecklist,
        allowedRoles: ['admin', 'manager', 'technician']
      }
    ]
  },
  {
    id: 'operations',
    title: 'Vận hành',
    items: [
      {
        title: 'Phiếu dịch vụ',
        url: '/operations/tickets',
        icon: IconClipboardList,
        allowedRoles: ['admin', 'manager', 'technician', 'reception']
      },
      {
        title: 'Yêu cầu dịch vụ',
        url: '/operations/service-requests',
        icon: IconInbox,
        allowedRoles: ['admin', 'manager', 'reception'],
        badge: 'pendingServiceRequests' // Dynamic counter
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Kho hàng',
    items: [
      {
        title: 'Sản phẩm vật lý',
        url: '/inventory/products',
        icon: IconPackage,
        allowedRoles: ['admin', 'manager', 'technician'],
        readOnly: ['technician']
      },
      {
        title: 'Mức tồn kho',
        url: '/inventory/stock-levels',
        icon: IconChartBar,
        allowedRoles: ['admin', 'manager', 'technician'],
        readOnly: ['technician']
      },
      {
        title: 'Quản lý RMA',
        url: '/inventory/rma',
        icon: IconRefresh,
        allowedRoles: ['admin', 'manager']
      },
      {
        title: 'Quản lý kho',
        url: '/inventory/warehouses',
        icon: IconBuildingWarehouse,
        allowedRoles: ['admin', 'manager']
      }
    ]
  },
  {
    id: 'catalog',
    title: 'Danh mục',
    items: [
      {
        title: 'Sản phẩm',
        url: '/catalog/products',
        icon: IconDevices,
        allowedRoles: ['admin', 'manager', 'technician', 'reception'],
        readOnly: ['technician', 'reception']
      },
      {
        title: 'Linh kiện',
        url: '/catalog/parts',
        icon: IconComponents,
        allowedRoles: ['admin', 'manager', 'technician'],
        readOnly: ['technician']
      },
      {
        title: 'Nhãn hàng',
        url: '/catalog/brands',
        icon: IconTag,
        allowedRoles: ['admin', 'manager', 'technician', 'reception'],
        readOnly: ['technician', 'reception']
      }
    ]
  },
  {
    id: 'management',
    title: 'Quản lý',
    items: [
      {
        title: 'Khách hàng',
        url: '/management/customers',
        icon: IconUser,
        allowedRoles: ['admin', 'manager', 'reception']
      },
      {
        title: 'Nhân sự',
        url: '/management/team',
        icon: IconUsers,
        allowedRoles: ['admin', 'manager']
      }
    ]
  },
  {
    id: 'workflows',
    title: 'Quy trình',
    allowedRoles: ['admin', 'manager'],
    items: [
      {
        title: 'Mẫu công việc',
        url: '/workflows/templates',
        icon: IconTemplate
      },
      {
        title: 'Loại công việc',
        url: '/workflows/task-types',
        icon: IconListCheck
      }
    ]
  },
  {
    id: 'settings',
    title: 'Cài đặt',
    items: [
      {
        title: 'Hệ thống',
        url: '/settings/system',
        icon: IconSettings,
        allowedRoles: ['admin']
      },
      {
        title: 'Email',
        url: '/settings/email',
        icon: IconMail,
        allowedRoles: ['admin', 'manager']
      },
      {
        title: 'Tài khoản',
        url: '/settings/account',
        icon: IconUserCircle,
        allowedRoles: ['admin', 'manager', 'technician', 'reception']
      }
    ]
  }
];
```

---

## 🔄 Migration Plan

### Phase 1: Create New Structure (No Breaking Changes)
```bash
# Create new directory structure
mkdir -p src/app/(auth)/operations/{tickets,service-requests,deliveries,my-tasks}
mkdir -p src/app/(auth)/inventory/{products,stock-levels,rma,warehouses}
mkdir -p src/app/(auth)/catalog/{products,parts,brands}
mkdir -p src/app/(auth)/management/{customers,team}
mkdir -p src/app/(auth)/settings/{system,email,account}
```

### Phase 2: Move Files
```bash
# Operations
mv src/app/(auth)/tickets → src/app/(auth)/operations/tickets
mv src/app/(auth)/dashboard/service-requests → src/app/(auth)/operations/service-requests
mv src/app/(auth)/dashboard/deliveries → src/app/(auth)/operations/deliveries
mv src/app/(auth)/my-tasks → src/app/(auth)/operations/my-tasks

# Inventory
mv src/app/(auth)/dashboard/inventory/products → src/app/(auth)/inventory/products
mv src/app/(auth)/dashboard/inventory/stock-levels → src/app/(auth)/inventory/stock-levels
mv src/app/(auth)/dashboard/inventory/rma → src/app/(auth)/inventory/rma
mv src/app/(auth)/warehouses → src/app/(auth)/inventory/warehouses

# Catalog
mv src/app/(auth)/products → src/app/(auth)/catalog/products
mv src/app/(auth)/parts → src/app/(auth)/catalog/parts
mv src/app/(auth)/brands → src/app/(auth)/catalog/brands

# Management
mv src/app/(auth)/customers → src/app/(auth)/management/customers
mv src/app/(auth)/team → src/app/(auth)/management/team
```

### Phase 3: Update Sidebar Navigation
- Update `src/components/app-sidebar.tsx` with new structure
- Add proper role filtering per section
- Update URL paths

### Phase 4: Add Redirects (Backwards Compatibility)
```typescript
// src/middleware.ts
const redirects = {
  '/tickets': '/operations/tickets',
  '/customers': '/management/customers',
  '/products': '/catalog/products',
  '/parts': '/catalog/parts',
  '/warehouses': '/inventory/warehouses',
  // ... etc
};
```

### Phase 5: Update Internal Links
- Search codebase for hardcoded URLs
- Update Link components
- Update tRPC router paths if needed

---

## ✅ Benefits of Proposed Structure

### 1. **Clear Mental Model**
- Operations = Daily work
- Inventory = Stock management
- Catalog = Master data
- Management = Admin functions
- Workflows = Process templates
- Settings = Configuration

### 2. **Easier RBAC**
- Groups align with permissions
- Clear visual separation in sidebar
- Easy to understand access levels

### 3. **Scalability**
- Easy to add new pages to logical groups
- Clear hierarchy for future features
- Consistent naming patterns

### 4. **Better UX per Role**

**Manager sees:**
```
📊 Dashboard
🎯 Operations (4 items)
  - Phiếu dịch vụ
  - Yêu cầu dịch vụ
  - Giao hàng
  - Công việc của tôi ⭐
📦 Inventory (4 items)
📚 Catalog (3 items)
👥 Management (2 items)
⚙️ Workflows (2 items)
🔧 Settings (2 items)
```
  - Công việc của tôi ⭐
📦 Inventory (4 items)
📚 Catalog (3 items)
👥 Management (2 items)
⚙️ Workflows (2 items)
🔧 Settings (2 items)
```

**Technician sees:**
```
🎯 Operations
  - Công việc của tôi ⭐
  - Phiếu dịch vụ
📦 Inventory (read-only)
  - Sản phẩm vật lý
  - Mức tồn kho
📚 Catalog (read-only)
  - Sản phẩm
  - Linh kiện
  - Nhãn hàng
🔧 Settings
  - Tài khoản
```

**Reception sees:**
```
🎯 Operations
  - Phiếu dịch vụ
  - Yêu cầu dịch vụ
  - Giao hàng
📚 Catalog (read-only)
  - Sản phẩm (warranty check)
  - Nhãn hàng
👥 Quản lý
  - Khách hàng ⭐
🔧 Settings
  - Tài khoản
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Too Many Sidebar Groups
**Problem:** 6 groups might be overwhelming
**Solution:** Use collapsible sections, remember user preferences

### Issue 2: Breaking Changes for Existing Users
**Problem:** URLs change, bookmarks break
**Solution:** Keep redirects for 6+ months, show notification about new structure

### Issue 3: Confusion Between catalog/products vs inventory/products
**Problem:** Two "products" pages
**Solution:** Rename clearly:
- `/catalog/products` → "Danh mục sản phẩm" (Product Catalog/SKU)
- `/inventory/products` → "Sản phẩm vật lý" (Physical Products/Serial Tracking)

### Issue 4: Team Page Access for Manager
**Problem:** Manager can only manage Tech/Reception, not other Managers
**Solution:** 
- Show all users in table
- Disable edit buttons for Admin/Manager roles
- Add tooltip: "Chỉ Admin mới có thể chỉnh sửa Manager"

---

## 🎯 Recommendation

**PROCEED with Option 2** because:

1. ✅ **RBAC-friendly:** Groups align perfectly with permission levels
2. ✅ **Clear hierarchy:** Easy to understand what each section does
3. ✅ **Scalable:** Can add new features to logical groups
4. ✅ **Role-specific UX:** Each role sees relevant sections only
5. ✅ **Better organization:** No more `/dashboard/inventory/products` confusion

**Next Steps:**
1. Review this proposal
2. Confirm group names and icons
3. Start Phase 1: Create new structure without breaking existing
4. Test with all 4 roles
5. Deploy with redirects for backwards compatibility

---

**Questions for Review:**
1. Do the Vietnamese translations make sense?
2. Should we rename "Catalog" to something else? (Danh mục vs Kho?)
3. Any concerns about the Team page for Manager role?
4. Should Technician see simplified sidebar (fewer groups)?
