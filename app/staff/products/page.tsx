"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { StaffSidebar } from "@/components/staff-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { toast } from "sonner";
import { Plus, Search, Filter, Smartphone, Eye, EyeOff, Upload, X, Edit, Trash2, CheckCircle2 } from "lucide-react";

export default function StaffProductsPage() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);

  // State Modal Form (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State Modal Konfirmasi Terjual yang Elegan
  const [soldConfirmModal, setSoldConfirmModal] = useState<{
    isOpen: boolean;
    product: any | null;
  }>({
    isOpen: false,
    product: null,
  });

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

  // Helper untuk memformat angka ke format Rupiah (12.500.000)
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

  // Helper untuk mengembalikan string rupiah ke angka murni (number)
  const parseRupiahToNumber = (rupiahString: string) => {
    if (!rupiahString) return 0;
    return Number(rupiahString.replace(/[^0-9]/g, ""));
  };

  const supabase = createClient();

  const fetchProducts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data katalog: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [supabase]);

  // Handle Upload Foto ke Supabase Storage
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

  // Hapus Foto dari preview
  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Sakelar Tampilan Landing Page
  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_featured: newStatus } : item))
    );

    const { error } = await supabase.from("products").update({ is_featured: newStatus }).eq("id", id);
    if (error) {
      toast.error("Gagal mengupdate tampilan landing page");
      fetchProducts();
    } else {
      toast.success(newStatus ? "Tampil di Landing Page!" : "Disembunyikan dari Landing Page.");
    }
  };

  // Shortcut Buka Modal Konfirmasi Status Sold
  const handleQuickMarkAsSold = (product: any) => {
    if (product.status === "sold") {
      toast.info("Unit ini sudah berstatus terjual.");
      return;
    }
    setSoldConfirmModal({ isOpen: true, product });
  };

  // Eksekusi Update ke Supabase
  const confirmMarkAsSold = async () => {
    const product = soldConfirmModal.product;
    if (!product) return;

    const { error } = await supabase
      .from("products")
      .update({
        status: "sold",
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      toast.error("Gagal mengubah status: " + error.message);
    } else {
      toast.success("Unit berhasil ditandai sebagai Terjual!");
      fetchProducts();
    }
    setSoldConfirmModal({ isOpen: false, product: null });
  };

  // Buka Modal Tambah / Edit
  const openModal = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        imei: product.imei || "",
        name: product.name || "",
        storage: product.storage || "128GB",
        color: product.color || "",
        price: product.price ? product.price.toLocaleString("id-ID") : "",
        cost_price: product.cost_price ? product.cost_price.toLocaleString("id-ID") : "",
        battery_health: product.battery_health?.toString() || "90",
        condition: product.condition || "Grade A (Mulus 98-99%)",
        imei_status: product.imei_status || "Sinyal All Operator (Permanen)",
        completeness: product.completeness || "Fullset Box Original",
        warranty: product.warranty || "Garansi Toko 1 Bulan",
        description: product.description || "",
        status: product.status || "available",
        is_featured: product.is_featured ?? true,
        images: product.images || [],
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  // Simpan Data Unit (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: any = {
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
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      const res = await supabase.from("products").update(payload).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("products").insert([payload]);
      error = res.error;
    }

    if (error) {
      toast.error("Gagal menyimpan unit: " + error.message);
    } else {
      toast.success(editingId ? "Data unit berhasil diperbarui!" : "Unit baru berhasil ditambahkan!");
      setIsModalOpen(false);
      fetchProducts();
    }
    setSaving(false);
  };

  // Hapus Unit
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus unit ini dari katalog?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus produk: " + error.message);
    } else {
      toast.success("Unit berhasil dihapus");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.imei?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storage?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-neutral-50/50 flex text-neutral-900 selection:bg-amber-200 selection:text-amber-900">
      <StaffSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 p-6 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Katalog & Stok iPhone
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                Kelola inventaris, data IMEI, kelengkapan, foto unit, dan etalase landing page.
              </p>
            </div>

            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-amber-400 hover:bg-neutral-800 text-xs font-mono font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Unit Baru</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari IMEI, tipe, warna, atau memori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Filter className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              {["all", "available", "sold"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium capitalize transition-all cursor-pointer ${
                    statusFilter === status
                      ? "bg-neutral-900 text-amber-400 font-bold shadow-2xs"
                      : "bg-white border border-neutral-200/80 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {status === "all" ? "Semua Status" : status === "available" ? "Tersedia" : "Terjual"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Katalog */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-neutral-400">Memuat data katalog...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Smartphone className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs font-mono text-neutral-500">Tidak ada unit iPhone yang ditemukan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      <th className="p-4 pl-6">Foto & IMEI / Model</th>
                      <th className="p-4">Varian & Condition</th>
                      <th className="p-4">BH & Status IMEI</th>
                      <th className="p-4">Harga & Margin</th>
                      <th className="p-4 text-center">Etalase Web</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 pl-6 flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-xl border border-neutral-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                              <Smartphone className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-neutral-900">{product.name}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                product.status === "sold" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {product.status === "sold" ? "Terjual" : "Tersedia"}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                              IMEI: <span className="font-semibold text-neutral-700">{product.imei || "-"}</span>
                            </p>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-neutral-600">
                          <p>{product.storage} • {product.color}</p>
                          <p className="text-[10px] text-neutral-400">{product.condition}</p>
                        </td>
                        <td className="p-4 font-mono space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 text-[10px]">
                            {product.battery_health}% BH
                          </span>
                          <p className="text-[10px] text-neutral-500">{product.imei_status}</p>
                        </td>
                        <td className="p-4 font-mono">
                          <p className="font-bold text-neutral-900">Rp {Number(product.price).toLocaleString("id-ID")}</p>
                          {product.cost_price > 0 && (
                            <p className="text-[10px] text-emerald-600 font-semibold">
                              Profit: +Rp {Number(product.price - product.cost_price).toLocaleString("id-ID")}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleFeatured(product.id, product.is_featured)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              product.is_featured
                                ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                : "bg-neutral-100 text-neutral-400 border border-neutral-200 hover:bg-neutral-200"
                            }`}
                          >
                            {product.is_featured ? <Eye className="w-3.5 h-3.5 text-amber-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{product.is_featured ? "Tampil" : "Sembunyi"}</span>
                          </button>
                        </td>
                        <td className="p-4 pr-6 text-right font-mono space-x-1">
                          {product.status !== "sold" && (
                            <button
                              onClick={() => handleQuickMarkAsSold(product)}
                              title="Tandai Terjual"
                              className="p-2 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Terjual</span>
                            </button>
                          )}
                          <button
                            onClick={() => openModal(product)}
                            title="Edit Unit"
                            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            title="Hapus Unit"
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Modal Konfirmasi Terjual yang Elegan */}
      {soldConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl font-mono">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 font-sans">
                Konfirmasi Unit Terjual
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Tandai <span className="font-bold text-neutral-800 font-sans">"{soldConfirmModal.product?.name}"</span> dengan IMEI <span className="text-neutral-700 font-semibold">{soldConfirmModal.product?.imei}</span> sebagai terjual sekarang?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSoldConfirmModal({ isOpen: false, product: null })}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmMarkAsSold}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs cursor-pointer transition-all shadow-sm"
              >
                Ya, Tandai Terjual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Unit Fleksibel (Tambah / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">
                {editingId ? "Edit Unit iPhone" : "Tambah Unit iPhone Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-mono text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                [ Tutup ]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-mono">
              
              {/* Multi Upload Foto Unit */}
              <div className="space-y-2">
                <label className="text-neutral-700 font-semibold flex items-center justify-between">
                  <span>Foto Fisik Unit (Multiple)</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Maksimal 5 Foto</span>
                </label>

                <div className="grid grid-cols-5 gap-3">
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
                      <span className="text-[9px] font-bold">{uploading ? "Uploading..." : "Upload"}</span>
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-700 font-semibold">Penyimpanan</label>
                  <select
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-700 font-semibold">Harga Modal (Rp) <span className="text-[10px] text-neutral-400 font-normal">(Internal)</span></label>
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
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Grade A (Mulus 98-99%)">Grade A (Mulus 98-99%)</option>
                    <option value="Grade B (Baret Halus Pemakaian)">Grade B (Baret Halus Pemakaian)</option>
                    <option value="Grade C (Dent Samping)">Grade C (Dent Samping)</option>
                    <option value="Like New (BBM / BNOB)">Like New (BBM / BNOB)</option>
                  </select>
                </div>
              </div>

              {/* Baris 5: Garansi & Kelengkapan Box */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-neutral-700 font-semibold">Kelengkapan Unit</label>
                  <select
                    value={formData.completeness}
                    onChange={(e) => setFormData({ ...formData, completeness: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Sinyal All Operator (Permanen)">Sinyal All Operator (Permanen)</option>
                    <option value="Garansi Resmi Indonesia (iBox/GDN)">Garansi Resmi Indonesia (iBox/GDN)</option>
                    <option value="Ex-Inter Terdaftar Bea Cukai">Ex-Inter Terdaftar Bea Cukai</option>
                    <option value="Garansi Sinyal 3 Bulan">Garansi Sinyal 3 Bulan</option>
                    <option value="Garansi Sinyal 1 Bulan">Garansi Sinyal 1 Bulan</option>
                  </select>
                </div>
              </div>

              {/* Deskripsi Tambahan */}
              <div className="space-y-1">
                <label className="text-neutral-700 font-semibold">Catatan / Catatan Khusus Unit</label>
                <textarea
                  rows={2}
                  placeholder="3utools hijau semua, kamera bening, garansi toko 1 bulan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl p-3 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Stok & Tampilan Web */}
              <div className="grid grid-cols-2 gap-4 pt-2">
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

                <div className="flex items-center justify-end gap-2">
                  <label className="text-neutral-700 font-semibold">Status Stok:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="border border-neutral-200 rounded-xl px-3 py-1.5 bg-neutral-50 font-bold cursor-pointer"
                  >
                    <option value="available">Tersedia</option>
                    <option value="sold">Terjual</option>
                  </select>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 text-amber-400 font-bold hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Menyimpan..." : editingId ? "Update Unit" : "Simpan Produk"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}