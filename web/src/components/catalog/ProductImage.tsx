"use client";

type ProductImageProps = {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function ProductImage({
  src,
  fallback,
  alt,
  className,
  priority,
}: ProductImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      onError={(event) => {
        const target = event.currentTarget;
        if (target.src.endsWith(fallback)) return;
        target.src = fallback;
      }}
    />
  );
}
