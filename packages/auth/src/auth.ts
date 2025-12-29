import { db } from "@flack/db";
import {
  sendInvitationEmail as sendInvitation,
  sendVerificationEmail,
} from "@flack/email";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";

/**
 * Access Control Configuration
 *
 * Defines custom permissions for Flack's messaging features.
 * These extend the default organization permissions.
 */
const statement = {
  // Channel permissions
  channel: ["create", "update", "delete", "manage-members"],
  // Message permissions
  message: ["send", "edit", "delete", "moderate"],
  // Organization-level permissions (extend defaults)
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

export const ac = createAccessControl(statement);

// Define role permissions
export const memberRole = ac.newRole({
  channel: ["create"],
  message: ["send", "edit", "delete"],
});

export const adminRole = ac.newRole({
  channel: ["create", "update", "delete", "manage-members"],
  message: ["send", "edit", "delete", "moderate"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
});

export const ownerRole = ac.newRole({
  channel: ["create", "update", "delete", "manage-members"],
  message: ["send", "edit", "delete", "moderate"],
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  logger: {
    disabled: false,
    verboseLogging: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(),
    organization({
      // Access control configuration
      ac,
      roles: {
        member: memberRole,
        admin: adminRole,
        owner: ownerRole,
      },
      // The creator of an organization gets the owner role
      creatorRole: "owner",
      // Maximum members per organization (can be increased)
      membershipLimit: 100,
      // Invitation expires in 7 days
      invitationExpiresIn: 60 * 60 * 24 * 7,
      // Send invitation email callback
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/accept-invitation/${data.id}`;
        await sendInvitation({
          email: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name ?? "A team member",
          inviterEmail: data.inviter.user.email,
          role: data.role,
          inviteLink,
        });
      },
    }),
    emailOTP({
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp }) {
        await sendVerificationEmail({ email, otp });
      },
    }),
  ],
});
