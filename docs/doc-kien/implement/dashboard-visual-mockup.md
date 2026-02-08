# Dashboard Visual Mockup - Với Layout Hiện Tại

**Document Version**: 1.0
**Created**: 2026-02-07
**Based on**: Existing app design system
**Companion Document**: [Dashboard Implementation Plan](./dashboard-manager-plan.md) - For business requirements, backend APIs, and technical architecture

**Purpose**: Document này focus vào UI/UX implementation details, component specs, styling, và responsive design. Để hiểu business context và backend architecture, xem Plan document.

---

## 🎨 Design System Hiện Tại

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────┐
│  Sidebar (288px)    │  Main Content Area                            │
│  Collapsible        │                                               │
│                     │  ┌─────────────────────────────────────────┐  │
│  • Dashboard        │  │  PageHeader (h: 48px)                   │  │
│  • Công việc        │  │  - SidebarTrigger                      │  │
│  • Phiếu yêu cầu    │  │  - Title                               │  │
│  • Phiếu dịch vụ    │  │  - Clock (HH:MM:SS)                    │  │
│  • ...              │  │  - Pending count                        │  │
│                     │  └─────────────────────────────────────────┘  │
│                     │                                               │
│                     │  Main Content (px-4 lg:px-6, py-4/py-6)      │
│                     │  - Responsive grid                            │
│                     │  - Card components                            │
│                     │  - Charts                                     │
│                     │                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Color Palette (từ code hiện tại)
- **Positive/Success**: `bg-green-100 text-green-800`
- **Negative/Critical**: `bg-red-100 text-red-800`
- **Warning**: `bg-amber-100 text-amber-800` (new for dashboard)
- **Neutral**: `bg-gray-100 text-gray-800`
- **Card Background**: `bg-gradient-to-t from-primary/5 to-card`
- **Shadow**: `shadow-xs`

### Typography
- **Page Title**: `text-base font-medium`
- **Card Title**: `text-2xl font-semibold tabular-nums` → `text-3xl` @ 250px+
- **Card Description**: `text-sm text-muted-foreground`
- **Metric Value**: `text-2xl/3xl font-semibold tabular-nums`
- **Badge**: inline with icons

### Responsive Breakpoints
- **Mobile**: `grid-cols-1`
- **Tablet**: `@xl/main:grid-cols-2` (container query)
- **Desktop**: `@5xl/main:grid-cols-4`

---

## 📱 Dashboard Layout - Desktop (1440px+)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Sidebar │ 🔲 Dashboard          ⏰ 07/02/2026 14:30:45  🎫 18 phiếu đang xử lý   │
├─────────┼──────────────────────────────────────────────────────────────────────────┤
│         │                                                                          │
│ 🏠 Dash │   📊 ALERTS OVERVIEW (4 cards grid)                                    │
│ board   │   ┌──────────────┬──────────────┬──────────────┬──────────────┐        │
│         │   │🔴 Tickets    │⚠️  Tickets   │📦 Vật tư     │👥 Workload   │        │
│ ✓ Công  │   │  Quá hạn     │   Đọng lâu   │   Sắp hết    │   Không cân  │        │
│ việc    │   │              │              │              │   bằng       │        │
│         │   │    3         │     5        │     2        │     1        │        │
│ 📥 Phiếu│   │  tickets     │  tickets     │  items       │  person      │        │
│ yêu cầu │   │              │              │              │              │        │
│         │   │ +2 hôm nay   │ Avg: 6.2d    │ iPhone 12    │ Tuấn: 8 tasks│        │
│ 📋 Phiếu│   └──────────────┴──────────────┴──────────────┴──────────────┘        │
│ dịch vụ │                                                                          │
│         │   📊 FLOW BOARD (Kanban style)                                          │
│ 🚚 Giao │   ┌──────────────────────────────────────────────────────────────┐     │
│ hàng    │   │ Tiếp nhận  │ Kiểm tra   │ Sửa chữa    │ Trả hàng           │     │
│         │   │   (3) 🟡   │   (5) 🟢   │   (8) 🔴   │   (2) 🟢           │     │
│ ──────  │   │            │            │            │                     │     │
│         │   │ #SV-001    │ #SV-004    │ #SV-007 7d │ #SV-015             │     │
│ 📊 Kho  │   │ 1d         │ 2d         │ #SV-008 5d │ #SV-016             │     │
│ hàng    │   │ #SV-002    │ #SV-005    │ #SV-009 4d │                     │     │
│         │   │ 0.5d       │ 3d         │ ...        │ [+6 more]           │     │
│ 📦 Phiếu│   │ #SV-003    │ ...        │            │                     │     │
│ XNK     │   │            │            │            │                     │     │
│         │   │ [Xem tất cả]│[Xem tất cả]│[Xem tất cả]│[Xem tất cả]        │     │
│ 📦 SP   │   └──────────────────────────────────────────────────────────────┘     │
│ vật lý  │                                                                          │
│         │   👥 TEAM STATUS                                                        │
│ ──────  │   ┌──────────────────────────────────────────────────────────────┐     │
│         │   │ 👤 Minh Nguyen    🟢  Kiểm tra hiệu năng (#SV-004)      3⏳  │     │
│ 👤 Khách│   │ 👤 Hùng Trần      🟢  Sửa chữa màn hình (#SV-007)       5⏳  │     │
│ hàng    │   │ 👤 Lan Võ         🟢  Sửa chữa pin (#SV-008)            4⏳  │     │
│         │   │ 👤 Tuấn Lê        🔴  8 tasks pending (Overloaded!)     8⏳  │     │
│ 👥 Nhân │   └──────────────────────────────────────────────────────────────┘     │
│ sự      │                                                                          │
│         │   📈 TODAY'S METRICS (3 cards)                                          │
│ ──────  │   ┌─────────────┬──────────────┬──────────────────────────────┐        │
│         │   │📥 Tiếp nhận │✅ Hoàn thành │⏱️  Cycle Time                │        │
│ ⚙️ Tài  │   │              │              │                              │        │
│ khoản   │   │     3        │      5       │    4.5 ngày                  │        │
│         │   │              │              │                              │        │
│ ⚙️ Cài  │   │ +1 hôm qua   │ +2 hôm qua   │ -0.3d vs tuần trước         │        │
│ đặt     │   └─────────────┴──────────────┴──────────────────────────────┘        │
│         │                                                                          │
│         │   📈 WEEK PERFORMANCE & TREND                                           │
│         │   ┌──────────────────────────────────────────────────────────────┐     │
│         │   │ Week Performance              │  7-Day Trend                 │     │
│         │   │ ────────────────────          │  ───────────────────         │     │
│         │   │ 📥 Received: 24               │         [Line Chart]         │     │
│         │   │ ✅ Completed: 20              │    6  ╱───╲                  │     │
│         │   │ 📊 Throughput: 4.0/day        │    4 ╱     ╲___              │     │
│         │   │ 📈 WIP: 18 tickets            │    2╱          ╲             │     │
│         │   │                               │    0─────────────────         │     │
│         │   │ Net: -4 (backlog growing)     │     M  T  W  T  F  S  S      │     │
│         │   └──────────────────────────────────────────────────────────────┘     │
│         │                                                                          │
└─────────┴──────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Dashboard Layout - Mobile (375px)

```
┌────────────────────────────────────────┐
│ ☰  Dashboard      🔔 3   ⏰ 14:30      │
├────────────────────────────────────────┤
│                                        │
│ 📊 ALERTS (Stacked)                   │
│ ┌────────────────────────────────────┐│
│ │🔴 3 Tickets quá hạn     [Xem >]   ││
│ └────────────────────────────────────┘│
│ ┌────────────────────────────────────┐│
│ │⚠️  5 Tickets đọng lâu   [Xem >]   ││
│ └────────────────────────────────────┘│
│ ┌────────────────────────────────────┐│
│ │📦 2 Vật tư sắp hết      [Xem >]   ││
│ └────────────────────────────────────┘│
│                                        │
│ 📊 FLOW SUMMARY                       │
│ ┌────────────────────────────────────┐│
│ │ Tiếp nhận        3 tickets    🟡  ││
│ │ Kiểm tra         5 tickets    🟢  ││
│ │ Sửa chữa         8 tickets    🔴  ││
│ │ Trả hàng         2 tickets    🟢  ││
│ │                                    ││
│ │ [Xem chi tiết Flow Board]          ││
│ └────────────────────────────────────┘│
│                                        │
│ 👥 TEAM (Collapsed)                   │
│ ┌────────────────────────────────────┐│
│ │ 🟢 3 active  ⚪ 1 available 🔴 1   ││
│ │ [Xem chi tiết team]                ││
│ └────────────────────────────────────┘│
│                                        │
│ 📈 TODAY (2 cols)                     │
│ ┌────────────┬───────────────────────┐│
│ │📥 Tiếp nhận│ ✅ Hoàn thành        ││
│ │    3       │     5                ││
│ └────────────┴───────────────────────┘│
│                                        │
│ [Xem thêm metrics...]                 │
│                                        │
└────────────────────────────────────────┘
```

---

## 🎨 Component Design Specs

### 1. Alert Card Component

**Design** (tương tự SectionCards hiện tại):
```tsx
<Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
  <CardHeader>
    <CardDescription className="flex items-center gap-2">
      {icon}
      {title}
    </CardDescription>
    <CardTitle className="text-3xl font-semibold tabular-nums">
      {count}
    </CardTitle>
    <CardAction>
      <Badge className="bg-red-100 text-red-800">
        {severity === 'critical' && '🔴 Critical'}
        {severity === 'warning' && '⚠️  Warning'}
      </Badge>
    </CardAction>
  </CardHeader>
  <CardFooter className="flex-col items-start gap-1.5 text-sm">
    <div className="font-medium">{subtitle}</div>
    <div className="text-muted-foreground">{details}</div>
  </CardFooter>
</Card>
```

**Example**:
```tsx
// Critical Alert
<AlertCard
  icon={<IconAlertCircle />}
  title="Tickets quá hạn"
  count={3}
  severity="critical"
  subtitle="+2 so với hôm qua"
  details="Cập nhật 2 phút trước"
  onClick={() => router.push('/operations/tickets?filter=overdue')}
/>

// Warning Alert
<AlertCard
  icon={<IconClock />}
  title="Tickets đọng lâu"
  count={5}
  severity="warning"
  subtitle="Trung bình 6.2 ngày"
  details="Lâu nhất: 9 ngày (SV-2026-001)"
/>
```

---

### 2. Flow Board Component

**Design**: Horizontal scrollable columns (mobile) / Grid (desktop)

```tsx
<div className="flow-board">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    {statuses.map(status => (
      <FlowColumn
        key={status}
        title={STATUS_LABELS[status]}
        count={flowData[status].count}
        tickets={flowData[status].tickets}
        severity={getSeverity(flowData[status].count)}
      />
    ))}
  </div>
</div>

// FlowColumn Component
<Card className="flow-column">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-base font-semibold">
        {title}
      </CardTitle>
      <Badge variant={severity}>
        {count}
      </Badge>
    </div>
  </CardHeader>
  <CardContent className="space-y-2">
    {tickets.slice(0, 3).map(ticket => (
      <TicketCard
        key={ticket.id}
        ticketNumber={ticket.ticket_number}
        daysInStatus={ticket.days_in_status}
        priority={ticket.priority_level}
      />
    ))}
    {tickets.length > 3 && (
      <Button variant="ghost" size="sm" className="w-full">
        +{tickets.length - 3} more
      </Button>
    )}
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm" className="w-full">
      Xem tất cả
    </Button>
  </CardFooter>
</Card>

// TicketCard (mini)
<div className="flex items-center justify-between rounded-lg border p-2 text-sm hover:bg-accent cursor-pointer">
  <span className="font-mono">{ticketNumber}</span>
  <div className="flex items-center gap-2">
    {daysInStatus > 7 && <IconAlertCircle className="h-4 w-4 text-red-500" />}
    <span className="text-muted-foreground">{daysInStatus}d</span>
  </div>
</div>
```

**Severity Badge Colors**:
- **< 5 tickets**: `variant="secondary"` (gray)
- **5-7 tickets**: `variant="default"` (primary)
- **> 7 tickets**: `variant="destructive"` (red)

---

### 3. Team Status Component

**Design**: List with avatar, current task, status badge

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Status</CardTitle>
    <CardDescription>Trạng thái làm việc hiện tại</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {teamMembers.map(member => (
        <TeamMemberRow key={member.id} member={member} />
      ))}
    </div>
  </CardContent>
</Card>

// TeamMemberRow
<div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent">
  <Avatar className="h-10 w-10">
    <AvatarImage src={member.avatar_url} />
    <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
  </Avatar>

  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="font-medium">{member.full_name}</span>
      <StatusBadge status={member.status} />
    </div>
    {member.current_task && (
      <p className="text-sm text-muted-foreground truncate">
        {member.current_task.task_name} ({member.current_task.ticket_number})
      </p>
    )}
  </div>

  <div className="flex items-center gap-1 text-sm text-muted-foreground">
    <IconClock className="h-4 w-4" />
    <span>{member.pending_tasks}</span>
  </div>
</div>

// StatusBadge
<Badge variant={
  status === 'active' ? 'default' :
  status === 'overloaded' ? 'destructive' :
  'secondary'
}>
  {status === 'active' && '🟢 Active'}
  {status === 'available' && '⚪ Available'}
  {status === 'overloaded' && '🔴 Overloaded'}
</Badge>
```

---

### 4. Metrics Cards

**Design**: Same as existing SectionCards

```tsx
<div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
  <MetricCard
    title="Tiếp nhận hôm nay"
    value={3}
    change={+1}
    changeLabel="so với hôm qua"
    icon={<IconInbox />}
  />
  <MetricCard
    title="Hoàn thành hôm nay"
    value={5}
    change={+2}
    changeLabel="so với hôm qua"
    icon={<IconCheck />}
  />
  <MetricCard
    title="Cycle Time TB"
    value="4.5"
    unit="ngày"
    change={-0.3}
    changeLabel="so với tuần trước"
    icon={<IconClock />}
  />
</div>

// MetricCard (reuse SectionCards pattern)
<Card className="@container/card bg-gradient-to-t from-primary/5 to-card">
  <CardHeader>
    <CardDescription className="flex items-center gap-2">
      {icon}
      {title}
    </CardDescription>
    <CardTitle className="text-3xl font-semibold tabular-nums">
      {value}
      {unit && <span className="text-base text-muted-foreground ml-1">{unit}</span>}
    </CardTitle>
    <CardAction>
      <Badge className={cn(
        change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      )}>
        {change > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
        {change > 0 ? '+' : ''}{change}
      </Badge>
    </CardAction>
  </CardHeader>
  <CardFooter>
    <div className="text-sm text-muted-foreground">{changeLabel}</div>
  </CardFooter>
</Card>
```

---

### 5. Trend Chart Component

**Design**: Simple area chart (như ChartAreaInteractive hiện tại)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Xu hướng 7 ngày</CardTitle>
    <CardDescription>Tickets tiếp nhận vs hoàn thành</CardDescription>
  </CardHeader>
  <CardContent>
    <ChartContainer config={chartConfig} className="h-[300px]">
      <AreaChart data={trendData}>
        <defs>
          <linearGradient id="received" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="received"
          stroke="hsl(var(--chart-1))"
          fill="url(#received)"
          name="Tiếp nhận"
        />
        <Area
          type="monotone"
          dataKey="completed"
          stroke="hsl(var(--chart-2))"
          fill="url(#completed)"
          name="Hoàn thành"
        />
      </AreaChart>
    </ChartContainer>
  </CardContent>
</Card>
```

---

## 📋 Component Hierarchy

```
DashboardPage
├── PageHeader (existing)
│   └── title="Dashboard"
├── Main Container
│   ├── Alert Cards Grid
│   │   ├── OverdueTicketsCard
│   │   ├── AgingTicketsCard
│   │   ├── LowStockCard
│   │   └── WorkloadImbalanceCard
│   ├── Flow Board Section
│   │   └── FlowBoard
│   │       ├── FlowColumn (Tiếp nhận)
│   │       ├── FlowColumn (Kiểm tra)
│   │       ├── FlowColumn (Sửa chữa)
│   │       └── FlowColumn (Trả hàng)
│   ├── Team Status Section
│   │   └── TeamStatusCard
│   │       └── TeamMemberRow[] (4 members)
│   ├── Today's Metrics Grid
│   │   ├── NewTicketsCard
│   │   ├── CompletedTicketsCard
│   │   └── CycleTimeCard
│   └── Week Performance & Trend
│       ├── WeekStatsCard (left half)
│       └── TrendChartCard (right half)
```

---

## 🎬 Interactions & Animations

### Click Actions
- **Alert Cards** → Navigate to filtered list
  - Overdue → `/operations/tickets?filter=overdue`
  - Aging → `/operations/tickets?filter=aging`
  - Low Stock → `/inventory/overview?tab=alerts`

- **Flow Column** → Navigate to ticket list with status filter
  - `/operations/tickets?status=in_progress`

- **Team Member Row** → Navigate to team member profile/tasks
  - `/my-tasks?assignee={id}`

- **Ticket Mini Card** → Navigate to ticket detail
  - `/operations/tickets/{id}`

### Hover Effects (existing from shadcn)
- Cards: `hover:bg-accent`
- Buttons: `hover:bg-primary/90`
- List items: `hover:bg-accent`

### Loading States
```tsx
// Alert Cards
<Skeleton className="h-[140px] w-full rounded-xl" />

// Flow Board
<div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
  {[1,2,3,4].map(i => (
    <Skeleton key={i} className="h-[300px] rounded-xl" />
  ))}
</div>

// Team Status
<div className="space-y-3">
  {[1,2,3,4].map(i => (
    <Skeleton key={i} className="h-[60px] rounded-lg" />
  ))}
</div>
```

### Auto-refresh Indicators
- Small pulse animation on card when data refreshes
- Subtle badge with "Cập nhật X giây trước"

---

## 🔄 Data Refresh Strategy

### Refresh Intervals (tương tự existing code)
```tsx
// Alert Cards - 30 seconds
const { data: alerts } = trpc.dashboard.getCriticalAlerts.useQuery(undefined, {
  refetchInterval: 30000,
});

// Flow Board - 30 seconds
const { data: flowBoard } = trpc.dashboard.getFlowBoard.useQuery(undefined, {
  refetchInterval: 30000,
});

// Team Status - 15 seconds (more frequent)
const { data: teamStatus } = trpc.dashboard.getTeamStatus.useQuery(undefined, {
  refetchInterval: 15000,
});

// Metrics - 60 seconds
const { data: metrics } = trpc.dashboard.getTodayMetrics.useQuery(undefined, {
  refetchInterval: 60000,
});

// Trend Chart - 5 minutes
const { data: trend } = trpc.dashboard.getTrendData.useQuery(undefined, {
  refetchInterval: 300000,
});
```

---

## 📊 Responsive Behavior

### Desktop (1440px+)
```css
.alert-grid {
  grid-template-columns: repeat(4, 1fr);
}
.flow-board {
  grid-template-columns: repeat(4, 1fr);
}
.metrics-grid {
  grid-template-columns: repeat(3, 1fr);
}
.week-section {
  grid-template-columns: 1fr 1fr;
}
```

### Tablet (768px - 1439px)
```css
.alert-grid {
  grid-template-columns: repeat(2, 1fr);
}
.flow-board {
  grid-template-columns: repeat(2, 1fr);
}
.metrics-grid {
  grid-template-columns: repeat(2, 1fr);
}
.week-section {
  grid-template-columns: 1fr; /* Stack vertically */
}
```

### Mobile (< 768px)
```css
.alert-grid {
  grid-template-columns: 1fr;
}
.flow-board {
  display: block; /* Use ScrollArea horizontal */
}
.metrics-grid {
  grid-template-columns: repeat(2, 1fr); /* 2 cols for compact view */
}
.week-section {
  grid-template-columns: 1fr;
}
.team-status {
  /* Collapse to summary badge */
  display: none; /* Hidden, show summary only */
}
```

---

## 🎯 Key Differences from Plan Document

### What's the Same
✅ **Business goals** - vẫn giống
✅ **Core features** - Alert, Flow Board, Team Status, Metrics
✅ **Data requirements** - Backend APIs vẫn như cũ

### What's Different (Design Implementation)
🎨 **Visual Style**:
- **Plan**: Sidebar layout (20% left)
- **Reality**: Integrated vào main content (không sidebar riêng vì app đã có AppSidebar)

🎨 **Card Design**:
- **Plan**: Custom wireframe
- **Reality**: Sử dụng existing Card component với gradient background

🎨 **Color System**:
- **Plan**: Generic red/yellow/green
- **Reality**: Specific Tailwind classes (bg-red-100, text-red-800, etc.)

🎨 **Typography**:
- **Plan**: Generic
- **Reality**: Cụ thể (text-2xl/@3xl, font-semibold, tabular-nums)

🎨 **Grid System**:
- **Plan**: Fixed layout
- **Reality**: Container queries (@container/main) + responsive

---

## 🚀 Implementation Priority với Layout Hiện Tại

### Phase 1: Core Dashboard (MVP) - 1 week
1. ✅ Replace existing dashboard page content
2. ✅ Create 4 Alert Cards (reuse SectionCards pattern)
3. ✅ Create Flow Board component
4. ✅ Create Team Status list
5. ✅ Create Today's Metrics cards
6. ✅ Wire up with backend APIs (when ready)

### Phase 2: Polish - 1 week
1. ✅ Add Week Performance section
2. ✅ Add Trend Chart (reuse ChartAreaInteractive)
3. ✅ Add click-through navigation
4. ✅ Add loading skeletons
5. ✅ Mobile responsive refinements

### Phase 3: Advanced - 1 week
1. ✅ Auto-refresh with visual indicators
2. ✅ Accessibility improvements
3. ✅ Performance optimization
4. ✅ Error boundaries

---

## ✅ Checklist để bắt đầu

### Backend Prerequisites
- [ ] Dashboard router implemented (`src/server/routers/dashboard.ts`)
- [ ] 6 core APIs working:
  - [ ] getCriticalAlerts
  - [ ] getFlowBoard
  - [ ] getTeamStatus
  - [ ] getTodayMetrics
  - [ ] getWeekPerformance
  - [ ] getTrendData

### Frontend Tasks
- [ ] Update `/dashboard/page.tsx` with new layout
- [ ] Create components:
  - [ ] `AlertCard.tsx`
  - [ ] `FlowBoard.tsx` + `FlowColumn.tsx`
  - [ ] `TeamStatusCard.tsx` + `TeamMemberRow.tsx`
  - [ ] `MetricCard.tsx` (or reuse existing)
  - [ ] `TrendChart.tsx` (or reuse ChartAreaInteractive)
- [ ] Add click handlers for navigation
- [ ] Add loading states
- [ ] Mobile responsive testing

---

## 📸 Reference Screenshots (từ existing components)

Để visualize chính xác hơn, refer to:
- **SectionCards** ([section-cards.tsx:54](src/components/section-cards.tsx#L54)) - Card design pattern
- **EmployeePerformanceTable** - Table/list pattern
- **ChartAreaInteractive** - Chart style
- **PageHeader** ([page-header.tsx:60](src/components/page-header.tsx#L60)) - Header design

---

**END OF VISUAL MOCKUP DOCUMENT**

---

## 💬 Notes for Designer/Developer

Khi implement, **GIỮ NGUYÊN** design system hiện tại:
- ✅ Sử dụng existing Card component
- ✅ Follow existing color patterns (green-100/800, red-100/800)
- ✅ Use existing grid patterns (grid-cols-1 → @xl:grid-cols-2)
- ✅ Reuse Badge, Button, Avatar components
- ✅ Follow existing spacing (px-4 lg:px-6, gap-4/gap-6)

**KHÔNG TỰ Ý**:
- ❌ Thêm màu sắc mới không có trong hệ thống
- ❌ Thay đổi typography scale
- ❌ Tạo component mới khi đã có sẵn
- ❌ Break responsive patterns hiện tại

Dashboard này sẽ **nhất quán 100%** với phần còn lại của app! 🎨✨
