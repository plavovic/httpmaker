"use client";

import { useLayoutEffect, useState, type PointerEvent } from "react";

type Rect = { left: number; top: number; width: number; height: number };
type Guide = { axis: "x" | "y"; position: number; start: number; length: number; label: string };
type Props = { sectionId: string; elementKey: string; widthPercent?: number; offsetX?: number; offsetY?: number; onCommit: (widthPercent: number) => void; onMoveCommit: (offsetX: number, offsetY: number) => void };

const SNAP_DISTANCE = 9;
const EDGE_MARGIN = 24;

function closestSnap(points: { value: number; label: string }[], anchors: number[]) {
  let result: { delta: number; position: number; label: string } | undefined;
  for (const point of points) for (const anchor of anchors) {
    const delta = point.value - anchor;
    if (Math.abs(delta) <= SNAP_DISTANCE && (!result || Math.abs(delta) < Math.abs(result.delta))) result = { delta, position: point.value, label: point.label };
  }
  return result;
}

export default function ImageResizeOverlay({ sectionId, elementKey, widthPercent, offsetX = 0, offsetY = 0, onCommit, onMoveCommit }: Props) {
  const [rect, setRect] = useState<Rect>();
  const [displayPercent, setDisplayPercent] = useState(widthPercent ?? 50);
  const [guides, setGuides] = useState<Guide[]>([]);
  const selector = `[data-section-id="${CSS.escape(sectionId)}"] [data-editor-element="${CSS.escape(elementKey)}"]`;

  const locate = () => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return setRect(undefined);
    const box = element.getBoundingClientRect();
    setRect({ left: box.left, top: box.top, width: box.width, height: box.height });
    if (widthPercent) setDisplayPercent(widthPercent);
  };

  useLayoutEffect(() => {
    locate();
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate, true);
    return () => { window.removeEventListener("resize", locate); window.removeEventListener("scroll", locate, true); };
  }, [sectionId, elementKey, widthPercent]);

  const context = () => {
    const section = document.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(sectionId)}"]`);
    const element = document.querySelector<HTMLElement>(selector);
    if (!section || !element) return;
    const sectionBox = section.getBoundingClientRect();
    const elementBox = element.getBoundingClientRect();
    const peers = Array.from(section.querySelectorAll<HTMLElement>("[data-editor-element]"))
      .filter((peer) => peer !== element && !element.contains(peer) && !peer.contains(element))
      .map((peer) => peer.getBoundingClientRect());
    return { section, element, sectionBox, elementBox, peers };
  };

  const startResize = (event: PointerEvent<HTMLButtonElement>, direction: -1 | 1) => {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const data = context();
    if (!data) return;
    const { section, element, sectionBox, elementBox, peers } = data;
    const startX = event.clientX;
    const usesGridTrack = elementKey === "imageUrl" && (section.dataset.sectionType === "hero" || section.dataset.sectionType === "about");
    let next = Math.max(10, Math.min(100, elementBox.width / sectionBox.width * 100));

    const move = (moveEvent: globalThis.PointerEvent) => {
      let pixels = Math.max(sectionBox.width * .1, Math.min(sectionBox.width, elementBox.width + (moveEvent.clientX - startX) * direction));
      const matchingWidth = peers.map((peer) => peer.width).find((peerWidth) => Math.abs(peerWidth - pixels) <= SNAP_DISTANCE);
      if (matchingWidth !== undefined) pixels = matchingWidth;
      next = Math.round(pixels / sectionBox.width * 1000) / 10;
      if (usesGridTrack) {
        section.dataset.imageResized = "true";
        section.style.setProperty("--section-image-width", `${next}%`);
      } else {
        element.style.width = `${next}%`;
        element.style.maxWidth = "100%";
      }
      setGuides(matchingWidth === undefined ? [] : [{ axis: "x", position: direction > 0 ? elementBox.left + pixels : elementBox.right - pixels, start: sectionBox.top, length: sectionBox.height, label: "Match width" }]);
      setDisplayPercent(next);
      locate();
    };
    const finish = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      setGuides([]);
      onCommit(next);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

  const startMove = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const data = context();
    if (!data) return;
    const { element, sectionBox, elementBox, peers } = data;
    const startX = event.clientX;
    const startY = event.clientY;
    const verticalPoints = [
      { value: sectionBox.left + EDGE_MARGIN, label: "Left margin" },
      { value: sectionBox.left + sectionBox.width / 2, label: "Center" },
      { value: sectionBox.right - EDGE_MARGIN, label: "Right margin" },
      ...peers.flatMap((peer) => [{ value: peer.left, label: "Align left" }, { value: peer.left + peer.width / 2, label: "Align center" }, { value: peer.right, label: "Align right" }]),
    ];
    const horizontalPoints = [
      { value: sectionBox.top + EDGE_MARGIN, label: "Top margin" },
      { value: sectionBox.top + sectionBox.height / 2, label: "Middle" },
      { value: sectionBox.bottom - EDGE_MARGIN, label: "Bottom margin" },
      ...peers.flatMap((peer) => [{ value: peer.top, label: "Align top" }, { value: peer.top + peer.height / 2, label: "Align middle" }, { value: peer.bottom, label: "Align bottom" }]),
    ];
    let nextX = offsetX;
    let nextY = offsetY;

    const move = (moveEvent: globalThis.PointerEvent) => {
      let deltaX = moveEvent.clientX - startX;
      let deltaY = moveEvent.clientY - startY;
      const xSnap = closestSnap(verticalPoints, [elementBox.left + deltaX, elementBox.left + elementBox.width / 2 + deltaX, elementBox.right + deltaX]);
      const ySnap = closestSnap(horizontalPoints, [elementBox.top + deltaY, elementBox.top + elementBox.height / 2 + deltaY, elementBox.bottom + deltaY]);
      if (xSnap) deltaX += xSnap.delta;
      if (ySnap) deltaY += ySnap.delta;
      nextX = Math.round(offsetX + deltaX);
      nextY = Math.round(offsetY + deltaY);
      element.style.position = "relative";
      element.style.left = `${nextX}px`;
      element.style.top = `${nextY}px`;
      setGuides([
        ...(xSnap ? [{ axis: "x" as const, position: xSnap.position, start: sectionBox.top, length: sectionBox.height, label: xSnap.label }] : []),
        ...(ySnap ? [{ axis: "y" as const, position: ySnap.position, start: sectionBox.left, length: sectionBox.width, label: ySnap.label }] : []),
      ]);
      locate();
    };
    const finish = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", finish);
      setGuides([]);
      onMoveCommit(nextX, nextY);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", finish);
  };

  if (!rect) return null;
  return <>
    {guides.map((guide, index) => <div key={`${guide.axis}-${index}`} className={`alignment-guide alignment-guide-${guide.axis}`} style={guide.axis === "x" ? { left: guide.position, top: guide.start, height: guide.length } : { left: guide.start, top: guide.position, width: guide.length }}><span>{guide.label}</span></div>)}
    <div className="image-resize-overlay" style={rect} aria-label="Resize and move selected element">
      <button type="button" className="image-resize-handle left" aria-label="Resize from left" onPointerDown={(event) => startResize(event, -1)} />
      <button type="button" className="element-move-handle" aria-label="Move element" title="Drag to move with smart alignment" onPointerDown={startMove}>✥</button>
      <button type="button" className="image-resize-handle right" aria-label="Resize from right" onPointerDown={(event) => startResize(event, 1)} />
      <span>{Math.round(displayPercent)}%</span>
    </div>
  </>;
}
