import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getActiveHeroBanners } from "@/lib/banners";
import { Hero } from "@/components/home/Hero";
import { LoggedInHero } from "@/components/home/LoggedInHero";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { Stats } from "@/components/home/Stats";
import { BenefitsAndHowItWorks } from "@/components/home/BenefitsAndHowItWorks";
import { Faq } from "@/components/home/Faq";
import { DownloadAndContact } from "@/components/home/DownloadAndContact";

export default async function HomePage() {
  const ctx = await getCurrentBusiness();

  if (ctx) {
    const banners = await getActiveHeroBanners();
    return (
      <div>
        <LoggedInHero ownerName={ctx.owner.full_name} />
        <BannerCarousel banners={banners} />
      </div>
    );
  }

  return (
    <div>
      <Hero />
      <Stats />
      <BenefitsAndHowItWorks />
      <Faq />
      <DownloadAndContact />
    </div>
  );
}
