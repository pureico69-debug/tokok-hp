"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { HomeNavbar } from "@/components/home-navbar";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // State form profil
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("Member");

  // State form rekening (khusus staff / kebutuhan pencairan)
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");

  const supabase = createClient();
  const pathname = usePathname();

  // Filter Menu Navigasi Berdasarkan Role
  const isFounder = role.toLowerCase() === "founder";
  const isStaff = role.toLowerCase() === "staff";

  const menuItems = [
    { href: "/home/profil", label: "Profil" },
    { href: "/home/setting", label: "Setting" },
    ...(!isFounder
      ? [
          { href: "/home/pesanan", label: "Pesanan" },
          { href: "/home/riwayat", label: "Riwayat" },
        ]
      : []),
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Ambil data dari tabel profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatar_url || "");
        setRole(data.role || "Member");
        
        // Data rekening
        setBankName(data.bank_name || "");
        setBankAccountNumber(data.bank_account_number || "");
        setBankAccountHolder(data.bank_account_holder || "");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  // Fungsi Upload / Update Foto Profil ke Supabase Storage
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = publicURLData.publicUrl;
      setAvatarUrl(newAvatarUrl);

      await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", user.id);

      toast.success("Foto profil berhasil diperbarui!");
    } catch (error: any) {
      toast.error("Gagal mengunggah foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Fungsi Hapus Foto Profil
  const handleDeleteAvatar = async () => {
    try {
      if (!avatarUrl) return;
      setUploading(true);

      const urlParts = avatarUrl.split("/avatars/");
      const filePath = urlParts[urlParts.length - 1];

      if (filePath) {
        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (removeError) throw removeError;
      }

      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      setAvatarUrl("");
      toast.success("Foto profil berhasil dihapus!");
    } catch (error: any) {
      toast.error("Gagal menghapus foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Simpan Perubahan Profil (Termasuk Rekening)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_holder: bankAccountHolder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Gagal memperbarui profil: " + error.message);
    } else {
      toast.success("Profil dan data rekening berhasil diperbarui!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-xs font-mono text-neutral-400">
        Memuat data profil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col selection:bg-amber-200 selection:text-amber-900">
      <HomeNavbar user={user} />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Kiri - Diperbaiki dengan md:sticky agar aman di mobile */}
        <aside className="w-full md:w-64 shrink-0 space-y-3 md:sticky md:top-24 self-start">
          
          {/* Tombol Kembali ke Dashboard */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-2 shadow-xs">
            <Link
              href="/home"
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

        {/* Konten Kanan (Form Profil) */}
        <main className="flex-1 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Personal Profile</h1>
            <p className="text-xs text-neutral-500 mt-1">Kelola foto profil, informasi identitas, dan data rekening bank Anda.</p>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-neutral-100 flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 text-amber-400 font-bold font-mono text-2xl flex items-center justify-center overflow-hidden shadow-md border-2 border-neutral-200/60">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase()
                  )}
                </div>
                
                <label className="absolute inset-0 bg-neutral-950/60 text-white rounded-2xl flex items-center justify-center text-[10px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs">
                  {uploading ? "Proses..." : "Ganti Foto"}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-bold text-neutral-900">{fullName || "Pengguna PUREI"}</h2>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-neutral-900 text-amber-400 px-3 py-1 rounded-full shadow-2xs">
                    {role}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  {user?.email}
                </p>
              </div>
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Hapus Foto
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Bagian Identitas Utama */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">Informasi Pribadi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Nomor Handphone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-neutral-700">Alamat Email <span className="text-neutral-400 font-normal">(Tidak dapat diubah)</span></label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-neutral-100/60 border border-neutral-200/80 rounded-xl px-4 py-3 text-xs text-neutral-400 cursor-not-allowed font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* Bagian Rekening Bank (Khusus Staff / Kebutuhan Operasional) */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-900 font-bold">Informasi Rekening Bank</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Digunakan untuk keperluan transfer gaji, komisi, atau pencairan dana staff.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Nama Bank</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA / Mandiri"
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Atas Nama (Pemilik)</label>
                  <input
                    type="text"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Sesuai buku tabungan"
                    className="w-full bg-neutral-50/70 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-neutral-900 text-amber-400 hover:bg-neutral-800 text-xs font-mono font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>

        </main>

      </div>
    </div>
  );
}