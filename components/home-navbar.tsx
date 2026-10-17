"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { Menu } from "lucide-react";

interface HomeNavbarProps {
  user?: any;
  onOpenMobileSidebar?: () => void; // Tambahan prop untuk tombol hamburger
}

export function HomeNavbar({ user: initialUser, onOpenMobileSidebar }: HomeNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roleLabel, setRoleLabel] = useState("Member Area");
  const [roleColor, setRoleColor] = useState("text-neutral-500");
  const [role, setRole] = useState("Member");
  const [currentUser, setCurrentUser] = useState<any>(initialUser);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchAuthAndRole = async () => {
      let userId = initialUser?.id;

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          setCurrentUser(user);
        }
      }

      if (!userId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && data) {
        const userRole = data.role || "Member";
        setRole(userRole);

        const lowerRole = userRole.toLowerCase();
        if (lowerRole === "founder") {
          setRoleLabel("Founder Dashboard");
          setRoleColor("text-neutral-900 font-semibold"); 
        } else if (lowerRole === "staff") {
          setRoleLabel("Staff Portal");
          setRoleColor("text-blue-600 font-semibold");   
        } else {
          setRoleLabel("Member Area");
          setRoleColor("text-neutral-500 font-medium");  
        }
      }
    };

    fetchAuthAndRole();
  }, [initialUser, supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal keluar: " + error.message);
    } else {
      toast.success("Berhasil keluar akun.");
      router.push("/login");
      router.refresh();
    }
  };

  const isFounder = role.toLowerCase() === "founder";

  const dropdownItems = [
    { href: "/home/profil", label: "Profil" },
    { href: "/home/setting", label: "Setting" },
    ...(!isFounder
      ? [
          { href: "/home/pesanan", label: "Pesanan" },
          { href: "/home/riwayat", label: "Riwayat" },
        ]
      : []),
  ];

  return (
    <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-4 sm:px-10 h-16 flex items-center justify-between">
        
        {/* Sisi Kiri: Tombol Hamburger (Khusus Mobile) + Indikator Area */}
        <div className="flex items-center gap-3">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-xl bg-neutral-100 border border-neutral-200/80 text-neutral-800 hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono uppercase tracking-wider text-neutral-400">Portal:</span>
            <span className={`text-[11px] sm:text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/60 ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Sisi Kanan: Profil & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200/80 text-neutral-700 hover:bg-neutral-200 hover:border-neutral-300 transition-all shadow-2xs focus:outline-none cursor-pointer"
            aria-label="Menu Profil"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-xs text-neutral-400 font-mono">Signed in as</p>
                <p className="text-xs font-semibold text-neutral-900 truncate mt-0.5 font-mono">
                  {currentUser?.email || "User"}
                </p>
              </div>

              <div className="py-1 text-xs font-mono">
                {dropdownItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-4 py-2.5 text-neutral-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-1 border-t border-neutral-100">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-mono font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}