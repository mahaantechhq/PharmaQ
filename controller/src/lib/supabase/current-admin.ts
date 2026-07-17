import { createClient } from "@/lib/supabase/server";

export interface CurrentAdminContext {
  adminId: string;
  email: string;
}

export async function getCurrentAdmin(): Promise<CurrentAdminContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase.from("super_admins").select("id").eq("id", user.id).maybeSingle();

  if (!admin) return null;

  return { adminId: user.id, email: user.email ?? "" };
}
