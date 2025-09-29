import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Global counters for server client tracking
let serverClientCount = 0;
let cookieStoreCallCount = 0;
const callerTracker = new Map<string, number>();

export async function createClient() {
  serverClientCount++;
  const clientId = `server-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  // Track the caller location
  const stack = new Error().stack;
  const caller = stack?.split("\n")[2]?.trim() || "unknown";
  const callerCount = callerTracker.get(caller) || 0;
  callerTracker.set(caller, callerCount + 1);

  console.log(
    `🏗️ [SERVER-${clientId}] Creating server client (call #${serverClientCount})`,
  );
  console.log(
    `📍 [SERVER-${clientId}] Called from: ${caller} (${callerCount + 1} times)`,
  );

  const startTime = performance.now();
  const cookieStore = await cookies();
  const cookieStoreTime = performance.now();

  console.log(
    `⏱️ [SERVER-${clientId}] Cookie store creation took ${(cookieStoreTime - startTime).toFixed(2)}ms`,
  );

  // Track cookie operations
  let getAllCallCount = 0;
  let setAllCallCount = 0;

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          getAllCallCount++;
          cookieStoreCallCount++;
          const cookies = cookieStore.getAll();
          console.log(
            `🍪 [SERVER-${clientId}] getAll() call #${getAllCallCount} - returned ${cookies.length} cookies`,
          );
          console.log(
            `🍪 [SERVER-${clientId}] Cookie names:`,
            cookies.map((c) => c.name),
          );
          return cookies;
        },
        setAll(cookiesToSet) {
          setAllCallCount++;
          console.log(
            `🍪 [SERVER-${clientId}] setAll() call #${setAllCallCount} - setting ${cookiesToSet.length} cookies`,
          );
          console.log(
            `🍪 [SERVER-${clientId}] Cookie names to set:`,
            cookiesToSet.map((c) => c.name),
          );

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
            console.log(
              `✅ [SERVER-${clientId}] Successfully set ${cookiesToSet.length} cookies`,
            );
          } catch (error) {
            console.log(
              `⚠️ [SERVER-${clientId}] Cookie setting failed (Server Component context):`,
              error,
            );
          }
        },
      },
    },
  );

  const endTime = performance.now();
  console.log(
    `⏱️ [SERVER-${clientId}] Total client creation took ${(endTime - startTime).toFixed(2)}ms`,
  );
  console.log(
    `📊 [SERVER-${clientId}] Global cookie store calls: ${cookieStoreCallCount}`,
  );

  // Log duplication warning if too many calls
  if (serverClientCount > 5) {
    console.warn(
      `⚠️ [SERVER-${clientId}] HIGH CLIENT COUNT: ${serverClientCount} server clients created!`,
    );
    console.warn(
      `⚠️ [SERVER-${clientId}] Top callers:`,
      Array.from(callerTracker.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    );
  }

  return client;
}
