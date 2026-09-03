"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Smartphone, BatteryCharging, MessageSquare, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export function ProductCatalog() {
  const [iphoneProducts, setIphoneProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [waNumber, setWaNumber] = useState("6281234567890"); // Default fallback
  const supabase = createClient();

  useEffect(() => {
    async function fetchCatalogData() {
      setLoading(true);

      // Ambil produk dan nomor WhatsApp dari database secara bersamaan
      const [productRes, settingRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("status", "available")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("settings")
          .select("value")
          .eq("key", "whatsapp_number")
          .single()
      ]);

      if (!productRes.error && productRes.data) {
        setIphoneProducts(productRes.data);
      }

      if (!settingRes.error && settingRes.data?.value) {
        setWaNumber(settingRes.data.value);
      }

      setLoading(false);
    }

    fetchCatalogData();
  }, [supabase]);

  const formatRupiah = (val: number) =>
    "Rp " + Number(val).toLocaleString("id-ID");

  const handleCheckout = async (product: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("Silakan login terlebih dahulu untuk checkout.");
      window.location.href = "/login";
      return;
    }

    setProcessingId(product.id);

    const { error } = await supabase.from("orders").insert([
      {
        user_id: user.id,
        product_id: product.id,
        customer_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer PUREI",
        customer_phone: user.user_metadata?.phone || "-",
        total_price: product.price,
        status: "pending"
      }
    ]);

    if (error) {
      toast.error("Gagal membuat pesanan: " + error.message);
      setProcessingId(null);
    } else {
      toast.success("Pesanan berhasil dibuat! Silakan cek menu Kelola Pesanan.");
      setProcessingId(null);
    }
  };

  return (
    <section id="katalog" className="relative scroll-mt-20 bg-white py-24 sm:py-32 border-b border-neutral-200 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-neutral-100 border border-neutral-200 px-4 py-1.5 text-xs font-mono font-bold text-neutral-900 mb-4 shadow-xs">
            ETALASE PRE-OWNED
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Katalog Pilihan iPhone
          </h2>
          <p className="mt-3 text-base text-neutral-700 leading-relaxed font-medium">
            Setiap unit telah melalui uji kualitas ketat, laporan baterai transparan, dan bergaransi toko. Siap kirim atau ambil langsung di store.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 font-mono text-xs text-neutral-400">
            Memuat etalase unit terbaru...
          </div>
        ) : iphoneProducts.length === 0 ? (
          <div className="text-center py-12 font-mono text-xs text-neutral-500">
            Belum ada unit yang ditampilkan di etalase.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {iphoneProducts.map((product) => {
              // Buat link WhatsApp dinamis berdasarkan nomor dari database settings
              const waMessage = encodeURIComponent(`Halo PUREI, saya ingin bertanya mengenai unit ${product.name} ${product.storage} (${product.color}) pre-owned. Apakah masih tersedia?`);
              const dynamicWaUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500 hover:shadow-xl"
                >
                  <div className="absolute top-0 left-5 right-5 h-1 rounded-full bg-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div>
                    <div className="relative aspect-square w-full rounded-xl bg-neutral-50 border border-neutral-200/60 overflow-hidden mb-4 flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-400">
                          <Smartphone className="w-10 h-10 mb-1" />
                          <span className="text-[10px] font-mono">No Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-900 text-[10px] font-mono font-bold text-amber-400">
                          {product.condition || "Like New"}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-[10px] font-mono font-bold text-emerald-700">
                          <BatteryCharging className="w-3 h-3" />
                          BH {product.battery_health}%
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold tracking-tight text-neutral-900 mt-1">
                          {product.name}
                        </h3>
                        <p className="text-xs font-bold text-neutral-500 font-mono mt-0.5">
                          {product.storage} • {product.color}
                        </p>
                      </div>

                      <div className="pt-1">
                        <p className="text-base font-extrabold tracking-tight text-neutral-950 font-mono">
                          {formatRupiah(product.price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2">
                    <button
                      onClick={() => handleCheckout(product)}
                      disabled={processingId === product.id}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-xs font-bold text-white transition-all hover:bg-amber-400 hover:text-neutral-950 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingCart className="w-4 h-4 text-amber-400 group-hover:text-neutral-950" />
                      {processingId === product.id ? "Memproses..." : "Checkout via Web"}
                    </button>

                    <a
                      href={dynamicWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-[11px] font-bold text-neutral-700 transition-all hover:bg-neutral-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                      Tanya via WhatsApp
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}