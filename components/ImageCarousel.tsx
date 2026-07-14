'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const images = [
  '/images/image1.webp',
  '/images/image2.webp',
  '/images/image3.webp',
  '/images/image4.webp',
  '/images/image5.webp',
];

export function ImageCarousel() {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  
  // Ref to hold mouse drag tracking states
  const dragStatus = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  // --- Wheel Effect: Maps trackpad/mousewheel vertical scroll to horizontal scroll ---
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if the scroll has any vertical movement
      if (Math.abs(e.deltaY) > 0) {
        // Completely locks the main browser window vertical scroll while over the component
        e.preventDefault();

        // Dynamically shift the carousel horizontally based on the mousewheel shift
        gsap.to(carousel, {
          scrollLeft: carousel.scrollLeft + e.deltaY * 1.5,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    // 'passive: false' lets us successfully call e.preventDefault()
    carousel.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      carousel.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // --- Drag Mechanics (Mouse Left Click and Slide) ---
  const startDrag = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;

    dragStatus.current.isDragging = true;
    dragStatus.current.startX = e.pageX - carouselRef.current.offsetLeft;
    dragStatus.current.scrollLeft = carouselRef.current.scrollLeft;

    gsap.killTweensOf(carouselRef.current);
  };

  const stopDrag = () => {
    dragStatus.current.isDragging = false;
  };

  const drag = (e: React.MouseEvent) => {
    const state = dragStatus.current;
    if (!state.isDragging || !carouselRef.current) return;

    e.preventDefault();

    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - state.startX) * 2; 

    gsap.to(carouselRef.current, {
      scrollLeft: state.scrollLeft - walk,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink py-32">
      <div
        ref={carouselRef}
        onMouseDown={startDrag}
        onMouseLeave={stopDrag}
        onMouseUp={stopDrag}
        onMouseMove={drag}
        className="
          flex
          cursor-grab
          gap-10
          overflow-x-auto
          px-10
          scrollbar-hide
          active:cursor-grabbing
          select-none
          touch-action-pan-x /* Prevents mobile browser touch-swipe tracking vertically over the track */
        "
        style={{ touchAction: 'pan-x' }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="
              group
              relative
              h-[600px]
              min-w-[450px]
              overflow-hidden
              rounded-3xl
            "
          >
            <img
              src={image}
              alt=""
              draggable="false"
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-700
                group-hover:scale-110
              "
            />
          </div>
        ))}
      </div>
    </section>
  );
}