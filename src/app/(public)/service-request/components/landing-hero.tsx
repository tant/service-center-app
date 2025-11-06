"use client";

import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

const TRACK_FEATURE_READY = false;

export function LandingHero() {
  const router = useRouter();

  const handleCreate = () => {
    router.push("/service-request/create");
  };

  const handleTrack = () => {
    if (TRACK_FEATURE_READY) {
      router.push("/service-request/track");
    }
  };

  const trackButton = (
    <Button
      variant="outline"
      size="lg"
      className={clsx(
        "min-w-48 border-primary-foreground text-primary transition-colors",
        "hover:bg-primary-foreground/15 hover:text-primary-foreground",
      )}
      onClick={handleTrack}
      disabled={false}
    >
      Tra cứu tình trạng
    </Button>
  );

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-2xl">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/88 to-primary/72" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_78%,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center sm:gap-7 sm:py-20 lg:max-w-3xl lg:gap-8 lg:py-24">
        <Badge className="bg-primary-foreground/15 text-primary-foreground uppercase tracking-[0.35em]">
          Dịch vụ hậu mãi
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Trung tâm sửa chữa và chăm sóc thiết bị chính hãng
        </h1>
        <p className="text-base text-primary-foreground/90 sm:text-lg lg:text-xl">
          Gửi yêu cầu bảo hành, sửa chữa và theo dõi tiến trình xử lý trong
          cùng một nơi. Đội ngũ kỹ thuật được chứng nhận luôn sẵn sàng hỗ trợ
          bạn.
        </p>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <Button
            size="lg"
            className="min-w-48 shadow-lg shadow-black/20 hover:shadow-black/30"
            onClick={handleCreate}
          >
            Tạo yêu cầu dịch vụ
          </Button>
          {TRACK_FEATURE_READY ? (
            trackButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>{trackButton}</TooltipTrigger>
              <TooltipContent side="bottom">
                Tính năng đang phát triển, vui lòng quay lại sau.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </section>
  );
}
