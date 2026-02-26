import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Krisha Sparkles. Questions about orders, returns, or products? We typically respond within a few hours.",
  openGraph: {
    title: "Contact Us | Krisha Sparkles",
    description: "Reach out to Krisha Sparkles for order support, product questions, or general inquiries. Fast response guaranteed.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
