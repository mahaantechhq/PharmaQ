import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { PlatformSettingsForm } from "@/components/settings/PlatformSettingsForm";
import type { PlatformSettingsValues } from "@/app/(dashboard)/settings/actions";

const DEFAULTS: PlatformSettingsValues = {
  site_name: "Pharma Q",
  support_email: "support@pharmaq.in",
  support_phone: "",
  default_commission_percent: 5,
  maintenance_mode: false,
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("platform_settings").select("*");

  const values = { ...DEFAULTS };
  for (const s of settings ?? []) {
    if (s.key in values) {
      (values as any)[s.key] = s.value;
    }
  }

  return (
    <div>
      <PageHeader title="Platform settings" description="Global configuration for the Pharma Q marketplace." />
      <Card>
        <CardHeader title="General" />
        <CardBody>
          <PlatformSettingsForm defaultValues={values} />
        </CardBody>
      </Card>
    </div>
  );
}
