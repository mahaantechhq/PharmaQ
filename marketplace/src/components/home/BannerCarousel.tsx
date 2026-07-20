"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types/database";

const AUTO_ROTATE_MS = 6000;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[index];
  const slide = (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 sm:aspect-[16/9]">
      <Image src={banner.image_url} alt={banner.title} fill className="object-cover" priority={index === 0} />
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="group relative">
        {banner.link_url ? (
          <Link href={banner.link_url} className="block">
            {slide}
          </Link>
        ) : (
          slide
        )}

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-[var(--shadow-card)] transition-opacity group-hover:opacity-100"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % banners.length)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-[var(--shadow-card)] transition-opacity group-hover:opacity-100"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
