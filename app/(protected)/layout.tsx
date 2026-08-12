import { unstable_noStore as noStore } from "next/cache";
import { requirePageUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  noStore();
  await requirePageUser();
  return children;
}
