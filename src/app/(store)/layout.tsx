import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh" }}>{children}</main>
      <Footer />
    </>
  );
}
