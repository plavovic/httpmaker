import type { CSSProperties } from "react";
import type { ImageTreatment } from "@/types/designPreset";
export function getImageTreatmentStyle(treatment:ImageTreatment):CSSProperties{switch(treatment){case"monochrome":return{filter:"grayscale(100%)"};case"high-contrast":return{filter:"contrast(120%) saturate(90%)"};case"soft":return{filter:"contrast(90%) saturate(80%) brightness(105%)"};case"vibrant":return{filter:"saturate(125%) contrast(105%)"};default:return{}}}
