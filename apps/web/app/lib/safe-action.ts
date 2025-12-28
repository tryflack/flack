import { auth } from "@flack/auth";
import { db } from "@flack/db";
import {
    createSafeActionClient,
    DEFAULT_SERVER_ERROR_MESSAGE,
  } from "next-safe-action";
  import { headers } from "next/headers";
  import { z } from "zod";
  
  export class ActionError extends Error {}
  
  // Base client.
  const actionClient = createSafeActionClient({
    defineMetadataSchema() {
      return z.object({
        actionName: z.string(),
      });
    },
    handleServerError(e) {
      console.error("Action error:", e.message);
  
      if (e instanceof ActionError) {
        return e.message;
      }
  
      return DEFAULT_SERVER_ERROR_MESSAGE;
    },
    // Define logging middleware.
  }).use(async ({ next, clientInput, metadata }) => {
    console.log("LOGGING MIDDLEWARE");
  
    const startTime = performance.now();
  
    // Here we await the action execution.
    const result = await next();
  
    const endTime = performance.now();
  
    console.log("Result ->", result);
    console.log("Client input ->", clientInput);
    console.log("Metadata ->", metadata);
    console.log("Action execution took", endTime - startTime, "ms");
  
    // And then return the result of the awaited action.
    return result;
  });
  
  // Auth client defined by extending the base one.
  // Note that the same initialization options and middleware functions of the base client
  // will also be used for this one.
  export const authActionClient = actionClient
    // Define authorization middleware.
    .use(async ({ next }) => {

      const session = await auth.api.getSession({
        headers: await headers(),
      });
  
      if (!session) {
        throw new Error("Session not found!");
      }
  
      const userId = session.user.id;
  
      if (!userId) {
        throw new Error("Session is not valid!");
      }
  
      // Return the next middleware with `userId` value in the context
      return next({ ctx: { userId, session } });
    });

  // Organization-scoped action client for messaging
  // Validates that the user is a member of the organization
  export const orgActionClient = authActionClient
    .use(async ({ next, ctx }) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      const organizationId = session?.session?.activeOrganizationId;

      if (!organizationId) {
        throw new ActionError("No active organization selected");
      }

      // Verify user is a member of this organization
      const membership = await db.member.findFirst({
        where: {
          userId: ctx.userId,
          organizationId,
        },
      });

      if (!membership) {
        throw new ActionError("You are not a member of this organization");
      }

      return next({
        ctx: {
          ...ctx,
          organizationId,
          memberRole: membership.role,
        },
      });
    });