"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";

interface Profile {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      console.log('🔍 [NAV USER] Starting getProfile function');
      try {
        console.log('🔍 [NAV USER] Calling supabase.auth.getSession()');
        const sessionResult = await supabase.auth.getSession();
        console.log('🔍 [NAV USER] Session result:', {
          hasData: !!sessionResult.data,
          hasSession: !!sessionResult.data?.session,
          hasUser: !!sessionResult.data?.session?.user,
          userId: sessionResult.data?.session?.user?.id || 'none',
          error: sessionResult.error ? {
            message: sessionResult.error.message,
            status: sessionResult.error.status
          } : null
        });

        if (sessionResult.error) {
          console.error('🔍 [NAV USER] Session error:', sessionResult.error);
          return;
        }

        const { data: { session } } = sessionResult;

        if (session?.user) {
          console.log('🔍 [NAV USER] User found, fetching profile for user:', session.user.id);

          try {
            console.log('🔍 [NAV USER] Calling supabase.from(profiles).select()');
            const profileResult = await supabase
              .from('profiles')
              .select('full_name, email, avatar_url')
              .eq('user_id', session.user.id)
              .single();

            console.log('🔍 [NAV USER] Profile query result:', {
              hasData: !!profileResult.data,
              hasError: !!profileResult.error,
              data: profileResult.data,
              error: profileResult.error ? {
                message: profileResult.error.message,
                code: profileResult.error.code,
                details: profileResult.error.details
              } : null
            });

            if (profileResult.error) {
              console.error('🔍 [NAV USER] Profile fetch error:', profileResult.error);
            } else {
              console.log('🔍 [NAV USER] Profile data retrieved successfully:', profileResult.data);
              setProfile(profileResult.data);
            }
          } catch (profileError) {
            console.error('🔍 [NAV USER] Exception during profile fetch:', profileError);
          }
        } else {
          console.log('🔍 [NAV USER] No session or user found');
        }
      } catch (error) {
        console.error('🔍 [NAV USER] Exception in getProfile function:', error);
        console.error('🔍 [NAV USER] Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      } finally {
        console.log('🔍 [NAV USER] Setting loading to false');
        setLoading(false);
      }
    }

    getProfile();
  }, [supabase]);

  const handleLogout = async () => {
    console.log('🔍 [NAV USER] Starting logout process');
    try {
      console.log('🔍 [NAV USER] Calling supabase.auth.signOut()');
      const signOutResult = await supabase.auth.signOut();
      console.log('🔍 [NAV USER] Sign out result:', {
        hasError: !!signOutResult.error,
        error: signOutResult.error ? {
          message: signOutResult.error.message,
          status: signOutResult.error.status
        } : null
      });

      if (signOutResult.error) {
        console.error('🔍 [NAV USER] Sign out error:', signOutResult.error);
      } else {
        console.log('🔍 [NAV USER] Sign out successful, redirecting to /login');
        router.push('/login');
      }
    } catch (error) {
      console.error('🔍 [NAV USER] Exception during logout:', error);
      console.error('🔍 [NAV USER] Logout error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    }
  };

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
              <span className="text-muted-foreground truncate text-xs">...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!profile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No user found</span>
              <span className="text-muted-foreground truncate text-xs">Please log in</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
                <AvatarFallback className="rounded-lg">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile.full_name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {profile.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
                  <AvatarFallback className="rounded-lg">{getInitials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{profile.full_name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {profile.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
