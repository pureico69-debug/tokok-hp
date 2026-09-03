"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X, Construction } from "lucide-react";
import { toast } from "sonner";

interface FounderSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function FounderSidebar({ 
  mobileOpen: externalMobileOpen, 
  setMobileOpen: externalSetMobileOpen 
}: FounderSidebarProps) {
  const pathname = usePathname();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  // Fallback: pakai props luar jika ada, kalau tidak pakai state internal
  const mobileOpen = externalMobileOpen ?? internalMobileOpen;
  const setMobileOpen = externalSetMobileOpen ?? setInternalMobileOpen;

  // State untuk modal "Sedang Dalam Pengembangan"
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [featureName, setFeatureName] = useState("");

  const handleSoonClick = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setFeatureName(name);
    setDevModalOpen(true);
  };

  const menuGroups = [
    {
      title: "UTAMA",
      items: [
        { name: "Dashboard Overview", href: "/home" },
        { name: "Live Analytics", href: "/founder/analytics", soon: true },
      ],
    },
    {
      title: "MANAJEMEN TOKO",
      items: [
        { name: "Katalog & Stok iPhone", href: "/founder/products" },
        { name: "Kelola Pesanan", href: "/founder/orders" },
        { name: "Pengajuan Trade-In", href: "/founder/trade-in" },
        { name: "Utang & Piutang", href: "/founder/receivables" },
        { name: "Penggajian (Payroll)", href: "/founder/payroll" },
        { name: "Data Transaksi & Keuangan", href: "/founder/transactions" },
      ],
    },
    {
      title: "LAYANAN & GARANSI",
      items: [
        { name: "Klaim Garansi PUREI", href: "/founder/warranty", soon: true },
        { name: "Pusat Bantuan / Tiket", href: "/founder/support", soon: true },
      ],
    },
    {
      title: "SISTEM & PENGGUNA",
      items: [
        { name: "Price List", href: "/founder/pricelist" },
        { name: "Manajemen Staff & Role", href: "/founder/staff" },
        { name: "Database Customer", href: "/founder/customers", soon: true },
        { name: "Pengaturan Website", href: "/founder/settings" },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      {/* Bagian Atas: Logo Text & Navigasi */}
      <div className="p-6 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1">
            <span className="text-xl font-black tracking-wider text-neutral-900">
              PU<span className="text-amber-500">REI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-neutral-900 text-amber-400 px-2.5 py-1 rounded-md shadow-2xs">
              Founder
            </span>
            {/* Tombol Close khusus versi Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
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
                {group.items.map((item: any, itemIdx) => {
                  const isActive = pathname === item.href;
                  
                  if (item.soon) {
                    return (
                      <a
                        key={itemIdx}
                        href="#"
                        onClick={(e) => handleSoonClick(item.name, e)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-100/60 hover:text-neutral-600 transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-400">
                          Soon
                        </span>
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-neutral-900 text-amber-400 font-semibold shadow-xs"
                          : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                      }`}
                    >
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bagian Bawah: System Status */}
      <div className="p-4 m-4 bg-neutral-50/80 border border-neutral-200/60 rounded-2xl space-y-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] font-mono font-semibold text-neutral-800">Sistem Beroperasi</p>
        </div>
        <p className="text-[10px] text-neutral-400 font-mono">
          Akses tingkat tertinggi aktif.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay Backdrop saat Mobile Drawer Terbuka */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Sidebar untuk Desktop (Sticky) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200/80 flex-col justify-between min-h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Sidebar Drawer untuk Mobile (Slide-over dari kiri) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Modal / Popup "Sedang Dalam Pengembangan" */}
      {devModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl font-mono text-xs text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <Construction className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-neutral-900">{featureName}</h3>
              <p className="text-neutral-500 text-[11px]">
                Fitur ini sedang dalam tahap pengembangan dan akan segera dirilis pada pembaruan sistem berikutnya.
              </p>
            </div>

            <button
              onClick={() => setDevModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 text-amber-400 font-bold hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}