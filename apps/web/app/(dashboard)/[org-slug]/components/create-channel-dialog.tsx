"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@flack/ui/components/dialog";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { Textarea } from "@flack/ui/components/textarea";
import { Switch } from "@flack/ui/components/switch";
import { Spinner } from "@flack/ui/components/spinner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@flack/ui/components/field";
import { useChannels } from "@/app/lib/hooks/use-channels";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { toast } from "sonner";

const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(80, "Channel name must be 80 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers, and hyphens allowed",
    ),
  description: z
    .string()
    .max(250, "Description must be 250 characters or less")
    .optional(),
  isPrivate: z.boolean(),
});

type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
}: CreateChannelDialogProps) {
  const { create } = useChannels();
  const { navigateToChannel } = useChatParams();

  const form = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: CreateChannelFormValues) => {
    const result = await create({
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
    });

    if (result?.data?.channel) {
      toast.success(`Channel #${data.name} created`);
      form.reset();
      onOpenChange(false);
      navigateToChannel(result.data.channel.slug);
    } else if (result?.serverError) {
      toast.error(result.serverError);
    } else if (result?.validationErrors) {
      toast.error("Invalid input");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>
            Channels are where conversations happen. Create a channel for a
            topic, project, or team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                placeholder="e.g. announcements"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
              <FieldDescription>
                Lowercase letters, numbers, and hyphens only
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Textarea
                id="description"
                placeholder="What's this channel about?"
                rows={2}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </Field>

            <Field orientation="horizontal">
              <Switch
                id="isPrivate"
                checked={form.watch("isPrivate")}
                onCheckedChange={(checked) =>
                  form.setValue("isPrivate", checked)
                }
              />
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="isPrivate" className="font-normal">
                  Make private
                </FieldLabel>
                <FieldDescription>
                  Only invited members can see this channel
                </FieldDescription>
              </div>
            </Field>

            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Creating...
                  </span>
                ) : (
                  "Create Channel"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
