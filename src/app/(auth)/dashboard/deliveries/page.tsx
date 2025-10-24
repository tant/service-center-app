// Pending Deliveries Page
// Story 1.14: Customer Delivery Confirmation Workflow - List View

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DeliveryConfirmationModal } from '@/components/modals/delivery-confirmation-modal';
import { usePendingDeliveries } from '@/hooks/use-delivery';
import {
  IconPackage,
  IconLoader,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function PendingDeliveriesPage() {
  const { data, isLoading, refetch } = usePendingDeliveries();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleConfirmDelivery = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTicket(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chờ giao hàng</h1>
          <p className="text-muted-foreground">
            Danh sách phiếu dịch vụ đã hoàn thành, chờ giao cho khách hàng
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <IconRefresh className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconPackage className="h-5 w-5 text-primary" />
            <CardTitle>Tổng quan</CardTitle>
          </div>
          <CardDescription>
            Thống kê phiếu chờ giao hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-2xl font-bold">{data?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Phiếu chờ giao</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phiếu chờ xác nhận giao hàng</CardTitle>
          <CardDescription>
            Các phiếu dịch vụ đã hoàn thành nhưng chưa xác nhận giao hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Đang tải...</span>
            </div>
          ) : data?.tickets && data.tickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Hoàn thành</TableHead>
                  <TableHead>Người phụ trách</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tickets.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ticket.ticket_number}</span>
                        <Badge variant="secondary">
                          <IconCheck className="h-3 w-3 mr-1" />
                          Hoàn thành
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.customer?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.customer?.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {ticket.product?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.completed_at ? (
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(ticket.completed_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ticket.assigned?.full_name || (
                          <span className="text-muted-foreground">Chưa phân công</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmDelivery(ticket)}
                      >
                        <IconCheck className="h-4 w-4 mr-1" />
                        Xác nhận giao
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconAlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Không có phiếu chờ giao hàng
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Tất cả các phiếu dịch vụ đã hoàn thành đều đã được xác nhận giao hàng
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Confirmation Modal */}
      {selectedTicket && (
        <DeliveryConfirmationModal
          open={showModal}
          onOpenChange={handleModalClose}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
}
