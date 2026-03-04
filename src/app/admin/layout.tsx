import { headers } from "next/headers";
import AdminSidebar from "@/components/admin/AdminSidebar";
import TestModeBanner from "@/components/admin/TestModeBanner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const heads = await headers();
  const pathname = heads.get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login");

  // Login page gets a clean full-screen layout — no sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    // Force dark theme for admin panel regardless of store theme setting
    <div data-theme="dark" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar />
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <TestModeBanner />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
