"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function DaftarPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Validasi standar password
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

  const passwordChecks = validatePassword(password);

  const handleDaftar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Password dan Konfirmasi Password tidak sama!");
      return;
    }

    if (!passwordChecks.isValid) {
      toast.error("Password belum memenuhi standar keamanan yang ditentukan.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "member", // Otomatis set role jadi member untuk user baru
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      // Pastikan data session atau user terbentuk agar langsung masuk
      if (data.session) {
        toast.success("Pendaftaran berhasil! Selamat datang di PUREI.");
        router.push("/user"); // Arahkan ke halaman utama/katalog user
        router.refresh();
      } else {
        // Fallback jika konfirmasi email aktif di supabase meskipun dimatikan di local
        toast.success("Pendaftaran berhasil! Silakan masuk ke akun Anda.");
        router.push("/login");
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-black text-white px-4 py-12 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-extrabold tracking-wider text-white">
            PU<span className="text-yellow-400">REI</span>
          </Link>
          <p className="text-xs tracking-widest text-neutral-400 uppercase mt-1">Pre-Owned iPhone Terpercaya</p>
        </div>

        {/* Card Container */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 p-8 rounded-3xl shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Buat Akun Baru</h2>
            <p className="text-sm text-neutral-400 mt-1">Mulai belanja iPhone pre-owned aman bergaransi</p>
          </div>

          <form onSubmit={handleDaftar} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                placeholder="nama@email.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-xs font-medium text-neutral-400 hover:text-white transition"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>

              {/* Indikator Standar Password */}
              {password && (
                <div className="mt-2.5 space-y-1 text-xs bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80">
                  <p className="text-neutral-400 font-medium mb-1">Syarat Keamanan Password:</p>
                  <p className={passwordChecks.minLength ? "text-green-400" : "text-neutral-500"}>
                    {passwordChecks.minLength ? "✓" : "•"} Minimal 8 karakter
                  </p>
                  <p className={passwordChecks.hasUpperCase ? "text-green-400" : "text-neutral-500"}>
                    {passwordChecks.hasUpperCase ? "✓" : "•"} Ada huruf besar (A-Z)
                  </p>
                  <p className={passwordChecks.hasLowerCase ? "text-green-400" : "text-neutral-500"}>
                    {passwordChecks.hasLowerCase ? "✓" : "•"} Ada huruf kecil (a-z)
                  </p>
                  <p className={passwordChecks.hasNumber ? "text-green-400" : "text-neutral-500"}>
                    {passwordChecks.hasNumber ? "✓" : "•"} Ada angka (0-9)
                  </p>
                  <p className={passwordChecks.hasSpecialChar ? "text-green-400" : "text-neutral-500"}>
                    {passwordChecks.hasSpecialChar ? "✓" : "•"} Ada simbol khusus (misal: @, #, $, dll)
                  </p>
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-xs font-medium text-neutral-400 hover:text-white transition"
                >
                  {showConfirmPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Konfirmasi password tidak cocok!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordChecks.isValid || password !== confirmPassword}
              className="w-full bg-yellow-400 text-black font-semibold text-sm py-3 rounded-xl hover:bg-yellow-300 active:scale-[0.99] transition shadow-lg shadow-yellow-400/10 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          {/* Divider ATAU */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900 px-3 text-neutral-500 font-medium">Atau</span>
            </div>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-neutral-950 border border-neutral-800 text-white font-medium text-sm py-3 rounded-xl hover:bg-neutral-800/80 active:scale-[0.99] transition shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.8 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.3-1.5-.3-2.3s.1-1.6.3-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.1-6.7-5.1L1.6 16c1.9 3.8 5.8 7 10.4 7z"/>
            </svg>
            Daftar dengan Google
          </button>

          <div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
            <p className="text-xs text-neutral-400">
              Sudah punya akun PUREI?{" "}
              <Link href="/login" className="text-yellow-400 font-medium hover:underline">
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}