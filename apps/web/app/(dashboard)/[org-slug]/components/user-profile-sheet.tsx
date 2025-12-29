"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Pencil, Calendar, Check, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@flack/ui/components/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { Textarea } from "@flack/ui/components/textarea";
import { Spinner } from "@flack/ui/components/spinner";
import { Separator } from "@flack/ui/components/separator";
import { Badge } from "@flack/ui/components/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@flack/ui/components/field";
import { toast } from "sonner";
import { PresenceIndicator } from "./presence-indicator";
import { usePresenceContext } from "./presence-provider";
import { updateProfile } from "@/app/actions/profile/update-profile";
import { uploadAvatar } from "@/app/actions/profile/upload-avatar";

const profileSchema = z.object({
  displayName: z
    .string()
    .max(50, "Display name must be 50 characters or less")
    .optional(),
  firstName: z
    .string()
    .max(50, "First name must be 50 characters or less")
    .optional(),
  lastName: z
    .string()
    .max(50, "Last name must be 50 characters or less")
    .optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  createdAt: string;
  role: string | null;
  memberSince: string | null;
  isDeactivated: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function UserProfileSheet({
  open,
  onOpenChange,
  userId,
}: UserProfileSheetProps) {
  const { getStatus } = usePresenceContext();
  const { data, isLoading, mutate } = useSWR<{
    user: UserProfile;
    isOwnProfile: boolean;
  }>(open ? `/api/users/${userId}` : null, fetcher);

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      firstName: "",
      lastName: "",
      bio: "",
    },
  });

  const { isSubmitting } = form.formState;

  // Reset form when user data changes
  useEffect(() => {
    if (data?.user) {
      form.reset({
        displayName: data.user.displayName ?? "",
        firstName: data.user.firstName ?? "",
        lastName: data.user.lastName ?? "",
        bio: data.user.bio ?? "",
      });
    }
  }, [data?.user, form]);

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  const user = data?.user;
  const isOwnProfile = data?.isOwnProfile ?? false;
  const presenceStatus = getStatus(userId);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    if (user) {
      form.reset({
        displayName: user.displayName ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        bio: user.bio ?? "",
      });
    }
    setIsEditing(false);
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    try {
      const result = await updateProfile({
        displayName: formData.displayName || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        bio: formData.bio || null,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Profile updated");
      mutate(); // Refresh profile data
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsUploading(true);
    try {
      const result = await uploadAvatar({ file });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Avatar updated");
      mutate(); // Refresh profile data
    } catch (error) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const displayedName = user?.displayName || user?.name || "User";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="md" className="overflow-y-auto p-6">
        <SheetHeader className="sr-only">
          <SheetTitle>User Profile</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Avatar section */}
            <div className="flex flex-col items-center pt-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={!isOwnProfile || isUploading}
                  className="group relative"
                >
                  <Avatar size="2xl" className="ring-4 ring-background">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback size="2xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {isUploading ? (
                        <Spinner size="lg" className="text-white" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                  )}
                </button>

                {/* Presence indicator */}
                <span className="absolute bottom-1 right-1">
                  <PresenceIndicator status={presenceStatus} size="lg" />
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Name and presence */}
              <div className="mt-4 text-center">
                <h2 className="text-xl font-semibold">{displayedName}</h2>
                {user.displayName && user.displayName !== user.name && (
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                )}
                <div className="mt-1 flex items-center justify-center gap-2">
                  {user.isDeactivated ? (
                    <Badge
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground"
                    >
                      Deactivated
                    </Badge>
                  ) : (
                    <>
                      <span className="text-sm capitalize text-muted-foreground">
                        {presenceStatus}
                      </span>
                      {user.role && (
                        <Badge variant="secondary" size="sm">
                          {user.role}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Edit mode toggle for own profile */}
            {isOwnProfile && !isEditing && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            )}

            {/* Profile fields */}
            {isEditing ? (
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="displayName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Display Name
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="How you want to appear"
                          maxLength={50}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : (
                          <FieldDescription>
                            This will be shown instead of your full name
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="firstName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            First Name
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            placeholder="First name"
                            maxLength={50}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="lastName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>
                            Last Name
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            placeholder="Last name"
                            maxLength={50}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    name="bio"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>About</FieldLabel>
                        <Textarea
                          {...field}
                          id={field.name}
                          placeholder="Tell others a bit about yourself"
                          maxLength={500}
                          rows={4}
                          resize="none"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : (
                          <FieldDescription className="text-right">
                            {field.value?.length ?? 0}/500
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            ) : (
              <div className="space-y-4">
                {/* First/Last Name */}
                {(user.firstName || user.lastName) && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground">
                      Full Name
                    </h4>
                    <p className="text-sm">
                      {[user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" ") || user.name}
                    </p>
                  </div>
                )}

                {/* Bio */}
                {user.bio && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground">
                      About
                    </h4>
                    <p className="whitespace-pre-wrap text-sm">{user.bio}</p>
                  </div>
                )}

                {/* Email (only for own profile) */}
                {isOwnProfile && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium uppercase text-muted-foreground">
                      Email
                    </h4>
                    <p className="text-sm">{user.email}</p>
                  </div>
                )}

                <Separator />

                {/* Member since */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {user.isDeactivated ? (
                    <span>No longer a member</span>
                  ) : user.memberSince ? (
                    <span>Member since {formatDate(user.memberSince)}</span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-24">
            <p className="text-muted-foreground">User not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
