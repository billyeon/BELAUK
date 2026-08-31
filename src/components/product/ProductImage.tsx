"use client";

import { useState } from "react";

export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-line/60 text-2xl text-muted ${className}`}
        aria-hidden
      >
        ▦
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
