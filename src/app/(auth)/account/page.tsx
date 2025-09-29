"use client";

import { Loader2, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { trpc } from "@/components/providers/trpc-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uploadAvatar } from "@/lib/supabase/storage";

export default function Page() {
  const {
    data: profile,
    isLoading,
    error,
  } = trpc.profile.getCurrentUser.useQuery();

  const utils = trpc.useUtils();
  const updateProfileMutation = trpc.profile.updateProfile.useMutation();

  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSave = async () => {
    if (!profile || fullName.trim() === profile.full_name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        full_name: fullName.trim(),
        email: profile.email,
        avatar_url: profile.avatar_url,
      });

      toast.success("Name updated successfully!");
      setIsEditingName(false);
      // Invalidate cache to update both account page and nav-user
      utils.profile.getCurrentUser.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update name",
      );
      setFullName(profile.full_name || "");
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setFullName(profile?.full_name || "");
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      handleNameCancel();
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // 1. Immediate preview (keep your UX pattern)
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 2. Store actual file for optimized upload
    setSelectedFile(file);

    // 3. Start upload process
    setIsUploading(true);
    try {
      const result = await uploadAvatar(file, profile.user_id);

      // Update profile with storage URL
      await updateProfileMutation.mutateAsync({
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: result.url,
      });

      toast.success("Avatar updated successfully!");
      // Invalidate cache to update both account page and nav-user
      utils.profile.getCurrentUser.invalidate();
      setSelectedFile(null);
      setAvatarPreview("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar",
      );
      setAvatarPreview("");
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
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
                <Card className="w-full">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="animate-pulse space-y-4 text-center">
                        <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto"></div>
                        <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
                      </div>
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
                <Card className="w-full">
                  <CardContent className="p-8">
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
                <Card className="w-full">
                  <CardContent className="p-8">
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

  const displayAvatar = avatarPreview || profile.avatar_url;

  return (
    <>
      <PageHeader title="Account" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Card className="w-full">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
                    {/* Avatar Section */}
                    <div className="relative">
                      <button
                        type="button"
                        className="cursor-pointer group relative outline-none bg-transparent border-0 p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        aria-label="Change avatar"
                      >
                        <Avatar className="w-24 h-24">
                          <AvatarImage
                            src={displayAvatar || undefined}
                            alt={profile.full_name || "User"}
                            className="object-cover w-full h-full"
                          />
                          <AvatarFallback className="text-2xl">
                            {getInitials(profile.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Pencil icon overlay */}
                        <span className="absolute top-0 right-0 bg-white rounded-full p-1 shadow transform translate-x-1/3 -translate-y-1/3">
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                          ) : (
                            <Pencil className="w-4 h-4 text-gray-600" />
                          )}
                        </span>

                        {/* Hover overlay */}
                        {!isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <span className="text-white text-xs">
                              Change Photo
                            </span>
                          </div>
                        )}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>

                    {/* Name Section */}
                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <Input
                          ref={nameInputRef}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onBlur={handleNameSave}
                          onKeyDown={handleNameKeyDown}
                          className="text-center text-xl font-semibold w-auto min-w-[200px]"
                          placeholder="Enter your name"
                          disabled={updateProfileMutation.isPending}
                        />
                      ) : (
                        <>
                          <h1 className="text-xl font-semibold">
                            {profile.full_name || "Name not set"}
                          </h1>
                          <button
                            type="button"
                            onClick={() => setIsEditingName(true)}
                            className="p-1 hover:bg-muted rounded-full transition-colors"
                            aria-label="Edit name"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Email */}
                    <p className="text-muted-foreground">{profile.email}</p>

                    {/* Roles */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {profile.roles.map((role: string) => (
                        <Badge key={role} variant={getRoleColor(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      ))}
                    </div>
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
