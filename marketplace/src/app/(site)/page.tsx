import { createClient } from "@/lib/supabase/server";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getFeaturedProducts, getTrendingProducts, getTopSuppliers, getHomepageStats } from "@/lib/homepage";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";
import { TopSuppliers } from "@/components/home/TopSuppliers";
import { Stats } from "@/components/home/Stats";
import { BenefitsAndHowItWorks } from "@/components/home/BenefitsAndHowItWorks";
import { TestimonialsAndFaq } from "@/components/home/TestimonialsAndFaq";
import { DownloadAndContact } from "@/components/home/DownloadAndContact";

export default async function HomePage() {
  await requireCurrentBusiness("/");
  const supabase = await createClient();

  const [{ data: categories }, featured, trending, suppliers, stats] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    getFeaturedProducts(),
    getTrendingProducts(),
    getTopSuppliers(),
    getHomepageStats(),
  ]);

  return (
    <div>
      <Hero />
      <CategoryGrid categories={categories ?? []} />
      <ProductSection title="Featured products" products={featured} />
      <TopSuppliers suppliers={suppliers} />
      <ProductSection title="Trending products" products={trending} />
      <Stats stats={stats} />
      <BenefitsAndHowItWorks />
      <TestimonialsAndFaq />
      <DownloadAndContact />
    </div>
  );
}
