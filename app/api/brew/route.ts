import { handleBrew } from "@/lib/brew-handler";
import { fetchBeanProfile, resolveProvider } from "@/lib/claude";

// Web research plus a full recipe can take a while on the most capable model.
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { status, body: payload } = await handleBrew(body, request.headers, process.env, {
    // handleBrew rejects the request before calling this when no provider is configured.
    fetchProfile: (q) => fetchBeanProfile(q, resolveProvider(process.env)!),
  });
  return Response.json(payload, { status, headers: { "cache-control": "no-store" } });
}
