"use client";

import { useEffect, useRef, useState } from "react";
import type { CoverFit } from "@/types/app-widget";

interface Props {
  src: string;
  fit: CoverFit;
  /** Zoom and offset from the card's settings. */
  transform: string;
  onError: () => void;
}

/**
 * Soft edges so the whole image blends into the blurred copy behind it. Wide
 * enough to hide the darker edges and bottom fade many banners have baked in,
 * which a narrow feather leaves showing as a frame.
 */
const FEATHER =
  "linear-gradient(to right, transparent, #000 22%, #000 78%, transparent), " +
  "linear-gradient(to bottom, transparent, #000 16%, #000 80%, transparent)";

/**
 * A full-cover card's image. "cover" fills the card and crops. "contain"
 * shows the whole image, sized to its own shape and feathered at the edges,
 * over a blurred, cropped copy that fills the rest of the card.
 */
export default function CoverImage({ src, fit, transform, onError }: Props) {
  const [ratio, setRatio] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function measure(img: HTMLImageElement) {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) setRatio(img.naturalWidth / img.naturalHeight);
  }

  // A cached image can finish loading before React attaches onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) measure(imgRef.current);
  }, [src, fit]);

  if (fit !== "contain") {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- logo URLs are arbitrary external images */
      <img
        src={src}
        alt=""
        data-cover-image
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform, transformOrigin: "center" }}
        onError={onError}
      />
    );
  }

  // Until the image's shape is known, letterbox it inside the whole card.
  const sized: React.CSSProperties = ratio
    ? {
        width: `min(100cqw, ${Math.round(ratio * 100 * 100) / 100}cqh)`,
        aspectRatio: String(ratio),
        maskImage: FEATHER,
        WebkitMaskImage: FEATHER,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }
    : { width: "100%", height: "100%", objectFit: "contain" };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo URLs are arbitrary external images */}
      <img
        src={src}
        alt=""
        aria-hidden
        data-cover-backdrop
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl"
      />
      <div className="absolute inset-0 flex items-center justify-center" style={{ containerType: "size" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logo URLs are arbitrary external images */}
        <img
          src={src}
          alt=""
          data-cover-image
          className="block object-contain"
          style={{ ...sized, transform, transformOrigin: "center" }}
          ref={imgRef}
          onLoad={(e) => measure(e.currentTarget)}
          onError={onError}
        />
      </div>
    </>
  );
}
