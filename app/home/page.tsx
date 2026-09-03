"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FounderSidebar } from "@/components/founder-sidebar";
import { StaffSidebar } from "@/components/staff-sidebar";
import { HomeNavbar } from "@/components/home-navbar";
import { 
  RefreshCw, TrendingUp, X, ShoppingBag, ShieldAlert, 
  Package, RefreshCcw, ShieldCheck, MessageSquare, PlusCircle, Clock, Calendar, Award 
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("member");
  const [profileName, setProfileName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // State untuk filter rentang waktu (Bulan & Tahun)
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  // State khusus metrik operasional staff (Pending Orders & Trade-In)
  const [staffMetrics, setStaffMetrics] = useState({
    pendingOrders: 0,
    pendingTradeIn: 0,
  });

  // Target Profit Bulanan, Target Unit, & Real-time Actual Sales dari Supabase
  const [salesTarget, setSalesTarget] = useState<number>(0); 
  const [actualSales, setActualSales] = useState<number>(0);
  const [unitTarget, setUnitTarget] = useState<number>(0);
  const [actualUnitsSold, setActualUnitsSold] = useState<number>(0);

  // State Metrik Utama Founder yang terhubung ke Database
  const [metrics, setMetrics] = useState({
    availableStockCount: 0,
    totalAssetValue: 0,
    lastTxTime: "-",
    lastTxDate: "-",
    lastTxAmount: 0,
    lastTxChannel: "-",
    grossTransaction: 0,
    nettTransaction: 0,
    totalUnitTransaction: 0,
    transactionSuccess: 0,
  });

  const router = useRouter();
  const supabase = createClient();

  const checkUserAndProfile = async () => {
    setIsRefreshing(true);
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      toast.error("Sesi telah berakhir, silakan login kembali.");
      router.push("/login");
      return;
    }

    setUser(session.user);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", session.user.id)
      .single();

    let userRole = "member";
    if (!profileError && profile) {
      userRole = profile.role?.toLowerCase() || "member";
      setRole(userRole);
      setProfileName(profile.full_name || session.user.email?.split('@')[0] || "");
    } else {
      setProfileName(session.user.email?.split('@')[0] || "");
    }

    if (userRole !== "founder" && userRole !== "admin" && userRole !== "staff") {
      setLoading(false);
      setIsRefreshing(false);
      return; 
    }

    // Rentang tanggal awal & akhir bulan yang dipilih
    const startDate = `${selectedYear}-${selectedMonth}-01T00:00:00`;
    const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
    const endDate = `${selectedYear}-${selectedMonth}-${lastDay}T23:59:59`;

    // 0. Ambil Target Bulanan & Target Unit dari tabel store_targets sesuai bulan & tahun aktif[cite: 2]
    const { data: targetData } = await supabase
      .from("store_targets")
      .select("target_amount, unit_target")
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .single();

    if (targetData) {
      if (targetData.target_amount) {
        setSalesTarget(Number(targetData.target_amount));
      } else {
        setSalesTarget(25000000); // Default fallback
      }

      if (targetData.unit_target !== null && targetData.unit_target !== undefined) {
        setUnitTarget(Number(targetData.unit_target));
      } else {
        setUnitTarget(10); // Default fallback target unit dari founder
      }
    } else {
      setSalesTarget(25000000);
      setUnitTarget(10);
    }

    // 1. Ambil data produk dengan status 'available' (Stok unit & Nilai Aset)[cite: 2]
    const { data: availableProducts } = await supabase
      .from("products")
      .select("cost_price, status")
      .eq("status", "available");

    const stockCount = availableProducts ? availableProducts.length : 0;
    const assetValue = availableProducts ? availableProducts.reduce((acc, item) => acc + Number(item.cost_price || 0), 0) : 0;

    // 2. Ambil data produk 'sold' pada periode terpilih untuk Hitung Real-time Actual Profit Staff & Jumlah Unit Terjual[cite: 2]
    const { data: soldProducts } = await supabase
      .from("products")
      .select("price, cost_price, updated_at")
      .eq("status", "sold")
      .gte("updated_at", startDate)
      .lte("updated_at", endDate);

    let totalSoldOmzet = 0;
    let totalProfit = 0;
    let totalUnits = soldProducts ? soldProducts.length : 0;

    setActualUnitsSold(totalUnits);

    if (soldProducts && soldProducts.length > 0) {
      soldProducts.forEach((item) => {
        const jual = Number(item.price || 0);
        const modal = Number(item.cost_price || 0);
        totalSoldOmzet += jual;
        const profit = jual - modal;
        if (profit > 0) {
          totalProfit += profit;
        }
      });
      setActualSales(totalProfit);
    } else {
      setActualSales(0);
    }

    // 3. Ambil data transaksi keuangan pada periode tersebut[cite: 2]
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    let grossTotal = 0; 
    let nettTotal = 0;  
    let totalUnitTxCount = 0;
    let lastTx: any = null;

    if (txData && txData.length > 0) {
      setTransactions(txData);
      lastTx = txData[0];

      txData.forEach((tx) => {
        const amount = Number(tx.amount || 0);
        const typeLower = (tx.type || "").toLowerCase();

        // Hitung transaksi dengan kategori/tipe "penjualan"
        if (typeLower.includes("penjualan")) {
          totalUnitTxCount += 1;
        }

        if (typeLower.includes("pengeluaran") || typeLower.includes("pembelian") || amount < 0) {
          nettTotal -= Math.abs(amount);
        } else {
          grossTotal += amount;
          nettTotal += amount;
        }
      });
    } else {
      setTransactions([]);
    }

    const totalTransactionCount = txData ? txData.length : 0;

    setMetrics({
      availableStockCount: stockCount,
      totalAssetValue: assetValue,
      lastTxTime: lastTx ? new Date(lastTx.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-",
      lastTxDate: lastTx ? new Date(lastTx.created_at).toLocaleString("id-ID") : "-",
      lastTxAmount: lastTx ? Math.abs(Number(lastTx.amount || 0)) : 0,
      lastTxChannel: lastTx ? (lastTx.channel || lastTx.payment_method || "Transfer Bank") : "-",
      grossTransaction: grossTotal,
      nettTransaction: nettTotal,
      totalUnitTransaction: totalUnitTxCount,
      transactionSuccess: totalTransactionCount,
    });

    // 4. Ambil Pending Orders
    const { count: pendingOrdersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 5. Ambil Trade-In Review (Ganti dari "trade_in" ke "trade_in_submissions")
    const { count: pendingTradeInCount } = await supabase
      .from("trade_in_submissions")
      .select("*", { count: "exact", head: true })
      .in("status", ["Pending", "Diproses"]); // Menghitung yang statusnya Pending atau Diproses

    setStaffMetrics({
      pendingOrders: pendingOrdersCount || 0,
      pendingTradeIn: pendingTradeInCount || 0,
    });

    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkUserAndProfile();
  }, [router, supabase, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          Memuat Dashboard PUREI...
        </div>
      </div>
    );
  }

  const isAuthorized = role === "founder" || role === "admin" || role === "staff";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <HomeNavbar user={user} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-neutral-900">Akses Terbatas</h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Halo, <strong className="text-neutral-900">{profileName}</strong>. Akun Anda merupakan akun Member/Pelanggan. Halaman ini khusus diperuntukkan bagi Founder dan Staff toko.
            </p>
            <div className="pt-2">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 text-white hover:bg-amber-400 hover:text-neutral-950 font-bold text-xs py-3 rounded-xl transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                Kembali ke Katalog Belanja
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isStaffOnly = role === "staff";

  // Perhitungan Persentase Real-time Staff (Profit & Unit)
  const achievementPercentage = salesTarget > 0 ? Math.min(Math.round((actualSales / salesTarget) * 100), 100) : 0;
  const remainingTarget = Math.max(salesTarget - actualSales, 0);
  const unitAchievementPercentage = unitTarget > 0 ? Math.min(Math.round((actualUnitsSold / unitTarget) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex max-w-full overflow-x-hidden">
      
      {role === "founder" && (
        <FounderSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      )}
      {(role === "staff" || role === "admin") && (
        <StaffSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      )}

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        
        <HomeNavbar user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          
          {/* Header Dashboard & Filter Bulan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {isStaffOnly ? "Staff Operational Portal" : "Dashboard"}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isStaffOnly ? "Kelola pesanan, verifikasi trade-in, dan target profit toko bulan ini." : "Overview metrik bisnis, inventaris stok, dan laporan keuangan real-time."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
                >
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>

                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer border-l border-neutral-200 pl-2"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <button
                onClick={checkUserAndProfile}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 bg-[#00a3ff] hover:bg-[#008fe6] text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-neutral-200/80 rounded-xl px-4 sm:px-5 py-3 text-xs text-neutral-600 shadow-2xs gap-2">
            <div className="flex items-center gap-1.5 font-medium">
              <span>Selamat bertugas, <strong className="text-neutral-900">{profileName}!</strong></span>
              <span>🤠</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-neutral-400">
              Periode Aktif: <strong className="text-neutral-700">{selectedMonth}/{selectedYear}</strong>
            </div>
          </div>

          {/* ========================================================= */}
          {/* JIKA ROLE STAFF                                           */}
          {/* ========================================================= */}
          {isStaffOnly ? (
            <>
              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <a 
                  href="/staff/orders"
                  className="bg-white hover:border-neutral-400 border border-neutral-200/80 rounded-xl p-3.5 flex items-center gap-3 transition-all shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-100 transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-900">Pesanan Masuk</p>
                    <p className="text-[10px] text-neutral-400">Proses & Kirim</p>
                  </div>
                </a>

                <a 
                  href="/staff/trade-in"
                  className="bg-white hover:border-neutral-400 border border-neutral-200/80 rounded-xl p-3.5 flex items-center gap-3 transition-all shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-100 transition-colors">
                    <RefreshCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-900">Cek Trade-In</p>
                    <p className="text-[10px] text-neutral-400">Validasi Unit</p>
                  </div>
                </a>

                <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-xl p-3.5 flex items-center gap-3 opacity-75 cursor-not-allowed">
                  <div className="w-9 h-9 rounded-lg bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-semibold text-neutral-700">Klaim Garansi</p>
                      <span className="text-[9px] bg-neutral-200 text-neutral-700 font-bold px-1.5 py-0.2 rounded">Soon</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Segera Hadir</p>
                  </div>
                </div>

                <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-xl p-3.5 flex items-center gap-3 opacity-75 cursor-not-allowed">
                  <div className="w-9 h-9 rounded-lg bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-semibold text-neutral-700">Tiket CS</p>
                      <span className="text-[9px] bg-neutral-200 text-neutral-700 font-bold px-1.5 py-0.2 rounded">Soon</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Segera Hadir</p>
                  </div>
                </div>

                <a 
                  href="/staff/products/add"
                  className="bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-900 rounded-xl p-3.5 flex items-center gap-3 transition-all shadow-2xs group col-span-2 sm:col-span-1"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 text-amber-400 flex items-center justify-center font-bold group-hover:bg-white/20 transition-colors">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white">Tambah Stok</p>
                    <p className="text-[10px] text-neutral-400">Input Produk Baru</p>
                  </div>
                </a>
              </div>

              {/* Status Task Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Pending Orders</p>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">{staffMetrics.pendingOrders} <span className="text-xs font-normal text-neutral-500">pesanan</span></p>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-[11px] text-amber-600 font-medium border-t border-neutral-100">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Perlu segera dikemas hari ini</span>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Trade-In Review</p>
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">{staffMetrics.pendingTradeIn} <span className="text-xs font-normal text-neutral-500">unit</span></p>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-[11px] text-blue-600 font-medium border-t border-neutral-100">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Menunggu verifikasi fisik/foto</span>
                  </div>
                </div>
              </div>

              {/* TARGET & PENCAPAIAN PROFIT BERSIH & UNIT BULANAN (REAL-TIME DB) */}
              <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Target & Pencapaian Profit & Unit Bulanan</h2>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200">
                      Target Profit: IDR {salesTarget.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                      Target Unit: {unitTarget} Unit
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-50/70 border border-neutral-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-medium text-neutral-500">TOTAL PROFIT BERSIH</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                      IDR {actualSales.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 pt-0.5">
                      <TrendingUp className="w-3 h-3" />
                      <span>{achievementPercentage}% dari target profit</span>
                    </p>
                  </div>

                  <div className="p-4 bg-neutral-50/70 border border-neutral-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-medium text-neutral-500">UNIT TERJUAL BULAN INI</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                      {actualUnitsSold} <span className="text-xs font-normal text-neutral-500">/ {unitTarget} Unit</span>
                    </p>
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 pt-0.5">
                      <Package className="w-3 h-3" />
                      <span>{unitAchievementPercentage}% dari target unit</span>
                    </p>
                  </div>

                  <div className="p-4 bg-neutral-50/70 border border-neutral-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-medium text-neutral-500">KURANG UNTUK ACHIEVE</p>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                      IDR {remainingTarget.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-neutral-500 pt-0.5">Sisa akumulasi profit agar target terpenuhi</p>
                  </div>

                  <div className="p-4 bg-neutral-50/70 border border-neutral-100 rounded-xl space-y-1">
                    <p className="text-[11px] font-medium text-neutral-500">STATUS TIM</p>
                    <p className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-1.5 pt-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Fokus Kejar Target</span>
                    </p>
                    <p className="text-[10px] text-neutral-500">Semangat jual unit impresif minggu ini!</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-600">Progress Bar Pencapaian Profit</span>
                      <span className="font-mono font-bold text-neutral-900">{achievementPercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
                      <div 
                        className="h-full bg-neutral-900 rounded-full transition-all duration-1000"
                        style={{ width: `${achievementPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-600">Progress Bar Penjualan Unit</span>
                      <span className="font-mono font-bold text-neutral-900">{unitAchievementPercentage}% ({actualUnitsSold}/{unitTarget} Unit)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${unitAchievementPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modul Bawah (Klaim Garansi & Pusat Bantuan CS) */}
              <div className="bg-neutral-900 text-white rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="space-y-1.5">
                  <span className="bg-amber-400 text-neutral-950 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                    Segera Hadir (Phase 2)
                  </span>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight">Modul Klaim Garansi & Pusat Bantuan CS</h3>
                  <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
                    Sistem manajemen klaim garansi pelanggan dan sistem tiket live chat terpusat sedang dalam tahap pengembangan akhir.
                  </p>
                </div>
                <span className="bg-white/10 border border-white/15 text-neutral-300 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">
                  Dalam Pengembangan
                </span>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* JIKA ROLE FOUNDER                                         */
            /* ========================================================= */
            <>
              {/* Stok Unit & Nilai Aset Inventaris */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Inventaris Stok Aktif</h2>
                    <span className="text-[10px] font-mono bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                      Live Database
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-400 mb-1">Total Stok Unit Ready</p>
                      <p className="text-xl sm:text-2xl font-bold text-neutral-900">
                        {metrics.availableStockCount} <span className="text-xs font-normal text-neutral-500">Unit</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-400 mb-1">Total Nilai Aset (Modal)</p>
                      <p className="text-base sm:text-lg font-bold text-amber-600 font-mono">
                        IDR {metrics.totalAssetValue.toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-neutral-400">Akumulasi cost price unit ready</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Last Successful Transaction</h2>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-400 mb-1">Transaction Time</p>
                      <p className="text-xs font-bold text-neutral-800">{metrics.lastTxTime}</p>
                      <p className="text-[9px] sm:text-[10px] text-neutral-400">{metrics.lastTxDate}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-400 mb-1">Amount</p>
                      <p className="text-xs font-bold text-neutral-800 font-mono">
                        IDR {metrics.lastTxAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-400 mb-1">Payment Channel</p>
                      <p className="text-xs font-bold text-neutral-800">{metrics.lastTxChannel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicator Cards Keuangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-400 mb-2">Gross Transaction</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 font-mono">IDR {metrics.grossTransaction.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold border-t border-neutral-100">
                    <span>Periode {selectedMonth}/{selectedYear}</span>
                    <TrendingUp className="w-3 h-3" />
                  </div>
                </div>

                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-400 mb-2">Nett Transaction (Kas)</p>
                    <p className={`text-xl sm:text-2xl font-bold font-mono ${metrics.nettTransaction >= 0 ? 'text-neutral-900' : 'text-rose-600'}`}>
                      IDR {metrics.nettTransaction.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold border-t border-neutral-100">
                    <span>Periode {selectedMonth}/{selectedYear}</span>
                    <TrendingUp className="w-3 h-3" />
                  </div>
                </div>

                {/* Card Total Unit Penjualan (Pengganti Total Transaction) */}
                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-400 mb-2">Total Unit Penjualan</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900">{metrics.totalUnitTransaction} <span className="text-xs font-normal text-neutral-500">Unit</span></p>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold border-t border-neutral-100">
                    <span>Periode {selectedMonth}/{selectedYear}</span>
                    <TrendingUp className="w-3 h-3" />
                  </div>
                </div>

                <div className="bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-400 mb-2">Transaction Success</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900">{metrics.transactionSuccess}</p>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-[11px] text-emerald-500 font-semibold border-t border-neutral-100">
                    <span>Periode {selectedMonth}/{selectedYear}</span>
                    <TrendingUp className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Latest Transactions Card */}
              <div className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 sm:px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between">
                  <h2 className="text-xs font-bold text-neutral-800">Latest Transactions ({selectedMonth}/{selectedYear})</h2>
                  <a href="/founder/transactions" className="text-xs font-semibold text-amber-600 hover:underline">
                    Lihat Semua &rarr;
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-neutral-50/60 border-b border-neutral-200/80 text-[11px] font-semibold text-neutral-600">
                        <th className="px-4 sm:px-6 py-3 font-medium">Transaction Date</th>
                        <th className="px-4 sm:px-6 py-3 font-medium">Type</th>
                        <th className="px-4 sm:px-6 py-3 font-medium">Description</th>
                        <th className="px-4 sm:px-6 py-3 font-medium">Amount</th>
                        <th className="px-4 sm:px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60 text-xs">
                      {transactions.length > 0 ? (
                        transactions.map((tx, idx) => {
                          const isExpense = tx.type?.toLowerCase().includes("pengeluaran") || tx.type?.toLowerCase().includes("pembelian") || Number(tx.amount || 0) < 0;
                          return (
                            <tr key={tx.id || idx} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="px-4 sm:px-6 py-3.5 text-neutral-700 font-mono">
                                {tx.created_at ? new Date(tx.created_at).toLocaleString("id-ID") : "-"}
                              </td>
                              <td className="px-4 sm:px-6 py-3.5 text-neutral-800 font-medium">
                                <span className={`inline-px px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isExpense ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                  {tx.type || "TRANSACTION"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3.5 text-neutral-600 truncate max-w-xs">{tx.description || "-"}</td>
                              <td className={`px-4 sm:px-6 py-3.5 font-bold font-mono ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isExpense ? "-" : "+"}Rp {Math.abs(Number(tx.amount || 0)).toLocaleString("id-ID")}
                              </td>
                              <td className="px-4 sm:px-6 py-3.5">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                  {tx.status || "Lunas"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                <X className="w-5 h-5 stroke-[2.5]" />
                              </div>
                              <span className="text-xs font-semibold text-neutral-700">No transactions in {selectedMonth}/{selectedYear}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

    </div>
  );
}