"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { HomeNavbar } from "@/components/home-navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const pathname = usePathname();

  const menuItems = [
    { href: "/home/profil", label: "Profil" },
    { href: "/home/setting", label: "Setting" },
    { href: "/home/pesanan", label: "Pesanan" },
    { href: "/home/riwayat", label: "Riwayat" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col selection:bg-amber-200 selection:text-amber-900">
      <HomeNavbar user={user} />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Kiri */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-2.5 space-y-1 shadow-xs sticky top-24">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 px-3 py-2">
              Menu Akun
            </p>
            
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-neutral-900 text-amber-400 shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isActive ? "bg-amber-400" : "bg-neutral-300 group-hover:bg-amber-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Konten Kanan (Coming Soon Santai) */}
        <main className="flex-1 bg-white border border-neutral-200/80 rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-inner">
            🚧
          </div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">COMING SOON BRO!</h1>
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider bg-neutral-100 py-1.5 px-3 rounded-lg inline-block border border-neutral-200">
              SABAR HESE TANGKURAK SIA 
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Tenang, fitur ini lagi dirakit perlahan tapi pasti biar gak jomplang. Nongkrong dulu aja di menu Profil ya, bro!
            </p>
          </div>
        </main>

      </div>
    </div>
  );
}