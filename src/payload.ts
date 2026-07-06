import { MODULE_ID } from "./constants";
import { MessageEventType, UserRole } from "./types";
import type {
  Author,
  ActorInfo,
  CollectedData,
  ItemInfo,
  MessageEvent,
  WorldInfo,
  SystemInfo,
} from "./payload-types";

export { MessageEventType };
export type { Author, ActorInfo, MessageEvent };

const ROLE_BY_VALUE: readonly UserRole[] = [
  UserRole.None,
  UserRole.Player,
  UserRole.Trusted,
  UserRole.Assistant,
  UserRole.Gamemaster,
];

/**
 * Mirror any message that carries rolls OR references a dnd5e item/activity —
 * ability/spell/item uses (Second Wind, Unleash Incarnation, …) produce
 * roll-less usage cards, and features without activities (Tactical Mind, …)
 * produce bare description cards that only carry the item ref. Plain chat text
 * is skipped. The backend classifies the type.
 */
export function shouldMirror(message: ChatMessage): boolean {
  if (message.rolls?.length) return true;
  const dnd5e = (message.flags as { dnd5e?: { activity?: unknown; item?: unknown } } | undefined)
    ?.dnd5e;
  return !!(dnd5e?.activity || dnd5e?.item);
}

function absoluteUrl(path: string | null | undefined): string {
  if (!path) return "";
  // Already absolute (e.g. a CDN asset on The Forge) — pass through untouched.
  if (/^https?:\/\//i.test(path)) return path;
  // getRoute prepends Foundry's route prefix (self-hosting behind a reverse
  // proxy at a subpath); bare origin would drop it.
  const routed = foundry.utils.getRoute?.(path) ?? path;
  return new URL(routed, window.location.origin).href;
}

function authorOf(message: ChatMessage): Author | null {
  const source = message.toObject() as { author?: string | null };
  const id = source.author ?? null;
  if (!id) return null;
  const user = game?.users?.get(id);
  return {
    id,
    name: user?.name ?? "",
    avatar: absoluteUrl(user?.avatar),
    role: ROLE_BY_VALUE[user?.role ?? 0] ?? UserRole.None,
  };
}

function actorOf(message: ChatMessage): ActorInfo | null {
  const id = message.speaker?.actor ?? null;
  if (!id) return null;
  const actor = game?.actors?.get(id);
  // `name` is the shared actor template. When the speaker is a token, capture the
  // instance separately: its id (unique per token) + the display name from
  // `speaker.alias` (the token name, e.g. "Angry Phase Spider"). Foundry stores
  // both on the message, so they survive after the token/combat is gone.
  const tokenId = message.speaker?.token ?? null;
  return {
    id,
    name: actor?.name ?? "",
    image: absoluteUrl(actor?.img),
    token: tokenId ? { id: tokenId, name: message.speaker?.alias ?? "" } : null,
  };
}

/** Resolve a document uuid on this client; null if it's gone or unresolvable. */
function resolveUuid(uuid: string | undefined): { name?: string; img?: string } | null {
  if (!uuid) return null;
  const resolver = (globalThis as { fromUuidSync?: (u: string) => unknown }).fromUuidSync;
  if (!resolver) return null;
  try {
    return (resolver(uuid) as { name?: string; img?: string } | null) ?? null;
  } catch {
    return null;
  }
}

type Dnd5eRef = { type?: string; id?: string; uuid?: string };

/**
 * The item (weapon/spell/feat/consumable) behind the message, with its display
 * name resolved client-side — the backend can't dereference Foundry uuids, and
 * `flags.dnd5e.item` only carries id/uuid/type. Covers usage cards and
 * midi-qol attack messages alike. Null when the message has no item.
 */
function itemOf(message: ChatMessage): ItemInfo | null {
  const dnd5e = (message.flags as { dnd5e?: { item?: Dnd5eRef; activity?: Dnd5eRef } } | undefined)
    ?.dnd5e;
  const ref = dnd5e?.item;
  if (!ref?.uuid) return null;
  const item = resolveUuid(ref.uuid);
  const activityRef = dnd5e?.activity;
  const activity = resolveUuid(activityRef?.uuid);
  return {
    id: ref.id ?? "",
    uuid: ref.uuid,
    type: ref.type ?? "",
    name: item?.name ?? "",
    image: absoluteUrl(item?.img),
    activity: activityRef
      ? {
          id: activityRef.id ?? "",
          type: activityRef.type ?? "",
          name: activity?.name ?? "",
        }
      : null,
  };
}

function worldOf(): WorldInfo {
  const w = game?.world;
  let image = "";
  for (const m of w?.media ?? []) {
    if (m.url) {
      image = absoluteUrl(m.url);
      break;
    }
  }
  return {
    id: w?.id ?? "",
    title: w?.title ?? "",
    image,
  };
}

function systemOf(): SystemInfo {
  const s = game?.system;
  return {
    id: s?.id ?? "",
    version: s?.version ?? "",
  };
}

/** The raw Foundry data we mirror — flags (incl. our enricher's) pass through. */
function buildCollectedData(message: ChatMessage): CollectedData {
  const source = message.toObject() as {
    flags?: Record<string, unknown>;
    rolls?: string[];
    flavor?: string;
  };
  return {
    messageCreatedAt: new Date(message.timestamp),
    author: authorOf(message),
    actor: actorOf(message),
    item: itemOf(message),
    visibility: {
      whisper: (message.whisper ?? []) as string[],
      blind: message.blind ?? false,
    },
    world: worldOf(),
    system: systemOf(),
    flavor: source.flavor ?? "",
    flags: (source.flags ?? {}) as CollectedData["flags"],
    rolls: (source.rolls ?? []).map((r) => JSON.parse(r) as Record<string, unknown>),
  };
}

/** Build the wire event. The campaign is identified by the Bearer token, not the body. */
export function buildEvent(type: MessageEventType, message: ChatMessage): MessageEvent {
  if (!message.id) throw new Error(`${MODULE_ID} | ChatMessage delivered to hook without an id`);
  return {
    eventType: type,
    messageId: message.id,
    // A deletion only needs the id — nothing to collect.
    collectedData: type === MessageEventType.Deleted ? null : buildCollectedData(message),
  };
}
