import { NextResponse } from "next/server";
import { exploreLocal, parseExploreRequest } from "@/lib/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/explore
 *
 * Runs the HackSprout constraint engine (lib/engine.ts) locally.
 * The request is validated strictly by parseExploreRequest: unknown
 * fields, wrong types, out-of-range values and unverifiable allergen
 * exclusions all return 400 with a clear message — the client and the
 * server share the exact same schema definition.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  try {
    const req = parseExploreRequest(body);
    const result = exploreLocal(req);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
