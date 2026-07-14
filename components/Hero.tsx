'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroVideo from '@/components/hero-video.mp4';

export function Hero() {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const excellenceRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
  gsap.registerPlugin(ScrollTrigger);

  const ctx = gsap.context(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const lines = heading.querySelectorAll('span');

    gsap.fromTo(
      lines,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
      },
    );

    lines.forEach((line, index) => {
      gsap.to(line, {
        yPercent: index % 2 === 0 ? -3 : 3,
        ease: 'none',
        scrollTrigger: {
          trigger: heading,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    // EXCELLENCE scramble animation
    const scrambleText = 'EXCELLENCE';
    const chars = '%$#@!&*';

    if (excellenceRef.current) {
      const element = excellenceRef.current;

      let iteration = 0;

      const interval = setInterval(() => {
        element.textContent = scrambleText
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return scrambleText[index];
            }

            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');

        iteration += 0.5;

        if (iteration >= scrambleText.length) {
          clearInterval(interval);
          element.textContent = scrambleText;
        }
      }, 80);
    }
  });

  return () => ctx.revert();
}, []);

  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden bg-ink">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={heroVideo}
        muted
        playsInline
        autoPlay
        loop
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/95" />

      {/* Logo */}
      <div className="absolute top-8 left-8 z-20 text-3xl font-black uppercase tracking-[0.2em] text-white">
      <span className="text-yellow-400">{'{'}</span>
      HTTPMAKER
      </div>
      {/* Heading */}
      <div className="absolute top-[200px] left-0 z-10 w-full">
        <h1
          ref={headingRef}
          className="text-[5rem] font-semibold leading-[0.9] tracking-tight text-white sm:text-[6.5rem] lg:text-[9rem] xl:text-[10rem]"
        >
          QUIETLY SHAPING
          <br />
          STATEMENT OF
          <br />
          <span ref={excellenceRef} className="text-yellow-400">
  EXCELLENCE
</span>
        </h1>
      </div>
    </section>
  );
}
