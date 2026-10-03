"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface SearchBarProps {
  id?: string;
}

export function SearchBar({ id = "search" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <div className="relative flex items-center">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 h-4 w-4 fill-none stroke-steel-400 stroke-2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          id={id}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o medida..."
          className="w-full rounded-xl border border-steel-200 bg-steel-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
    </form>
  );
}
