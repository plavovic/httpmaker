import { auth } from "@/auth";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import { isSupportedImageBytes, SUPPORTED_IMAGE_TYPES } from "@/lib/assets/validation";
import { apiError } from "@/lib/server/api-error";
import { readFormDataBody, RequestBodyTooLargeError } from "@/lib/server/request";

const MAX_ICON_BYTES = 512 * 1024;
type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: Context) {
  const ownerId=(await auth())?.user?.id;
  if(!ownerId)return apiError("UNAUTHENTICATED","Sign in to upload an icon.",401);
  const projectId=(await context.params).projectId;
  if(!(await findProjectByIdAndOwner(projectId,ownerId)))return apiError("PROJECT_NOT_FOUND","Project not found.",404);
  let form:FormData;
  try{form=await readFormDataBody(request,MAX_ICON_BYTES+20_000)}catch(error){return apiError(error instanceof RequestBodyTooLargeError?"ICON_TOO_LARGE":"INVALID_UPLOAD",error instanceof RequestBodyTooLargeError?"Website icons must be 512 KB or smaller.":"Upload a valid image file.",error instanceof RequestBodyTooLargeError?413:400)}
  const file=form.get("file");
  if(!(file instanceof File))return apiError("ICON_REQUIRED","Choose an image file.",400);
  if(file.size>MAX_ICON_BYTES)return apiError("ICON_TOO_LARGE","Website icons must be 512 KB or smaller.",413);
  if(!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number]))return apiError("ICON_TYPE","Use PNG, JPG, WebP, or GIF.",415);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!isSupportedImageBytes(bytes.slice(0,16),file.type))return apiError("ICON_CONTENT","The icon contents do not match its file type.",415);
  return Response.json({iconData:`data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`});
}
