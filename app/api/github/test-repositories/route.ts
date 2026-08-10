export async function GET() {
  return Response.json({ error: "This global-installation endpoint has been retired. Use an owned installation endpoint." }, { status: 410 });
}
