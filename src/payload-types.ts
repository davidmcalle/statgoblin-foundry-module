import type { MessageEventType, UserRole } from "./types";

// The wire shapes the collector builds and sends. The module only *produces*
// these — it never reads or validates an incoming payload — so plain TS types
// are enough here. Runtime validation (zod) lives with the consumers (e2e suite
// and backend), not in the shipped module.

export type Author = {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
};

// The specific token instance that rolled — present when the speaker is a token.
// `id` is the unique per-token key; `name` is the token's display name (e.g.
// "Miserable Adult Red Dragon"). Distinguishes several tokens of one actor.
type TokenInfo = {
  id: string;
  name: string;
};

export type ActorInfo = {
  id: string;
  name: string;
  image: string;
  // dnd5e actor type: "character" (PC) vs "npc" (monster/NPC); "" if unknown.
  type: string;
  // Challenge rating, npc sheets only.
  cr: number | null;
  token: TokenInfo | null;
};

// The activity (attack/heal/utility/…) that produced the message, name resolved
// client-side from its uuid.
type ActivityInfo = {
  id: string;
  type: string;
  name: string;
};

// The item behind the message (weapon/spell/feat/consumable), name + image
// resolved client-side — the backend can't dereference Foundry uuids.
export type ItemInfo = {
  id: string;
  uuid: string;
  type: string;
  name: string;
  image: string;
  activity: ActivityInfo | null;
};

type Visibility = {
  whisper: string[];
  blind: boolean;
};

export type WorldInfo = {
  id: string;
  title: string;
  image: string;
};

export type SystemInfo = {
  id: string;
  version: string;
};

// What the collector mirrors off the ChatMessage. dnd5e/core flags pass through
// untouched alongside our own `whatwerolled` enrichment flag, so `flags` stays a
// loose bag — the backend interprets it.
export type CollectedData = {
  messageCreatedAt: Date;
  author: Author | null;
  actor: ActorInfo | null;
  item: ItemInfo | null;
  visibility: Visibility;
  world: WorldInfo;
  system: SystemInfo;
  flavor: string;
  flags: Record<string, unknown>;
  rolls: Record<string, unknown>[];
};

// Wire envelope: identity + what happened. `collectedData` is null for deletions
// (the backend only needs the id to drop the row). The campaign is identified by
// the Bearer token, not carried in the body.
export type MessageEvent = {
  eventType: MessageEventType;
  messageId: string;
  collectedData: CollectedData | null;
};
