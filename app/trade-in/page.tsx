"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, ShieldCheck, RefreshCw, CheckCircle2, ChevronRight, Sparkles, Package, Wallet } from "lucide-react";

export default function TradeInPage() {
  const [priceListData, setPriceListData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State user session aktif
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State untuk form kalkulator trade-in
  const [simModel, setSimModel] = useState("iPhone 13");
  const [simStorage, setSimStorage] = useState("128GB");
  const [simRegion, setSimRegion] = useState("");
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [simBh, setSimBh] = useState(85);
  const [simCondition, setSimCondition] = useState("Mulus (Like New)");

  // State untuk pilihan produk pengganti (yang mau dibeli)
  const [selectedProductObj, setSelectedProductObj] = useState<any>(null);
  
  // State untuk formulir pengajuan/booking trade-in
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Fetch data session user & master data price_list / products dari Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil session user aktif
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
          // Auto-fill nama/email jika profil atau metadata tersedia (opsional)
          if (session.user.email) {
            setUserName(session.user.user_metadata?.full_name || "");
          }
        }

        // 2. Ambil price_list trade-in aktif
        const { data: priceList, error: priceError } = await supabase
          .from("price_list")
          .select("*")
          .eq("status", "Active");

        if (!priceError && priceList && priceList.length > 0) {
          setPriceListData(priceList);

          const uniqueRegions = Array.from(new Set(priceList.map((item: any) => item.region).filter(Boolean)));
          setAvailableRegions(uniqueRegions);
          
          if (uniqueRegions.length > 0) {
            setSimRegion(uniqueRegions[0]);
          }

          setSimModel(priceList[0].model || "iPhone 13");
          setSimStorage(priceList[0].storage || "128GB");
        }

        // 3. Ambil daftar produk katalog
        const { data: prodList, error: prodError } = await supabase
          .from("products")
          .select("*");

        if (!prodError && prodList && prodList.length > 0) {
          setProductsData(prodList);
          setSelectedProductObj(prodList[0]);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Kalkulasi estimasi harga HP lama
  const calculateEstimate = () => {
    const currentPriceItem = priceListData.find(
      (item) => 
        item.model?.toLowerCase() === simModel.toLowerCase() && 
        item.storage?.toLowerCase() === simStorage.toLowerCase() && 
        item.region?.toLowerCase() === simRegion.toLowerCase()
    );

    let baseMin = currentPriceItem ? Number(currentPriceItem.trade_in_min) : 7000000;
    let baseMax = currentPriceItem ? Number(currentPriceItem.trade_in_max) : 7500000;

    if (simBh < 85) {
      const deduction = (85 - simBh) * 50000;
      baseMin = Math.max(0, baseMin - deduction);
      baseMax = Math.max(0, baseMax - deduction);
    }
    if (simCondition.includes("Baret")) {
      baseMin -= 400000;
      baseMax -= 400000;
    } else if (simCondition.includes("Minus")) {
      baseMin -= 1000000;
      baseMax -= 1000000;
    }

    return {
      min: Math.max(0, baseMin),
      max: Math.max(0, baseMax),
    };
  };

  const estimate = calculateEstimate();

  // Harga produk incaran
  const targetProductPrice = selectedProductObj ? Number(selectedProductObj.price || 0) : 0;
  
  // Cek apakah estimasi HP lama lebih tinggi dari harga incaran (artinya dapat kembalian)
  const isCashback = estimate.min > targetProductPrice;

  // Hitung sisa kekurangan pembayaran atau kelebihan kembalian
  const remainingMinPay = Math.max(0, targetProductPrice - estimate.max);
  const remainingMaxPay = Math.max(0, targetProductPrice - estimate.min);

  // Hitung estimasi kembalian jika harga HP lama lebih tinggi
  const cashbackMin = Math.max(0, estimate.min - targetProductPrice);
  const cashbackMax = Math.max(0, estimate.max - targetProductPrice);

  const handleSubmitTradeIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone) {
      alert("Mohon lengkapi Nama dan No. WhatsApp Anda!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const payload = {
        user_id: session?.user?.id || null,
        email: session?.user?.email || null,
        name: userName,
        phone: userPhone,
        model: simModel,
        storage: simStorage,
        region: simRegion,
        battery_health: simBh,
        condition: simCondition,
        estimated_min: estimate.min,
        estimated_max: estimate.max,
        target_product: selectedProductObj?.name || "",
        status: "Pending"
      };

      const { error } = await supabase.from("trade_in_submissions").insert([payload]);

      if (error) {
        console.error("Supabase Error detail:", error);
        alert("Gagal menyimpan ke database: " + error.message);
        return;
      }

      setSuccessSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting trade-in:", err);
      alert("Terjadi kesalahan sistem: " + (err?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueModels = Array.from(new Set(priceListData.map((item) => item.model)));

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-neutral-900 font-sans pb-16">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push("/user")}
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
          <span className="font-extrabold text-sm tracking-tight text-neutral-900">PUREI Trade-In Center</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        
        {/* Banner Info */}
        <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3 max-w-lg">
            <span className="inline-flex items-center gap-1.5 bg-amber-400 text-neutral-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Tukar Tambah Mudah & Transparan
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Upgrade iPhone Lama ke Seri Terbaru</h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Cek estimasi harga perangkat lamamu, pilih HP pengganti incaranmu di toko kami, lalu lihat kalkulasi sisa pembayaran secara transparan.
            </p>
          </div>
        </div>

        {successSubmitted ? (
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-neutral-900">Pengajuan Trade-In Berhasil Dikirim!</h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
              Tim PUREI akan segera menghubungi nomor WhatsApp <strong className="text-neutral-800 font-mono">{userPhone}</strong> untuk verifikasi unit dan pemesanan unit incaran: <strong className="text-neutral-900">{selectedProductObj?.name}</strong>. Data pengajuan ini juga sudah tersimpan di riwayat akun kamu.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => router.push("/user/riwayat")}
                className="bg-amber-400 hover:bg-amber-500 text-neutral-950 px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Cek Riwayat Trade-In
              </button>
              <button 
                onClick={() => { setSuccessSubmitted(false); }}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hitung Simulasi Lainnya
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sisi Kiri: Form Pilihan Kalkulator & Katalog Produk */}
            <div className="md:col-span-2 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Bagian 1: Pilih HP Lama */}
              <div className="space-y-4">
                <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>1. Pilih Spesifikasi HP Lama Kamu</span>
                </h2>

                {loading ? (
                  <div className="text-center py-6 text-xs text-neutral-400">Memuat data...</div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">Model Perangkat Lama</label>
                        <select 
                          value={simModel} 
                          onChange={(e) => setSimModel(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900"
                        >
                          {uniqueModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">Kapasitas Storage</label>
                        <select 
                          value={simStorage} 
                          onChange={(e) => setSimStorage(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900"
                        >
                          <option value="64GB">64GB</option>
                          <option value="128GB">128GB</option>
                          <option value="256GB">256GB</option>
                          <option value="512GB">512GB</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">Garansi / Region Asal</label>
                        <select 
                          value={simRegion} 
                          onChange={(e) => setSimRegion(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900"
                        >
                          {availableRegions.map((reg) => (
                            <option key={reg} value={reg}>
                              {reg === 'ibox' ? 'iBox / Digimap (PA/A)' : reg === 'inter' ? 'International (Inter)' : reg}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">Battery Health (%)</label>
                        <input 
                          type="number" 
                          min="50" 
                          max="100"
                          value={simBh} 
                          onChange={(e) => setSimBh(Number(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Kondisi Fisik & Fungsi</label>
                      <select 
                        value={simCondition} 
                        onChange={(e) => setSimCondition(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900"
                      >
                        <option>Mulus (Like New, Tanpa Lecet)</option>
                        <option>Baret Sedang Pemakaian Normal</option>
                        <option>Ada Minus Fungsi / LCD / Fisik Berat</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-neutral-100 my-2" />

              {/* Bagian 2: Pilih Produk Katalog (Pengganti) */}
              <div className="space-y-4">
                <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>2. Pilih iPhone Pengganti Incaran Kamu</span>
                </h2>
                <div className="text-xs">
                  <label className="block font-semibold text-neutral-700 mb-1">Pilih Produk Ready dari Katalog Kami</label>
                  <select 
                    value={selectedProductObj?.id || selectedProductObj?.name} 
                    onChange={(e) => {
                      const found = productsData.find((p) => String(p.id || p.name) === e.target.value);
                      setSelectedProductObj(found);
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900"
                  >
                    {productsData.map((prod) => (
                      <option key={prod.id || prod.name} value={prod.id || prod.name}>
                        {prod.name} {prod.price ? `- Rp ${Number(prod.price).toLocaleString("id-ID")}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-neutral-100 my-2" />

              {/* Bagian 3: Data Diri & Submit */}
              <form onSubmit={handleSubmitTradeIn} className="space-y-4">
                <h3 className="font-extrabold text-neutral-900 text-sm">3. Data Diri untuk Pengajuan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Budi Santoso"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nomor WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 081234567890"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:border-neutral-900 font-mono"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white py-3.5 rounded-xl font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>{isSubmitting ? "Mengirim Pengajuan..." : "Ajukan Trade-In Sekarang"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>

            </div>

            {/* Sisi Kanan: Kotak Hasil Estimasi & Sisa Pembayaran / Kembalian */}
            <div className="space-y-4">
              <div className="bg-neutral-900 text-white rounded-3xl p-6 shadow-lg space-y-4 sticky top-24">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
                  {isCashback ? "Kalkulasi Estimasi Cashback" : "Kalkulasi Sisa Pembayaran"}
                </span>
                
                <div>
                  <p className="text-xs text-neutral-400">Harga Unit Incaran:</p>
                  <p className="text-base font-bold font-mono text-white mt-0.5">
                    Rp {targetProductPrice.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-neutral-400">Estimasi Potongan HP Lama:</p>
                  <p className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                    Rp {estimate.min.toLocaleString("id-ID")} s/d Rp {estimate.max.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 bg-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                    <Wallet className="w-4 h-4" />
                    <span>{isCashback ? "Estimasi Tunai / Kembalian:" : "Estimasi Sisa Bayar:"}</span>
                  </div>
                  
                  {isCashback ? (
                    <>
                      <p className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                        + Rp {cashbackMin.toLocaleString("id-ID")}
                      </p>
                      {cashbackMin !== cashbackMax && (
                        <p className="text-[11px] text-neutral-300 font-mono">
                          s/d + Rp {cashbackMax.toLocaleString("id-ID")}
                        </p>
                      )}
                      <p className="text-[10px] text-emerald-300 pt-1 font-medium">
                        *Nilai lebih HP kamu akan dikembalikan tunai/transfer oleh store.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg sm:text-xl font-black font-mono text-white">
                        Rp {remainingMinPay.toLocaleString("id-ID")}
                      </p>
                      {remainingMinPay !== remainingMaxPay && (
                        <p className="text-[11px] text-neutral-300 font-mono">
                          s/d Rp {remainingMaxPay.toLocaleString("id-ID")}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2 text-[11px] text-neutral-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dicek langsung oleh teknisi profesional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Proses cepat kurang dari 30 menit</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}