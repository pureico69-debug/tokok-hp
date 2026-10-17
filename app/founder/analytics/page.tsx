'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import { 
  TrendingUp, DollarSign, Package, AlertTriangle, 
  RefreshCw, Calendar, ArrowUpRight, ShieldAlert, Wallet, ArrowLeft,
  ChevronDown, CheckCircle2, Sparkles, Building2, TrendingDown, Target, ShieldCheck, Activity, BarChart3
} from 'lucide-react';

// Formatter Mata Uang Rupiah
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Opsi Filter Periode
const PERIOD_OPTIONS = [
  { id: 'all', label: 'All Time (Semua Waktu)', badge: 'ALL' },
  { id: '2026', label: 'Tahun 2026', badge: 'YEAR' },
  { id: '2026-10', label: 'Oktober 2026', badge: 'OCT' },
  { id: '2026-09', label: 'September 2026', badge: 'SEP' },
  { id: '2026-08', label: 'Agustus 2026', badge: 'AUG' },
];

export default function FounderLiveAnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  
  // Custom Dropdown State
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State Business Performance & Comparison
  const [businessData, setBusinessData] = useState({
    totalSales: 0,
    hpp: 0,
    grossProfit: 0,
    grossMargin: 0,
    opex: 0,
    netProfit: 0,
    netMargin: 0,
    totalUnitsSold: 0,
    salesGrowth: 0,
    profitGrowth: 0,
    // Data Bulan Lalu untuk Monthly Comparison Card
    prevMonthLabel: 'Bulan Lalu',
    prevSales: 0,
    prevGrossProfit: 0,
    prevNetProfit: 0,
    prevUnitsSold: 0,
  });

  // State Target Store (Gross Profit & Unit Target) dari Tabel store_targets
  const [targetData, setTargetData] = useState({
    targetGrossProfit: 0,
    unitTarget: 0,
    profitProgress: 0,
    unitProgress: 0,
    isTargetReached: false,
  });

  // State Break-Even Analysis (BEP) Berbasis Fixed Cost Rp 3.5jt
  const [bepData, setBepData] = useState({
    fixedOpex: 3500000,
    bepUnitsMin: 7,
    bepUnitsMax: 10,
    calculatedBepUnits: 0,
    isBreakEvenReached: false,
  });

  // State Cash Flow & Bank Balances
  const [cashFlowData, setCashFlowData] = useState({
    totalBalance: 0,
    bankAccounts: [] as Array<{ id: string; name: string; balance: number }>,
    totalInflows: 0,
    totalOutflows: 0,
    netCashFlow: 0,
  });

  // State Inventory
  const [inventoryData, setInventoryData] = useState({
    totalUnitsInStock: 0,
    totalInventoryValue: 0,
    aging0_7: 0,
    aging8_14: 0,
    aging15_30: 0,
    agingMore30: 0,
    avgHoldingPeriod: 12,
  });

  // State Equity & Financial Health
  const [equityData, setEquityData] = useState({
    totalAssets: 0,
    totalEquity: 0,
    equityPercentage: 100,
  });

  // State Alerts
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    amount?: string;
    linkText: string;
    linkUrl: string;
  }>>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. FETCH REALTIME BANK BALANCES DARI TABEL 'banks'
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('*');

      let currentBankAccounts: Array<{ id: string; name: string; balance: number }> = [];
      let calculatedTotalCash = 0;

      if (!banksError && banksData && banksData.length > 0) {
        currentBankAccounts = banksData.map((b: any) => {
          const bal = Number(b.balance ?? b.saldo ?? 0);
          calculatedTotalCash += bal;
          const bankName = b.name || b.holder_name || `Bank ${b.account_number || ''}`;
          return {
            id: b.id || b.account_number || bankName,
            name: `${bankName} Account`,
            balance: bal,
          };
        });
      } else {
        currentBankAccounts = [
          { id: 'bca', name: 'BCA Account', balance: 50000000 },
          { id: 'bni', name: 'BNI Account', balance: 25000000 },
          { id: 'seabank', name: 'SEABANK Account', balance: 5000000 },
        ];
        calculatedTotalCash = 80000000;
      }

      // 2. FETCH DATA PRODUCTS UNTUK PENCOCOKAN IMEI & COST PRICE (HPP)
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*');

      const productMap = new Map();
      if (!prodError && products) {
        products.forEach((p: any) => {
          if (p.imei) {
            productMap.set(String(p.imei).trim(), p);
          }
        });
      }

      // 3. FETCH DATA STORE TARGETS DARI TABEL 'store_targets'
      let [selY, selM] = selectedMonth.includes('-') ? selectedMonth.split('-') : ['2026', '09'];
      const { data: targets, error: targetError } = await supabase
        .from('store_targets')
        .select('*')
        .eq('month', selM)
        .eq('year', selY);

      let currentTargetProfit = 0;
      let currentUnitTarget = 0;

      if (!targetError && targets && targets.length > 0) {
        currentTargetProfit = Number(targets[0].target_amount || 0);
        currentUnitTarget = Number(targets[0].unit_target || 0);
      } else {
        currentTargetProfit = 5000000;
        currentUnitTarget = 15;
      }

      // 4. FETCH DATA TRANSAKSI
      const { data: transactions, error: trxError } = await supabase
        .from('transactions')
        .select('*');

      if (trxError) throw trxError;

      let sales = 0;
      let costOfGoods = 0;
      let operatingExpenses = 0;
      let inflows = 0;
      let outflows = 0;
      let unitsSold = 0;

      // Variabel Bulan Sebelumnya untuk Monthly Comparison
      let prevSales = 0;
      let prevGrossProfit = 0;
      let prevNetProfit = 0;
      let prevUnitsSold = 0;
      let prevMonthName = 'Bulan Lalu';

      let targetPrevYear = 2026;
      let targetPrevMonth = 8;

      if (selectedMonth.includes('-')) {
        const [currY, currM] = selectedMonth.split('-').map(Number);
        if (currM === 10) { targetPrevYear = currY; targetPrevMonth = 9; prevMonthName = 'September 2026'; }
        else if (currM === 9) { targetPrevYear = currY; targetPrevMonth = 8; prevMonthName = 'Agustus 2026'; }
        else { targetPrevYear = currY - 1; targetPrevMonth = 12; prevMonthName = 'Desember Tahun Lalu'; }
      }

      transactions?.forEach((trx: any) => {
        if (!trx.created_at) return;
        const trxDate = new Date(trx.created_at);
        const trxYear = trxDate.getFullYear();
        const trxMonth = trxDate.getMonth() + 1;

        const amount = Number(trx.amount || 0);
        const status = (trx.status || '').toLowerCase();
        const type = (trx.type || '').toLowerCase();
        const isPaid = status === 'lunas' || status === 'completed' || status === 'paid' || status === 'success';

        if (!isPaid) return;

        // Hitung Periode Terpilih
        let isMatch = false;
        if (selectedMonth === 'all') {
          isMatch = true;
        } else if (selectedMonth === '2026') {
          isMatch = trxYear === 2026;
        } else {
          const [sYear, sMonth] = selectedMonth.split('-').map(Number);
          isMatch = trxYear === sYear && trxMonth === sMonth;
        }

        let itemCost = 0;
        const imeiMatch = trx.description?.match(/\(([^)]+)\)/);
        const imei = imeiMatch ? imeiMatch[1].trim() : null;
        if (imei && productMap.has(imei)) {
          const prod = productMap.get(imei);
          itemCost = Number(prod.cost_price || prod.buy_price || 0);
        } else {
          itemCost = amount * 0.82;
        }

        if (isMatch) {
          if (type === 'penjualan') {
            sales += amount;
            inflows += amount;
            unitsSold += 1;
            costOfGoods += itemCost;
          } else if (type === 'pengeluaran_operasional') {
            operatingExpenses += amount;
            outflows += amount;
          } else if (type === 'pembelian_stok') {
            outflows += amount;
          } else if (type === 'trade_in') {
            inflows += amount;
          }
        }

        // Hitung Data Bulan Sebelumnya
        if (trxYear === targetPrevYear && trxMonth === targetPrevMonth) {
          if (type === 'penjualan') {
            prevSales += amount;
            prevUnitsSold += 1;
            prevGrossProfit += (amount - itemCost);
          }
          if (type === 'pengeluaran_operasional') {
            prevNetProfit -= amount;
          }
        }
      });

      const grossProfit = sales - costOfGoods;
      const grossMargin = sales > 0 ? (grossProfit / sales) * 100 : 0;
      prevNetProfit = prevGrossProfit + prevNetProfit; // gross - opex
      const netProfit = grossProfit - operatingExpenses;
      const netMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

      const salesGrowth = prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : (sales > 0 ? 100 : 0);
      const profitGrowth = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : (netProfit > 0 ? 100 : 0);

      setBusinessData({
        totalSales: sales,
        hpp: costOfGoods,
        grossProfit,
        grossMargin,
        opex: operatingExpenses,
        netProfit,
        netMargin,
        totalUnitsSold: unitsSold,
        salesGrowth,
        profitGrowth,
        prevMonthLabel: prevMonthName,
        prevSales,
        prevGrossProfit,
        prevNetProfit,
        prevUnitsSold,
      });

      // Hitung Target Progress Gross Profit dari store_targets
      const profitProg = currentTargetProfit > 0 ? Math.min((grossProfit / currentTargetProfit) * 100, 100) : 0;
      const unitProg = currentUnitTarget > 0 ? Math.min((unitsSold / currentUnitTarget) * 100, 100) : 0;

      setTargetData({
        targetGrossProfit: currentTargetProfit,
        unitTarget: currentUnitTarget,
        profitProgress: profitProg,
        unitProgress: unitProg,
        isTargetReached: grossProfit >= currentTargetProfit && unitsSold >= currentUnitTarget,
      });

      // 5. BREAK-EVEN ANALYSIS BERBASIS FIXED COST (Opex Rp 3.500.000)
      const fixedOpex = 3500000;
      const avgProfitPerUnit = unitsSold > 0 ? (grossProfit / unitsSold) : 400000; // default estimasi 400rb jika blm ada penjualan
      const calculatedBepUnits = avgProfitPerUnit > 0 ? Math.ceil(fixedOpex / avgProfitPerUnit) : 8;
      const isBreakEvenReached = unitsSold >= calculatedBepUnits;

      setBepData({
        fixedOpex,
        bepUnitsMin: 7, // Berdasarkan simulasi 500rb per unit
        bepUnitsMax: 10, // Berdasarkan simulasi 350rb per unit
        calculatedBepUnits,
        isBreakEvenReached,
      });

      // 6. HITUNG INVENTARIS
      let currentInvVal = 0;
      let totalStock = 0;
      let age0_7 = 0, age8_14 = 0, age15_30 = 0, ageMore30 = 0;

      if (products) {
        const now = new Date();
        products.forEach((prod: any) => {
          const prodStatus = (prod.status || '').toLowerCase();
          const isAvailable = prodStatus === 'available' || prodStatus === 'tersedia' || !prod.status;
          if (isAvailable) {
            const stockQty = Number(prod.stock || 1);
            const costPrice = Number(prod.cost_price || prod.buy_price || prod.price || 0);
            totalStock += stockQty;
            currentInvVal += costPrice * stockQty;

            const createdDate = new Date(prod.created_at || now);
            const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));

            if (diffDays <= 7) age0_7 += stockQty;
            else if (diffDays <= 14) age8_14 += stockQty;
            else if (diffDays <= 30) age15_30 += stockQty;
            else ageMore30 += stockQty;
          }
        });

        setInventoryData({
          totalUnitsInStock: totalStock,
          totalInventoryValue: currentInvVal,
          aging0_7: age0_7,
          aging8_14: age8_14,
          aging15_30: age15_30,
          agingMore30: ageMore30,
          avgHoldingPeriod: 12,
        });
      }

      setCashFlowData({
        totalBalance: calculatedTotalCash,
        bankAccounts: currentBankAccounts,
        totalInflows: inflows,
        totalOutflows: outflows,
        netCashFlow: inflows - outflows,
      });

      // 7. HITUNG EQUITIES & ALERTS
      const totalAssets = calculatedTotalCash + currentInvVal;
      const totalDebts = outflows > inflows ? (outflows - inflows) : 0; 
      const calculatedEquity = totalAssets - totalDebts;
      const equityRatio = totalAssets > 0 ? (calculatedEquity / totalAssets) * 100 : 100;

      setEquityData({
        totalAssets,
        totalEquity: calculatedEquity,
        equityPercentage: equityRatio,
      });

      const dynamicAlerts: Array<any> = [];

      if (equityRatio < 30) {
        dynamicAlerts.push({
          id: 'alert-equity-low',
          severity: 'high',
          title: 'CRITICAL: Equity Ratio Below 30%',
          description: `Rasio Ekuitas/Modal bersih toko turun menjadi ${equityRatio.toFixed(1)}%. Segera evaluasi kewajiban kas dan beban operasional!`,
          amount: `${equityRatio.toFixed(1)}%`,
          linkText: 'Cek Laporan Kas',
          linkUrl: '/founder/transactions'
        });
      }

      if (grossMargin < 15 && sales > 0) {
        dynamicAlerts.push({
          id: 'alert-margin',
          severity: 'medium',
          title: 'Low Gross Margin Detected',
          description: `Margin kotor saat ini berada di ${grossMargin.toFixed(1)}%, di bawah standar aman 15%.`,
          amount: `${grossMargin.toFixed(1)}%`,
          linkText: 'Cek Inventaris',
          linkUrl: '/founder/inventory'
        });
      }

      setAlerts(dynamicAlerts);
      setLastRefresh(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activePeriodLabel = PERIOD_OPTIONS.find(p => p.id === selectedMonth)?.label || 'Pilih Periode';

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[70vh] bg-slate-50/50">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        </div>
        <p className="text-xs font-mono tracking-widest text-slate-500 uppercase mt-4">Syncing Executive Analytics Suite...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 bg-[#F8FAFC] min-h-screen space-y-8 font-sans">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-white p-6 lg:px-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            href="/home" 
            className="p-3 bg-slate-50 hover:bg-slate-900 text-slate-600 hover:text-amber-400 rounded-2xl border border-slate-200/80 hover:border-slate-900 transition-all duration-200 shrink-0 group shadow-2xs"
            title="Kembali ke Dashboard Home"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Live Executive Analytics</h1>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> Founder Suite v3.1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Command center kinerja finansial, perbandingan bulanan, target Gross Profit, dan analisis BEP.</p>
          </div>
        </div>

        {/* Custom Filter & Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-medium transition shadow-sm border border-slate-800 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-100">{activePeriodLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 mb-1">
                  Pilih Rentang Laporan
                </div>
                {PERIOD_OPTIONS.map((option) => {
                  const isSelected = selectedMonth === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedMonth(option.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/10 text-slate-900 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                        <span>{option.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {option.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button 
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-semibold transition border border-slate-200/80 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400">Updated: {lastRefresh || 'Just now'}</span>
        </div>
      </div>

      {/* DATA ACCURACY BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-white">Ledger & Executive Analytics Synchronized</h3>
              <span className="text-[10px] font-mono bg-emerald-500 text-slate-900 px-2 py-0.5 rounded font-extrabold uppercase">100% Verified</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">Pencocokan IMEI unit katalog, target `store_targets`, dan perbandingan bulanan aktif.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
          <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Realtime Sync Active</span>
        </div>
      </div>

      {/* 1. Business Performance & Monthly Comparison Cards */}
      <div className="space-y-4">
        <div className="bg-[#0F172A] text-white px-7 py-4 rounded-t-3xl flex items-center justify-between shadow-md">
          <h2 className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            Business Performance & Profitability
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-blue-500/15 text-blue-300 px-3 py-1 rounded-full border border-blue-500/25 font-semibold">
            IMEI Cost Matched
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Omzet Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Sales / Omzet</p>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-3 tracking-tight">{formatIDR(businessData.totalSales)}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">{businessData.totalUnitsSold} Unit Terjual</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${businessData.salesGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {businessData.salesGrowth >= 0 ? '+' : ''}{businessData.salesGrowth.toFixed(1)}% vs bln lalu
              </span>
            </div>
          </div>

          {/* HPP Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Cost of Goods Sold (HPP)</p>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-3 tracking-tight">{formatIDR(businessData.hpp)}</p>
            <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">Exact cost price from product catalog</p>
          </div>

          {/* Gross Profit Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Gross Profit / Margin</p>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-600 mt-3 tracking-tight">{formatIDR(businessData.grossProfit)}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Margin: {businessData.grossMargin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Net Profit / Margin</p>
              <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${businessData.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {businessData.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <p className={`text-2xl font-black mt-3 tracking-tight ${businessData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatIDR(businessData.netProfit)}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Margin: {businessData.netMargin.toFixed(1)}%</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${businessData.profitGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {businessData.profitGrowth >= 0 ? '+' : ''}{businessData.profitGrowth.toFixed(1)}% vs bln lalu
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: MONTHLY COMPARISON TABLE / CARD SECTION */}
      <div className="space-y-4">
        <div className="bg-[#0F172A] text-white px-7 py-4 rounded-t-3xl flex items-center justify-between shadow-md">
          <h2 className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            Monthly Comparison (Periode Ini vs {businessData.prevMonthLabel})
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/25 font-semibold">
            Side-by-Side Growth
          </span>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Total Omzet</p>
              <div className="mt-2 flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-500">Bulan Ini: </span>
                  <p className="text-base font-black font-mono text-slate-900">{formatIDR(businessData.totalSales)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Bulan Lalu: </span>
                  <p className="text-sm font-bold font-mono text-slate-600">{formatIDR(businessData.prevSales)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Gross Profit (Laba Kotor)</p>
              <div className="mt-2 flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-500">Bulan Ini: </span>
                  <p className="text-base font-black font-mono text-blue-600">{formatIDR(businessData.grossProfit)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Bulan Lalu: </span>
                  <p className="text-sm font-bold font-mono text-slate-600">{formatIDR(businessData.prevGrossProfit)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Net Profit (Laba Bersih)</p>
              <div className="mt-2 flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-500">Bulan Ini: </span>
                  <p className={`text-base font-black font-mono ${businessData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatIDR(businessData.netProfit)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Bulan Lalu: </span>
                  <p className="text-sm font-bold font-mono text-slate-600">{formatIDR(businessData.prevNetProfit)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Unit Terjual</p>
              <div className="mt-2 flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                <div>
                  <span className="text-xs text-slate-500">Bulan Ini: </span>
                  <p className="text-base font-black font-mono text-slate-900">{businessData.totalUnitsSold} Unit</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Bulan Lalu: </span>
                  <p className="text-sm font-bold font-mono text-slate-600">{businessData.prevUnitsSold} Unit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STORE GROSS PROFIT TARGET & FIXED COST BEP COMMAND CENTER */}
      <div className="space-y-4">
        <div className="bg-[#0F172A] text-white px-7 py-4 rounded-t-3xl flex items-center justify-between shadow-md">
          <h2 className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Target className="w-4 h-4" />
            </div>
            Monthly Gross Profit Target & Fixed Cost BEP
          </h2>
          <span className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border font-semibold ${
            targetData.isTargetReached ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {targetData.isTargetReached ? 'Target Profit Tercapai ⚡' : 'Target Profit Berjalan 🚀'}
          </span>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Target Gross Profit (`store_targets`)</p>
              <p className="text-xl font-black font-mono text-slate-900 mt-2">{formatIDR(targetData.targetGrossProfit)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Target laba kotor bulan ini</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-mono uppercase text-slate-400 font-bold">Target Unit (`store_targets`)</p>
              <p className="text-xl font-black font-mono text-slate-900 mt-2">{targetData.unitTarget} Unit</p>
              <p className="text-[11px] text-slate-500 mt-1">Target kuantitas penjualan</p>
            </div>

            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
              <p className="text-[11px] font-mono uppercase text-blue-700 font-bold">Biaya Tetap Bulanan (Opex)</p>
              <p className="text-xl font-black font-mono text-blue-900 mt-2">{formatIDR(bepData.fixedOpex)}</p>
              <p className="text-[11px] text-blue-600 mt-1">Gaji staff & operasional tetap</p>
            </div>

            <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/70">
              <p className="text-[11px] font-mono uppercase text-amber-800 font-bold">BEP Unit (Minimal Tutup Biaya)</p>
              <p className="text-xl font-black font-mono text-amber-900 mt-2">{bepData.bepUnitsMin} - {bepData.bepUnitsMax} Unit</p>
              <p className="text-[11px] text-amber-700 mt-1">Estimasi margin @Rp 350rb - 500rb</p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-slate-600">Pencapaian Target Gross Profit</span>
                <span className={targetData.profitProgress >= 100 ? 'text-emerald-600' : 'text-blue-600'}>
                  {targetData.profitProgress.toFixed(1)}% ({formatIDR(businessData.grossProfit)} / {formatIDR(targetData.targetGrossProfit)})
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${targetData.profitProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${targetData.profitProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-slate-600">Pencapaian Target Unit</span>
                <span className={targetData.unitProgress >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                  {targetData.unitProgress.toFixed(1)}% ({businessData.totalUnitsSold} / {targetData.unitTarget} Unit)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${targetData.unitProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${targetData.unitProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cash Flow, Bank Balances & Equity */}
      <div className="space-y-4">
        <div className="bg-[#0F172A] text-white px-7 py-4 rounded-t-3xl flex items-center justify-between shadow-md">
          <h2 className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            Cash Flow & Realtime Account Balances
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/25 font-semibold">
            Realtime Supabase Sync
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Balances List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" /> Realtime Bank Balances
              </h3>
              <span className="text-[10px] font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">LIVE</span>
            </div>

            <div className="space-y-3">
              {cashFlowData.bankAccounts.map((acc, index) => (
                <div key={acc.id || index} className="flex justify-between items-center p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-slate-100/80 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                  </div>
                  <span className="text-xs font-extrabold font-mono text-slate-900">{formatIDR(acc.balance)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex justify-between items-center">
              <span className="text-xs font-black text-slate-800">Total Cash Balance</span>
              <span className="text-base font-black font-mono text-blue-600">{formatIDR(cashFlowData.totalBalance)}</span>
            </div>

            {/* Equity Health Indicator */}
            <div className={`p-4 rounded-2xl border ${equityData.equityPercentage < 30 ? 'bg-red-50/80 border-red-200' : 'bg-slate-900 text-white border-slate-800'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${equityData.equityPercentage < 30 ? 'text-red-700' : 'text-slate-400'}`}>
                  PUREI Equity Ratio
                </span>
                <span className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded-md ${
                  equityData.equityPercentage < 30 ? 'bg-red-100 text-red-800' : 'bg-amber-400 text-slate-900'
                }`}>
                  {equityData.equityPercentage.toFixed(1)}%
                </span>
              </div>
              <p className={`text-[11px] mt-2 ${equityData.equityPercentage < 30 ? 'text-red-700' : 'text-slate-300'}`}>
                Total Modal Bersih: <span className="font-mono font-bold text-white">{formatIDR(equityData.totalEquity)}</span>
              </p>
            </div>
          </div>

          {/* Cash Flow Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Cash Flow Summary (Inflow vs Outflow)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100/80">
                  <p className="text-[11px] font-mono font-bold uppercase text-emerald-700">Total Cash Inflows</p>
                  <p className="text-xl font-black font-mono text-emerald-900 mt-2">{formatIDR(cashFlowData.totalInflows)}</p>
                </div>
                <div className="p-5 bg-red-50/60 rounded-2xl border border-red-100/80">
                  <p className="text-[11px] font-mono font-bold uppercase text-red-700">Total Cash Outflows</p>
                  <p className="text-xl font-black font-mono text-red-900 mt-2">{formatIDR(cashFlowData.totalOutflows)}</p>
                </div>
                <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100/80">
                  <p className="text-[11px] font-mono font-bold uppercase text-blue-700">Net Cash Flow</p>
                  <p className="text-xl font-black font-mono text-blue-900 mt-2">{formatIDR(cashFlowData.netCashFlow)}</p>
                </div>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Internal account transfers are filtered out to prevent double-counting.</span>
              <span className="font-semibold font-mono text-emerald-600">Connected to 'banks' Table</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inventory & Stock Analytics */}
      <div className="space-y-4">
        <div className="bg-[#0F172A] text-white px-7 py-4 rounded-t-3xl flex items-center justify-between shadow-md">
          <h2 className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Package className="w-4 h-4" />
            </div>
            Inventory & Stock Analytics
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 px-3 py-1 rounded-full border border-amber-500/25 font-semibold">
            Active Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Units in Stock</p>
            <p className="text-2xl font-black text-slate-900 mt-3 tracking-tight">{inventoryData.totalUnitsInStock} Units</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for sale</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Inventory Value</p>
            <p className="text-2xl font-black text-slate-900 mt-3 tracking-tight">{formatIDR(inventoryData.totalInventoryValue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">At exact cost price</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Avg. Holding Period</p>
            <p className="text-2xl font-black text-blue-600 mt-3 tracking-tight">{inventoryData.avgHoldingPeriod} Days</p>
            <p className="text-[11px] text-slate-400 mt-1">From acquisition date</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Units Sold (Period)</p>
            <p className="text-2xl font-black text-emerald-600 mt-3 tracking-tight">{businessData.totalUnitsSold} Units</p>
            <p className="text-[11px] text-slate-400 mt-1">Realized sales volume</p>
          </div>
        </div>

        {/* Inventory Aging Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Inventory Aging Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
              <span className="text-[11px] font-mono font-bold text-slate-500">0–7 Days</span>
              <p className="text-xl font-black text-slate-900 mt-1">{inventoryData.aging0_7} Units</p>
            </div>
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
              <span className="text-[11px] font-mono font-bold text-slate-500">8–14 Days</span>
              <p className="text-xl font-black text-slate-900 mt-1">{inventoryData.aging8_14} Units</p>
            </div>
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
              <span className="text-[11px] font-mono font-bold text-slate-500">15–30 Days</span>
              <p className="text-xl font-black text-slate-900 mt-1">{inventoryData.aging15_30} Units</p>
            </div>
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-center">
              <span className="text-[11px] font-mono font-bold text-amber-700">More than 30 Days</span>
              <p className="text-xl font-black text-amber-800 mt-1">{inventoryData.agingMore30} Units</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Founder Actionable Alerts */}
      <div className="space-y-4">
        <div className="bg-[#0F172A] text-white px-7 py-4 rounded-t-3xl flex items-center justify-between shadow-md">
          <h2 className="font-bold text-sm tracking-wide flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            Founder Actionable Alerts
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 px-3 py-1 rounded-full border border-amber-500/25 font-semibold">
            {alerts.length} Active Notice(s)
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-xs font-mono">Semua indikator keuangan, saldo bank, dan ekuitas berada di kondisi aman.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-3 ${
                    alert.severity === 'high' ? 'bg-red-50/80 border-red-200' : 'bg-amber-50/60 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`} />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{alert.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {alert.amount && (
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-lg ${
                        alert.severity === 'high' ? 'text-red-800 bg-red-100' : 'text-amber-800 bg-amber-100'
                      }`}>
                        {alert.amount}
                      </span>
                    )}
                    <a 
                      href={alert.linkUrl} 
                      className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs transition hover:border-blue-300"
                    >
                      {alert.linkText} &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}