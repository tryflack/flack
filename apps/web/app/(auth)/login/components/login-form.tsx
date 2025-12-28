"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
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
import { Spinner } from "@flack/ui/components/spinner";
import { authClient } from "@flack/auth/auth-client";
import { useTransition } from "react";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (formData: LoginFormValues) => {
    await authClient.signIn.email(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: () => {
          toast.success("Login successful!");
          startTransition(() => {
            router.push("/");
          });
        },
        onError: (ctx) => {
          if (ctx.error.status === 403) {
            toast.error("Please verify your email address.");
            startTransition(() => {
              router.push("/verify-email");
            });
          } else {
            toast.error("Invalid email or password. Please try again.");
          }
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to Flack</CardTitle>
        <CardDescription>
          Enter your credentials below to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
                    autoComplete="current-password"
                  />
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
                  disabled={
                    !form.formState.isValid || isPending || isSubmitting
                  }
                >
                  {isPending || isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner /> Logging in...
                    </span>
                  ) : (
                    "Log In"
                  )}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/register">Register</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
