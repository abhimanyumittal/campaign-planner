import { LoadAPIKeyError } from "ai";

/** Turns pipeline failures into a message the person running the demo can act on. */
export function describeError(err: unknown): string {
  if (LoadAPIKeyError.isInstance(err)) {
    return "No LLM API key is set. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local and restart the dev server. The sample advertisers work without a key.";
  }
  return err instanceof Error ? err.message : "Something went wrong while planning. Try again.";
}
