"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

interface RefundRequestButtonProps {
  orderId: string;
  userEmail: string;
  userId: string;
}

export default function RefundRequestButton({ orderId, userEmail, userId }: RefundRequestButtonProps) {
  // Suppress unused-variable warnings — props kept for interface compatibility
  void orderId;
  void userEmail;
  void userId;

  return (
    <Link
      href="/contact"
      className="btn-gold-outline"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}
    >
      <Mail size={15} />
      Contact Us for Help
    </Link>
  );
}
