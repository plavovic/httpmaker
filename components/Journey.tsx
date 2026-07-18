'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code } from './Code';
import Button from './Button';
import CursorTrail from './CursorTrail';


export function Journey() {

  const sectionRef = useRef<HTMLElement | null>(null);
  const httpmakerRef = useRef<HTMLSpanElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {

    gsap.registerPlugin(ScrollTrigger);


    const ctx = gsap.context(() => {


      // {HTTPMAKER scramble reveal
      ScrollTrigger.create({

        trigger: sectionRef.current,

        start: 'top 75%',

        once: true,


        onEnter: () => {

          const element =
            httpmakerRef.current;


          if (!element) return;


          const scrambleText =
            '{HTTPMAKER';


          const chars =
            '%$#@!&*';


          let iteration = 0;


          const interval =
            setInterval(() => {


              element.textContent =
                scrambleText
                  .split('')
                  .map((letter, index) => {


                    if (index < iteration) {
                      return scrambleText[index];
                    }


                    return chars[
                      Math.floor(
                        Math.random() *
                        chars.length
                      )
                    ];


                  })
                  .join('');


              iteration += 0.5;


              if (iteration >= scrambleText.length) {

                clearInterval(interval);

                element.textContent =
                  scrambleText;

              }


            }, 80);

        }

      });



      // Infinite marquee animation
      if (marqueeRef.current) {

        gsap.to(marqueeRef.current, {

          xPercent: -50,

          duration: 18,

          ease: 'none',

          repeat: -1,

        });

      }


    }, sectionRef);



    return () => ctx.revert();


  }, []);



  return (

    <section

      ref={sectionRef}

      id="start"

      className="
        relative
        min-h-screen
        overflow-hidden
        bg-ink
        pt-10
        pb-24
      "

    >


      <div className="px-8">


        <h2

          className="
            text-[5rem]
            font-semibold
            uppercase
            leading-[0.9]
            tracking-tight
            sm:text-[6.5rem]
            lg:text-[9rem]
          "

        >

          <span

            ref={httpmakerRef}

            className="text-yellow-400"

          >

            {'{HTTPMAKER'}

          </span>


          <br />


          <span className="text-white">

            JOURNEY

          </span>


        </h2>



        {/* Infinite moving text */}

        <div
          className="
            mt-8
            overflow-hidden
            py-6
          "
        >

          <div

            ref={marqueeRef}

            className="
              flex
              w-max
              items-center
              gap-16
              whitespace-nowrap
              text-4xl
              font-semibold
              uppercase
              tracking-tight
              text-white
              sm:text-5xl
              lg:text-6xl
            "

          >

            <span>
              Skip the coding, join the web.
            </span>


            <span>
              Be visible with
              <span className="text-yellow-400">
                {' {HTTPMAKER'}
              </span>
            </span>


            <span>
              Skip the coding, join the web.
            </span>


            <span>
              Be visible with
              <span className="text-yellow-400">
                {' {HTTPMAKER'}
              </span>
            </span>


          </div>

        </div>


      </div>
    <Code />

    <div className="mt-10 flex flex-col items-center justify-center gap-5">

    <Link href="/login">
      <Button />
    </Link>
        

      </div>
    </section>

  );

}
