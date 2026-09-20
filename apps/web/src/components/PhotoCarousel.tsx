'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';

export interface CarouselImage {
  src: string;
  alt: string;
}

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d={dir === 'prev' ? 'M15.2 5.2 8.4 12l6.8 6.8' : 'M8.8 5.2 15.6 12l-6.8 6.8'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhotoCarousel({
  images,
  autoplay = true,
  intervalMs = 5000,
  delayMs = 0,
  paused = false,
  variant = 'hero',
  href,
  index,
  onIndexChange,
  onOpen,
}: {
  images: CarouselImage[];
  autoplay?: boolean;
  intervalMs?: number;
  delayMs?: number;
  paused?: boolean;
  variant?: 'hero' | 'card';
  href?: string;
  index?: number;
  onIndexChange?: (index: number) => void;
  onOpen?: (index: number) => void;
}) {
  const [internal, setInternal] = useState(0);
  const [hovering, setHovering] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const firstDelay = useRef(true);
  const current = index ?? internal;
  const canSlide = images.length > 1;
  const isPaused = paused || hovering;

  function go(next: number) {
    if (!canSlide) return;
    const wrapped = ((next % images.length) + images.length) % images.length;
    onIndexChange?.(wrapped);
    if (index === undefined) setInternal(wrapped);
  }

  useEffect(() => {
    if (!canSlide || !autoplay || isPaused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const wait = firstDelay.current ? delayMs : 0;
    firstDelay.current = false;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        go(current + 1);
      }, intervalMs);
    }, wait);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
    // go is stable enough for this interval; current resets the countdown after each slide or manual change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, canSlide, current, isPaused, intervalMs, delayMs]);

  if (images.length === 0) return null;

  const slide = images[current] ?? images[0];
  const showProgress = variant === 'hero' && canSlide && autoplay && !paused;

  return (
    <div
      className={`photo-carousel photo-carousel-${variant}${isPaused ? ' is-paused' : ''}`}
      style={{ '--carousel-ms': `${intervalMs}ms` } as CSSProperties}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null) return;
        const delta = event.changedTouches[0].clientX - start;
        if (delta > 40) go(current - 1);
        if (delta < -40) go(current + 1);
      }}
    >
      <div className="photo-carousel-stack">
        {images.map((image, i) => (
          <div key={`${image.src}-${i}`} className={`photo-carousel-layer${i === current ? ' is-on' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={i === current ? image.alt : ''} />
          </div>
        ))}
      </div>

      {href ? (
        <Link href={href} className="photo-carousel-hit" aria-label={slide.alt} />
      ) : (
        <button
          type="button"
          className="photo-carousel-hit"
          aria-label="Ver foto en grande"
          onClick={() => onOpen?.(current)}
        />
      )}

      {canSlide && (
        <>
          <button
            type="button"
            className="photo-carousel-nav is-prev"
            aria-label="Foto anterior"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              go(current - 1);
            }}
          >
            <Chevron dir="prev" />
          </button>
          <button
            type="button"
            className="photo-carousel-nav is-next"
            aria-label="Foto siguiente"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              go(current + 1);
            }}
          >
            <Chevron dir="next" />
          </button>
          <div className="photo-carousel-dots" role="tablist" aria-label="Fotos">
            {images.map((image, i) => (
              <button
                key={`${image.src}-dot-${i}`}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Foto ${i + 1}`}
                className={i === current ? 'is-on' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  go(i);
                }}
              />
            ))}
          </div>
          <p className="photo-carousel-count" aria-live="polite">
            {current + 1} / {images.length}
          </p>
          {showProgress && (
            <div className="photo-carousel-progress" aria-hidden="true">
              <span key={current} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
