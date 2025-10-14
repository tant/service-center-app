import { GalleryVerticalEnd, ArrowRight, LayoutDashboard, Package, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-5" />
            </div>
            <span className="font-bold text-lg">SSTC Service Center</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                Vào ứng dụng <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 md:py-32 lg:py-40">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-2xl mb-2">
                <GalleryVerticalEnd className="size-10" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
                Hệ thống quản lý
                <br />
                <span className="text-primary">Trung tâm bảo hành</span>
              </h1>
              <p className="text-muted-foreground max-w-[700px] text-lg sm:text-xl leading-relaxed mx-auto">
                Giải pháp toàn diện cho việc quản lý phiếu bảo hành, theo dõi linh kiện,
                quản lý khách hàng và báo cáo doanh thu cho trung tâm dịch vụ của bạn.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row mt-4">
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 size-5" />
                    Truy cập Dashboard
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">
                    Đăng nhập vào hệ thống
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full border-t bg-muted/40 py-20 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                Tính năng chính
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl">
                Mọi thứ bạn cần để quản lý trung tâm dịch vụ hiệu quả
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Wrench className="text-primary size-12" />
                  </div>
                  <CardTitle className="text-xl">Quản lý phiếu bảo hành</CardTitle>
                  <CardDescription className="text-base">
                    Tạo, theo dõi và quản lý phiếu bảo hành từ tiếp nhận đến hoàn thành
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Package className="text-primary size-12" />
                  </div>
                  <CardTitle className="text-xl">Quản lý linh kiện</CardTitle>
                  <CardDescription className="text-base">
                    Theo dõi tồn kho, giá cả và sử dụng linh kiện trong quá trình sửa chữa
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Users className="text-primary size-12" />
                  </div>
                  <CardTitle className="text-xl">Quản lý khách hàng</CardTitle>
                  <CardDescription className="text-base">
                    Lưu trữ thông tin khách hàng, lịch sử bảo hành và sản phẩm của họ
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <LayoutDashboard className="text-primary size-12" />
                  </div>
                  <CardTitle className="text-xl">Báo cáo & Thống kê</CardTitle>
                  <CardDescription className="text-base">
                    Dashboard trực quan với các chỉ số quan trọng và báo cáo chi tiết
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center gap-6 py-16 px-6 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  Sẵn sàng bắt đầu?
                </h2>
                <p className="text-muted-foreground max-w-[600px] text-lg sm:text-xl leading-relaxed">
                  Đăng nhập vào hệ thống để bắt đầu quản lý trung tâm dịch vụ của bạn một cách chuyên nghiệp và hiệu quả.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row mt-2">
                  <Button size="lg" asChild>
                    <Link href="/login">
                      Đăng nhập ngay
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/dashboard">
                      Xem Demo
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="text-sm font-medium">SSTC Service Center</span>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            © 2025 SSTC Service Center. Hệ thống quản lý trung tâm bảo hành.
          </p>
        </div>
      </footer>
    </div>
  );
}
