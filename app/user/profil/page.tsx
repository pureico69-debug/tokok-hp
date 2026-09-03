"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Camera, User, Phone, Mail, MapPin, ShieldCheck } from "lucide-react";

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

  // State form alamat pengiriman (pengganti rekening bank)
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

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
        
        // Data alamat (pastikan kolom ini ada atau nanti bisa disesuaikan di database)
        setAddress(data.address || "");
        setCity(data.city || "");
        setPostalCode(data.postal_code || "");
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

  // Simpan Perubahan Profil (Termasuk Alamat)
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
        address: address,
        city: city,
        postal_code: postalCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Gagal memperbarui profil: " + error.message);
    } else {
      toast.success("Profil dan alamat pengiriman berhasil diperbarui!");
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
    <div className="min-h-screen bg-neutral-100/60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/40 via-neutral-50/50 to-neutral-100/60 text-neutral-900 flex flex-col selection:bg-amber-200 selection:text-amber-900">
      
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Kiri (Menggunakan md:sticky agar di HP tidak ikut melayang/menutupi konten) */}
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

        {/* Konten Kanan (Form Profil) */}
        <main className="flex-1 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Personal Profile</h1>
              <p className="text-xs text-neutral-500 mt-1">Kelola foto profil, informasi identitas, dan alamat pengiriman Anda.</p>
            </div>
            
            {/* Quick Status Badge */}
            <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/60 px-3.5 py-2 rounded-2xl text-xs font-mono text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Akun Terverifikasi</span>
            </div>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-neutral-100 flex-wrap gap-4 bg-neutral-50/50 p-5 rounded-2xl border border-neutral-200/60">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-neutral-900 text-amber-400 font-bold font-mono text-2xl flex items-center justify-center overflow-hidden shadow-md border-2 border-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase()
                  )}
                </div>
                
                <label className="absolute inset-0 bg-neutral-950/70 text-white rounded-2xl flex flex-col items-center justify-center text-[10px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-2xs gap-1">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>{uploading ? "Proses..." : "Ganti"}</span>
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
                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  {user?.email}
                </p>
              </div>
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Hapus Foto
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Bagian Identitas Utama */}
            <div className="space-y-4 bg-neutral-50/40 p-5 rounded-2xl border border-neutral-200/60">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-700 font-bold flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-600" />
                Informasi Pribadi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Nomor Handphone / WhatsApp</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-medium text-neutral-700">Alamat Email <span className="text-neutral-400 font-normal">(Tidak dapat diubah)</span></label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-neutral-100/80 border border-neutral-200/80 rounded-xl px-4 py-3 text-xs text-neutral-400 cursor-not-allowed font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* Bagian Alamat Pengiriman (Pengganti Rekening Bank) */}
            <div className="space-y-4 bg-neutral-50/40 p-5 rounded-2xl border border-neutral-200/60">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-900 font-bold flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Alamat Pengiriman Utama
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Digunakan untuk mempercepat proses pengiriman pesanan iPhone atau gadget Anda.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-mono font-medium text-neutral-700">Alamat Lengkap (Jalan, No. Rumah, Patokan)</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Merdeka No. 45, RT 01/02"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-2xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-neutral-700">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Contoh: Jakarta Selatan"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-neutral-700">Kode Pos</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Contoh: 12950"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
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