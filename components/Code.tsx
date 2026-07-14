"use client";

import React, { useEffect, useState } from "react";

export const Code = () => {
  const [displayedCode, setDisplayedCode] = useState("");

  const code = `import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-black">

      <section className="max-w-6xl mx-auto rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl p-12">

        <h1 className="text-7xl font-black tracking-tight text-white">
          Build Faster
        </h1>

        <button className="mt-8 rounded-full bg-blue-600 px-8 py-4 text-white shadow-lg hover:bg-blue-500">
          Get Started
        </button>

      </section>

    </main>
  );
}`;



  useEffect(() => {

    let index = 0;

    const interval = setInterval(() => {

      setDisplayedCode(code.substring(0,index));

      index++;

      if(index > code.length){
        clearInterval(interval);
      }

    },35);


    return () => clearInterval(interval);

  }, []);



  const highlightCode = (text:string) => {

    const tokens = text.split(/(\s+|[{}()<>;"'=])/g);


    return tokens.map((token,index)=>{

      let color = "text-slate-300";


      // keywords
      if(
        [
          "import",
          "export",
          "default",
          "function",
          "return",
          "from"
        ].includes(token)
      ){
        color="text-purple-400";
      }


      // strings
      else if(
        token.startsWith('"')
      ){
        color="text-green-400";
      }


      // jsx tags
      else if(
        [
          "main",
          "section",
          "h1",
          "button",
          "LandingPage"
        ].includes(token)
      ){
        color="text-blue-400";
      }


      // attributes
      else if(
        token === "className"
      ){
        color="text-orange-400";
      }


      // jsx symbols
      else if(
        [
          "<",
          ">",
          "/",
          "="
        ].includes(token)
      ){
        color="text-yellow-400";
      }


      return (
        <span
          key={index}
          className={color}
        >
          {token}
        </span>
      );

    });

  };



  return (

    <div
      className="
        relative
        bottom-0
        left-1/2
        w-full
        max-w-4xl
        -translate-x-1/2
        px-4
      "
    >

      <div
        className="
          h-[420px]
          overflow-hidden
          rounded-t-2xl
          border
          border-white/10
          bg-[#0d1117]
          shadow-[0_-20px_80px_rgba(59,130,246,0.2)]
        "
      >


        {/* Header */}

        <div
          className="
            relative
            flex
            h-10
            items-center
            border-b
            border-white/10
            bg-[#161b22]
          "
        >

          <div className="flex gap-2 px-5">

            <span className="h-3 w-3 rounded-full bg-red-500"/>
            <span className="h-3 w-3 rounded-full bg-yellow-400"/>
            <span className="h-3 w-3 rounded-full bg-green-500"/>

          </div>


          <span
            className="
              absolute
              left-1/2
              -translate-x-1/2
              font-mono
              text-xs
              text-slate-500
            "
          >
            LandingPage.tsx
          </span>

        </div>



        {/* Editor */}

        <div
          className="
            flex
            h-[380px]
            overflow-hidden
            p-5
          "
        >


          {/* line numbers */}

          <div
            className="
              mr-5
              select-none
              text-right
              font-mono
              text-[11px]
              leading-5
              text-slate-600
            "
          >

            {
              displayedCode
              .split("\n")
              .map((_,i)=>(
                <div key={i}>
                  {i+1}
                </div>
              ))
            }

          </div>



          <pre
            className="
              whitespace-pre-wrap
              font-mono
              text-[11px]
              leading-5
            "
          >

            {
              highlightCode(displayedCode)
            }


            <span
              className="
                inline-block
                h-4
                w-[2px]
                animate-pulse
                bg-blue-400
              "
            />

          </pre>


        </div>


      </div>


    </div>

  );
};