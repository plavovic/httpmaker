'use client';

import { useState } from 'react';

type ButtonProps = {
  text?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
};

export default function Button({
  text = 'LAUNCH JOURNEY',
  type = 'button',
  fullWidth = false,
}: ButtonProps) {

  const [displayText, setDisplayText] = useState(text);
  const [scrambling, setScrambling] = useState(false);

  const chars = '%$#@!&*';


  const handleMouseEnter = () => {
    if (scrambling) return;

    setScrambling(true);

    let iteration = 0;


    const interval = setInterval(() => {

      setDisplayText(
        text
          .split('')
          .map((letter, index) => {

            if (index < iteration) {
              return text[index];
            }

            return chars[
              Math.floor(Math.random() * chars.length)
            ];

          })
          .join('')
      );


      iteration += 0.5;


      if (iteration >= text.length) {

        clearInterval(interval);

        setDisplayText(text);

        setScrambling(false);

      }

    }, 70);
  };


  return (
    <button
      type={type}
      onMouseEnter={handleMouseEnter}
      className={`ui-btn${fullWidth ? ' ui-btn--full' : ''}`}
    >
      <span>{displayText}</span>

      <style jsx>{`
        .ui-btn {
          width: 240px;
          height: 58px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #ffb703;
          color: #050505;

          border: none;
          border-radius: 0;

          cursor: pointer;

          font-family: inherit;
          font-size: 16px;
          font-weight: 900;

          text-transform: uppercase;
          letter-spacing: 0.15rem;

          transition: background 0.25s ease;
        }

        .ui-btn:hover {
          background: #ffc933;
        }

        .ui-btn--full {
          width: 100%;
        }

        .ui-btn:focus-visible {
          outline: 2px solid #ffc933;
          outline-offset: 3px;
        }

        .ui-btn span {
          display: block;
          width: 100%;
          text-align: center;
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
}
