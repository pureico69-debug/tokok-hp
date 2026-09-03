"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";

export default function SettingPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("Member");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State Form Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Show/Hide Password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const supabase = createClient();
  const pathname = usePathname();

  // Filter Menu Navigasi Berdasarkan Role
  const isFounder = role.toLowerCase() === "founder";

  const menuItems = [
    { href: "/user/profil", label: "Profil" },
    { href: "/user/setting", label: "Setting" },
    ...(!isFounder
      ? [
          { href: "/user/riwayat", label: "Riwayat" },
        ]
      : []),
  ];

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Ambil role dari tabel profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        setRole(profile.role);
      }
      setLoading(false);
    };

    fetchUserAndRole();
  }, [supabase]);

  // Validasi Standar Keamanan Password
  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    };
  };

  const passwordChecks = validatePassword(newPassword);

  // Handler Update Password ke Supabase
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok!");
      return;
    }

    if (!passwordChecks.isValid) {
      toast.error("Password baru belum memenuhi semua standar keamanan!");
      return;
    }

    setSaving(true);

    try {
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          toast.error("Password saat ini salah!");
          setSaving(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error("Gagal memperbarui password: " + updateError.message);
      } else {
        toast.success("Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-xs font-mono text-neutral-400">
        Memuat pengaturan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col selection:bg-amber-200 selection:text-amber-900">
      
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Kiri (Diperbaiki dengan md:sticky agar di HP tidak ikut melayang) */}
        <aside className="w-full md:w-64 shrink-0 space-y-3 md:sticky md:top-10 self-start">
          
          {/* Tombol Kembali ke Dashboard */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-2 shadow-xs">
            <Link
              href="/user"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono font-bold text-neutral-700 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:text-amber-600 transition-colors" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>

          {/* Menu Akun Navigasi */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-2.5 space-y-1 shadow-xs">
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

        {/* Konten Kanan */}
        <main className="flex-1 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="border-b border-neutral-100 pb-6 flex items-center gap-3">
            <div className="p-3 bg-neutral-900 text-amber-400 rounded-2xl shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Keamanan & Password</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Perbarui password kata sandi akun PUREI Anda secara berkala.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-neutral-700">Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 pr-10 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-neutral-700">Password Baru</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 pr-10 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {newPassword && (
                <div className="mt-3 space-y-1.5 text-xs bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80 font-mono">
                  <p className="text-neutral-500 font-bold mb-1">Syarat Password Baru:</p>
                  <p className={passwordChecks.minLength ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {passwordChecks.minLength ? "✓" : "•"} Minimal 8 karakter
                  </p>
                  <p className={passwordChecks.hasUpperCase ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {passwordChecks.hasUpperCase ? "✓" : "•"} Memiliki huruf besar (A-Z)
                  </p>
                  <p className={passwordChecks.hasLowerCase ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {passwordChecks.hasLowerCase ? "✓" : "•"} Memiliki huruf kecil (a-z)
                  </p>
                  <p className={passwordChecks.hasNumber ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {passwordChecks.hasNumber ? "✓" : "•"} Memiliki angka (0-9)
                  </p>
                  <p className={passwordChecks.hasSpecialChar ? "text-emerald-600 font-semibold" : "text-neutral-400"}>
                    {passwordChecks.hasSpecialChar ? "✓" : "•"} Memiliki karakter khusus (!@#$%^&* dll)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-neutral-700">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 pr-10 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] font-mono text-red-500 mt-1">Konfirmasi password tidak cocok!</p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-start">
              <button
                type="submit"
                disabled={saving || !passwordChecks.isValid || newPassword !== confirmPassword || !currentPassword}
                className="px-6 py-3 rounded-xl bg-neutral-900 text-amber-400 hover:bg-neutral-800 text-xs font-mono font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Memperbarui..." : "Update Password"}
              </button>
            </div>
          </form>
        </main>

      </div>
    </div>
  );
}