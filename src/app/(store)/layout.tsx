import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import FlashSaleBanner from "@/components/store/FlashSaleBanner";
import CookieBanner from "@/components/store/CookieBanner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FlashSaleBanner />
      <Navbar />
      <main style={{ minHeight: "100vh" }}>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
