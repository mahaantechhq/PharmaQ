import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/supabase/current-business";

export default async function RootPage() {
  const ctx = await getCurrentBusiness();
  redirect(ctx ? "/dashboard" : "/login");
}
