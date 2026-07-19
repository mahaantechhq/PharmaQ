import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getActiveHeroBanners } from "@/lib/banners";
import { Hero } from "@/components/home/Hero";
import { LoggedInHero } from "@/components/home/LoggedInHero";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Stats } from "@/components/home/Stats";
import { BenefitsAndHowItWorks } from "@/components/home/BenefitsAndHowItWorks";
import { TestimonialsAndFaq } from "@/components/home/TestimonialsAndFaq";
import { DownloadAndContact } from "@/components/home/DownloadAndContact";

export default async function HomePage() {
  const supabase = await createClient();
  const ctx = await getCurrentBusiness();

  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  if (ctx) {
    const banners = await getActiveHeroBanners();
    return (
      <div>
        <LoggedInHero ownerName={ctx.owner.full_name} />
        <BannerCarousel banners={banners} />
        <CategoryGrid categories={categories ?? []} />
      </div>
    );
  }

  return (
    <div>
      <Hero />
      <CategoryGrid categories={categories ?? []} />
      <Stats />
      <BenefitsAndHowItWorks />
      <TestimonialsAndFaq />
      <DownloadAndContact />
    </div>
  );
}
