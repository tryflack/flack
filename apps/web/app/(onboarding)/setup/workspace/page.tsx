"use client";

import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@flack/ui/components/input-group";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@flack/ui/components/field";
import { Spinner } from "@flack/ui/components/spinner";
import { toast } from "sonner";
import { authClient } from "@flack/auth/auth-client";
import { useOnboarding, useStepGuard } from "../context";
import { createDefaultChannels } from "@/app/actions/channels";

const workspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must be at least 2 characters")
    .max(100, "Workspace name must be less than 100 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only",
    ),
  website: z
    .string()
    .min(1, "Please enter a website URL")
    .transform((val) => {
      if (!/^https?:\/\//i.test(val)) {
        return "https://" + val;
      }
      return val;
    }),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export default function WorkspacePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isLoading, refetchOrganizations } = useOnboarding();
  const canAccess = useStepGuard(2);

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      website: "",
    },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;
  const nameValue = useWatch({ control: form.control, name: "name" });
  const websiteValue = useWatch({ control: form.control, name: "website" });

  // Show slug field only when both name and website have values
  const showSlugField =
    nameValue?.trim().length > 0 && websiteValue?.trim().length > 0;

  // Auto-generate slug from name
  useEffect(() => {
    if (!nameValue) return;

    const currentSlug = form.getValues("slug");
    const generatedSlug = generateSlug(nameValue);

    if (
      !currentSlug ||
      currentSlug === generateSlug(form.getValues("name").slice(0, -1))
    ) {
      form.setValue("slug", generatedSlug, { shouldValidate: false });
    }
  }, [nameValue, form]);

  const onSubmit = async (formData: WorkspaceFormValues) => {
    const result = await authClient.organization.create({
      name: formData.name,
      slug: formData.slug,
      metadata: JSON.parse(
        JSON.stringify({
          website: formData.website,
        }),
      ),
    });

    if (result.error) {
      toast.error(result.error.message ?? "Failed to create workspace");
      return;
    }

    if (result.data) {
      // Set active organization
      await authClient.organization.setActive({
        organizationId: result.data.id,
      });

      // Create default channels (general and announcements)
      const channelsResult = await createDefaultChannels({
        organizationId: result.data.id,
      });

      if (channelsResult?.serverError) {
        console.error(
          "Failed to create default channels:",
          channelsResult.serverError,
        );
        // Don't block navigation, just log the error
      }

      // Refetch organizations to update the context
      await refetchOrganizations();

      startTransition(() => {
        router.push(`/${result.data.slug}`);
      });
    }
  };

  // Show loading while checking access
  if (isLoading || !canAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-tight mb-2">
          Create your workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Setup your Flack workspace to start communicating with your team.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Workspace name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Acme Inc."
                  aria-invalid={fieldState.invalid}
                  autoComplete="organization"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="website"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="website">Your company website</FieldLabel>
                <Input
                  {...field}
                  id="website"
                  placeholder="https://acme.com"
                  aria-invalid={fieldState.invalid}
                  autoComplete="website"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Workspace slug</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>tryflack.com/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    {...field}
                    id={field.name}
                    placeholder="acme"
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>
                <FieldDescription>
                  This will be your workspace URL
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field className="pt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending || isSubmitting}
            >
              {isPending || isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Creating workspace...
                </span>
              ) : (
                "Create workspace"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
