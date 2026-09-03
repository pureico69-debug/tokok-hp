"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { createClient } from "@/lib/supabase-client";

// --- TYPE DEFINITION SESUAI STRUCT TABEL SUPABASE ---
interface DebtReceivableItem {
  id: string;
  created_at: string;
  type: "piutang" | "utang";
  party_name: string;      // Sesuai DB: nama orang/pihak
  description: string;     // Sesuai DB: judul/keterangan
  total_amount: number;    // Sesuai DB: nominal
  paid_amount?: number;
  due_date?: string;       // Sesuai DB: tanggal jatuh tempo
  status: "Belum Lunas" | "Lunas";
}

// --- HELPER FORMATTING ---
const formatNumberWithDots = (val: string | number) => {
  if (!val && val !== 0) return "";
  const cleanNumber = val.toString().replace(/\D/g, "");
  if (!cleanNumber) return "";
  return new Intl.NumberFormat("id-ID").format(Number(cleanNumber));
};

const unformatNumber = (val: string) => {
  return Number(val.toString().replace(/\D/g, "")) || 0;
};

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export default function ReceivablesAndDebtsPage() {
  const supabase = createClient();

  // State User & Data
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<DebtReceivableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State (all, piutang, utang)
  const [activeTab, setActiveTab] = useState<"all" | "piutang" | "utang">("all");

  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DebtReceivableItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State Modal Hapus
  const [deletingItem, setDeletingItem] = useState<DebtReceivableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    type: "piutang" as "piutang" | "utang",
    description: "",
    party_name: "",
    total_amount: "",
    due_date: "",
    status: "Belum Lunas" as "Belum Lunas" | "Lunas",
  });

  // Load Data dari Supabase (Tabel: debts_and_receivables)
  const initData = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);

    const { data, error } = await supabase
      .from("debts_and_receivables")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data utang & piutang: " + error.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  // Form Input Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setFormData((prev) => ({ ...prev, total_amount: formatNumberWithDots(rawValue) }));
  };

  // Open Modal Create / Edit
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      type: "piutang",
      description: "",
      party_name: "",
      total_amount: "",
      due_date: "",
      status: "Belum Lunas",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DebtReceivableItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      description: item.description || "",
      party_name: item.party_name || "",
      total_amount: formatNumberWithDots(item.total_amount),
      due_date: item.due_date || "",
      status: item.status || "Belum Lunas",
    });
    setIsModalOpen(true);
  };

  // Submit Data ke Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = unformatNumber(formData.total_amount);
    if (!formData.description || !formData.party_name || numericAmount <= 0) {
      toast.error("Mohon lengkapi judul, nama pihak, dan nominal angka yang valid!");
      return;
    }

    setIsSubmitting(true);

    // Payload disesuaikan penuh dengan kolom di DB Supabase kamu
    const payload = {
      type: formData.type,
      description: formData.description,
      party_name: formData.party_name,
      total_amount: numericAmount,
      due_date: formData.due_date || null,
      status: formData.status,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("debts_and_receivables")
        .update(payload)
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Gagal memperbarui catatan: " + error.message);
      } else {
        toast.success("Catatan berhasil diperbarui!");
        setIsModalOpen(false);
        initData();
      }
    } else {
      const { error } = await supabase.from("debts_and_receivables").insert([payload]);

      if (error) {
        toast.error("Gagal menambahkan catatan: " + error.message);
      } else {
        toast.success("Catatan berhasil disimpan ke database!");
        setIsModalOpen(false);
        initData();
      }
    }

    setIsSubmitting(false);
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("debts_and_receivables")
      .delete()
      .eq("id", deletingItem.id);

    if (error) {
      toast.error("Gagal menghapus catatan: " + error.message);
    } else {
      toast.success("Catatan berhasil dihapus!");
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    }

    setIsDeleting(false);
    setDeletingItem(null);
  };

  // Filter Items
  const filteredItems = items.filter((item) => {
    if (activeTab === "piutang") return item.type === "piutang";
    if (activeTab === "utang") return item.type === "utang";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 text-neutral-900 font-sans">
      
      {/* 1. FOUNDER SIDEBAR */}
      <FounderSidebar />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        <HomeNavbar user={user} />

        {/* Inner Page Content */}
        <main className="p-8 space-y-6 max-w-7xl">
          
          {/* Header Title & Button Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-900">
                Catatan Utang & Piutang
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Kelola tagihan pelanggan (piutang) dan kewajiban bayar toko ke supplier (utang).
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Catat Utang / Piutang</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-neutral-900 text-amber-400 shadow-xs"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              Semua Data
            </button>
            <button
              onClick={() => setActiveTab("piutang")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "piutang"
                  ? "bg-neutral-900 text-amber-400 shadow-xs"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              Piutang (Tagihan Masuk)
            </button>
            <button
              onClick={() => setActiveTab("utang")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "utang"
                  ? "bg-neutral-900 text-amber-400 shadow-xs"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              Utang Toko (Kewajiban)
            </button>
          </div>

          {/* List Content Area */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
              DAFTAR TAGIHAN & KEWAJIBAN
            </h2>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Memuat catatan dari database...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Belum ada pencatatan utang atau piutang.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] font-mono uppercase text-neutral-400">
                      <th className="py-3 px-2">JENIS</th>
                      <th className="py-3 px-2">DESKRIPSI / KETERANGAN</th>
                      <th className="py-3 px-2">PELANGGAN / SUPPLIER</th>
                      <th className="py-3 px-2 text-right">NOMINAL</th>
                      <th className="py-3 px-2 text-center">JATUH TEMPO</th>
                      <th className="py-3 px-2 text-center">STATUS</th>
                      <th className="py-3 px-2 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-mono">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3.5 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              item.type === "piutang"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {item.type === "piutang" ? "Piutang" : "Utang"}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 font-bold text-neutral-900">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-2 text-neutral-700">{item.party_name}</td>
                        <td className={`py-3.5 px-2 text-right font-bold ${
                          item.type === "piutang" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {formatRupiah(item.total_amount)}
                        </td>
                        <td className="py-3.5 px-2 text-center text-neutral-500">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString("id-ID") : "-"}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "Lunas"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-800 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-700 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </main>
      </div>

      {/* 3. MODAL CATAT / EDIT UTANG PIUTANG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingItem ? "Edit Catatan Utang / Piutang" : "Catat Utang / Piutang Baru"}
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Rekap kewajiban toko atau tagihan pelanggan secara rapi.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Kategori Pencatatan
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900 font-medium"
                >
                  <option value="piutang">Piutang (Tagihan Pelanggan ke Kita)</option>
                  <option value="utang">Utang Toko (Kewajiban Toko ke Supplier)</option>
                </select>
              </div>

              {/* Judul & Pelanggan/Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Judul / Keterangan *
                  </label>
                  <input
                    type="text"
                    name="description"
                    required
                    placeholder="Contoh: DP Pembelian iPhone 15"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Nama Pihak (Pelanggan/Supplier) *
                  </label>
                  <input
                    type="text"
                    name="party_name"
                    required
                    placeholder="Contoh: PT Supplier Seluler / Budi"
                    value={formData.party_name}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  />
                </div>
              </div>

              {/* Nominal & Jatuh Tempo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Nominal (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      name="total_amount"
                      required
                      placeholder="0"
                      value={formData.total_amount}
                      onChange={handleAmountChange}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Jatuh Tempo (Opsional)
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Status Pembayaran
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                >
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-amber-400 bg-neutral-900 hover:bg-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : editingItem ? "Update Catatan" : "Simpan Catatan"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI HAPUS */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Hapus Catatan?</h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Apakah Anda yakin ingin menghapus catatan <span className="font-bold text-neutral-800">{deletingItem.description}</span>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Hapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}