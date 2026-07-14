'use client';

import { useEffect, useState, type MouseEvent } from 'react';

interface NavLink {
  id: string;
  label: string;
}

interface VerticalNavbarProps {
  links: NavLink[];
}

export function VerticalNavbar({ links }: VerticalNavbarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(links[0]?.id ?? '');

  useEffect(() => {
    const elements = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const updateActiveSection = () => {
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScrollPosition = window.scrollY;

      if (totalScrollHeight > 0) {
        const percentage = (currentScrollPosition / totalScrollHeight) * 100;
        setScrollProgress(Math.min(Math.max(percentage, 0), 100));
      }

      const viewportMidpoint = window.innerHeight * 0.35;
      let currentSectionId = links[0]?.id ?? '';

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= viewportMidpoint && rect.bottom >= viewportMidpoint) {
          currentSectionId = element.id;
        }
      });

      setActiveSection(currentSectionId);
    };

    updateActiveSection();

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.4, 0.6, 0.8],
      },
    );

    elements.forEach((element) => observer.observe(element));

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [links]);

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(id);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed right-4 top-1/2 z-[1000] hidden -translate-y-1/2 items-center gap-4 lg:flex">
      <div className="flex flex-col items-end gap-4 text-right">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            onClick={(e) => handleNavClick(e, link.id)}
            className={`text-sm uppercase tracking-[0.35em] transition-colors duration-200 ${
              activeSection === link.id ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="relative h-40 w-1 overflow-hidden rounded-full bg-white/15">
        <div
          className="absolute inset-x-0 top-0 w-full rounded-full bg-[#ffb703] transition-[height] duration-200"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
    </nav>
  );
}
