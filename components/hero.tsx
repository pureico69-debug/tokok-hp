import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white text-neutral-900 py-24 sm:py-32 border-b border-neutral-200">
      {/* Garis grid tipis halus ala editorial jurnal */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f2f2f2_1px,transparent_1px),linear-gradient(to_bottom,#f2f2f2_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
        
        {/* Judul Utama */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 leading-[1.12]">
          Cari iPhone Bekas Aman, <br />
          Atau Mau <span className="text-yellow-400">Jual Cepat</span> HP-mu?
        </h1>

        {/* Deskripsi */}
        <p className="mt-6 mx-auto text-base sm:text-lg text-neutral-600 leading-relaxed font-light max-w-2xl">
          Pusat pre-owned Terpercaya di Indonesia. Cari unit <span className="font-medium text-neutral-900">like new</span> bergaransi tanpa takut minus, atau tukar tambah HP lama dengan penawaran transparan.
        </p>

        {/* Tombol Aksi Utama */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#katalog"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-neutral-900 px-8 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-sm"
          >
            Cek Stok Unit Ready
          </Link>
          <Link
            href="https://wa.me/6287895164020?text=Halo%20PUREI%2C%20saya%20mau%20ajukan%20jual%20atau%20tukar%20tambah%20HP%20saya."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full border border-neutral-300 bg-white px-8 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 hover:border-neutral-400"
          >
            Ajukan Jual / Tukar Tambah
          </Link>
        </div>

        {/* Bagian Bawah: Diubah jadi Card Interaktif Beranimasi Halus */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          
          {/* Card 1 */}
          <div className="group relative rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/50 hover:shadow-md">
            <div className="absolute top-0 left-6 h-1 w-10 rounded-full bg-yellow-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center gap-2 font-semibold text-neutral-900 text-xs tracking-wide">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              BEBAS MINUS TERSEMBUNYI
            </div>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
              Kondisi fisik & kesehatan baterai transparan apa adanya tanpa ada yang ditutup-tutupi.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/50 hover:shadow-md">
            <div className="absolute top-0 left-6 h-1 w-10 rounded-full bg-yellow-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center gap-2 font-semibold text-neutral-900 text-xs tracking-wide">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              JUAL / TUKAR TAMBAH CEPAT
            </div>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
              Proses penawaran harga wajar dan bersaing langsung via WhatsApp atau datang ke store.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/50 hover:shadow-md">
            <div className="absolute top-0 left-6 h-1 w-10 rounded-full bg-yellow-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center gap-2 font-semibold text-neutral-900 text-xs tracking-wide">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              GARANSI TOKO AMAN
            </div>
            <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
              Belanja unit pre-owned dengan rasa tenang bergaransi toko tanpa rasa khawatir.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}