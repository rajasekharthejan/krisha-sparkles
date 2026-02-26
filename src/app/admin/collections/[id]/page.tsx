"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import CollectionForm from "../CollectionForm";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditCollectionPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    supabase.from("collections").select("*").eq("id", params.id).single()
      .then(({ data: d }) => setData(d));
  }, [params.id]);

  if (!data) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Loading...</div>;
  return <CollectionForm mode="edit" initialData={{ ...data, id: params.id, filter_category_slugs: (data.filter_category_slugs as string[] | null)?.join(", ") || "" } as Parameters<typeof CollectionForm>[0]["initialData"]} />;
}
