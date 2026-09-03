"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Megaphone } from "lucide-react";

export function AnnouncementBar() {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBanners() {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setBanners(data);
      }
    }

    fetchBanners();
  }, [supabase]);

  // Efek geser otomatis setiap 4 detik kalau bannernya lebih dari 1
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="bg-neutral-900 text-amber-300 px-4 py-2 text-xs font-mono flex items-center justify-center gap-2 border-b border-neutral-800">
      <Megaphone className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
      <div className="overflow-hidden relative h-5 flex items-center text-center">
        <span className="transition-all duration-500 ease-in-out font-medium tracking-wide">
          {banners[currentIndex]?.text}
        </span>
      </div>
    </div>
  );
}