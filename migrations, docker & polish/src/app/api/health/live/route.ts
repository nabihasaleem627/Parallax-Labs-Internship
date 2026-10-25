/**
 * Liveness probe: answers "is the Node.js process up and able to handle an
 * HTTP request at all?". It intentionally does NOT touch the database or
 * Redis - a slow/unavailable dependency should surface as a readiness
 * failure, not cause the orchestrator to restart a perfectly healthy
 * process.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "ok", uptimeSeconds: Math.round(process.uptime()) },
    { status: 200 },
  );
}
