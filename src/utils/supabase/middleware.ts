import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// TODO: Add a runtime env-var guard (hasEnvVars) to skip middleware when the
// required Supabase env vars aren't set in development. This prevents the
// middleware from throwing when `.env.local` is missing. Example:
//
// if (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
//     !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) {
//   return NextResponse.next({ request })
// }

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  return supabaseResponse
}