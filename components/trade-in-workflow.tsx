import Link from "next/link";

export function TradeInWorkflow() {
  const steps = [
    {
      number: "01",
      title: "Kirim Detail Perangkat",
      description: "Infokan tipe, kapasitas, kondisi fisik, dan persentase Battery Health langsung via WhatsApp.",
    },
    {
      number: "02",
      title: "Estimasi Harga Transparan",
      description: "Tim kami akan mengecek dan memberikan penawaran harga terbaik secara jujur dan terbuka.",
    },
    {
      number: "03",
      title: "Deal & Serah Terima",
      description: "Datang langsung ke store kami di Bandung atau tunggu kami di lokasi anda proses pencairan dana instan.",
    },
  ];

  return (
    <section className="relative bg-white py-24 sm:py-32 border-b border-neutral-200 overflow-hidden">
      {/* Background grid halus yang konsisten */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block rounded-full bg-neutral-100 border border-neutral-200 px-4 py-1.5 text-xs font-mono font-medium text-neutral-800 mb-4 shadow-sm">
            LAYANAN TRADE-IN & JUAL
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Cara Mudah Jual atau Tukar Tambah
          </h2>
          <p className="mt-3 text-base text-neutral-600 leading-relaxed">
            Tiga langkah simpel untuk menguangkan atau menukar perangkat lama Anda di PUREI dengan aman dan transparan.
          </p>
        </div>

        {/* Grid Card dengan Teks Lebih Jelas & Tajam */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="group relative rounded-2xl border border-neutral-200/90 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500 hover:shadow-xl flex flex-col justify-between"
            >
              {/* Garis aksen kuning di atas card saat hover */}
              <div className="absolute top-0 left-6 h-1 w-12 rounded-full bg-yellow-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-900">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    LANGKAH {step.number}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    0{index + 1} / 03
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm text-neutral-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>PUREI SYSTEM</span>
                <span className="group-hover:text-neutral-900 transition-colors">VERIFIED</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tombol Aksi */}
        <div className="mt-12 text-center">
          <Link
            href="https://wa.me/6287895164020?text=Halo%20PUREI%2C%20saya%20mau%20tanya%20estimasi%20harga%20untuk%20jual/tukar%20tambah%20iPhone%20saya."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-xs font-bold text-white transition-all duration-300 hover:bg-yellow-500 hover:text-black shadow-md hover:-translate-y-0.5"
          >
            Konsultasikan Penjualan via WhatsApp
          </Link>
        </div>

      </div>
    </section>
  );
}