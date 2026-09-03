"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Megaphone, 
  Clock, 
  MapPin, 
  Share2, 
  ShieldAlert, 
  Save, 
  Store, 
  Plus, 
  Trash2,
  Upload,
  Layers,
  Loader2
} from "lucide-react";

export default function PengaturanWebsitePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State pengaturan umum
  const [settings, setSettings] = useState({
    whatsapp_number: "",
    store_address: "",
    store_hours: "",
    instagram_url: "",
    tiktok_url: "",
    maintenance_mode: "false",
  });

  // State khusus untuk list banner slider teks (Top Bar)
  const [banners, setBanners] = useState<any[]>([]);
  const [newBannerText, setNewBannerText] = useState("");

  // State khusus untuk Banner Promo Utama (Carousel Gambar)
  const [imageBanners, setImageBanners] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [newImageBanner, setNewImageBanner] = useState({
    title: "",
    link_url: "",
  });

  const supabase = createClient();

  const fetchImageBanners = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setImageBanners(data);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Ambil settings, announcements, & image banners secara parallel
      const [settingRes, bannerRes] = await Promise.all([
        supabase.from("settings").select("key, value"),
        supabase.from("announcements").select("*").order("created_at", { ascending: false })
      ]);

      if (settingRes.data) {
        const newSettings: any = {};
        settingRes.data.forEach((item) => {
          if (item.key === "whatsapp_number" && item.value.startsWith("62")) {
            newSettings[item.key] = item.value.slice(2);
          } else {
            newSettings[item.key] = item.value;
          }
        });
        setSettings((prev) => ({ ...prev, ...newSettings }));
      }

      if (bannerRes.data) {
        setBanners(bannerRes.data);
      }

      await fetchImageBanners();

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Handler Pilih File Gambar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handler Upload Gambar & Insert ke Database
  const handleAddImageBanner = async () => {
    if (!selectedFile) {
      toast.error("Pilih file gambar banner terlebih dahulu!");
      return;
    }

    try {
      setUploading(true);

      // 1. Upload Gambar ke Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `hero-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Dapatkan Public URL Gambar
      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // 3. Simpan Ke Tabel Database `banners`
      const { error: dbError } = await supabase.from("banners").insert([
        {
          image_url: imageUrl,
          title: newImageBanner.title.trim() || null,
          link_url: newImageBanner.link_url.trim() || null,
          is_active: true,
        },
      ]);

      if (dbError) throw dbError;

      // Reset Form
      setSelectedFile(null);
      setPreviewUrl("");
      setNewImageBanner({ title: "", link_url: "" });
      fetchImageBanners();
      toast.success("Banner promo gambar berhasil di-upload dan ditambahkan!");
    } catch (error: any) {
      toast.error("Gagal mengunggah banner: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleImageBanner = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengubah status banner");
    } else {
      fetchImageBanners();
      toast.success("Status banner berhasil diperbarui!");
    }
  };

  const handleDeleteImageBanner = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus banner");
    } else {
      setImageBanners(imageBanners.filter((b) => b.id !== id));
      toast.success("Banner gambar berhasil dihapus.");
    }
  };

  // Handler Banner Teks (Top Bar)
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerText.trim()) return;

    const { data, error } = await supabase
      .from("announcements")
      .insert([{ text: newBannerText, is_active: true }])
      .select();

    if (error) {
      toast.error("Gagal menambah banner: " + error.message);
    } else if (data) {
      setBanners([data[0], ...banners]);
      setNewBannerText("");
      toast.success("Banner promo berhasil ditambahkan!");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus banner");
    } else {
      setBanners(banners.filter((b) => b.id !== id));
      toast.success("Banner berhasil dihapus.");
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanWa = "62" + settings.whatsapp_number.replace(/^0+/, "");

    const updates = [
      { key: "whatsapp_number", value: cleanWa },
      { key: "store_address", value: settings.store_address },
      { key: "store_hours", value: settings.store_hours },
      { key: "instagram_url", value: settings.instagram_url },
      { key: "tiktok_url", value: settings.tiktok_url },
      { key: "maintenance_mode", value: settings.maintenance_mode },
    ];

    for (const item of updates) {
      await supabase
        .from("settings")
        .upsert({ key: item.key, value: item.value, updated_at: new Date() });
    }

    setSaving(false);
    toast.success("Semua pengaturan website berhasil disimpan!");
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex text-neutral-900 selection:bg-amber-200 selection:text-amber-900">
      <FounderSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} />

        <main className="flex-1 p-6 sm:p-10 max-w-5xl space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200/80">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Pengaturan Website & Toko
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                Kelola kontak, slider banner promosi, jam operasional, dan status sistem secara real-time.
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

          {loading ? (
            <div className="text-xs font-mono text-neutral-400 py-12 text-center">Memuat data pengaturan...</div>
          ) : (
            <form onSubmit={handleSaveAll} className="space-y-6">
              
              {/* CARD: BANNER PROMO UTAMA (UPLOAD FILE GAMBAR) */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Banner Promo Utama (Carousel Gambar User)</h2>
                    <p className="text-xs text-neutral-500 font-mono">Upload foto banner promo besar yang tampil di halaman depan user.</p>
                  </div>
                </div>

                {/* Form Upload File Banner */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-4">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block font-bold">
                    + Upload Banner Promo Baru
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    {/* Area Pilih File */}
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-neutral-300 hover:border-amber-500 rounded-2xl cursor-pointer bg-white transition-all">
                        <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                        <span className="text-xs font-mono text-neutral-600 font-bold">Pilih Gambar Banner</span>
                        <span className="text-[10px] text-neutral-400 font-mono">PNG, JPG, WEBP (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Preview Gambar */}
                    {previewUrl ? (
                      <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-neutral-200 border border-neutral-200">
                        <img src={previewUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">Preview</span>
                      </div>
                    ) : (
                      <div className="h-32 w-full rounded-2xl border border-neutral-200/80 bg-neutral-100/50 flex items-center justify-center text-xs font-mono text-neutral-400">
                        Belum Ada File Dipilih
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <input
                      type="text"
                      value={newImageBanner.title}
                      onChange={(e) => setNewImageBanner({ ...newImageBanner, title: e.target.value })}
                      placeholder="Judul Banner Promo (Opsional)"
                      className="bg-white border border-neutral-200/80 rounded-xl px-4 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                    <input
                      type="text"
                      value={newImageBanner.link_url}
                      onChange={(e) => setNewImageBanner({ ...newImageBanner, link_url: e.target.value })}
                      placeholder="Link Redirect Saat Diklik (Contoh: /user/katalog)"
                      className="bg-white border border-neutral-200/80 rounded-xl px-4 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddImageBanner}
                    disabled={uploading || !selectedFile}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-mono text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Upload & Tambah Banner</span>
                      </>
                    )}
                  </button>
                </div>

                {/* List Banner Gambar Aktif */}
                <div className="space-y-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block">Daftar Banner Aktif ({imageBanners.length})</label>
                  {imageBanners.length === 0 ? (
                    <p className="text-xs text-neutral-400 font-mono py-2">Belum ada banner promo gambar yang ditambahkan.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {imageBanners.map((b) => (
                        <div key={b.id} className={`bg-neutral-50 border border-neutral-200/80 rounded-2xl p-3 space-y-3 ${!b.is_active ? "opacity-50" : ""}`}>
                          <div className="relative h-32 w-full rounded-xl overflow-hidden bg-neutral-200 border border-neutral-200/60">
                            <img src={b.image_url} alt={b.title || "Banner Promo"} className="w-full h-full object-cover" />
                            <span className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${b.is_active ? "bg-emerald-500 text-white" : "bg-neutral-500 text-white"}`}>
                              {b.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-xs font-mono">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-neutral-900 truncate">{b.title || "Tanpa Judul"}</p>
                              <p className="text-[10px] text-neutral-400 truncate">{b.link_url || "Tanpa Link Redirect"}</p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleImageBanner(b.id, b.is_active)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border border-neutral-200 hover:bg-white transition-all cursor-pointer"
                              >
                                {b.is_active ? "Sembunyikan" : "Aktifkan"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteImageBanner(b.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Banner"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD: BANNER PROMOSI SLIDER (TOP BAR TEKS) */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Slider Banner Promosi (Top Bar Teks)</h2>
                    <p className="text-xs text-neutral-500 font-mono">Tambah dan atur daftar teks promo yang akan bergeser otomatis di atas web.</p>
                  </div>
                </div>

                {/* Form Tambah Banner */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBannerText}
                    onChange={(e) => setNewBannerText(e.target.value)}
                    placeholder="Tulis info promo baru (contoh: Diskon kilat akhir pekan...)"
                    className="flex-1 bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddBanner}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-mono text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>

                {/* List Banner Aktif */}
                <div className="space-y-2.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block">Daftar Banner Berjalan ({banners.length})</label>
                  {banners.length === 0 ? (
                    <p className="text-xs text-neutral-400 font-mono py-2">Belum ada banner promo yang ditambahkan.</p>
                  ) : (
                    banners.map((banner) => (
                      <div key={banner.id} className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-xs font-mono">
                        <span className="text-neutral-800 font-medium truncate">✨ {banner.text}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Hapus Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CARD: KONTAK & WHATSAPP */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Kontak Utama (WhatsApp)</h2>
                    <p className="text-xs text-neutral-500 font-mono">Nomor tujuan chat interaksi produk dengan pelanggan.</p>
                  </div>
                </div>

                <div className="pt-2 max-w-md">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block mb-2">
                    Nomor WhatsApp CS
                  </label>
                  <div className="flex items-center shadow-2xs rounded-xl overflow-hidden border border-neutral-200/80 focus-within:border-amber-500 bg-white">
                    <div className="bg-neutral-100 border-r border-neutral-200 px-4 py-3 text-xs font-mono text-neutral-500 font-bold select-none">
                      +62
                    </div>
                    <input
                      type="text"
                      value={settings.whatsapp_number}
                      onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                      placeholder="81234567890"
                      className="w-full bg-transparent px-4 py-3 text-xs text-neutral-900 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CARD: JAM & LOKASI TOKO */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Informasi Store & Operasional</h2>
                    <p className="text-xs text-neutral-500 font-mono">Alamat fisik toko dan jam operasional layanan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" /> Jam Operasional
                    </label>
                    <input
                      type="text"
                      value={settings.store_hours}
                      onChange={(e) => handleChange("store_hours", e.target.value)}
                      placeholder="10.00 - 21.00 WIB"
                      className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" /> Alamat Toko Fisik
                    </label>
                    <input
                      type="text"
                      value={settings.store_address}
                      onChange={(e) => handleChange("store_address", e.target.value)}
                      placeholder="Jl. Sudirman No. 45, Jakarta"
                      className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* CARD: MEDIA SOSIAL */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Tautan Media Sosial</h2>
                    <p className="text-xs text-neutral-500 font-mono">Link Instagram dan TikTok resmi toko.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block">Link Instagram</label>
                    <input
                      type="text"
                      value={settings.instagram_url}
                      onChange={(e) => handleChange("instagram_url", e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block">Link TikTok</label>
                    <input
                      type="text"
                      value={settings.tiktok_url}
                      onChange={(e) => handleChange("tiktok_url", e.target.value)}
                      placeholder="https://tiktok.com/@..."
                      className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* CARD: MAINTENANCE MODE */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Mode Pemeliharaan (Maintenance)</h2>
                    <p className="text-xs text-neutral-500 font-mono">Aktifkan untuk menutup akses web sementara saat ada perbaikan sistem.</p>
                  </div>
                </div>

                <div className="pt-2 max-w-xs">
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block mb-2">Status Website</label>
                  <select
                    value={settings.maintenance_mode}
                    onChange={(e) => handleChange("maintenance_mode", e.target.value)}
                    className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3 text-xs font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="false">Normal (Website Beroperasi)</option>
                    <option value="true">Maintenance (Tutup Sementara)</option>
                  </select>
                </div>
              </div>

            </form>
          )}

        </main>
      </div>
    </div>
  );
}