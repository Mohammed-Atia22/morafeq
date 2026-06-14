import { useState } from "react";

export function PhotoGallery({ photos = [] }) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1));

  // Thumbnails: show up to 4 below the hero
  const thumbs = photos.slice(0, 4);

  if (photos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3 9.75L12 3l9 6.75V21H3V9.75z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Hero */}
      <div className="relative h-[340px] overflow-hidden rounded-2xl bg-slate-900">
        <img
          src={photos[current]?.url}
          alt={`صورة ${current + 1}`}
          className="h-full w-full object-cover"
        />

        {/* Counter badge */}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {current + 1} / {photos.length}
        </span>

        {/* Arrows — only show if more than 1 photo */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 shadow backdrop-blur transition hover:bg-white"
              aria-label="السابق"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 shadow backdrop-blur transition hover:bg-white"
              aria-label="التالي"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail grid */}
      {thumbs.length > 1 && (
        <div className={`grid gap-2 ${thumbs.length === 2 ? "grid-cols-2" : thumbs.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {thumbs.map((photo, idx) => (
            <button
              key={photo.id ?? idx}
              type="button"
              onClick={() => setCurrent(idx)}
              className={[
                "relative h-28 overflow-hidden rounded-xl transition",
                current === idx
                  ? "ring-2 ring-[#1752F0] ring-offset-2"
                  : "opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              <img
                src={photo.url}
                alt={`thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              {/* Show "+N more" overlay on last thumb if there are more photos */}
              {idx === 3 && photos.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                  +{photos.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}