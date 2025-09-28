"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { trpc } from "@/components/providers/trpc-provider";
import Link from "next/link";
import { User, Mail, Calendar, Shield, Edit } from "lucide-react";

export default function Page() {
  const {
    data: profile,
    isLoading,
    error,
  } = trpc.profile.getCurrentUser.useQuery();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (
    role: string,
  ): "destructive" | "default" | "secondary" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "technician":
        return "secondary";
      case "reception":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Account" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Account" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-red-600">
                      <p>Error loading profile: {error.message}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PageHeader title="Account" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-600">
                      <p>No profile data found.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Account" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="max-w-2xl space-y-6">
                {/* Profile Header */}
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={profile.avatar_url || undefined}
                          alt={profile.full_name}
                        />
                        <AvatarFallback className="text-lg">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl">
                          {profile.full_name}
                        </CardTitle>
                        <p className="text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href="/account/edit">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Link>
                    </Button>
                  </CardHeader>
                </Card>

                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                          {profile.full_name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                          {profile.email}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Roles
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {profile.roles.map((role: string) => (
                            <Badge key={role} variant={getRoleColor(role)}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Account Status</Label>
                        <div>
                          <Badge
                            variant={profile.is_active ? "default" : "outline"}
                          >
                            {profile.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Account Created</Label>
                        <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                          {formatDate(profile.created_at)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Last Updated</Label>
                        <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                          {formatDate(profile.updated_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
