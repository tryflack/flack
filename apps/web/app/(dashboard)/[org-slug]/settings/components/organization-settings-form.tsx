"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@flack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@flack/ui/components/card";
import { Field, FieldError } from "@flack/ui/components/field";
import { Input } from "@flack/ui/components/input";
import { Spinner } from "@flack/ui/components/spinner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@flack/auth/auth-client";

const nameSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),
});

const websiteSchema = z.object({
  website: z
    .string()
    .min(1, "Website is required")
    .url("Please enter a valid URL"),
});

const slugSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only",
    ),
});

type NameFormValues = z.infer<typeof nameSchema>;
type WebsiteFormValues = z.infer<typeof websiteSchema>;
type SlugFormValues = z.infer<typeof slugSchema>;

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: string | null;
}

interface OrganizationSettingsFormProps {
  organization: Organization;
  isOwner: boolean;
}

function parseMetadata(metadata?: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

export function OrganizationSettingsForm({
  organization,
  isOwner,
}: OrganizationSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingField, setSavingField] = useState<string | null>(null);
  const existingMetadata = parseMetadata(organization.metadata);

  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  const websiteForm = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      website: (existingMetadata.website as string) ?? "",
    },
  });

  const slugForm = useForm<SlugFormValues>({
    resolver: zodResolver(slugSchema),
    defaultValues: {
      slug: organization.slug,
    },
  });

  const onNameSubmit = async (formData: NameFormValues) => {
    if (!isOwner) {
      toast.error("You don't have permission to update organization settings");
      return;
    }

    setSavingField("name");
    try {
      const result = await authClient.organization.update({
        organizationId: organization.id,
        data: {
          name: formData.name,
        },
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to update organization name",
        );
        return;
      }

      toast.success("Organization name updated successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingField(null);
    }
  };

  const onWebsiteSubmit = async (formData: WebsiteFormValues) => {
    if (!isOwner) {
      toast.error("You don't have permission to update organization settings");
      return;
    }

    setSavingField("website");
    try {
      const updatedMetadata: Record<string, unknown> = {
        ...existingMetadata,
      };
      if (formData.website) {
        updatedMetadata.website = formData.website;
      } else {
        delete updatedMetadata.website;
      }

      const result = await authClient.organization.update({
        organizationId: organization.id,
        data: {
          metadata:
            Object.keys(updatedMetadata).length > 0
              ? updatedMetadata
              : undefined,
        },
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to update website");
        return;
      }

      toast.success("Website updated successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingField(null);
    }
  };

  const onSlugSubmit = async (formData: SlugFormValues) => {
    if (!isOwner) {
      toast.error("You don't have permission to update organization settings");
      return;
    }

    setSavingField("slug");
    try {
      const result = await authClient.organization.update({
        organizationId: organization.id,
        data: {
          slug: formData.slug,
        },
      });

      if (result.error) {
        toast.error(
          result.error.message ?? "Failed to update organization slug",
        );
        return;
      }

      toast.success("Organization slug updated successfully!");

      if (formData.slug !== organization.slug) {
        startTransition(() => {
          router.push(`/${formData.slug}/settings`);
        });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingField(null);
    }
  };

  const isSaving = savingField !== null || isPending;

  const { isDirty: isNameDirty } = nameForm.formState;
  const { isDirty: isWebsiteDirty } = websiteForm.formState;
  const { isDirty: isSlugDirty } = slugForm.formState;

  return (
    <div className="space-y-8 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization Name</CardTitle>
          <CardDescription>
            The display name of your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="name"
            control={nameForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Acme Inc."
                  aria-invalid={fieldState.invalid}
                  disabled={!isOwner || isSaving}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={nameForm.handleSubmit(onNameSubmit)}
            disabled={isSaving || !isNameDirty}
          >
            {savingField === "name" ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Website</CardTitle>
          <CardDescription>
            Your organization&apos;s website URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="website"
            control={websiteForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  type="url"
                  placeholder="https://acme.com"
                  aria-invalid={fieldState.invalid}
                  disabled={!isOwner || isSaving}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={websiteForm.handleSubmit(onWebsiteSubmit)}
            disabled={isSaving || !isWebsiteDirty}
          >
            {savingField === "website" ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Slug</CardTitle>
          <CardDescription>
            Your organization&apos;s unique identifier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="slug"
            control={slugForm.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="acme-inc"
                  aria-invalid={fieldState.invalid}
                  disabled={!isOwner || isSaving}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={slugForm.handleSubmit(onSlugSubmit)}
            disabled={isSaving || !isSlugDirty}
          >
            {savingField === "slug" ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
