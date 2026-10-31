import { resolveProvider } from "@/lib/claude";
import { handleJourney } from "@/lib/journey-handler";
import { fetchJourneyFacts } from "@/lib/journey/research";

// Web research on one lot can take a while on the most capable model.
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { status, body: payload } = await handleJourney(body, request.headers, process.env, {
    // handleJourney rejects the request before calling this when no provider is configured.
    fetchFacts: (input) => fetchJourneyFacts(input, resolveProvider(process.env)!),
  });
  return Response.json(payload, { status, headers: { "cache-control": "no-store" } });
}
