import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_LENGTH = 2_800_000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, image: true },
  });

  if (!user) return Response.json({ error: "User not found." }, { status: 404 });
  return Response.json(user, { status: 200 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must contain valid JSON." }, { status: 400 });
  }

  const image = typeof body === "object" && body !== null && "image" in body ? (body as { image?: unknown }).image : null;
  if (typeof image !== "string" || image.length > MAX_IMAGE_LENGTH || !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image)) {
    return Response.json({ error: "A valid profile image smaller than 2 MB is required." }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: session.user.id }, data: { image }, select: { image: true } });
  return Response.json(user, { status: 200 });
}
