import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Validate environment variables and throw errors if missing
function validateSupabaseConfig(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!key) missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error("🔄 [MIDDLEWARE] Configuration Error:", errorMessage);
    throw new Error(errorMessage);
  }

  console.log("🔄 [MIDDLEWARE] Supabase config validated:", {
    url: url!.substring(0, 40) + '...',
    hasKey: !!key,
    isLocal: url!.includes('localhost') || url!.includes('127.0.0.1')
  });
}

export async function updateSession(request: NextRequest) {
  console.log(
    "🔄 [MIDDLEWARE] Processing request for path:",
    request.nextUrl.pathname,
  );
  console.log("🔄 [MIDDLEWARE] Request method:", request.method);
  console.log("🔄 [MIDDLEWARE] Request URL:", request.url);

  try {
    // Validate environment variables first - throw error if missing
    validateSupabaseConfig();
    console.log("🔄 [MIDDLEWARE] Environment variables:", {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || 'none',
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) || 'none'
    });

    let supabaseResponse = NextResponse.next({
      request,
    });

    console.log("🔄 [MIDDLEWARE] Creating Supabase client...");
    console.log("🔄 [MIDDLEWARE] Full Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("🔄 [MIDDLEWARE] Supabase key prefix:", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 30) + '...');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          console.log(
            "🔄 [MIDDLEWARE] Getting all cookies:",
            cookies.length,
            "cookies found",
          );
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log(
            "🔄 [MIDDLEWARE] Setting cookies:",
            cookiesToSet.length,
            "cookies to set",
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

    console.log("🔄 [MIDDLEWARE] Getting user from session...");
    let userResult;

    try {
      userResult = await supabase.auth.getUser();
      console.log("🔄 [MIDDLEWARE] Raw user result:", {
        hasData: !!userResult.data,
        hasUser: !!userResult.data?.user,
        hasError: !!userResult.error,
        errorDetails: userResult.error ? {
          message: userResult.error.message,
          status: userResult.error.status,
          name: userResult.error.name
        } : null
      });
    } catch (fetchError) {
      console.error("🔄 [MIDDLEWARE] Fetch error during getUser():", fetchError);
      console.log("🔄 [MIDDLEWARE] Continuing without user session due to fetch error");

      // Return a basic response when fetch fails - don't break the app
      console.log("🔄 [MIDDLEWARE] Middleware processing complete (with fetch error)");
      return NextResponse.next({ request });
    }

    const {
      data: { user },
      error,
    } = userResult;

    console.log("🔄 [MIDDLEWARE] User check result:", {
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

    console.log(
      "🔄 [MIDDLEWARE] Middleware processing complete for:",
      request.nextUrl.pathname,
    );
    return supabaseResponse;
  } catch (middlewareError) {
    console.error("🔄 [MIDDLEWARE] Error in middleware:", middlewareError);
    console.error("🔄 [MIDDLEWARE] Request details:", {
      path: request.nextUrl.pathname,
      method: request.method,
      url: request.url
    });

    // Check if this is a configuration error (missing env vars)
    if (middlewareError instanceof Error && middlewareError.message.includes('Missing required environment variables')) {
      console.error("🔄 [MIDDLEWARE] Configuration error - cannot proceed");
      // Return error response for configuration issues
      return NextResponse.json(
        {
          error: 'Middleware Configuration Error',
          message: middlewareError.message,
          path: request.nextUrl.pathname
        },
        { status: 500 }
      );
    }

    // For other errors (like fetch failures), log but continue
    console.log("🔄 [MIDDLEWARE] Non-critical error, continuing with basic response");
    return NextResponse.next({ request });
  }
}
