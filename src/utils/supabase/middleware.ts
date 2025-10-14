import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Global counters for middleware tracking
let middlewareCallCount = 0;
let supabaseClientCreateCount = 0;
const pathTracker = new Map<string, number>();
const simultaneousRequests = new Set<string>();

// Validate environment variables and throw errors if missing
function validateSupabaseConfig(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(", ")}`;
    console.error("🔄 [MIDDLEWARE] Configuration Error:", errorMessage);
    throw new Error(errorMessage);
  }

  console.log("🔄 [MIDDLEWARE] Supabase config validated:", {
    url: `${url?.substring(0, 40)}...`,
    hasKey: !!key,
    isLocal: url?.includes("localhost") || url?.includes("127.0.0.1"),
  });
}

export async function updateSession(request: NextRequest) {
  const startTime = performance.now();
  middlewareCallCount++;
  const requestId = `mw-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  // Track path frequency
  const path = request.nextUrl.pathname;
  const pathCount = pathTracker.get(path) || 0;
  pathTracker.set(path, pathCount + 1);
  simultaneousRequests.add(requestId);

  console.log(
    `🔄 [MIDDLEWARE-${requestId}] Starting middleware (call #${middlewareCallCount})`,
  );
  console.log(
    `🔄 [MIDDLEWARE-${requestId}] Processing request for path: ${path} (${pathCount + 1} times)`,
  );
  console.log(`🔄 [MIDDLEWARE-${requestId}] Request method: ${request.method}`);
  console.log(`🔄 [MIDDLEWARE-${requestId}] Request URL: ${request.url}`);
  console.log(
    `🔄 [MIDDLEWARE-${requestId}] Simultaneous requests: ${simultaneousRequests.size}`,
  );

  try {
    // Validate environment variables first - throw error if missing
    validateSupabaseConfig();
    console.log(`🔄 [MIDDLEWARE-${requestId}] Environment variables:`, {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      urlPrefix:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || "none",
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
      keyPrefix:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) ||
        "none",
    });

    let supabaseResponse = NextResponse.next({
      request,
    });

    supabaseClientCreateCount++;
    console.log(
      `🔄 [MIDDLEWARE-${requestId}] Creating Supabase client (create #${supabaseClientCreateCount})...`,
    );
    console.log(
      `🔄 [MIDDLEWARE-${requestId}] Full Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    );
    console.log(
      `🔄 [MIDDLEWARE-${requestId}] Supabase key prefix: ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 30)}...`,
    );

    let cookieGetCount = 0;
    let cookieSetCount = 0;

    const clientCreateStart = performance.now();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            cookieGetCount++;
            const cookies = request.cookies.getAll();
            console.log(
              `🍪 [MIDDLEWARE-${requestId}] Cookie getAll() call #${cookieGetCount} - ${cookies.length} cookies found`,
            );

            // Log cookie info without full content
            cookies.forEach((cookie) => {
              const value = cookie.value;
              let displayValue;
              if (value.length > 50) {
                displayValue = `${value.substring(0, 25)}...${value.substring(value.length - 25)}`;
              } else {
                displayValue = value;
              }
              console.log(
                `🍪 [MIDDLEWARE-${requestId}] Cookie: ${cookie.name} = ${displayValue}`,
              );
            });

            return cookies;
          },
          setAll(cookiesToSet) {
            cookieSetCount++;
            console.log(
              `🍪 [MIDDLEWARE-${requestId}] Cookie setAll() call #${cookieSetCount} - ${cookiesToSet.length} cookies to set`,
            );

            // Log cookies being set with truncated values
            cookiesToSet.forEach(({ name, value }) => {
              let displayValue;
              if (value && value.length > 50) {
                displayValue = `${value.substring(0, 25)}...${value.substring(value.length - 25)}`;
              } else {
                displayValue = value;
              }
              console.log(
                `🍪 [MIDDLEWARE-${requestId}] Setting cookie: ${name} = ${displayValue}`,
              );
              request.cookies.set(name, value);
            });

            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const clientCreateEnd = performance.now();
    console.log(
      `⏱️ [MIDDLEWARE-${requestId}] Supabase client creation took ${(clientCreateEnd - clientCreateStart).toFixed(2)}ms`,
    );

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    console.log(`🔄 [MIDDLEWARE-${requestId}] Getting user from session...`);
    let userResult: any;

    try {
      const getUserStart = performance.now();
      userResult = await supabase.auth.getUser();
      const getUserEnd = performance.now();
      console.log(
        `⏱️ [MIDDLEWARE-${requestId}] getUser() took ${(getUserEnd - getUserStart).toFixed(2)}ms`,
      );
      console.log(`🔄 [MIDDLEWARE-${requestId}] Raw user result:`, {
        hasData: !!userResult.data,
        hasUser: !!userResult.data?.user,
        hasError: !!userResult.error,
        errorDetails: userResult.error
          ? {
              message: userResult.error.message,
              status: userResult.error.status,
              name: userResult.error.name,
            }
          : null,
      });
    } catch (fetchError) {
      console.error(
        `🔄 [MIDDLEWARE-${requestId}] Fetch error during getUser():`,
        fetchError,
      );
      console.log(
        `🔄 [MIDDLEWARE-${requestId}] Continuing without user session due to fetch error`,
      );

      // Return a basic response when fetch fails - don't break the app
      console.log(
        `🔄 [MIDDLEWARE-${requestId}] Middleware processing complete (with fetch error)`,
      );
      return NextResponse.next({ request });
    }

    const {
      data: { user },
      error,
    } = userResult;

    console.log(`🔄 [MIDDLEWARE-${requestId}] User check result:`, {
      path: request.nextUrl.pathname,
      hasUser: !!user,
      userId: user?.id || "none",
      userEmail: user?.email || "none",
      hasError: !!error,
      error: error
        ? {
            message: error.message,
            status: error.status,
            name: error.name,
          }
        : null,
    });

    // If there's an auth error and cookies exist, clear invalid auth cookies
    // This provides better UX by cleaning up stale/invalid sessions automatically
    if (error && request.cookies.getAll().length > 0) {
      const authCookies = request.cookies.getAll().filter(cookie =>
        cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
      );

      if (authCookies.length > 0) {
        console.log(
          `🔄 [MIDDLEWARE-${requestId}] Detected invalid auth cookies, clearing ${authCookies.length} cookie(s)`,
        );

        // Create a new response with cleared cookies
        const clearResponse = NextResponse.next({ request });

        // Copy any cookies that Supabase set
        supabaseResponse.cookies.getAll().forEach(cookie => {
          clearResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        // Clear the invalid auth cookies
        authCookies.forEach(cookie => {
          clearResponse.cookies.delete(cookie.name);
          console.log(`🔄 [MIDDLEWARE-${requestId}] Cleared cookie: ${cookie.name}`);
        });

        supabaseResponse = clearResponse;
      }
    }

    // NOTE: DO NOT perform redirects from middleware here. The app uses a
    // dedicated `(auth)` layout (`src/app/(auth)/layout.tsx`) to enforce
    // authentication for pages that require it. Keeping redirects in the
    // layout instead of middleware avoids having to update the middleware
    // allow-list whenever you add/remove public pages or route groups.
    //
    // If you need middleware-only protection for specific path prefixes you
    // can still use `matcher` in `src/middleware.ts` or add targeted checks
    // here, but the current approach keeps middleware focused on session
    // syncing only.

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    const endTime = performance.now();
    simultaneousRequests.delete(requestId);

    console.log(
      `⏱️ [MIDDLEWARE-${requestId}] Total processing time: ${(endTime - startTime).toFixed(2)}ms`,
    );
    console.log(
      `📊 [MIDDLEWARE-${requestId}] Cookie operations - Get: ${cookieGetCount}, Set: ${cookieSetCount}`,
    );
    console.log(
      `🔄 [MIDDLEWARE-${requestId}] Middleware processing complete for: ${request.nextUrl.pathname}`,
    );
    console.log(
      `📈 [MIDDLEWARE-${requestId}] Global stats - MW calls: ${middlewareCallCount}, SB clients: ${supabaseClientCreateCount}`,
    );

    // Log duplication warnings
    if (middlewareCallCount > 10) {
      console.warn(
        `⚠️ [MIDDLEWARE-${requestId}] HIGH MIDDLEWARE USAGE: ${middlewareCallCount} calls!`,
      );
      console.warn(
        `⚠️ [MIDDLEWARE-${requestId}] Top paths:`,
        Array.from(pathTracker.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3),
      );
    }

    return supabaseResponse;
  } catch (middlewareError) {
    const errorTime = performance.now();
    simultaneousRequests.delete(requestId);

    console.error(
      `🔄 [MIDDLEWARE-${requestId}] Error in middleware:`,
      middlewareError,
    );
    console.error(`🔄 [MIDDLEWARE-${requestId}] Request details:`, {
      path: request.nextUrl.pathname,
      method: request.method,
      url: request.url,
      processingTime: `${(errorTime - startTime).toFixed(2)}ms`,
    });

    // Check if this is a configuration error (missing env vars)
    if (
      middlewareError instanceof Error &&
      middlewareError.message.includes("Missing required environment variables")
    ) {
      console.error(
        `🔄 [MIDDLEWARE-${requestId}] Configuration error - cannot proceed`,
      );
      // Return error response for configuration issues
      return NextResponse.json(
        {
          error: "Middleware Configuration Error",
          message: middlewareError.message,
          path: request.nextUrl.pathname,
          requestId,
        },
        { status: 500 },
      );
    }

    // For other errors (like fetch failures), log but continue
    console.log(
      `🔄 [MIDDLEWARE-${requestId}] Non-critical error, continuing with basic response`,
    );
    return NextResponse.next({ request });
  }
}
