"use client";

import { useState } from "react";
import type { ProductImage as ProductImageType } from "@prisma/client";

type GalleryProps = {
  images: ProductImageType[];
  productName: string;
};

export function ProductGallery({ images, productName }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-steel-100 text-steel-400">
        <div className="text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 fill-none stroke-current stroke-1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="mt-2 text-sm">Sin foto disponible</p>
        </div>
      </div>
    );
  }

  const mainImage = images[activeIndex];
  const total = images.length;

  const prev = () => setActiveIndex((i) => (i - 1 + total) % total);
  const next = () => setActiveIndex((i) => (i + 1) % total);

  return (
    <div>
      {/* Main image */}
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-steel-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={mainImage.id}
          src={mainImage.pathFull}
          alt={mainImage.altText || productName}
          className="h-full w-full object-contain p-4 transition-opacity duration-200"
        />

        {/* Image counter */}
        {total > 1 && (
          <span className="absolute left-3 top-3 rounded-full bg-steel-900/60 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {activeIndex + 1} / {total}
          </span>
        )}

        {/* Arrow buttons — visible on hover or touch */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-steel-200 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white focus-visible:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2 text-steel-700" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-steel-200 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white focus-visible:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2 text-steel-700" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, i) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-white ring-2 transition-all ${
                i === activeIndex
                  ? "ring-brand-500"
                  : "ring-transparent hover:ring-steel-300"
              }`}
              aria-label={`Ver imagen ${i + 1} de ${total}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.pathThumb}
                alt={image.altText || `Imagen ${i + 1}`}
                className="h-full w-full object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
