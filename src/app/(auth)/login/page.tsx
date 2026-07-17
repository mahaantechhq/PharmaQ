"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold backdrop-blur">
            PQ
          </div>
          <h1 className="text-xl font-semibold">Pharma Q Business</h1>
          <p className="mt-1 text-sm text-primary-100">Manage your storefront, inventory &amp; orders</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-8 shadow-2xl"
        >
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mb-6 text-sm text-slate-500">
            Use the credentials issued to your business by Pharma Q.
          </p>

          <div className="flex flex-col gap-4">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="owner@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && (
              <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
            )}

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-primary-100">
          No public registration — businesses are onboarded by Pharma Q.
        </p>
      </div>
    </div>
  );
}
