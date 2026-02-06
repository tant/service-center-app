// Issue #9: Parts feature is disabled for MVP
// Redirect to products page if someone tries to access this route directly

import { redirect } from "next/navigation";

export default async function Page() {
  // Redirect to products catalog instead
  redirect("/catalog/products");
}

// Original implementation (commented out for MVP):
// import type { z } from "zod";
// import { PageHeader } from "@/components/page-header";
// import { PartsTable, type partSchema } from "@/components/parts-table";
// import { createClient } from "@/utils/supabase/server";
//
// async function getPartsData(): Promise<z.infer<typeof partSchema>[]> {
//   const supabase = await createClient();
//
//   const { data, error } = await supabase
//     .from("parts")
//     .select("*")
//     .order("created_at", { ascending: false });
//
//   if (error) {
//     console.error("Error fetching parts data:", error);
//     return [];
//   }
//
//   return data || [];
// }
//
// export default async function Page() {
//   const partsData = await getPartsData();
//
//   return (
//     <>
//       <PageHeader title="Linh kiện" />
//       <div className="flex flex-1 flex-col">
//         <div className="@container/main flex flex-1 flex-col gap-2">
//           <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
//             <PartsTable data={partsData} />
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
