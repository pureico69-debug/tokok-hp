"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Wrench, Sparkles, ArrowRight } from "lucide-react";

interface StaffSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

// FIX TYPESCRIPT: Tentukan tipe MenuItem dengan isComingSoon sebagai opsional (?)
type MenuItem = {
  name: string;
  href: string;
  isComingSoon?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export function StaffSidebar({ mobileOpen = false, setMobileOpen }: StaffSidebarProps) {
  const pathname = usePathname();

  // State untuk Modal Coming Soon / Maintenance
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [featureName, setFeatureName] = useState("");

  // Daftar menu khusus operasional Staff PUREI
  const menuGroups: MenuGroup[] = [
    {
      title: "UTAMA",
      items: [
        { name: "Dashboard Staff", href: "/home" },
      ],
    },
    {
      title: "OPERASIONAL TOKO",
      items: [
        { name: "Katalog & Stok iPhone", href: "/staff/products" },
        { name: "Kelola Pesanan Masuk", href: "/staff/orders" },
        { name: "Verifikasi Trade-In", href: "/staff/trade-in" },
      ],
    },
    {
      title: "LAYANAN & BANTUAN",
      items: [
        { name: "Klaim Garansi Customer", href: "/staff/warranty", isComingSoon: true },
        { name: "Pusat Bantuan / Tiket CS", href: "/staff/support", isComingSoon: true },
      ],
    },
  ];

  const handleMenuClick = (e: React.MouseEvent, item: MenuItem) => {
    if (item.isComingSoon) {
      e.preventDefault();
      setFeatureName(item.name);
      setComingSoonModalOpen(true);
      if (setMobileOpen) setMobileOpen(false);
    } else {
      if (setMobileOpen) setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Backdrop khusus Mobile ketika drawer terbuka */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-neutral-200/80 flex flex-col justify-between min-h-screen transition-transform duration-300 ease-in-out shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Bagian Atas: Logo Gambar Hitam, Tombol Close (Mobile), & Menu */}
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* Brand Logo, Badge Staff, & Tombol Close HP */}
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center">
              <Image
                src="/logo-purei-hitam.png"
                alt="PUREI Logo"
                width={100}
                height={92}
                className="h-7 w-auto object-contain"
                priority
              />
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md shadow-2xs">
                Staff
              </span>

              {/* Tombol Tutup Sidebar di HP */}
              {setMobileOpen && (
                <button
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden text-neutral-400 hover:text-neutral-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 px-3 py-1">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item, itemIdx) => {
                    const isActive = pathname === item.href && !item.isComingSoon;
                    return (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        onClick={(e) => handleMenuClick(e, item)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-neutral-900 text-amber-400 font-semibold shadow-xs"
                            : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                        }`}
                      >
                        <span>{item.name}</span>
                        {item.isComingSoon ? (
                          <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        ) : isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bagian Bawah: Info Hak Akses Staff */}
        <div className="p-4 m-4 bg-neutral-50/80 border border-neutral-200/60 rounded-2xl space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-[11px] font-mono font-semibold text-neutral-800">Mode Operasional</p>
          </div>
          <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
            Akses terbatas untuk kelola pesanan & layanan harian.
          </p>
        </div>

      </aside>

      {/* CUSTOM MODAL COMING SOON / MAINTENANCE */}
      {comingSoonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                <Wrench className="w-5 h-5" />
              </div>
              <button
                onClick={() => setComingSoonModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" />
                <span>Under Development</span>
              </div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                {featureName} Segera Hadir
              </h3>
              <p className="text-xs text-neutral-500 font-mono leading-relaxed">
                Fitur layanan ini sedang dalam tahap pengembangan sistem integrasi database PUREI. Nantikan pembaruannya segera!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setComingSoonModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white text-xs font-mono font-medium hover:bg-neutral-800 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Mengerti, Tutup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}