"use client";

import { useEffect, useRef, useState } from "react";

import type { WebsiteSectionComponentProps } from "@/types/website";
import { EditableText } from "./EditableContent";

type Props = WebsiteSectionComponentProps & { variant: "luxury" | "brutalist" };

export default function ResponsiveNavbar(props: Props) {
  const { section } = props;
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const appearance = section.navbarAppearance ?? "colored";
  const scrollBehavior = section.navbarScrollBehavior ?? "sticky";

  useEffect(() => {
    const nav = navRef.current;
    const wrapper = nav?.closest<HTMLElement>("[data-section-type='navbar']");
    if (!nav || !wrapper) return;
    wrapper.dataset.navbarScroll = scrollBehavior;
    return () => {
      delete wrapper.dataset.navbarScroll;
    };
  }, [scrollBehavior]);

  const action = (key: "buttonText" | "secondaryButtonText", secondary = false) => section.props[key] ? (
    <button type="button" className={secondary ? "site-navbar-secondary" : "site-navbar-primary"} onClick={() => setOpen(false)}>
      <EditableText {...props} elementKey={key}>{section.props[key]}</EditableText>
    </button>
  ) : null;

  return <nav ref={navRef} className={`site-navbar site-navbar-${props.variant} site-navbar-${appearance}`}>
    <div className="site-navbar-brand">
      <p><EditableText {...props} elementKey="subtitle">{section.props.subtitle}</EditableText></p>
      <h3><EditableText {...props} elementKey="title">{section.props.title}</EditableText></h3>
    </div>
    <button type="button" className="site-navbar-burger" aria-label="Toggle navigation menu" aria-expanded={open} onClick={(event) => { event.stopPropagation(); setOpen(value => !value); }}>
      <span /><span /><span />
    </button>
    <div className={`site-navbar-actions ${open ? "site-navbar-actions-open" : ""}`}>
      {action("buttonText")}
      {action("secondaryButtonText", true)}
    </div>
  </nav>;
}
