"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setUTMCookie } from "@/lib/attribution";

export default function UTMCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    setUTMCookie(new URLSearchParams(searchParams.toString()));
  }, [searchParams]);

  return null;
}
