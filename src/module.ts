import {
  CAMPAIGN_ID_SETTINGS_KEY,
  INGEST_TOKEN_SETTINGS_KEY,
  INGEST_URL_SETTINGS_KEY,
  MODULE_ID,
} from "./constants";
import { registerEnrichers } from "./enrichers";
import { buildEvent, shouldMirror, MessageEventType } from "./payload";
import { postEvent } from "./ingest";

Hooks.once("init", () => {
  game.settings!.register(MODULE_ID, INGEST_URL_SETTINGS_KEY, {
    name: "Ingest URL",
    hint: "Full URL of your StatGoblin ingest endpoint, e.g. https://rolls.example.com/api/ingest. Blank disables collection.",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });
  game.settings!.register(MODULE_ID, CAMPAIGN_ID_SETTINGS_KEY, {
    name: "Campaign ID",
    hint: "Your campaign's ID (a UUID) from the StatGoblin campaign page. Blank disables collection.",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });
  game.settings!.register(MODULE_ID, INGEST_TOKEN_SETTINGS_KEY, {
    name: "Admin API Key",
    hint: "The secret admin API key shown once when the campaign was created (the GM can regenerate it on the campaign page). Blank disables collection.",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });
  registerEnrichers();
});

Hooks.once("ready", () => {
  Hooks.on("createChatMessage", (message) => {
    if (!shouldMirror(message)) return;
    void postEvent(buildEvent(MessageEventType.Created, message));
  });
  Hooks.on("updateChatMessage", (message) => {
    if (!shouldMirror(message)) return;
    void postEvent(buildEvent(MessageEventType.Updated, message));
  });
  Hooks.on("deleteChatMessage", (message) => {
    if (!shouldMirror(message)) return;
    void postEvent(buildEvent(MessageEventType.Deleted, message));
  });
});
