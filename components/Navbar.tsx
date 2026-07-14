{/*'use client';

import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/40 backdrop-blur-2xl' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <a href="#top" className="text-lg font-semibold tracking-[0.2em] text-white">
          HTTPMAKER
        </a>
        <div className="flex items-center gap-6 text-sm text-white/75">
          <a href="#about" className="transition hover:text-white">
            About
          </a>
          <a href="#work" className="transition hover:text-white">
            Work
          </a>
          <a href="#contact" className="transition hover:text-white">
            Contact
          </a>
        </div>
      </nav>
    </header>
  );
}
*/}