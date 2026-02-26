"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BlogForm from "../../BlogForm";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("id", params.id).single()
      .then(({ data: d }) => setData(d));
  }, [params.id]);

  if (!data) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Loading...</div>;
  return <BlogForm mode="edit" initialData={{ ...data, id: params.id, tags: (data.tags as string[] | null)?.join(", ") || "" } as Parameters<typeof BlogForm>[0]["initialData"]} />;
}
