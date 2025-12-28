"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, Controller } from "react-hook-form";
import * as z from "zod";
import { Check, Circle } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@flack/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@flack/ui/components/field";
import { Input } from "@flack/ui/components/input";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@flack/ui/lib/utils";
import { Spinner } from "@flack/ui/components/spinner";
import { authClient } from "@flack/auth/auth-client";
import { useTransition } from "react";

type PasswordRequirement = {
  id: string;
  label: string;
  test: (value: string) => boolean;
  message?: string;
};

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
    message: "Password must contain at least one uppercase letter.",
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
    message: "Password must contain at least one lowercase letter.",
  },
  {
    id: "number",
    label: "One number",
    test: (value) => /\d/.test(value),
    message: "Password must contain at least one number.",
  },
  {
    id: "symbol",
    label: "One special character",
    test: (value) => /[^\w\s]/.test(value),
    message: "Password must contain at least one special character.",
  },
];

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be at most 128 characters.")
  .superRefine((value, ctx) => {
    const failedRequirement = PASSWORD_REQUIREMENTS.find(
      (requirement) => requirement.id !== "length" && !requirement.test(value),
    );

    if (failedRequirement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          failedRequirement.message ??
          `Password must meet the "${failedRequirement.label}" requirement.`,
      });
    }
  });

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name must be at most 100 characters."),
    email: z.email("Please enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const { isSubmitting, isValid } = form.formState;

  const passwordValue =
    useWatch({ control: form.control, name: "password" }) ?? "";
  const passwordRequirementStatuses = PASSWORD_REQUIREMENTS.map(
    (requirement) => ({
      ...requirement,
      met: requirement.test(passwordValue),
    }),
  );

  const onSubmit = async (formData: SignupFormValues) => {
    await authClient.signUp.email(
      {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      },
      {
        onSuccess: () => {
          toast.success("Your account has been created successfully");

          startTransition(() => {
            router.push("/login");
          });
        },
        onError: () => {
          toast.error("Sorry, that didn't work. Please try again.");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for Flack</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="John Doe"
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    placeholder="m@example.com"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                  />
                  <FieldDescription>
                    Please confirm your password.
                  </FieldDescription>
                  <FieldDescription>
                    Password must meet the following requirements:
                  </FieldDescription>
                  <div aria-live="polite" className="flex flex-col text-sm">
                    {passwordRequirementStatuses.map((requirement) => (
                      <div
                        key={requirement.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-0.5 transition-colors",
                        )}
                      >
                        {requirement.met ? (
                          <Check
                            className="h-4 w-4 text-primary"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        <span>{requirement.label}</span>
                        <span className="sr-only">
                          {requirement.met
                            ? "Requirement met"
                            : "Requirement not met"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <FieldGroup>
              <Field>
                <Button
                  type="submit"
                  disabled={!isValid || isPending || isSubmitting}
                >
                  {isPending || isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
