'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import image1 from './image1.webp';
import image2 from './image2.webp';
import image3 from './image3.webp';
import image4 from './image4.webp';
import image5 from './image5.webp';
import image6 from './image6.webp';
import image7 from './image7.webp';
import image8 from './image8.jpg';


const templates = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
];


export function Templates() {

  const sectionRef = useRef<HTMLElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const templatesRef = useRef<HTMLSpanElement | null>(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);



  useEffect(() => {

    gsap.registerPlugin(ScrollTrigger);


    const ctx = gsap.context(() => {


      ScrollTrigger.create({

        trigger: sectionRef.current,

        start: "top 75%",


        once: true,


        onEnter: () => {

          const element =
            templatesRef.current;


          if (!element) return;


          const scrambleText =
            "TEMPLATES";


          const chars =
            "%$#@!&*";


          let iteration = 0;


          const interval =
            setInterval(() => {


              element.textContent =
                scrambleText
                  .split("")
                  .map((letter,index)=>{


                    if(index < iteration){
                      return scrambleText[index];
                    }


                    return chars[
                      Math.floor(
                        Math.random() *
                        chars.length
                      )
                    ];

                  })
                  .join("");



              iteration += 0.5;



              if(iteration >= scrambleText.length){

                clearInterval(interval);

                element.textContent =
                  scrambleText;

              }


            },80);

        }

      });



    }, sectionRef);



    return () => ctx.revert();


  }, []);




  const handleWheel = (
    e: React.WheelEvent<HTMLDivElement>
  ) => {


    const carousel =
      carouselRef.current;


    if(!carousel) return;


    const maxScroll =
      carousel.scrollWidth -
      carousel.clientWidth;


    const current =
      carousel.scrollLeft;



    const canMoveRight =
      e.deltaY > 0 &&
      current < maxScroll;


    const canMoveLeft =
      e.deltaY < 0 &&
      current > 0;



    if(canMoveRight || canMoveLeft){

      e.preventDefault();

      carousel.scrollLeft +=
        e.deltaY;

    }

  };




  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {


    const carousel =
      carouselRef.current;


    if(!carousel) return;


    isDragging.current = true;


    startX.current =
      e.pageX -
      carousel.offsetLeft;


    scrollStart.current =
      carousel.scrollLeft;

  };




  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {


    const carousel =
      carouselRef.current;


    if(
      !isDragging.current ||
      !carousel
    ) return;



    e.preventDefault();



    const x =
      e.pageX -
      carousel.offsetLeft;



    const distance =
      (x - startX.current) * 1.5;



    carousel.scrollLeft =
      scrollStart.current -
      distance;


  };




  const stopDragging = () => {

    isDragging.current = false;

  };




  return (

    <section

      ref={sectionRef}

      id="templates"

      className="
        min-h-screen
        overflow-hidden
        bg-ink
        pt-10
        pb-24
      "

    >


      <div className="mb-10 px-8">


        <h2

          className="
            text-[5rem]
            font-semibold
            uppercase
            leading-[0.9]
            tracking-tight
            text-white
            sm:text-[6.5rem]
            lg:text-[9rem]
          "

        >

          WEBSITE

          <br/>


          <span

            ref={templatesRef}

            className="text-yellow-400"

          >

            TEMPLATES

          </span>


        </h2>


      </div>




      <div

        ref={carouselRef}

        onWheel={handleWheel}

        onMouseDown={handleMouseDown}

        onMouseMove={handleMouseMove}

        onMouseUp={stopDragging}

        onMouseLeave={stopDragging}


        className="
          flex
          gap-10
          overflow-x-auto
          px-8
          cursor-grab
          select-none
          active:cursor-grabbing
          overscroll-contain
          [&::-webkit-scrollbar]:hidden
          [-ms-overflow-style:none]
          [scrollbar-width:none]
        "

      >


        {templates.map((template,index)=>(


          <div

            key={index}

            className="
              group
              relative
              h-[420px]
              w-[750px]
              shrink-0
              overflow-hidden
              rounded-3xl
              bg-neutral-900
            "

          >


            <img

              src={template.src}

              alt={`Template ${index+1}`}

              className="
                h-full
                w-full
                object-cover
                object-top
                transition-transform
                duration-700
                group-hover:scale-105
              "

            />



            <div

              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/80
                via-black/20
                to-transparent
                opacity-0
                transition-opacity
                duration-500
                group-hover:opacity-100
              "

            />



            <span

              className="
                absolute
                bottom-8
                left-8
                text-xl
                font-bold
                uppercase
                tracking-[0.25em]
                text-white
                opacity-0
                transition-opacity
                duration-500
                group-hover:opacity-100
              "

            >

              TEMPLATE {index+1}

            </span>


          </div>


        ))}


      </div>


    </section>

  );

}