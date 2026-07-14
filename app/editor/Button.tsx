'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: string;
  compact?: boolean;
};

const chars = '%$#@!&*';

export default function Button({ children, compact = false, className = '', ...props }: ButtonProps) {
  const [displayText, setDisplayText] = useState(children);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayText(children);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [children]);

  const scramble = () => {
    if (intervalRef.current || props.disabled) return;
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      setDisplayText(children.split('').map((letter, index) =>
        letter === ' ' || index < iteration ? letter : chars[Math.floor(Math.random() * chars.length)],
      ).join(''));
      iteration += 0.5;

      if (iteration >= children.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setDisplayText(children);
      }
    }, 55);
  };

  return (
    <button
      {...props}
      onMouseEnter={(event) => {
        scramble();
        props.onMouseEnter?.(event);
      }}
      className={`publish-button inline-flex items-center justify-center bg-[#ffb703] font-black uppercase tracking-[0.15em] text-[#050505] transition-colors hover:bg-[#ffc933] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb703] disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? 'min-h-10 px-4 text-xs' : 'min-h-[58px] px-7 text-sm sm:text-base'
      } ${className}`}
    >
      <span className="whitespace-nowrap">{displayText}</span>
    </button>
  );
}
