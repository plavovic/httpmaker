'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function Section({
  children,
  id,
  className = '',
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          ref.current?.children ?? [],
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            stagger: 0.18,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 80%',
              once: true,
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id={id} ref={ref} className={`min-h-screen ${className}`}>
      {children}
    </section>
  );
}
