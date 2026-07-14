'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card } from './Card';

export function About() {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const heading = headingRef.current;
      if (!heading) return;

      const letters = heading.querySelectorAll('.letter');

      gsap.fromTo(
        letters,
        {
          opacity: 0,
          y: 80,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power4.out',
          stagger: 0.03,
          scrollTrigger: {
            trigger: heading,
            start: 'top 80%',
            end: 'top 40%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  const splitText = (text: string, className = '') =>
    text.split('').map((char, index) => (
      <span
        key={index}
        className={`letter inline-block ${className}`}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

  return (
  <section
    id="about"
    className="min-h-screen bg-ink px-6 pt-32"
  >
    <div className="w-full text-center">
      
      {/* Title */}
      <h2
        ref={headingRef}
        className="text-[5rem] font-semibold leading-[0.9] tracking-tight text-white sm:text-[6.5rem] lg:text-[9rem] xl:text-[10rem]"
      >
        <span className="text-white">
          {splitText('WHAT IS ')}
        </span>

        <span className="text-yellow-400">
          {splitText('{HTTPMAKER')}
        </span>

        <span className="text-white">
          {splitText('?')}
        </span>
      </h2>


      {/* Content row */}
      <div className="mt-24 grid w-full grid-cols-1 items-center gap-12 pr-32 text-left lg:grid-cols-[1fr_320px]">

        {/* Description */}
        <p className="max-w-5xl text-4xl font-light uppercase leading-[1.1] tracking-tight text-white/90 sm:text-5xl lg:text-6xl">
          <span className="font-bold text-yellow-400">
            {splitText('{HTTPMAKER')}
          </span>{' '}
          Built for visionaries who refuse to be limited by code.
          Create professional websites, portfolios, and digital identities —
          effortlessly.
        </p>


        {/* Card */}
        <div className="flex justify-end">
          <Card />
        </div>

      </div>

    </div>
  </section>
);
}