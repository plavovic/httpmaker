import type { DesignPreset, DesignPresetId } from "@/types/designPreset";
import { artisticPreset } from "./artistic"; import { analyticalPreset } from "./analytical"; import { modernPreset } from "./modern"; import { professionalPreset } from "./professional"; import { colourfulPreset } from "./colourful"; import { monochromePreset } from "./monochrome";
export const designPresets={artistic:artisticPreset,analytical:analyticalPreset,modern:modernPreset,professional:professionalPreset,colourful:colourfulPreset,monochrome:monochromePreset} satisfies Record<DesignPresetId,DesignPreset>;
export const designPresetList=Object.values(designPresets);
