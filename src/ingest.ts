import { INGEST_TOKEN_SETTINGS_KEY, INGEST_URL_SETTINGS_KEY, MODULE_ID } from "./constants";
import type { MessageEvent } from "./payload";

/**
 * POST one event to the configured ingest endpoint. The ingest token is the
 * Bearer token (not sent in the body); a blank URL or token disables upload.
 */
export async function postEvent(event: MessageEvent): Promise<void> {
  const url = game.settings!.get(MODULE_ID, INGEST_URL_SETTINGS_KEY).trim();
  const token = game.settings!.get(MODULE_ID, INGEST_TOKEN_SETTINGS_KEY).trim();
  if (!url || !token) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
      keepalive: true,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`${MODULE_ID} | ingest ${res.status}`, detail);
    }
  } catch (error) {
    console.error(`${MODULE_ID} | ingest error`, error);
  }
}
