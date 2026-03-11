import { Suspense } from "react";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import FlashSaleBanner from "@/components/store/FlashSaleBanner";
import CookieBanner from "@/components/store/CookieBanner";
import ExitIntentPopup from "@/components/store/ExitIntentPopup";
import AbandonedCartTracker from "@/components/store/AbandonedCartTracker";
import SocialProofToast from "@/components/store/SocialProofToast";
import UTMCapture from "@/components/store/UTMCapture";
import CrispChat from "@/components/store/CrispChat";
import PWAInstaller from "@/components/store/PWAInstaller";
import CartSessionGuard from "@/components/store/CartSessionGuard";
import BottomNav from "@/components/store/BottomNav";
import PageTransition from "@/components/store/PageTransition";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Extra bottom padding on mobile so BottomNav doesn't overlap content */}
      <style>{`@media(max-width:767px){.store-main{padding-bottom:calc(60px + env(safe-area-inset-bottom,0px)) !important}}`}</style>
      <FlashSaleBanner />
      <Navbar />
      <main className="store-main" style={{ minHeight: "100vh" }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <BottomNav />
      <CookieBanner />
      <ExitIntentPopup />
      <AbandonedCartTracker />
      <SocialProofToast />
      <Suspense fallback={null}>
        <UTMCapture />
      </Suspense>
      {/* F11: Live Chat — lazy-loads Crisp widget, injects user identity */}
      <CrispChat />
      {/* F9: PWA — shows "Add to Home Screen" banner on mobile after 30s */}
      <PWAInstaller />
      {/* Cart session guard — clears cart on logout / session expiry */}
      <CartSessionGuard />
    </>
  );
}
