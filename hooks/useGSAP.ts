'use client';

import { useLayoutEffect, type DependencyList } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function useGSAP(callback: () => void, deps: DependencyList = []) {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(callback);

    return () => ctx.revert();
  }, deps);
}
