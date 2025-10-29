/**
 * Story 1.12: Service Request Tracking Page
 * AC 2: Public tracking page at /service-request/track
 * AC 3, 9, 11: Token input with URL parameter support and auto-refresh
 */

"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequestStatusTimeline } from "@/components/shared/request-status-timeline";
import { StatusMessage } from "@/components/shared/status-message";
import { useTrackServiceRequest } from "@/hooks/use-service-request";
import { IconSearch, IconAlertCircle, IconPackage, IconCalendar, IconTruck } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlToken = searchParams.get("token");

  const [token, setToken] = useState(urlToken || "");
  const [shouldFetch, setShouldFetch] = useState(!!urlToken);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // AC 9: Fetch tracking data with auto-refresh every 30 seconds
  const { data: trackingData, isLoading, refetch } = useTrackServiceRequest(
    { tracking_token: token },
    {
      enabled: shouldFetch && token.length > 0,
      refetchInterval: 30000, // 30 seconds
      refetchIntervalInBackground: false, // Only refetch when page is active
    }
  );

  // AC 11: Auto-populate from URL on page load
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      setShouldFetch(true);
    }
  }, [urlToken]);

  // Update last updated timestamp on data change
  useEffect(() => {
    if (trackingData) {
      setLastUpdated(new Date());
    }
  }, [trackingData]);

  // AC 3: Handle tracking button click
  const handleTrack = () => {
    if (token && token.length >= 5) {
      setShouldFetch(true);
      // AC 11: Update URL with token
      router.push(`/service-request/track?token=${token.toUpperCase()}`);
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Theo dõi yêu cầu dịch vụ</h1>
          <p className="text-muted-foreground">
            Nhập mã theo dõi để kiểm tra tình trạng yêu cầu
          </p>
        </div>

        {/* AC 3: Tracking token input */}
        <Card>
          <CardHeader>
            <CardTitle>Mã theo dõi</CardTitle>
            <CardDescription>
              Nhập mã theo dõi từ email xác nhận của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="token">Mã theo dõi</Label>
              <div className="flex gap-2">
                <Input
                  id="token"
                  placeholder="SR-ABC123XYZ789"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                />
                <Button onClick={handleTrack} disabled={!token || token.length < 5 || isLoading}>
                  <IconSearch className="mr-2 h-4 w-4" />
                  {isLoading ? "Đang tìm..." : "Theo dõi"}
                </Button>
              </div>
            </div>

            {/* AC 4, 5, 6, 7, 8: Display tracking results */}
            {shouldFetch && trackingData && (
              <div className="space-y-6 pt-4">
                {/* AC 10: Not found handling */}
                {!trackingData.found ? (
                  <Alert variant="destructive">
                    <IconAlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Không tìm thấy yêu cầu.</strong> Vui lòng kiểm tra lại mã theo dõi.
                      <ul className="list-disc list-inside mt-2 text-sm">
                        <li>Đảm bảo mã theo dõi chính xác (định dạng: SR-XXXXXXXXXXXX)</li>
                        <li>Kiểm tra email xác nhận của bạn</li>
                        <li>Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  "request" in trackingData && (
                    <>
                      {/* AC 5: Status Timeline */}
                      <RequestStatusTimeline timeline={trackingData.request.timeline} />

                      {/* AC 8: Status Message */}
                      <StatusMessage status={trackingData.request.status} />

                    {/* AC 4: Request Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Product Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <IconPackage className="h-4 w-4" />
                            Sản phẩm ({trackingData.request.items.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {trackingData.request.items.map((item, index) => (
                            <div key={item.id} className={index > 0 ? "pt-3 border-t" : ""}>
                              <div className="space-y-1">
                                <p className="font-medium">{item.product_model}</p>
                                <p className="text-muted-foreground text-xs">
                                  {item.product_brand}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-muted-foreground text-xs">Serial:</p>
                                  <p className="font-mono text-xs">{item.serial_number}</p>
                                </div>
                                {item.linked_ticket && (
                                  <div className="mt-2 px-2 py-1 bg-muted rounded text-xs">
                                    <p className="text-muted-foreground">Phiếu dịch vụ:</p>
                                    <p className="font-medium">{item.linked_ticket.ticket_number}</p>
                                    <p className="text-muted-foreground capitalize">
                                      {item.linked_ticket.status}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Request Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <IconCalendar className="h-4 w-4" />
                            Chi tiết yêu cầu
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Đã gửi:</p>
                            <p className="font-medium">
                              {formatDistanceToNow(new Date(trackingData.request.submitted_at), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Trạng thái:</p>
                            <p className="font-medium capitalize">{trackingData.request.status}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Issue Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Mô tả vấn đề</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="text-muted-foreground">{trackingData.request.issue_description}</p>
                      </CardContent>
                    </Card>

                    {/* AC 6: Customer Information (masked) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Thông tin của bạn</CardTitle>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tên</p>
                          <p className="font-medium">{trackingData.request.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium font-mono text-xs">{trackingData.request.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Số điện thoại</p>
                          <p className="font-medium font-mono">{trackingData.request.customer_phone}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AC 7: Linked Tickets */}
                    {trackingData.request.items.some((item) => item.linked_ticket) && (
                      <Alert>
                        <AlertDescription>
                          {trackingData.request.items.filter((item) => item.linked_ticket).length === 1
                            ? `Yêu cầu của bạn đang được xử lý như phiếu dịch vụ ${trackingData.request.items.find((item) => item.linked_ticket)?.linked_ticket?.ticket_number}`
                            : `${trackingData.request.items.filter((item) => item.linked_ticket).length} phiếu dịch vụ đã được tạo cho các sản phẩm của bạn`}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Delivery Method */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <IconTruck className="h-4 w-4" />
                          Phương thức nhận hàng
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="capitalize">
                          {trackingData.request.delivery_method === "pickup"
                            ? "Đến lấy tại trung tâm"
                            : "Giao hàng tận nơi"}
                        </p>
                        {trackingData.request.delivery_address && (
                          <p className="text-muted-foreground mt-2">
                            Địa chỉ: {trackingData.request.delivery_address}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* AC 9: Last updated timestamp */}
                    <p className="text-xs text-muted-foreground text-center">
                      Cập nhật lần cuối:{" "}
                      {formatDistanceToNow(lastUpdated, {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </p>
                  </>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TrackServiceRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8 flex items-center justify-center">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
