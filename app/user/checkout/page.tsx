"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, CheckCircle2, Phone, MapPin, Edit3, ArrowRight } from "lucide-react";

// Komponen Utama yang membaca Search Params
function CheckoutContent() {
  const searchParams = useSearchParams();
  const itemsParam = searchParams.get("items");
  const router = useRouter();
  const supabase = createClient();

  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  const [manualPhone, setManualPhone] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          const userPhone = profileData.phone || profileData.whatsapp || "";
          const userAddress = profileData.address || "";
          
          setProfilePhone(userPhone);
          setProfileAddress(userAddress);
          setManualPhone(userPhone);
          setManualAddress(userAddress);
        }
      }

      if (!itemsParam) {
        setLoading(false);
        return;
      }

      const productIds = itemsParam.split(",");
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (!error && data) {
          setCheckoutItems(data);
        }
      } catch (err) {
        console.error("Error fetching checkout items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [itemsParam, supabase]);

  const totalPrice = checkoutItems.reduce((acc, item) => acc + Number(item.price), 0);

  // FUNGSI SIMPAN KE SUPABASE
  const handleProcessOrder = async () => {
    const finalPhone = isEditingPhone ? manualPhone : profilePhone;
    const finalAddress = isEditingAddress ? manualAddress : profileAddress;

    if (!finalPhone.trim() || !finalAddress.trim()) {
      alert("Mohon lengkapi nomor WhatsApp dan alamat pengiriman terlebih dahulu!");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sesi habis, silakan login ulang.");
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      const customerName = profileData?.full_name || session.user.email || "Pelanggan";

      const orderInserts = checkoutItems.map((item) => ({
        user_id: session.user.id,
        customer_name: customerName,
        customer_phone: finalPhone,
        product_id: item.id,
        total_price: item.price,
        status: "pending",
      }));

      const { error: insertError } = await supabase
        .from("orders")
        .insert(orderInserts);

      if (insertError) {
        alert("Gagal memproses pesanan: " + insertError.message);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsOrderSuccess(true);

    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (isOrderSuccess) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] text-neutral-900 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-neutral-200/80 rounded-3xl p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-neutral-900">Pesanan Berhasil Dibuat!</h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Terima kasih telah berbelanja di PUREI. Pesanan kamu sudah masuk ke sistem.
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => router.push("/user/riwayat")}
              className="w-full bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Lihat Status Pesanan di User</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-neutral-900 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </button>

        <h1 className="text-2xl font-black tracking-tight">Checkout Pesanan</h1>

        {loading ? (
          <div className="text-center py-20 text-xs text-neutral-400">Memuat rincian pesanan...</div>
        ) : checkoutItems.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold text-neutral-800">Tidak ada produk yang dipilih untuk checkout.</p>
            <button 
              onClick={() => router.push("/")}
              className="bg-neutral-900 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
            >
              Kembali Belanja
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              
              {/* Ringkasan Unit */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                  Ringkasan Unit ({checkoutItems.length} Item)
                </h2>

                <div className="space-y-3">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <img 
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded-lg bg-neutral-200"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.storage || "128GB"}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-900 truncate mt-0.5">{item.name}</h4>
                        <p className="text-xs font-extrabold text-neutral-900 font-mono">
                          Rp {Number(item.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kontak & Pengiriman */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-5 shadow-2xs text-xs">
                <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                  Informasi Kontak & Pengiriman
                </h2>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Nomor WhatsApp Aktif</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsEditingPhone(!isEditingPhone)}
                      className="text-amber-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingPhone ? "Gunakan dari Profil" : "Ganti Nomor"}</span>
                    </button>
                  </div>

                  {isEditingPhone ? (
                    <input 
                      type="text" 
                      placeholder="Masukkan nomor WhatsApp baru..."
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-neutral-400"
                    />
                  ) : (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 font-mono text-neutral-800 font-medium">
                      {profilePhone || <span className="text-rose-500 font-sans italic">Nomor belum diisi di profil. Silakan klik "Ganti Nomor".</span>}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Alamat Pengiriman</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsEditingAddress(!isEditingAddress)}
                      className="text-amber-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingAddress ? "Gunakan dari Profil" : "Ganti Alamat"}</span>
                    </button>
                  </div>

                  {isEditingAddress ? (
                    <textarea 
                      rows={3}
                      placeholder="Masukkan alamat pengiriman lengkap..."
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 focus:bg-white focus:outline-none focus:border-neutral-400 resize-none"
                    />
                  ) : (
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-neutral-800 leading-relaxed">
                      {profileAddress || <span className="text-rose-500 italic">Alamat belum diisi di profil. Silakan klik "Ganti Alamat".</span>}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Total Tagihan */}
            <div className="space-y-4">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-4 shadow-2xs sticky top-24">
                <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                  Rincian Pembayaran
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Total Harga Unit</span>
                    <span className="font-mono font-bold text-neutral-900">Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Biaya Pengiriman</span>
                    <span className="font-mono font-bold text-emerald-600">GRATIS</span>
                  </div>
                  <div className="border-t border-neutral-100 pt-3 flex justify-between text-sm font-extrabold text-neutral-900">
                    <span>Total Tagihan</span>
                    <span className="font-mono text-amber-600">Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={handleProcessOrder}
                  className="w-full bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Buat Pesanan Sekarang"}
                </button>

                <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Transaksi aman dengan garansi toko 30 hari.</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// Export Default dengan Pembungkus Suspense (FIX ERROR NEXT.JS BUILD)
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-neutral-400">Memuat Halaman Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}