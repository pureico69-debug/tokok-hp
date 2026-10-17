"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { FounderSidebar } from "@/components/founder-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { Smartphone, Phone, CheckCircle2, Clock, XCircle, MessageSquare } from "lucide-react";

export default function FounderTradeInList() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);

    // 1. Ambil data pengajuan trade-in
    const { data: subData, error: subError } = await supabase
      .from("trade_in_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subError) {
      console.error("Gagal mengambil data trade-in:", subError.message);
    }

    // 2. Ambil data produk untuk pemetaan harga
    const { data: prodData, error: prodError } = await supabase
      .from("products")
      .select("name, price");

    if (prodError) {
      console.error("Gagal mengambil data produk:", prodError.message);
    }

    // Buat kamus (map) nama produk ke harga (case-insensitive)
    const priceMapping: Record<string, number> = {};
    if (prodData) {
      prodData.forEach((p) => {
        if (p.name) {
          priceMapping[p.name.toLowerCase().trim()] = Number(p.price || 0);
        }
      });
    }

    setProductsMap(priceMapping);
    setSubmissions(subData || []);
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchData();
    }
    init();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("trade_in_submissions")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Gagal mengubah status: " + error.message);
    } else {
      await fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50/50 text-neutral-900 font-sans">
      <FounderSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <HomeNavbar user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          <div className="border-b border-neutral-200/80 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Daftar Pengajuan Trade-In Masuk
              </h1>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Kelola dan verifikasi unit tukar tambah yang diajukan oleh customer dari website publik.
              </p>
            </div>
            <button 
              onClick={fetchData}
              className="bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 px-4 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
            >
              Refresh Data
            </button>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xs overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-xs text-neutral-400 font-mono">Memuat data pengajuan...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Smartphone className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-sm font-bold text-neutral-700">Belum ada pengajuan trade-in.</p>
                <p className="text-xs text-neutral-400">Pengajuan dari customer akan muncul secara otomatis di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-mono">
                      <th className="p-4">Tanggal / Waktu</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Perangkat Lama</th>
                      <th className="p-4">Kondisi & BH</th>
                      <th className="p-4">Estimasi Harga</th>
                      <th className="p-4">Incaran & Tambah Bayar</th>
                      <th className="p-4 text-center">Aksi / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {submissions.map((item) => {
                      // Cari harga produk incaran berdasarkan nama produk (case-insensitive)
                      const targetName = (item.target_product || "").toLowerCase().trim();
                      const targetPrice = productsMap[targetName] || 0;
                      const estMax = Number(item.estimated_max || 0);
                      const topUp = targetPrice > 0 ? targetPrice - estMax : 0;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                          
                          <td className="p-4 font-mono text-neutral-500 whitespace-nowrap">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            }) : "-"}
                            <span className="block text-[10px] text-neutral-400">
                              {item.created_at ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-bold text-neutral-900 block">{item.name || "Tanpa Nama"}</span>
                            {item.phone && (
                              <a 
                                href={`https://wa.me/${String(item.phone).replace(/^0/, '62')}?text=Halo%20kak%20${item.name},%20terkait%20pengajuan%20trade-in%20iPhone%20${item.model}%20di%20PUREI...`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 font-mono font-medium hover:underline mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{item.phone}</span>
                              </a>
                            )}
                          </td>

                          <td className="p-4">
                            <span className="font-bold text-neutral-900 block">{item.model || "-"} ({item.storage || "-"})</span>
                            <span className="text-[11px] text-neutral-500 uppercase font-mono">{item.region || "-"}</span>
                          </td>

                          <td className="p-4">
                            <span className="font-medium text-neutral-800 block">BH: {item.battery_health ?? "-"}%</span>
                            <span className="text-[11px] text-neutral-500 block max-w-xs truncate" title={item.condition}>
                              {item.condition || "-"}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                            Rp {Number(item.estimated_min || 0).toLocaleString("id-ID")}
                            <span className="block text-[10px] text-neutral-400 font-normal">
                              s/d Rp {Number(item.estimated_max || 0).toLocaleString("id-ID")}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="text-neutral-900 font-bold block">{item.target_product || "-"}</span>
                            {targetPrice > 0 ? (
                              <span className="text-blue-600 font-mono font-semibold block text-[11px] mt-0.5">
                                User Nambah: Rp {topUp > 0 ? topUp.toLocaleString("id-ID") : 0}
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-mono text-[10px] block mt-0.5">
                                Harga incaran belum diset di stok produk
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                              item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.status === 'Diproses' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              item.status === 'Dibatalkan' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status === 'Selesai' && <CheckCircle2 className="w-3 h-3" />}
                              {item.status === 'Diproses' && <Clock className="w-3 h-3" />}
                              {item.status === 'Dibatalkan' && <XCircle className="w-3 h-3" />}
                              {item.status === 'Pending' && <Clock className="w-3 h-3" />}
                              <span>{item.status || 'Pending'}</span>
                            </span>
                          </td>

                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <select
                                value={item.status || 'Pending'}
                                onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 font-medium text-xs focus:outline-none focus:border-amber-500"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Diproses">Diproses</option>
                                <option value="Selesai">Selesai</option>
                                <option value="Dibatalkan">Dibatalkan</option>
                              </select>

                              {item.phone && (
                                <a
                                  href={`https://wa.me/${String(item.phone).replace(/^0/, '62')}?text=Halo%20kak%20${item.name},%20terkait%20pengajuan%20trade-in%20kamu%20untuk%20tukar%20ke%20${item.target_product},%20estimasi%20tambah%20bayar%20kamu%20sebesar%20Rp%20${topUp > 0 ? topUp.toLocaleString("id-ID") : 0}.`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2 rounded-lg transition-colors"
                                  title="Chat WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}