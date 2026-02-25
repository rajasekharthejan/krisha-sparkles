import { headers } from "next/headers";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const heads = await headers();
  const pathname = heads.get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login");

  // Login page gets a clean full-screen layout — no sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar />
      <div style={{ flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
