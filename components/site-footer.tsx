import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-neutral-800 bg-black py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        {/* Info Toko & Logo */}
        <div className="max-w-xs">
          <Link href="/" className="inline-block">
            <div className="relative h-12 w-42 overflow-hidden bg-black">
              <Image
                src="/logo-purei-putih.png"
                alt="PUREI Logo"
                fill
                className="object-contain object-left"
              />
            </div>
          </Link>
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-400">
            Toko HP bekas aman dan ramah di kantong. Pre-owned berkualitas, garansi resmi, siap pakai.
          </p>
          <p className="mt-4 text-[12px] leading-relaxed text-neutral-500">
            📍 Jl. Riung Mulya Raya No.13, Cisaranten Kidul, Kec. Gedebage, Kota Bandung, Jawa Barat 40295
          </p>
        </div>

        {/* Menu Navigasi & Sosial Media */}
        <div className="flex flex-wrap gap-12 text-[13px]">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-neutral-200">Belanja</p>
            <Link href="/?kategori=iphone#katalog" className="text-neutral-400 hover:text-white transition-colors">
              iPhone
            </Link>
            <Link href="/?kategori=android#katalog" className="text-neutral-400 hover:text-white transition-colors">
              Android
            </Link>
            <Link href="/?kategori=aksesoris#katalog" className="text-neutral-400 hover:text-white transition-colors">
              Aksesoris
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-medium text-neutral-200">Kontak & Informasi</p>
            <a
              href="https://wa.me/6287895164020"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              WhatsApp (+62 878-9516-4020)
            </a>

            {/* Bagian Sosmed dengan Judul "Ikuti Kami" */}
            <div className="mt-1 flex flex-col gap-2">
              <p className="font-medium text-neutral-200">Ikuti Kami</p>
              <div className="flex items-center gap-3">
                {/* Instagram */}
                <a
                  href="https://instagram.com/purei.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                  aria-label="Instagram PUREI"
                >
                  <InstagramIcon />
                </a>

                {/* TikTok */}
                <a
                  href="https://tiktok.com/@purei.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                  aria-label="TikTok PUREI"
                >
                  <TikTokIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-neutral-900 px-4 pt-6 text-[12px] text-neutral-500 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} PUREI. All rights reserved.</p>
        <p className="text-neutral-600">Terpercaya & Bergaransi Resmi</p>
      </div>
    </footer>
  );
}

/* Komponen Ikon Instagram */
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/* Komponen Ikon TikTok */
function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}