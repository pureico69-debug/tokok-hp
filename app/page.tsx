import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { ProductCatalog } from "@/components/product-catalog";
import { SiteFooter } from "@/components/site-footer";
import { TradeInWorkflow } from "@/components/trade-in-workflow";
import { TrustBar } from "@/components/trust-bar";
import { EditorialDivider } from "@/components/editor-divider";
import { AnnouncementBar } from "@/components/announcement-bar"; // Import komponennya

export default function Home() {
  return (
    <div className="min-h-full bg-white text-neutral-900">
      <AnnouncementBar /> {/* Pasang di sini paling atas */}
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <ProductCatalog />
        <EditorialDivider />
        <TradeInWorkflow /> 
      </main>
      <SiteFooter />
    </div>
  );
}