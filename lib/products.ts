export type Category = "iphone" | "android" | "aksesoris";

export type Product = {
  id: string;
  name: string;
  storage: string;
  color: string;
  price: number;
  originalPrice?: number;
  condition: string;
  batteryHealth: number;
  category: Category;
  accent: string;
};

export const products: Product[] = [
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    storage: "256 GB",
    color: "Natural Titanium",
    price: 18_499_000,
    originalPrice: 21_999_000,
    condition: "Like New 99%",
    batteryHealth: 95,
    category: "iphone",
    accent: "#8a8d88",
  },
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    storage: "128 GB",
    color: "Blue Titanium",
    price: 15_499_000,
    originalPrice: 18_999_000,
    condition: "Like New",
    batteryHealth: 96,
    category: "iphone",
    accent: "#4a5a6a",
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    storage: "128 GB",
    color: "Pink",
    price: 11_299_000,
    originalPrice: 14_499_000,
    condition: "Like New",
    batteryHealth: 94,
    category: "iphone",
    accent: "#e8b4c4",
  },
  {
    id: "iphone-14-pro",
    name: "iPhone 14 Pro",
    storage: "128 GB",
    color: "Deep Purple",
    price: 12_499_000,
    originalPrice: 15_999_000,
    condition: "Like New",
    batteryHealth: 92,
    category: "iphone",
    accent: "#5c4a6e",
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    storage: "128 GB",
    color: "Starlight",
    price: 8_749_000,
    originalPrice: 11_999_000,
    condition: "Like New",
    batteryHealth: 91,
    category: "iphone",
    accent: "#f0ece4",
  },
  {
    id: "iphone-13-pro",
    name: "iPhone 13 Pro",
    storage: "256 GB",
    color: "Sierra Blue",
    price: 9_499_000,
    originalPrice: 13_499_000,
    condition: "Like New",
    batteryHealth: 90,
    category: "iphone",
    accent: "#6b8ca8",
  },
  {
    id: "iphone-13",
    name: "iPhone 13",
    storage: "128 GB",
    color: "Midnight",
    price: 7_299_000,
    originalPrice: 9_499_000,
    condition: "Like New",
    batteryHealth: 89,
    category: "iphone",
    accent: "#1c1c1e",
  },
  {
    id: "iphone-12",
    name: "iPhone 12",
    storage: "64 GB",
    color: "Blue",
    price: 5_149_000,
    originalPrice: 6_799_000,
    condition: "Like New",
    batteryHealth: 87,
    category: "iphone",
    accent: "#3b82c4",
  },
  {
    id: "galaxy-s24-ultra",
    name: "Galaxy S24 Ultra",
    storage: "256 GB",
    color: "Titanium Black",
    price: 14_999_000,
    originalPrice: 18_499_000,
    condition: "Like New 99%",
    batteryHealth: 96,
    category: "android",
    accent: "#2b2b2b",
  },
  {
    id: "galaxy-s23",
    name: "Galaxy S23",
    storage: "128 GB",
    color: "Cream",
    price: 8_249_000,
    originalPrice: 10_999_000,
    condition: "Like New 97%",
    batteryHealth: 91,
    category: "android",
    accent: "#e8dcc8",
  },
  {
    id: "pixel-8-pro",
    name: "Pixel 8 Pro",
    storage: "128 GB",
    color: "Obsidian",
    price: 9_199_000,
    originalPrice: 12_499_000,
    condition: "Excellent 96%",
    batteryHealth: 90,
    category: "android",
    accent: "#3a3a3c",
  },
  {
    id: "airpods-pro-2",
    name: "AirPods Pro (2nd Gen)",
    storage: "USB-C",
    color: "White",
    price: 2_849_000,
    originalPrice: 3_799_000,
    condition: "Like New 99%",
    batteryHealth: 94,
    category: "aksesoris",
    accent: "#f5f5f7",
  },
];

export const categories: { slug: Category | "semua"; label: string }[] = [
  { slug: "semua", label: "Semua" },
  { slug: "iphone", label: "iPhone" },
  { slug: "android", label: "Android" },
  { slug: "aksesoris", label: "Aksesoris" },
];

export function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export const WHATSAPP_NUMBER = "6281234567890";

export function whatsappLink(productName: string) {
  const text = encodeURIComponent(
    `Halo StoreHP, saya tertarik dengan ${productName} pre-owned. Apakah masih tersedia?`,
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
