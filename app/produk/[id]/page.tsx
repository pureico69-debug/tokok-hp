import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { PhoneVisual } from "@/components/phone-visual";
import { SiteFooter } from "@/components/site-footer";
import {
  formatRupiah,
  products,
  whatsappLink,
} from "@/lib/products";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) notFound();

  return (
    <div className="min-h-full bg-white">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="rounded-3xl bg-gradient-to-b from-neutral-100 to-white">
          <PhoneVisual accent={product.accent} name={product.name} variant="hero" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[13px] font-medium tracking-[0.14em] text-neutral-500 uppercase">
            Pre-owned
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900">
            {product.name}
          </h1>
          <p className="mt-2 text-neutral-500">
            {product.storage} · {product.color}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[13px] font-medium text-neutral-800">
              {product.condition}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[13px] font-medium text-neutral-800">
              Battery Health {product.batteryHealth}%
            </span>
          </div>
          <p className="mt-6 text-3xl font-semibold tracking-tight text-neutral-900">
            {formatRupiah(product.price)}
          </p>
          {product.originalPrice ? (
            <p className="text-sm text-neutral-400 line-through">
              {formatRupiah(product.originalPrice)}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-7 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Beli via WhatsApp
            </a>
            <Link
              href="/#katalog"
              className="inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-medium text-[#0071e3] hover:underline"
            >
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
