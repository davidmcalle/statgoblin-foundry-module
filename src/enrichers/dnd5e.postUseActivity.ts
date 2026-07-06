import { buildSyntheticUsageEvent } from "../payload";
import { postEvent } from "../ingest";
import { type Enricher } from "./shared";

type UsageResults = { message?: unknown };

/**
 * Catch activity uses that produce no chat message (Manifest Echo, …) — the
 * chat mirror never sees them. When a message WAS created, skip: the
 * createChatMessage pipeline already captured it. Fires only on the using
 * client, so synthetic events don't duplicate across connected clients.
 */
function onPostUseActivity(activity: unknown, _config: unknown, results?: UsageResults): void {
  if (results?.message) return;
  void postEvent(
    buildSyntheticUsageEvent(activity as Parameters<typeof buildSyntheticUsageEvent>[0]),
  );
}

export const dnd5ePostUseActivity: Enricher = {
  hook: "dnd5e.postUseActivity",
  handler: onPostUseActivity as (...args: unknown[]) => void,
};
