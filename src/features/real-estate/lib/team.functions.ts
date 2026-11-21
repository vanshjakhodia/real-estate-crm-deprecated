import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteInput = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "agent"]),
  phone: z.string().trim().max(40).optional(),
});

const removeInput = z.object({ userId: z.string().uuid() });

async function requireAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Administrator access is required.");
}

export const inviteTeamMemberServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inviteInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${new URL(getRequest().url).origin}/reset-password`,
      data: { full_name: data.fullName, phone: data.phone ?? "" },
    });
    if (inviteError || !invitation.user) {
      throw new Error("Could not send the staff invitation. Check the email and try again.");
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: invitation.user.id,
      email,
      full_name: data.fullName,
      phone: data.phone || null,
    });
    if (profileError) throw new Error("The invitation was sent, but the staff profile could not be saved.");

    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: invitation.user.id, role: data.role },
      { onConflict: "user_id,role" },
    );
    if (roleError) throw new Error("The invitation was sent, but staff access could not be assigned.");
    return { userId: invitation.user.id, email };
  });

export const removeTeamMemberServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => removeInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot remove your own access.");

    const { data: targetRoles, error: targetError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if (targetError || !targetRoles?.length) throw new Error("Staff member not found.");

    if (targetRoles.some((row) => row.role === "admin")) {
      const { count, error: countError } = await context.supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if (countError || (count ?? 0) <= 1) throw new Error("The last administrator cannot be removed.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (error) throw new Error("Could not remove this staff member's CRM access.");
    return { success: true };
  });