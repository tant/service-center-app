"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/components/providers/trpc-provider";
import { User, Mail, Image, Save, X, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const {
    data: profile,
    isLoading,
    error,
  } = trpc.profile.getCurrentUser.useQuery();
  const updateProfileMutation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      router.push("/account");
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    avatar_url: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfileMutation.mutateAsync({
        full_name: formData.full_name,
        email: formData.email,
        avatar_url: formData.avatar_url || null,
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/account");
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

  const isFormValid = formData.full_name.trim() && formData.email.trim();
  const isFormChanged =
    profile &&
    (formData.full_name !== profile.full_name ||
      formData.email !== profile.email ||
      formData.avatar_url !== (profile.avatar_url || ""));

  if (isLoading) {
    return (
      <>
        <PageHeader title="Edit Account" />
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
        <PageHeader title="Edit Account" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-red-600">
                      <p>Error loading profile: {error.message}</p>
                      <Button onClick={handleCancel} className="mt-4">
                        Back to Account
                      </Button>
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
        <PageHeader title="Edit Account" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-600">
                      <p>No profile data found.</p>
                      <Button onClick={handleCancel} className="mt-4">
                        Back to Account
                      </Button>
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
      <PageHeader title="Edit Account" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="max-w-2xl space-y-6">
                {/* Profile Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={formData.avatar_url || undefined}
                          alt={formData.full_name || "Profile"}
                        />
                        <AvatarFallback className="text-lg">
                          {formData.full_name
                            ? getInitials(formData.full_name)
                            : "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {formData.full_name || "Full Name"}
                        </h3>
                        <p className="text-muted-foreground">
                          {formData.email || "email@example.com"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.roles.map((role: string) => (
                            <Badge
                              key={role}
                              variant={getRoleColor(role)}
                              className="text-xs"
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Edit Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="full_name"
                            className="flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            Full Name
                          </Label>
                          <Input
                            id="full_name"
                            type="text"
                            value={formData.full_name}
                            onChange={(e) =>
                              handleInputChange("full_name", e.target.value)
                            }
                            placeholder="Enter your full name"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            placeholder="Enter your email address"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="avatar_url"
                            className="flex items-center gap-2"
                          >
                            <Image className="h-4 w-4" />
                            Avatar URL (Optional)
                          </Label>
                          <Input
                            id="avatar_url"
                            type="url"
                            value={formData.avatar_url}
                            onChange={(e) =>
                              handleInputChange("avatar_url", e.target.value)
                            }
                            placeholder="https://example.com/your-avatar.jpg"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter a URL to an image to use as your profile
                            picture
                          </p>
                        </div>
                      </div>

                      {/* Read-only Role Information */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Account Roles (Read-only)
                        </Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                          {profile.roles.map((role: string) => (
                            <Badge key={role} variant={getRoleColor(role)}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Roles can only be changed by an administrator
                        </p>
                      </div>

                      {/* Form Actions */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={
                            !isFormValid || !isFormChanged || isSubmitting
                          }
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>

                      {!isFormChanged && isFormValid && (
                        <p className="text-sm text-muted-foreground">
                          No changes made to save.
                        </p>
                      )}
                    </form>
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
