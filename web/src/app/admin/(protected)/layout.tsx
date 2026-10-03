import { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, settings] = await Promise.all([requireAdmin(), getSiteSettings()]);

  return (
    <div className="min-h-full bg-steel-50">
      <AdminNav adminEmail={session.email} siteName={settings.siteName} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
