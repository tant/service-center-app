import { AddTicketForm } from "@/components/add-ticket-form";

export default function AddTicketPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Tạo Phiếu Dịch Vụ Mới</h1>
          <p className="text-muted-foreground">
            Tạo phiếu dịch vụ sửa chữa cho khách hàng
          </p>
        </div>
        <div className="mx-auto w-full max-w-6xl">
          <AddTicketForm />
        </div>
      </main>
    </div>
  );
}
