"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { StaffSidebar } from "@/components/staff-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, X, ArrowLeft, Smartphone } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const initialForm = {
    imei: "",
    name: "",
    storage: "128GB",
    color: "",
    price: "",
    cost_price: "",
    battery_health: "90",
    condition: "Grade A (Mulus 98-99%)",
    imei_status: "Sinyal All Operator (Permanen)",
    completeness: "Fullset Box Original",
    warranty: "Garansi Toko 1 Bulan",
    description: "",
    status: "available",
    is_featured: true,
    images: [] as string[],
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  // Helper Format Rupiah
  const formatInputRupiah = (value: string) => {
    if (!value) return "";
    const numberString = value.replace(/[^,\d]/g, "").toString();
    const split = numberString.split(",");
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
    return rupiah;
  };

  const parseRupiahToNumber = (rupiahString: string) => {
    if (!rupiahString) return 0;
    return Number(rupiahString.replace(/[^0-9]/g, ""));
  };

  // Upload Foto ke Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `units/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Gagal upload foto ${file.name}: ${uploadError.message}`);
      } else {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));

    setUploading(false);
    toast.success(`${uploadedUrls.length} foto berhasil diunggah!`);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Simpan Unit Baru ke Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      imei: formData.imei,
      name: formData.name,
      storage: formData.storage,
      color: formData.color,
      price: parseRupiahToNumber(formData.price),
      cost_price: formData.cost_price ? parseRupiahToNumber(formData.cost_price) : 0,
      battery_health: Number(formData.battery_health),
      condition: formData.condition,
      imei_status: formData.imei_status,
      completeness: formData.completeness,
      warranty: formData.warranty,
      description: formData.description,
      status: formData.status,
      is_featured: formData.is_featured,
      images: formData.images,
    };

    const { error } = await supabase.from("products").insert([payload]);

    if (error) {
      toast.error("Gagal menyimpan unit: " + error.message);
      setSaving(false);
    } else {
      toast.success("Unit iPhone baru berhasil ditambahkan!");
      router.push("/staff/products");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex text-neutral-900 selection:bg-amber-200 selection:text-amber-900">
      <StaffSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-8">
          
          {/* Header & Tombol Kembali */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200/80">
            <div className="space-y-1">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Katalog</span>
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Tambah Unit iPhone Baru
              </h1>
              <p className="text-xs text-neutral-500 font-mono">
                Masukkan detail fisik, kelengkapan, IMEI, dan harga unit baru ke database.
              </p>
            </div>
          </div>

          {/* Form Utama */}
          <form onSubmit={handleSubmit} className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs text-xs font-mono">
            
            {/* Multi Upload Foto Unit */}
            <div className="space-y-2">
              <label className="text-neutral-700 font-semibold flex items-center justify-between">
                <span>Foto Fisik Unit (Multiple)</span>
                <span className="text-[10px] text-neutral-400 font-normal">Maksimal 5 Foto</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {formData.images.length < 5 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-200 hover:border-amber-500 bg-neutral-50 flex flex-col items-center justify-center cursor-pointer text-neutral-400 hover:text-amber-600 transition-all">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold">{uploading ? "Uploading..." : "Upload Foto"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Baris 1: IMEI & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Nomor IMEI (15 Digit)</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="356789012345678"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Model iPhone</label>
                <input
                  type="text"
                  required
                  placeholder="iPhone 13 Pro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Baris 2: Storage & Warna */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Penyimpanan</label>
                <select
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Warna Unit</label>
                <input
                  type="text"
                  required
                  placeholder="Sierra Blue / Graphite / Starlight"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Baris 3: Harga Modal & Harga Jual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">
                  Harga Modal (Rp) <span className="text-[10px] text-neutral-400 font-normal">(Internal)</span>
                </label>
                <input
                  type="text"
                  placeholder="7.500.000"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: formatInputRupiah(e.target.value) })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Harga Jual (Rp)</label>
                <input
                  type="text"
                  required
                  placeholder="8.500.000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: formatInputRupiah(e.target.value) })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Baris 4: Battery Health & Grade Kondisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Battery Health (%)</label>
                <input
                  type="number"
                  required
                  placeholder="88"
                  value={formData.battery_health}
                  onChange={(e) => setFormData({ ...formData, battery_health: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Kondisi / Grade Fisik</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Grade A (Mulus 98-99%)">Grade A (Mulus 98-99%)</option>
                  <option value="Grade B (Baret Halus Pemakaian)">Grade B (Baret Halus Pemakaian)</option>
                  <option value="Grade C (Dent Samping)">Grade C (Dent Samping)</option>
                  <option value="Like New (BBM / BNOB)">Like New (BBM / BNOB)</option>
                </select>
              </div>
            </div>

            {/* Baris 5: Kelengkapan & Status IMEI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Kelengkapan Unit</label>
                <select
                  value={formData.completeness}
                  onChange={(e) => setFormData({ ...formData, completeness: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Fullset Box Original">Fullset Box Original</option>
                  <option value="Fullset OEM Box">Fullset OEM Box</option>
                  <option value="Unit Only (Batangan)">Unit Only (Batangan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Status Legalitas IMEI</label>
                <select
                  value={formData.imei_status}
                  onChange={(e) => setFormData({ ...formData, imei_status: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Sinyal All Operator (Permanen)">Sinyal All Operator (Permanen)</option>
                  <option value="Garansi Resmi Indonesia (iBox/GDN)">Garansi Resmi Indonesia (iBox/GDN)</option>
                  <option value="Ex-Inter Terdaftar Bea Cukai">Ex-Inter Terdaftar Bea Cukai</option>
                  <option value="Garansi Sinyal 3 Bulan">Garansi Sinyal 3 Bulan</option>
                  <option value="Garansi Sinyal 1 Bulan">Garansi Sinyal 1 Bulan</option>
                </select>
              </div>
            </div>

            {/* Deskripsi / Catatan Khusus */}
            <div className="space-y-1">
              <label className="text-neutral-700 font-semibold">Catatan / Keterangan Khusus Unit</label>
              <textarea
                rows={3}
                placeholder="3utools hijau semua, kamera bening, layar original..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-neutral-200 rounded-xl p-3 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Status Tampilan Web & Stok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="is_featured" className="text-neutral-800 font-medium cursor-pointer">
                  Tampilkan di Landing Page
                </label>
              </div>

              <div className="flex items-center sm:justify-end gap-2">
                <label className="text-neutral-700 font-semibold">Status Stok:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="border border-neutral-200 rounded-xl px-3 py-1.5 bg-neutral-50 font-bold"
                >
                  <option value="available">Tersedia</option>
                  <option value="sold">Terjual</option>
                </select>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2.5 rounded-xl bg-neutral-900 text-amber-400 font-bold hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {saving ? "Menyimpan ke Database..." : "Simpan Unit Baru"}
              </button>
            </div>

          </form>

        </main>
      </div>
    </div>
  );
}