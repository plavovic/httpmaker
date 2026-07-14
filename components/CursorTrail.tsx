import { useEffect, useRef } from "react";
import "./CursorTrail.css";

type TrailImageEntry = {
    element: HTMLDivElement;
    maskLayers: HTMLDivElement[];
    imageLayers: HTMLDivElement[];
    removeTime: number;
};

const TrailContainer = () => {
    const trailContainerRef = useRef<HTMLDivElement | null>(null);
    const animationStateRef = useRef<number | null>(null);
    const trailRef = useRef<TrailImageEntry[]>([]);
    const currentImageIndexRef = useRef(0);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const interpolatedMousePosRef = useRef({ x: 0, y: 0 });
    const isDesktopRef = useRef(false);

    useEffect(() => {
        const trailContainer = trailContainerRef.current;
        if (!trailContainer) return;

        const config = {
            imageLifespan: 1000,
            mouseThreshold: 150,
            inDuration: 750,
            outDuration: 1000,
            staggerIn: 100,
            staggerOut: 25,
            slideEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            easing: "cubic-bezier(0.87, 0, 0.13, 0.94)",
        };

        const images = [
            "/trail-image/img1.webp",
            "/trail-image/img2.webp",
            "/trail-image/img3.webp",
            "/trail-image/img4.webp",
            "/trail-image/img5.webp",
            "/trail-image/img6.webp",
            "/trail-image/img7.webp",
            "/trail-image/img8.jpg",
            "/trail-image/img9.webp",
            "/trail-image/img10.webp",
        ];
        const trailImageCount = images.length;

        isDesktopRef.current = window.innerWidth > 1000;

        const mathUtils = {
            lerp: (a: number, b: number, n: number) => (1 - n) * a + n * b,
            distance: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
        };

        const isInTrailContainer = (x: number, y: number) => {
            const rect = trailContainer.getBoundingClientRect();
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        };

        const createTrailImage = () => {
            const imgContainer = document.createElement("div");
            imgContainer.classList.add("trail-img");

            const imgSrc = images[currentImageIndexRef.current] ?? images[0];
            currentImageIndexRef.current = (currentImageIndexRef.current + 1) % trailImageCount;

            const rect = trailContainer.getBoundingClientRect();
            const startX = interpolatedMousePosRef.current.x - rect.left - 87.5;
            const startY = interpolatedMousePosRef.current.y - rect.top - 87.5;
            const targetX = mousePosRef.current.x - rect.left - 87.5;
            const targetY = mousePosRef.current.y - rect.top - 87.5;

            imgContainer.style.left = `${startX}px`;
            imgContainer.style.top = `${startY}px`;
            imgContainer.style.transition = `left ${config.inDuration}ms ${config.slideEasing}, top ${config.inDuration}ms ${config.slideEasing}`;

            const maskLayers: HTMLDivElement[] = [];
            const imageLayers: HTMLDivElement[] = [];

            for (let index = 0; index < 10; index += 1) {
                const layer = document.createElement("div");
                layer.classList.add("mask-layer");

                const imageLayer = document.createElement("div");
                imageLayer.classList.add("image-layer");
                imageLayer.style.backgroundImage = `url(${imgSrc})`;

                const startClipY = index * 10;
                const endClipY = (index + 1) * 10;

                layer.style.clipPath = `polygon(50% ${startClipY}px, 50% ${startClipY}px, 50% ${endClipY}px, 50% ${endClipY}px)`;
                layer.style.transition = `clip-path ${config.inDuration}ms ${config.easing}`;
                layer.style.transform = "translateZ(0)";
                layer.style.backfaceVisibility = "hidden";

                layer.appendChild(imageLayer);
                imgContainer.appendChild(layer);
                maskLayers.push(layer);
                imageLayers.push(imageLayer);
            }

            trailContainer.appendChild(imgContainer);

            requestAnimationFrame(() => {
                imgContainer.style.left = `${targetX}px`;
                imgContainer.style.top = `${targetY}px`;

                maskLayers.forEach((layer, index) => {
                    const startClipY = index * 10;
                    const endClipY = (index + 1) * 10;
                    const distanceFromMiddle = Math.abs(index - 4.5);
                    const delay = distanceFromMiddle * config.staggerIn;

                    setTimeout(() => {
                        layer.style.clipPath = `polygon(0% ${startClipY}px, 100% ${startClipY}px, 100% ${endClipY}px, 0% ${endClipY}px)`;
                    }, delay);
                });
            });

            trailRef.current.push({
                element: imgContainer,
                maskLayers,
                imageLayers,
                removeTime: Date.now() + config.imageLifespan,
            });
        };

        const removeOldImages = () => {
            const now = Date.now();
            if (trailRef.current.length === 0) return;

            const oldestImage = trailRef.current[0];
            if (now < oldestImage.removeTime) return;

            const imgToRemove = trailRef.current.shift();
            if (!imgToRemove) return;

            imgToRemove.maskLayers.forEach((layer, index) => {
                const startClipY = index * 10;
                const endClipY = (index + 1) * 10;
                const distanceFromMiddle = Math.abs(index - 4.5);
                const delay = distanceFromMiddle * config.staggerOut;

                layer.style.transition = `clip-path ${config.outDuration}ms ${config.easing}`;

                setTimeout(() => {
                    layer.style.clipPath = `polygon(50% ${startClipY}px, 50% ${startClipY}px, 50% ${endClipY}px, 50% ${endClipY}px)`;
                }, delay);
            });

            imgToRemove.imageLayers.forEach((layer) => {
                layer.style.transition = `opacity ${config.outDuration}ms ${config.easing}`;
                layer.style.opacity = "0.25";
            });

            setTimeout(() => {
                if (imgToRemove.element.parentNode) {
                    imgToRemove.element.parentNode.removeChild(imgToRemove.element);
                }
            }, config.outDuration + 100);
        };

        const render = () => {
            if (!isDesktopRef.current) return;

            interpolatedMousePosRef.current.x = mathUtils.lerp(
                interpolatedMousePosRef.current.x,
                mousePosRef.current.x,
                0.1
            );
            interpolatedMousePosRef.current.y = mathUtils.lerp(
                interpolatedMousePosRef.current.y,
                mousePosRef.current.y,
                0.1
            );

            const distance = mathUtils.distance(
                mousePosRef.current.x,
                mousePosRef.current.y,
                lastMousePosRef.current.x,
                lastMousePosRef.current.y
            );

            if (distance > config.mouseThreshold && isInTrailContainer(mousePosRef.current.x, mousePosRef.current.y)) {
                createTrailImage();
                lastMousePosRef.current = { ...mousePosRef.current };
            }

            removeOldImages();
            animationStateRef.current = window.requestAnimationFrame(render);
        };

        const handleMouseMove = (event: MouseEvent) => {
            mousePosRef.current = { x: event.clientX, y: event.clientY };
        };

        const stopAnimation = () => {
            if (animationStateRef.current !== null) {
                window.cancelAnimationFrame(animationStateRef.current);
                animationStateRef.current = null;
            }

            trailRef.current.forEach((item) => {
                if (item.element.parentNode) {
                    item.element.parentNode.removeChild(item.element);
                }
            });
            trailRef.current = [];
        };

        const handleResize = () => {
            const wasDesktop = isDesktopRef.current;
            isDesktopRef.current = window.innerWidth > 1000;

            if (!isDesktopRef.current && wasDesktop) {
                stopAnimation();
            } else if (isDesktopRef.current && !wasDesktop) {
                stopAnimation();
                animationStateRef.current = window.requestAnimationFrame(render);
            }
        };

        let cleanupMouseListener = () => undefined;
        if (isDesktopRef.current) {
            document.addEventListener("mousemove", handleMouseMove);
            animationStateRef.current = window.requestAnimationFrame(render);
            cleanupMouseListener = () => {
                document.removeEventListener("mousemove", handleMouseMove);
            };
        }

        window.addEventListener("resize", handleResize);

        return () => {
            cleanupMouseListener();
            stopAnimation();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return <div ref={trailContainerRef} className="trail-container" />;
};

export default TrailContainer;