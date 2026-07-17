/**
 * Creates the first Super Admin login (auth user + super_admins row).
 * Run with: npm run seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "admin@pharmaq.in";
const ADMIN_PASSWORD = "PharmaQ@Admin123";

async function main() {
  console.log("Seeding Pharma Q Super Admin...\n");

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let userId = existingUsers.users.find((u) => u.email === ADMIN_EMAIL)?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
    console.log("Created auth user for super admin.");
  } else {
    console.log("Super admin auth user already exists.");
  }

  const { error: adminError } = await supabase.from("super_admins").upsert({ id: userId });
  if (adminError) throw adminError;

  console.log("\nSeed complete.\n");
  console.log("Login to the Controller with:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
