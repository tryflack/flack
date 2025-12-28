"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { useId, useTransition } from "react";
import { Button } from "@flack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@flack/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@flack/ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@flack/ui/components/input-otp";
import { Spinner } from "@flack/ui/components/spinner";
import { authClient } from "@flack/auth/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const verifyEmailSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export function VerifyEmailForm({ email }: { email: string }) {
  const otpInputId = useId();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (formData: VerifyEmailFormValues) => {
    await authClient.emailOtp.verifyEmail(
      {
        email: email,
        otp: formData.otp,
      },
      {
        onSuccess: () => {
          toast.success("Email verified successfully");
          startTransition(() => {
            router.push("/");
          });
        },
        onError: (ctx) => {
          toast.error(
            ctx.error.message ?? "Sorry, that didn't work. Please try again.",
          );
        },
      },
    );
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Verify your email ({email})</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email address
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FieldGroup>
              <Controller
                name="otp"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={otpInputId}>
                      Verification Code
                    </FieldLabel>
                    <InputOTP
                      autoFocus
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      id={otpInputId}
                      disabled={form.formState.isSubmitting}
                      aria-invalid={fieldState.invalid}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={isPending || form.formState.isSubmitting}
            >
              {isPending || form.formState.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Verifying...
                </span>
              ) : (
                "Verify Email"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
