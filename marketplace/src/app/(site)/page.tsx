import { createClient } from "@/lib/supabase/server";
import { getHomepageStats } from "@/lib/homepage";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Stats } from "@/components/home/Stats";
import { BenefitsAndHowItWorks } from "@/components/home/BenefitsAndHowItWorks";
import { TestimonialsAndFaq } from "@/components/home/TestimonialsAndFaq";
import { DownloadAndContact } from "@/components/home/DownloadAndContact";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, stats] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    getHomepageStats(),
  ]);

  return (
    <div>
      <Hero />
      <CategoryGrid categories={categories ?? []} />
      <Stats stats={stats} />
      <BenefitsAndHowItWorks />
      <TestimonialsAndFaq />
      <DownloadAndContact />
    </div>
  );
}
