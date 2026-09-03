"use client";

import Link from "next/navigation"; // atau gunakan a / router bawaan
import { usePathname } from "next/navigation";

export function ProfileSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/home/profil", label: "Profil" },
    { href: "/home/setting", label: "Setting" },
    { href: "/home/pesanan", label: "Pesanan" },
    { href: "/home/riwayat", label: "Riwayat" },
  ];

  return (
    <div className="w-full md:w-64 shrink-0">
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 space-y-1 shadow-xs sticky top-24">
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 px-3 py-2">
          Menu Akun
        </p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-neutral-900 text-amber-400 shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isActive ? "bg-amber-400" : "bg-neutral-300 group-hover:bg-amber-500"
                }`}
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}