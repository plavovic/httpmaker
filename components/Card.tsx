'use client';

import { useRef } from 'react';

export function Card() {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const scrollDown = () => {
    cardRef.current?.scrollBy({
      top: 360,
      behavior: 'smooth',
    });
  };

  return (
    <div className="group relative">
      <div
        ref={cardRef}
        className="scroll-snap-card h-[360px] w-[500px] shrink-0 snap-y snap-mandatory overflow-y-auto rounded-2xl"
      >
        <div className="flex h-[360px] w-full snap-start items-center justify-center bg-yellow-500">
          <p className="px-6 text-center text-xl font-bold uppercase tracking-wide text-white">
            YOUR SIMPLE WEBSITE
          </p>
        </div>

        <div className="flex h-[360px] w-full snap-start items-center justify-center bg-blue-500">
          <p className="px-6 text-center text-xl font-bold uppercase tracking-wide text-white">
            ABOUT YOUR WEBSITE
          </p>
        </div>

        <div className="flex h-[360px] w-full snap-start items-center justify-center bg-green-500">
          <p className="px-6 text-center text-xl font-bold uppercase tracking-wide text-white">
            MORE ABOUT YOUR WEBSITE
          </p>
        </div>
      </div>

      {/* Hover scroll button */}
      <button
        onMouseEnter={scrollDown}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        Scroll ↓
      </button>
    </div>
  );
}