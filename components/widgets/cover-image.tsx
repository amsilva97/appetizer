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
 * Fades the whole image into the blurred copy behind it. One ellipse that
 * touches the image's sides, so there are no straight edges or corners to show
 * as a box (two crossed linear fades always leave a rounded rectangle), and it
 * hides the darker edges many banners have baked in.
 */
const FEATHER = "radial-gradient(ellipse closest-side at 50% 50%, #000 35%, rgba(0,0,0,.6) 65%, transparent 100%)";

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
