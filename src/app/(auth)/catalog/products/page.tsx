import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";
import { ProductsPageClient } from "./products-page-client";

export default async function Page() {
  const supabase = await createClient();

  // Get current user's role for permission checks
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userRole: "admin" | "manager" | "technician" | "reception" = "reception";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role) {
      userRole = profile.role as
        | "admin"
        | "manager"
        | "technician"
        | "reception";
    }
  }

  return (
    <>
      <PageHeader title="Sản phẩm" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ProductsPageClient currentUserRole={userRole} />
          </div>
        </div>
      </div>
    </>
  );
}
