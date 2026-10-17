"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";

export default function PriceListPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"ibox" | "beacukai" | "inter">("ibox");

  // State Data Supabase
  const [priceList, setPriceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State Modal Tambah / Edit Varian
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // State Form Input
  const [formModel, setFormModel] = useState("iPhone 13");
  const [formStorage, setFormStorage] = useState("128GB");
  const [formRegion, setFormRegion] = useState<"ibox" | "beacukai" | "inter">("ibox");
  const [formTradeInMin, setFormTradeInMin] = useState<number | "">(6000000);
  const [formTradeInMax, setFormTradeInMax] = useState<number | "">(6500000);
  const [formSellEstimate, setFormSellEstimate] = useState<number | "">(8000000);

  const supabase = createClient();

  // Fetch Data dari Supabase (`price_list`)
  const fetchPriceList = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("price_list")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setPriceList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchPriceList();
    };
    initData();
  }, [supabase]);

  // Format Tanggal Terakhir Diperbarui (Relatif / Waktu Lokal)
  const formatLastUpdated = (dateString: string) => {
    if (!dateString) return "Baru saja";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Buka Modal Tambah Baru
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormModel("iPhone 13");
    setFormStorage("128GB");
    setFormRegion(selectedRegion);
    setFormTradeInMin(6000000);
    setFormTradeInMax(6500000);
    setFormSellEstimate(8000000);
    setIsModalOpen(true);
  };

  // Buka Modal Edit Harga
  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setFormModel(item.model);
    setFormStorage(item.storage);
    setFormRegion(item.region);
    setFormTradeInMin(item.trade_in_min);
    setFormTradeInMax(item.trade_in_max);
    setFormSellEstimate(item.sell_estimate);
    setIsModalOpen(true);
  };

  // Save / Update ke Supabase
  const handleSaveVarian = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      model: formModel,
      storage: formStorage,
      region: formRegion,
      trade_in_min: Number(formTradeInMin) || 0,
      trade_in_max: Number(formTradeInMax) || 0,
      sell_estimate: Number(formSellEstimate) || 0,
      status: "Active",
      updated_at: new Date().toISOString(),
    };

    if (editingItem) {
      await supabase.from("price_list").update(payload).eq("id", editingItem.id);
    } else {
      await supabase.from("price_list").insert([payload]);
    }

    setSaving(false);
    setIsModalOpen(false);
    fetchPriceList();
  };

  // Filter Berdasarkan Region & Pencarian
  const filteredPrices = priceList.filter(
    (item) =>
      item.region === selectedRegion &&
      (item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.storage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-neutral-50/50 text-neutral-900 font-sans">
      
      {/* 1. SIDEBAR KIRI FOUNDER */}
      <FounderSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* 2. AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Bar */}
        <HomeNavbar 
          user={user} 
          onOpenMobileSidebar={() => setMobileOpen(true)} 
        />

        {/* Isian Fitur Price List */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Header & Informasi Master Price List */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Master Price List Store
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REALTIME ACUAN
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Database acuan harga beli trade-in & target resell toko. Cukup update ketika ada perubahan harga pasar.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddModal}
                className="bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>+</span> Tambah Varian Model
              </button>
            </div>
          </div>

          {/* Filter Region & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Tab Garansi / Region */}
            <div className="flex bg-neutral-200/60 p-1 rounded-xl border border-neutral-200 text-xs font-semibold self-start">
              <button
                onClick={() => setSelectedRegion("ibox")}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedRegion === "ibox"
                    ? "bg-white text-neutral-900 shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Ex iBox / Digimap (PA/A)
              </button>
              <button
                onClick={() => setSelectedRegion("beacukai")}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedRegion === "beacukai"
                    ? "bg-white text-neutral-900 shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Beacukai Official
              </button>
              <button
                onClick={() => setSelectedRegion("inter")}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedRegion === "inter"
                    ? "bg-white text-neutral-900 shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Inter (Non-Beacukai)
              </button>
            </div>

            {/* Input Search */}
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Cari model iPhone (ex: 13 Pro)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-amber-500 shadow-2xs font-mono"
              />
            </div>
          </div>

          {/* Tabel Master Price List */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <p className="text-xs font-mono font-bold text-neutral-600 uppercase">
                Daftar Acuan Pasaran Aktif
              </p>
              <span className="text-[11px] font-mono text-neutral-400">
                {filteredPrices.length} Varian Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600">
                <thead className="bg-neutral-50 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-100">
                  <tr>
                    <th className="p-4">Model & Varian</th>
                    <th className="p-4">Kapasitas</th>
                    <th className="p-4">Range Beli Trade-In</th>
                    <th className="p-4">Target Resell Store</th>
                    <th className="p-4">Terakhir Diperbarui</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        Memuat master data acuan dari Supabase...
                      </td>
                    </tr>
                  ) : filteredPrices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        Belum ada data acuan harga untuk kategori ini.
                      </td>
                    </tr>
                  ) : (
                    filteredPrices.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="p-4 font-bold text-neutral-900 font-sans">
                          {item.model}
                        </td>
                        <td className="p-4">
                          <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                            {item.storage}
                          </span>
                        </td>
                        <td className="p-4 text-amber-700 font-semibold">
                          IDR {Number(item.trade_in_min).toLocaleString("id-ID")} - {Number(item.trade_in_max).toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-emerald-700 font-semibold">
                          IDR {Number(item.sell_estimate).toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-neutral-500 text-[11px]">
                          {formatLastUpdated(item.updated_at)}
                        </td>
                        <td className="p-4 text-right space-x-2 font-sans">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Edit Harga
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Tips Operasional */}
          <div className="bg-neutral-900 text-neutral-300 p-5 rounded-2xl border border-neutral-800 text-xs space-y-2">
            <p className="font-mono font-bold text-amber-400 text-[11px] uppercase tracking-wider">
              ⚡ Keunggulan Master Price Hidup:
            </p>
            <p className="text-neutral-400 leading-relaxed">
              Kamu tidak perlu repot memasukkan ulang harga setiap bulan. Cukup klik <b>Edit Harga</b> pada varian yang harganya berubah di pasaran. Sistem kalkulator Trade-In akan langsung mengambil patokan terbaru dari tabel ini.
            </p>
          </div>

        </main>
      </div>

      {/* 3. MODAL POP-UP TAMBAH / EDIT VARIAN MODEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">
                {editingItem ? `Edit Harga: ${editingItem.model} ${editingItem.storage}` : "Tambah Varian Model"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVarian} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Model iPhone</label>
                <select
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-amber-500"
                >
                  <option>iPhone 11</option>
                  <option>iPhone 11 Pro / Pro Max</option>
                  <option>iPhone 12 / 12 Mini</option>
                  <option>iPhone 12 Pro / Pro Max</option>
                  <option>iPhone 13 / 13 Mini</option>
                  <option>iPhone 13 Pro / Pro Max</option>
                  <option>iPhone 14 / 14 Plus</option>
                  <option>iPhone 14 Pro / Pro Max</option>
                  <option>iPhone 15 / 15 Plus</option>
                  <option>iPhone 15 Pro / Pro Max</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Storage</label>
                  <select
                    value={formStorage}
                    onChange={(e) => setFormStorage(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option>64GB</option>
                    <option>128GB</option>
                    <option>256GB</option>
                    <option>512GB</option>
                    <option>1TB</option>
                    <option>2TB</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Garansi / Region</label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="ibox">Ex iBox (PA/A)</option>
                    <option value="beacukai">Beacukai Official</option>
                    <option value="inter">Inter (Non-Beacukai)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Harga Beli Min (IDR)</label>
                  <input
                    type="number"
                    value={formTradeInMin}
                    onChange={(e) => setFormTradeInMin(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none focus:border-amber-500"
                    placeholder="6000000"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Harga Beli Max (IDR)</label>
                  <input
                    type="number"
                    value={formTradeInMax}
                    onChange={(e) => setFormTradeInMax(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none focus:border-amber-500"
                    placeholder="6500000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Target Resell Store (IDR)</label>
                <input
                  type="number"
                  value={formSellEstimate}
                  onChange={(e) => setFormSellEstimate(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-mono focus:outline-none focus:border-amber-500"
                  placeholder="8000000"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-2.5 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}