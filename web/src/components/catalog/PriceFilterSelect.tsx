"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PRICE_RANGES } from "@/lib/constants";

export function PriceFilterSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("precio") ?? "";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("precio", value);
    else params.delete("precio");
    router.push(`${pathname}?${params.toString()}#productos`, { scroll: false });
  }

  return (
    <select
      value={active}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-xs rounded-xl border border-steel-200 bg-white px-4 py-3 text-sm font-semibold text-steel-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-auto"
    >
      <option value="">Todos los precios</option>
      {PRICE_RANGES.map((range) => (
        <option key={range.value} value={range.value}>
          {range.label}
        </option>
      ))}
    </select>
  );
}
