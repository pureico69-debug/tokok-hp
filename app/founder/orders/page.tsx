"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { toast } from "sonner";
import { ShoppingBag, Search, Filter, Trash2, Phone, AlertTriangle, X } from "lucide-react";

export default function KelolaPesananPage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State untuk Custom Modal Hapus
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name, storage, color, price)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data pesanan: " + error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [supabase]);

  // Update Status Pesanan (Pending / Diproses / Selesai / Dibatalkan)
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Gagal memperbarui status pesanan");
      fetchOrders();
    } else {
      toast.success(`Status pesanan diubah ke: ${newStatus}`);
    }
  };

  // Buka Modal Konfirmasi Hapus
  const openDeleteModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDeleteModalOpen(true);
  };

  // Eksekusi Hapus Pesanan dengan Optimistic Update
  const confirmDeleteOrder = async () => {
    if (!selectedOrderId) return;
    setIsDeleting(true);

    // Simpan ID yang mau dihapus untuk backup state jika gagal di DB
    const targetId = selectedOrderId;

    // LANGSUNG HAPUS DARI STATE LOKAL (UI langsung bersih seketika)
    setOrders((prev) => prev.filter((item) => item.id !== targetId));
    
    // Tutup modal duluan biar responsif
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setSelectedOrderId(null);

    // Hapus data asli di database Supabase
    const { error } = await supabase.from("orders").delete().eq("id", targetId);

    if (error) {
      toast.error("Gagal menghapus pesanan: " + error.message);
      fetchOrders(); // Ambil ulang data asli jika database nolak/gagal
    } else {
      toast.success("Pesanan berhasil dihapus");
    }
  };

  const filteredOrders = orders.filter((item) => {
    const matchesSearch =
      item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatRupiah = (val: number) =>
    "Rp " + Number(val || 0).toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-neutral-50/50 flex text-neutral-900 selection:bg-amber-200 selection:text-amber-900 relative">
      <FounderSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} />

        <main className="flex-1 p-6 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Kelola Pesanan & Transaksi
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                Pantau daftar pesanan masuk dari pelanggan dan update status transaksinya di sini.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari nama pembeli, nomor HP, atau unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              {[
                { label: "Semua", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Diproses", value: "processing" },
                { label: "Selesai", value: "completed" },
                { label: "Dibatalkan", value: "cancelled" },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    statusFilter === status.value
                      ? "bg-neutral-900 text-amber-400 font-bold shadow-2xs"
                      : "bg-white border border-neutral-200/80 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabel Pesanan */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-neutral-400">Memuat data pesanan...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs font-mono text-neutral-500">Belum ada pesanan yang masuk.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-200/80 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      <th className="p-4 pl-6">Pelanggan & Kontak</th>
                      <th className="p-4">Unit Dipesan</th>
                      <th className="p-4">Total Harga</th>
                      <th className="p-4">Status Pesanan</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 pl-6 font-mono space-y-0.5">
                          <p className="font-bold text-neutral-900 text-sm">{order.customer_name || "Tanpa Nama"}</p>
                          <div className="flex items-center gap-1 text-neutral-500 text-[11px]">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <span>{order.customer_phone || "-"}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono">
                          <p className="font-bold text-neutral-900">{order.products?.name || "Unit Terhapus / Custom"}</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {order.products?.storage} • {order.products?.color}
                          </p>
                        </td>
                        <td className="p-4 font-mono font-bold text-neutral-900">
                          {formatRupiah(order.total_price || order.products?.price)}
                        </td>
                        <td className="p-4 font-mono">
                          <select
                            value={order.status || "pending"}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer outline-none transition-all ${
                              order.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : order.status === "processing"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : order.status === "cancelled"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Diproses</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                        </td>
                        <td className="p-4 pr-6 text-right font-mono">
                          <button
                            onClick={() => openDeleteModal(order.id)}
                            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer inline-flex items-center justify-center"
                            title="Hapus Pesanan"
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

      {/* CUSTOM MODAL KONFIRMASI HAPUS */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                Hapus Data Pesanan?
              </h3>
              <p className="text-xs text-neutral-500 font-mono leading-relaxed">
                Tindakan ini bersifat permanen dan data transaksi pesanan akan dihapus dari sistem PUREI.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-mono font-medium hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                disabled={isDeleting}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 text-white text-xs font-mono font-medium hover:bg-red-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}