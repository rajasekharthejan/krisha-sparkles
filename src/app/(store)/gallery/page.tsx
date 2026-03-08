import type { Metadata } from "next";
import GalleryPageClient from "./GalleryPageClient";

export const metadata: Metadata = {
  title: "Customer Gallery — Krisha Sparkles",
  description:
    "See real customers wearing Krisha Sparkles jewelry. Browse verified photo reviews from our community of sparkle lovers.",
  openGraph: {
    title: "Customer Gallery — Krisha Sparkles",
    description:
      "Real customers, real sparkle. Browse verified photo reviews from our community.",
    images: [{ url: "https://shopkrisha.com/logo.png", width: 800, height: 800 }],
  },
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
