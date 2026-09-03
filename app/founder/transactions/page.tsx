"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { createClient } from "@/lib/supabase-client";

// --- TYPE DEFINITION ---
interface Transaction {
  id: string;
  transaction_code: string;
  created_at: string;
  type: "penjualan" | "trade_in" | "pembelian_stok" | "pengeluaran_operasional";
  description: string;
  customer_or_vendor: string;
  amount: number;
  payment_method: "QRIS" | "Transfer Bank" | "Cash";
  status: "Lunas" | "Pending" | "Dibatalkan";
}

// --- HELPER FORMATTING CURRENCY INPUT ---
const formatNumberWithDots = (val: string | number) => {
  if (!val && val !== 0) return "";
  const cleanNumber = val.toString().replace(/\D/g, "");
  if (!cleanNumber) return "";
  return new Intl.NumberFormat("id-ID").format(Number(cleanNumber));
};

const unformatNumber = (val: string) => {
  return Number(val.replace(/\D/g, "")) || 0;
};

// Helper tanggal hari ini
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper tanggal awal bulan ini
const getStartOfMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

export default function TransactionsAndFinancePage() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(getStartOfMonthString());
  const [endDate, setEndDate] = useState<string>(getTodayDateString());

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    type: "penjualan",
    description: "",
    customer_or_vendor: "",
    amount: "",
    payment_method: "QRIS",
    status: "Lunas",
    transaction_date: getTodayDateString(),
  });

  const initData = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data transaksi: " + error.message);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatNumberWithDots(rawValue);
    setFormData((prev) => ({ ...prev, amount: formatted }));
  };

  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setFormData({
      type: "penjualan",
      description: "",
      customer_or_vendor: "",
      amount: "",
      payment_method: "QRIS",
      status: "Lunas",
      transaction_date: getTodayDateString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trx: Transaction) => {
    setEditingTransaction(trx);
    const existingDate = trx.created_at ? trx.created_at.slice(0, 10) : getTodayDateString();
    
    setFormData({
      type: trx.type,
      description: trx.description || "",
      customer_or_vendor: trx.customer_or_vendor || "",
      amount: trx.amount ? formatNumberWithDots(trx.amount) : "",
      payment_method: trx.payment_method || "QRIS",
      status: trx.status || "Lunas",
      transaction_date: existingDate,
    });
    setIsModalOpen(true);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.customer_or_vendor || !formData.amount || !formData.transaction_date) {
      toast.error("Mohon isi semua field yang wajib!");
      return;
    }

    const numericAmount = unformatNumber(formData.amount);
    if (numericAmount <= 0) {
      toast.error("Nominal transaksi harus berupa angka valid!");
      return;
    }

    setIsSubmitting(true);
    const customCreatedAt = new Date(`${formData.transaction_date}T12:00:00`).toISOString();

    if (editingTransaction) {
      const payload = {
        type: formData.type,
        description: formData.description,
        customer_or_vendor: formData.customer_or_vendor,
        amount: numericAmount,
        payment_method: formData.payment_method,
        status: formData.status,
        created_at: customCreatedAt,
      };

      const { error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", editingTransaction.id);

      if (error) {
        toast.error("Gagal memperbarui transaksi: " + error.message);
      } else {
        toast.success("Transaksi berhasil diperbarui!");
        setIsModalOpen(false);
        initData();
      }
    } else {
      const dateCodeStr = formData.transaction_date.replace(/-/g, "");
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const transaction_code = `TRX-${dateCodeStr}-${randomCode}`;

      const payload = {
        transaction_code,
        type: formData.type,
        description: formData.description,
        customer_or_vendor: formData.customer_or_vendor,
        amount: numericAmount,
        payment_method: formData.payment_method,
        status: formData.status,
        created_at: customCreatedAt,
      };

      const { error } = await supabase.from("transactions").insert([payload]);

      if (error) {
        toast.error("Gagal mencatat transaksi: " + error.message);
      } else {
        toast.success("Transaksi berhasil dicatat!");
        setIsModalOpen(false);
        initData();
      }
    }

    setIsSubmitting(false);
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    setIsDeleting(true);
    const targetId = deletingTransaction.id;

    setTransactions((prev) => prev.filter((item) => item.id !== targetId));

    const { error } = await supabase.from("transactions").delete().eq("id", targetId);

    if (error) {
      toast.error("Gagal menghapus transaksi: " + error.message);
      initData();
    } else {
      toast.success("Transaksi berhasil dihapus");
    }

    setIsDeleting(false);
    setDeletingTransaction(null);
  };

  const filteredTransactions = transactions.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch =
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.transaction_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer_or_vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const itemDate = item.created_at ? item.created_at.slice(0, 10) : "";
    const matchesDateRange = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);

    return matchesType && matchesSearch && matchesDateRange;
  });

  const totalPemasukan = filteredTransactions
    .filter((t) => (t.type === "penjualan" || t.type === "trade_in") && t.status === "Lunas")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalPengeluaran = filteredTransactions
    .filter((t) => (t.type === "pembelian_stok" || t.type === "pengeluaran_operasional") && t.status === "Lunas")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const netBalance = totalPemasukan - totalPengeluaran;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-neutral-900 font-sans">
      <FounderSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} />

        <main className="p-8 space-y-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-900">Data Transaksi & Keuangan</h1>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Rekap kas toko, transaksi penjualan, trade-in, dan operasional real-time.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Catat Transaksi Baru</span>
            </button>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-neutral-500 whitespace-nowrap">Rentang Tanggal:</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-800 outline-none cursor-pointer"
              />
              <span className="text-xs font-mono text-neutral-400">s/d</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-800 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => {
                setStartDate(getStartOfMonthString());
                setEndDate(getTodayDateString());
              }}
              className="text-xs font-mono text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
            >
              Reset Filter Waktu
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
              <p className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">Total Pemasukan (Omset)</p>
              <p className="text-2xl font-black text-emerald-600 mt-2">{formatRupiah(totalPemasukan)}</p>
              <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
            </div>

            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs relative overflow-hidden">
              <p className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">Total Pengeluaran</p>
              <p className="text-2xl font-black text-rose-600 mt-2">{formatRupiah(totalPengeluaran)}</p>
              <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-2xs relative overflow-hidden text-white">
              <p className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">Arus Kas Bersih (Net)</p>
              <p className="text-2xl font-black text-amber-400 mt-2">{formatRupiah(netBalance)}</p>
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400"></div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {[
                { id: "all", label: "Semua Transaksi" },
                { id: "penjualan", label: "Penjualan" },
                { id: "trade_in", label: "Trade-In" },
                { id: "pembelian_stok", label: "Beli Stok" },
                { id: "pengeluaran_operasional", label: "Operasional" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterType === tab.id
                      ? "bg-neutral-900 text-amber-400 shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Cari Kode, deskripsi, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
            />
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                Riwayat Transaksi Keuangan
              </h2>
              <span className="text-xs font-mono text-neutral-500">
                {filteredTransactions.length} Transaksi Ditemukan
              </span>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Memuat data transaksi dari database...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-400">
                  Tidak ada transaksi pada rentang waktu tersebut.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] font-mono uppercase text-neutral-400">
                      <th className="py-3 px-2">KODE / WAKTU</th>
                      <th className="py-3 px-2">KATEGORI</th>
                      <th className="py-3 px-2">DESKRIPSI</th>
                      <th className="py-3 px-2">PELANGGAN / VENDOR</th>
                      <th className="py-3 px-2">METODE</th>
                      <th className="py-3 px-2 text-right">NOMINAL</th>
                      <th className="py-3 px-2 text-center">STATUS</th>
                      <th className="py-3 px-2 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredTransactions.map((trx) => {
                      const isDebit = trx.type === "penjualan" || trx.type === "trade_in";
                      return (
                        <tr key={trx.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-2 font-mono">
                            <p className="font-bold text-neutral-900">{trx.transaction_code}</p>
                            <p className="text-[10px] text-neutral-400">{formatDate(trx.created_at)}</p>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                              trx.type === "penjualan" ? "bg-emerald-100 text-emerald-800" :
                              trx.type === "trade_in" ? "bg-amber-100 text-amber-800" :
                              trx.type === "pembelian_stok" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {trx.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 font-semibold text-neutral-800">{trx.description}</td>
                          <td className="py-3.5 px-2 font-mono text-neutral-600">{trx.customer_or_vendor}</td>
                          <td className="py-3.5 px-2 font-mono text-neutral-600">{trx.payment_method}</td>
                          <td className={`py-3.5 px-2 font-mono font-bold text-right ${isDebit ? "text-emerald-600" : "text-rose-600"}`}>
                            {isDebit ? "+" : "-"}{formatRupiah(Number(trx.amount))}
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              trx.status === "Lunas" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                              trx.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                              "bg-rose-50 text-rose-600 border border-rose-200"
                            }`}>
                              {trx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(trx)}
                                className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 text-neutral-700 hover:text-amber-800 text-[11px] font-mono font-bold transition-all cursor-pointer"
                                title="Edit Transaksi"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => setDeletingTransaction(trx)}
                                className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-700 text-[11px] font-mono font-bold transition-all cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingTransaction ? "Edit Transaksi" : "Catat Transaksi Baru"}
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  {editingTransaction
                    ? `Mengubah detail untuk kode ${editingTransaction.transaction_code}`
                    : "Input detail kas keluar/masuk ke database Supabase."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  required
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900 font-medium cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Kategori Transaksi
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900 font-medium"
                >
                  <option value="penjualan">Penjualan (+ Pemasukan)</option>
                  <option value="trade_in">Trade-In (+ Pemasukan/Nett)</option>
                  <option value="pembelian_stok">Pembelian Stok (- Pengeluaran)</option>
                  <option value="pengeluaran_operasional">Pengeluaran Operasional (- Pengeluaran)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Deskripsi Transaksi *
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Contoh: Penjualan iPhone 13 128GB iBox / Restock Case"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                  Nama Pelanggan / Vendor *
                </label>
                <input
                  type="text"
                  name="customer_or_vendor"
                  required
                  placeholder="Contoh: Budi Santoso / Supplier Utama"
                  value={formData.customer_or_vendor}
                  onChange={handleInputChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Nominal (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-neutral-400 select-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      name="amount"
                      required
                      placeholder="0"
                      value={formData.amount}
                      onChange={handleAmountChange}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-neutral-900"
                  >
                    <option value="QRIS">QRIS</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Cash">Cash / Tunai</option>
                  </select>
                </div>
              </div>

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
                  <option value="Lunas">Lunas</option>
                  <option value="Pending">Pending</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

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
                  {isSubmitting ? "Menyimpan..." : editingTransaction ? "Update Transaksi" : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Hapus Transaksi?</h3>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-neutral-800">{deletingTransaction.transaction_code}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteTransaction}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}