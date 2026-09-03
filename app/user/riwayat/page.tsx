"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  ShoppingBag, 
  ArrowLeft, 
  Phone, 
  Calendar,
  ShieldCheck,
  ChevronRight,
  XCircle,
  RefreshCcw,
  Smartphone,
  Heart
} from "lucide-react";

export default function RiwayatPesananPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tradeIns, setTradeIns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "tradein">("orders");
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, userEmail: string) => {
    // 1. Ambil Pesanan Belanja
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`
        *,
        products (
          name,
          storage,
          images
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData);
    }

    // 2. Ambil Pengajuan Trade-In berdasarkan user_id atau email dengan aman
    let query = supabase.from("trade_in_submissions").select("*");
    
    if (userId && userEmail) {
      query = query.or(`user_id.eq.${userId},email.eq.${userEmail}`);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else if (userEmail) {
      query = query.eq("email", userEmail);
    }

    const { data: tradeInData } = await query.order("created_at", { ascending: false });

    if (tradeInData) {
      setTradeIns(tradeInData);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      await fetchUserData(session.user.id, session.user.email || "");
      setLoading(false);
    };

    init();
  }, [supabase, router]);

  // Real-time listener Supabase untuk orders & trade-in
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime_user_history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => fetchUserData(user.id, user.email)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_in_submissions" },
        () => fetchUserData(user.id, user.email)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // Statistik Pesanan Belanja
  const totalPendingOrders = orders.filter((o) => {
    const s = o.status?.toLowerCase();
    return !s || s === "pending" || s === "menunggu verifikasi" || s === "menunggu";
  }).length;

  const totalProcessOrders = orders.filter((o) => {
    const s = o.status?.toLowerCase();
    return s === "processing" || s === "verified" || s === "diproses" || s === "shipped";
  }).length;

  const totalCompletedOrders = orders.filter((o) => {
    const s = o.status?.toLowerCase();
    return s === "completed" || s === "selesai";
  }).length;

  const getOrderStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "cancelled":
      case "dibatalkan":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Dibatalkan</span>
          </span>
        );
      case "processing":
      case "diproses":
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Sedang Diproses</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Dalam Pengiriman</span>
          </span>
        );
      case "completed":
      case "selesai":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
    }
  };

  const getTradeInStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "selesai":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
      case "diproses":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Diproses Staff</span>
          </span>
        );
      case "dibatalkan":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-bold text-neutral-400 font-sans tracking-wide">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <span>MEMUAT RIWAYAT TRANSAKSI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push("/user")}
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Belanja</span>
          </button>
          <span className="text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-widest">
            PUREI Store Official
          </span>
        </div>

        {/* Header Profile Card */}
        <div className="relative overflow-hidden bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black font-mono uppercase tracking-widest text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                Akun Terverifikasi
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">
              {profile?.full_name || "Pelanggan PUREI"}
            </h1>
            <p className="text-xs text-neutral-400 font-mono">{user?.email}</p>
          </div>

          <button 
            onClick={() => router.push("/user")}
            className="z-10 bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-sm cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
          >
            <span>Katalog Unit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Switcher (Pesanan Belanja vs Trade-In) */}
        <div className="flex bg-neutral-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "orders" 
                ? "bg-white text-neutral-900 shadow-xs" 
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Riwayat Pesanan ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tradein")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "tradein" 
                ? "bg-white text-neutral-900 shadow-xs" 
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Pengajuan Trade-In ({tradeIns.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: RIWAYAT PESANAN ================= */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Ringkasan Status Pesanan */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 text-center shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Menunggu</span>
                <span className="text-base font-black font-mono text-neutral-800">{totalPendingOrders}</span>
              </div>
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 text-center shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Diproses</span>
                <span className="text-base font-black font-mono text-amber-600">{totalProcessOrders}</span>
              </div>
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 text-center shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Selesai</span>
                <span className="text-base font-black font-mono text-emerald-600">{totalCompletedOrders}</span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto border border-neutral-200/50">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-800">Belum Ada Riwayat Pesanan</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Semua transaksi unit iPhone bekas berkualitas kamu bakal langsung muncul di sini.
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/user")}
                  className="bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Cari Unit Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-3xl p-5 space-y-4 shadow-2xs transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-neutral-300">•</span>
                        <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          {new Date(order.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </span>
                      </div>
                      <div>{getOrderStatusBadge(order.status)}</div>
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-50/70 p-3.5 rounded-2xl border border-neutral-100">
                      <img 
                        src={order.products?.images?.[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"} 
                        alt={order.products?.name || "Unit iPhone"} 
                        className="w-16 h-16 object-cover rounded-xl bg-white border border-neutral-200/80 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[9px] font-black font-mono text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded uppercase">
                          {order.products?.storage || "128GB"}
                        </span>
                        <h3 className="text-sm font-bold text-neutral-900 truncate">
                          {order.products?.name || "iPhone Unit"}
                        </h3>
                        <p className="text-xs text-neutral-400">1x Unit Original Ex-Inter/Resmi</p>
                      </div>
                      <div className="text-right pl-2">
                        <span className="text-[10px] text-neutral-400 block font-medium">Total Harga</span>
                        <span className="text-sm font-black font-mono text-neutral-900">
                          Rp {Number(order.total_price).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>WhatsApp:</span>
                        <span className="font-mono font-bold text-neutral-800">{order.customer_phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Terlindungi Sistem PUREI</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PENGAJUAN TRADE-IN ================= */}
        {activeTab === "tradein" && (
          <div className="space-y-4">
            {tradeIns.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-neutral-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-neutral-200/50">
                  <RefreshCcw className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-800">Belum Ada Pengajuan Trade-In</p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Kamu belum pernah mengajukan tukar tambah perangkat lama ke katalog PUREI.
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/trade-in")}
                  className="bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Ajukan Trade-In Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tradeIns.map((item) => {
                  const statusLower = item.status?.toLowerCase();
                  return (
                    <div 
                      key={item.id} 
                      className="group bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-3xl p-5 space-y-4 shadow-2xs transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">
                            TRD-#{item.id.slice(0, 6).toUpperCase()}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </span>
                        </div>
                        <div>{getTradeInStatusBadge(item.status)}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50/70 p-4 rounded-2xl border border-neutral-100 text-xs">
                        {/* Kolom Kiri: Perangkat Lama (Tukar) + Harga Taksiran */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block">Perangkat Lama (Tukar)</span>
                          <p className="font-bold text-neutral-900 text-sm">iPhone {item.model} ({item.storage})</p>
                          <p className="text-neutral-500">BH: {item.battery_health}% | Region: {item.region}</p>
                          <p className="text-neutral-400 italic text-[11px] truncate" title={item.condition}>Kondisi: {item.condition}</p>
                          
                          <div className="pt-2 mt-2 border-t border-neutral-200/60">
                            <span className="text-[10px] text-neutral-400 block font-medium">Estimasi Harga Taksiran:</span>
                            <span className="font-mono font-bold text-amber-600 text-sm">
                              Rp {Number(item.estimated_min || 0).toLocaleString("id-ID")} - {Number(item.estimated_max || 0).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>

                        {/* Kolom Kanan: Incaran PUREI + Status Dinamis / Ucapan Terima Kasih */}
                        <div className="space-y-1.5 sm:border-l sm:border-neutral-200 sm:pl-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-amber-700 uppercase font-mono font-bold block">Incaran PUREI</span>
                            <p className="font-bold text-neutral-900 text-sm mt-1">{item.target_product || "Pilihan Bebas"}</p>
                          </div>

                          {/* Dynamic Status Helper Text */}
                          <div className={`p-3 rounded-xl border text-[11px] ${
                            statusLower === "selesai" 
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-800" 
                              : statusLower === "diproses"
                              ? "bg-blue-50/60 border-blue-200 text-blue-800"
                              : "bg-amber-50/60 border-amber-200 text-amber-800"
                          }`}>
                            {statusLower === "selesai" ? (
                              <div className="space-y-1">
                                <p className="font-bold flex items-center gap-1 text-emerald-900">
                                  <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                                  <span>Terima Kasih di PUREI!</span>
                                </p>
                                <p className="text-[10px] text-emerald-700 leading-relaxed">
                                  Transaksi tukar tambah selesai. Nikmati unit barumu dan sampai jumpa di kunjungan berikutnya!
                                </p>
                              </div>
                            ) : statusLower === "diproses" ? (
                              <div className="space-y-1">
                                <p className="font-bold flex items-center gap-1 text-blue-900">
                                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Staff Sedang Menyiapkan Unit</span>
                                </p>
                                <p className="text-[10px] text-blue-700 leading-relaxed">
                                  Unit incaran sedang disiapkan. Silakan bawa unit lama kamu ke store untuk pengecekan fisik final!
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-bold flex items-center gap-1 text-amber-900">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Menunggu Verifikasi Pengajuan</span>
                                </p>
                                <p className="text-[10px] text-amber-700 leading-relaxed">
                                  Pengajuanmu sedang ditinjau oleh sistem dan staff store. Kami akan segera menghubungimu.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-500">
                        <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Kontak:</span>
                          <span className="font-mono font-bold text-neutral-800">{item.phone || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                          <span>
                            {statusLower === "selesai" 
                              ? "Trade-in telah sukses diselesaikan" 
                              : "Menunggu verifikasi fisik oleh staff store"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}