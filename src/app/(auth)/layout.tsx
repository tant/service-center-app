import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AuthLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	console.log('🛡️ [AUTH LAYOUT] Starting authentication check')

	const supabase = await createClient();
	console.log('🛡️ [AUTH LAYOUT] Supabase client created')

	console.log('🛡️ [AUTH LAYOUT] Getting current session...')
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	console.log('🛡️ [AUTH LAYOUT] Session check result:', {
		hasSession: !!session,
		hasError: !!error,
		sessionId: session?.id || 'none',
		userEmail: session?.user?.email || 'none',
		error: error ? {
			message: error.message,
			status: error.status,
			name: error.name
		} : null
	})

	if (error) {
		console.error('🛡️ [AUTH LAYOUT] Supabase error occurred, redirecting to /login:', error)
		// If Supabase errors, treat as unauthenticated and send to login.
		// Consider logging this in a real app.
		redirect("/login");
	}

	if (!session) {
		console.log('🛡️ [AUTH LAYOUT] No session found, redirecting to /login')
		redirect("/login");
	}

	console.log('🛡️ [AUTH LAYOUT] Authentication successful, rendering protected content')
	return <>{children}</>;
}
