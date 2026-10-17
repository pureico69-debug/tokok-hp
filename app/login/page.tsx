"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Proses autentikasi login via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    // 2. Ambil data role user dari tabel profiles berdasarkan user.id
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        toast.error("Gagal memuat data profil pengguna.");
        setLoading(false);
        return;
      }

      toast.success("Berhasil masuk! Selamat datang kembali di PUREI.");

      // 3. Filter redirect berdasarkan role
      const userRole = profileData?.role?.toLowerCase() || "member";
      
      if (userRole === "founder" || userRole === "staff") {
        router.push("/home");
      } else {
        router.push("/user");
      }
      
      router.refresh();
    }
    
    setLoading(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Masukkan email terlebih dahulu!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
      toast.success("Link pemulihan berhasil dikirim ke email Anda.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-black text-white px-4 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>

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
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {isForgotMode ? "Reset Sandi" : "Selamat Datang"}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {isForgotMode 
                ? "Kami akan mengirimkan instruksi pemulihan ke email Anda." 
                : "Masuk untuk melacak pesanan & klaim garansi."}
            </p>
          </div>

          {!isForgotMode ? (
            /* FORM LOGIN */
            <div className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
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
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-neutral-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setIsForgotMode(true)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 transition"
                    >
                      Lupa password?
                    </button>
                  </div>
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 text-black font-semibold text-sm py-3 rounded-xl hover:bg-yellow-300 active:scale-[0.99] transition shadow-lg shadow-yellow-400/10 disabled:opacity-50"
                >
                  {loading ? "Memproses..." : "Masuk ke Akun"}
                </button>
              </form>

              {/* Divider ATAU */}
              <div className="relative my-4">
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
                Masuk dengan Google
              </button>
            </div>
          ) : (
            /* FORM LUPA PASSWORD */
            <div className="space-y-5">
              {resetSent ? (
                <div className="bg-neutral-950/80 p-5 rounded-2xl border border-neutral-800 text-center space-y-3">
                  <div className="w-10 h-10 bg-yellow-400/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto text-lg font-bold">✓</div>
                  <p className="text-sm text-white font-medium">Link Pemulihan Terkirim!</p>
                  <p className="text-xs text-neutral-400">Silakan cek kotak masuk atau folder spam email Anda.</p>
                  <button
                    onClick={() => { setIsForgotMode(false); setResetSent(false); }}
                    className="text-xs text-yellow-400 hover:underline block mx-auto pt-2 font-medium"
                  >
                    ← Kembali ke halaman Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-neutral-300">Email Terdaftar</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                      placeholder="nama@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 text-black font-semibold text-sm py-3 rounded-xl hover:bg-yellow-300 active:scale-[0.99] transition shadow-lg shadow-yellow-400/10 disabled:opacity-50"
                  >
                    {loading ? "Mengirim..." : "Kirim Link Pemulihan"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsForgotMode(false)}
                    className="w-full text-xs text-neutral-400 hover:text-white pt-2 text-center block transition"
                  >
                    Batal, kembali ke Login
                  </button>
                </form>
              )}
            </div>
          )}

          {!isForgotMode && (
            <div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
              <p className="text-xs text-neutral-400">
                Belum punya akun PUREI?{" "}
                <Link href="/daftar" className="text-yellow-400 font-medium hover:underline">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}