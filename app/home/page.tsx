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
  Package, RefreshCcw, ShieldCheck, MessageSquare, PlusCircle, Clock, Calendar, Award, Building2,
  Wallet, ArrowUpRight, ArrowDownRight, CreditCard
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("member");
  const [profileName, setProfileName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // State untuk perincian bank individual (Khusus Founder)
  const [bankList, setBankList] = useState<any[]>([]);

  // State untuk filter rentang waktu
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  // State operasional staff
  const [staffMetrics, setStaffMetrics] = useState({
    pendingOrders: 0,
    pendingTradeIn: 0,
  });

  // Target Profit & Real-time Sales
  const [salesTarget, setSalesTarget] = useState<number>(0); 
  const [actualSales, setActualSales] = useState<number>(0);
  const [unitTarget, setUnitTarget] = useState<number>(0);
  const [actualUnitsSold, setActualUnitsSold] = useState<number>(0);

  // State Metrik Utama Founder
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
    bankBalance: 0,
  });

  const router = useRouter();
  const supabase = createClient();

  const parseCurrency = (val: any): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper membaca saldo bank dari kolom 'balance'
  const extractBankBalance = (bank: any): number => {
    if (!bank) return 0;
    // Cek kolom balance terlebih dahulu
    if (bank.balance !== undefined && bank.balance !== null && Number(bank.balance) > 0) {
      return parseCurrency(bank.balance);
    }
    if (bank.saldo !== undefined && bank.saldo !== null && Number(bank.saldo) > 0) {
      return parseCurrency(bank.saldo);
    }
    return parseCurrency(bank.balance ?? bank.saldo ?? 0);
  };

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

    const startDate = `${selectedYear}-${selectedMonth}-01T00:00:00`;
    const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
    const endDate = `${selectedYear}-${selectedMonth}-${lastDay}T23:59:59`;

    // 1. Target Store
    const { data: targetData } = await supabase
      .from("store_targets")
      .select("target_amount, unit_target")
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .single();

    if (targetData) {
      setSalesTarget(targetData.target_amount ? Number(targetData.target_amount) : 25000000);
      setUnitTarget(targetData.unit_target !== null && targetData.unit_target !== undefined ? Number(targetData.unit_target) : 10);
    } else {
      setSalesTarget(25000000);
      setUnitTarget(10);
    }

    // 2. Fetch Kas Bank - KHUSUS FOUNDER
    let totalBankBalance = 0;
    if (userRole === "founder") {
      const { data: bankData, error: bankError } = await supabase.from("banks").select("*").order("name", { ascending: true });
      if (!bankError && bankData && bankData.length > 0) {
        setBankList(bankData);
        totalBankBalance = bankData.reduce((acc, bank) => {
          return acc + extractBankBalance(bank);
        }, 0);
      } else {
        setBankList([]);
      }
    } else {
      setBankList([]);
      totalBankBalance = 0;
    }

    // 3. Stok Produk Ready
    const { data: availableProducts } = await supabase
      .from("products")
      .select("cost_price, status")
      .eq("status", "available");

    const stockCount = availableProducts ? availableProducts.length : 0;
    const assetValue = availableProducts ? availableProducts.reduce((acc, item) => acc + parseCurrency(item.cost_price), 0) : 0;

    // 4. Sold Products & Profit
    const { data: soldProducts } = await supabase
      .from("products")
      .select("price, cost_price, updated_at")
      .eq("status", "sold")
      .gte("updated_at", startDate)
      .lte("updated_at", endDate);

    let totalProfit = 0;
    let totalUnits = soldProducts ? soldProducts.length : 0;

    setActualUnitsSold(totalUnits);

    if (soldProducts && soldProducts.length > 0) {
      soldProducts.forEach((item) => {
        const jual = parseCurrency(item.price);
        const modal = parseCurrency(item.cost_price);
        const profit = jual - modal;
        if (profit > 0) totalProfit += profit;
      });
      setActualSales(totalProfit);
    } else {
      setActualSales(0);
    }

    // 5. Transaksi Keuangan
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
        const amount = parseCurrency(tx.amount);
        const typeLower = (tx.type || "").toLowerCase();

        if (typeLower.includes("penjualan")) totalUnitTxCount += 1;

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
      lastTxDate: lastTx ? new Date(lastTx.created_at).toLocaleDateString("id-ID") : "-",
      lastTxAmount: lastTx ? Math.abs(parseCurrency(lastTx.amount)) : 0,
      lastTxChannel: lastTx ? (lastTx.payment_method || lastTx.channel || "Transfer Bank") : "-",
      grossTransaction: grossTotal,
      nettTransaction: nettTotal,
      totalUnitTransaction: totalUnitTxCount,
      transactionSuccess: totalTransactionCount,
      bankBalance: totalBankBalance,
    });

    // 6. Pending Staff
    const { count: pendingOrdersCount } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending");
    const { count: pendingTradeInCount } = await supabase.from("trade_in_submissions").select("*", { count: "exact", head: true }).in("status", ["Pending", "Diproses"]);

    setStaffMetrics({
      pendingOrders: pendingOrdersCount || 0,
      pendingTradeIn: pendingTradeInCount || 0,
    });

    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkUserAndProfile();

    const bankChannel = supabase
      .channel("realtime-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "banks" }, () => {
        checkUserAndProfile();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        checkUserAndProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bankChannel);
    };
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat Dashboard PUREI...</span>
        </div>
      </div>
    );
  }

  const isAuthorized = role === "founder" || role === "admin" || role === "staff";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <HomeNavbar user={user} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Akses Terbatas</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Halo, <strong className="text-slate-900">{profileName}</strong>. Halaman ini khusus untuk Staff & Founder.
            </p>
            <a href="/" className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs py-3 rounded-xl transition-all">
              <ShoppingBag className="w-4 h-4" />
              Kembali ke Katalog
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isStaffOnly = role === "staff";
  const achievementPercentage = salesTarget > 0 ? Math.min(Math.round((actualSales / salesTarget) * 100), 100) : 0;
  const unitAchievementPercentage = unitTarget > 0 ? Math.min(Math.round((actualUnitsSold / unitTarget) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      
      {role === "founder" && <FounderSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
      {(role === "staff" || role === "admin") && <StaffSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}

      <div className="flex-1 flex flex-col min-w-0">
        
        <HomeNavbar user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isStaffOnly ? "Staff Operational Portal" : "Dashboard Overview"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {isStaffOnly ? "Kelola pesanan, verifikasi trade-in, dan target toko." : "Metrik bisnis utama, kas bank, dan laporan keuangan transaksi."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
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
                  className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer border-l border-slate-200 ml-2 pl-2"
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
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Selamat Datang</span>
              <h2 className="text-xl font-bold mt-0.5">{profileName} 👋</h2>
              <p className="text-xs text-slate-300 mt-1">Sistem siap digunakan. Semua data tersinkronisasi secara otomatis.</p>
            </div>
            <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-2.5 text-right">
              <p className="text-[10px] text-slate-400 uppercase font-mono">Periode Terpilih</p>
              <p className="text-sm font-bold font-mono text-amber-400">{selectedMonth} / {selectedYear}</p>
            </div>
          </div>

          {!isStaffOnly && (
            <>
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ringkasan Keuangan</h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {role === "founder" && (
                    <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute right-[-20px] top-[-20px] opacity-10 text-white">
                        <Wallet className="w-48 h-48" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" /> Total Kas Tersedia
                          </span>
                          <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-mono">
                            {bankList.length} Bank Terkoneksi
                          </span>
                        </div>

                        <p className="text-3xl font-extrabold font-mono tracking-tight">
                          IDR {metrics.bankBalance.toLocaleString("id-ID")}
                        </p>
                      </div>

                      {bankList.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-1 gap-2">
                          {bankList.map((b, i) => {
                            const val = extractBankBalance(b);
                            return (
                              <div key={b.id || i} className="flex justify-between items-center text-xs">
                                <span className="text-blue-100 font-medium flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-blue-200" />
                                  {b.name || `Bank #${i+1}`}
                                </span>
                                <span className="font-mono font-bold text-white">Rp {val.toLocaleString("id-ID")}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`grid grid-cols-2 gap-4 ${role === "founder" ? "lg:col-span-7" : "lg:col-span-12"}`}>
                    
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Gross Transaction</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-slate-900 font-mono mt-3">
                        IDR {metrics.grossTransaction.toLocaleString("id-ID")}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-2 block">Total pemasukan kotor</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Nett Transaction</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <p className={`text-xl font-bold font-mono mt-3 ${metrics.nettTransaction >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        IDR {metrics.nettTransaction.toLocaleString("id-ID")}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-2 block">Sisa arus kas periode ini</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Unit Terjual</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.totalUnitTransaction} <span className="text-xs font-normal text-slate-500">Unit</span></p>
                      <span className="text-[11px] text-slate-400 mt-2 block">Transaksi unit sukses</span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Total Transaksi</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-3">{metrics.transactionSuccess}</p>
                      <span className="text-[11px] text-slate-400 mt-2 block">Frekuensi mutasi terdaftar</span>
                    </div>

                  </div>

                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inventaris Stok Aktif</h3>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                      Live Status
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Total Unit Ready</p>
                      <p className="text-2xl font-bold text-slate-900">{metrics.availableStockCount} <span className="text-xs font-normal text-slate-500">Unit</span></p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Total Nilai Asset Modal</p>
                      <p className="text-lg font-bold text-amber-600 font-mono">IDR {metrics.totalAssetValue.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Transaksi Terakhir</h3>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {metrics.lastTxDate}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Waktu</p>
                      <p className="text-sm font-bold text-slate-800">{metrics.lastTxTime}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Nominal</p>
                      <p className="text-sm font-bold text-slate-800 font-mono">IDR {metrics.lastTxAmount.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-1">Kanal</p>
                      <p className="text-sm font-bold text-slate-800">{metrics.lastTxChannel}</p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Laporan Transaksi ({selectedMonth}/{selectedYear})</h3>
                  <a href="/founder/transactions" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Lihat Semua &rarr;
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Tanggal</th>
                        <th className="px-6 py-3.5">Jenis</th>
                        <th className="px-6 py-3.5">Keterangan</th>
                        <th className="px-6 py-3.5">Nominal</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {transactions.length > 0 ? (
                        transactions.map((tx, idx) => {
                          const isExpense = tx.type?.toLowerCase().includes("pengeluaran") || tx.type?.toLowerCase().includes("pembelian") || parseCurrency(tx.amount) < 0;
                          return (
                            <tr key={tx.id || idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4 text-slate-600 font-mono">
                                {tx.created_at ? new Date(tx.created_at).toLocaleString("id-ID") : "-"}
                              </td>
                              <td className="px-6 py-4 font-medium">
                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${isExpense ? 'bg-rose-50 text-rose-600 border border-rose-200/60' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'}`}>
                                  {tx.type || "TRANSAKSI"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{tx.description || "-"}</td>
                              <td className={`px-6 py-4 font-bold font-mono ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isExpense ? "-" : "+"}Rp {Math.abs(parseCurrency(tx.amount)).toLocaleString("id-ID")}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                  {tx.status || "Lunas"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                            Tidak ada transaksi terdaftar pada periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {isStaffOnly && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <a href="/staff/orders" className="bg-white hover:border-slate-300 border border-slate-200 rounded-2xl p-5 flex items-center gap-4 transition-all shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Kelola Pesanan</p>
                    <p className="text-[11px] text-slate-400">Kemasi & Kirim</p>
                  </div>
                </a>

                <a href="/staff/trade-in" className="bg-white hover:border-slate-300 border border-slate-200 rounded-2xl p-5 flex items-center gap-4 transition-all shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <RefreshCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Validasi Trade-In</p>
                    <p className="text-[11px] text-slate-400">Verifikasi Fisik</p>
                  </div>
                </a>

                <a href="/staff/products/add" className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-5 flex items-center gap-4 transition-all shadow-xs col-span-2 sm:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center font-bold">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Input Produk Baru</p>
                    <p className="text-[11px] text-slate-300">Tambah stok unit siap jual</p>
                  </div>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</span>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1">{staffMetrics.pendingOrders} <span className="text-sm font-normal text-slate-500">pesanan</span></p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trade-In Review</span>
                    <p className="text-3xl font-extrabold text-slate-900 mt-1">{staffMetrics.pendingTradeIn} <span className="text-sm font-normal text-slate-500">unit</span></p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <RefreshCcw className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">Target Pencapaian Toko Bulan Ini</h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                    Target: IDR {salesTarget.toLocaleString("id-ID")} ({unitTarget} Unit)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Pencapaian Profit (IDR {actualSales.toLocaleString("id-ID")})</span>
                      <span className="font-bold font-mono text-slate-900">{achievementPercentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div className="h-full bg-slate-900 rounded-full transition-all duration-700" style={{ width: `${achievementPercentage}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">Pencapaian Unit ({actualUnitsSold} / {unitTarget} Unit)</span>
                      <span className="font-bold font-mono text-slate-900">{unitAchievementPercentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${unitAchievementPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

    </div>
  );
}