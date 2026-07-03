import crypto from "node:crypto";

export function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

const ALIAS_ADJECTIVES = [
  "Silent",
  "Curious",
  "Amber",
  "Velvet",
  "Cosmic",
  "Gentle",
  "Bold",
  "Quiet",
  "Lucky",
  "Swift",
  "Hidden",
  "Bright",
  "Calm",
  "Clever",
  "Rosy",
  "Sunny",
];

const ALIAS_NOUNS = [
  "Falcon",
  "Maple",
  "Comet",
  "Otter",
  "Willow",
  "Nova",
  "Ember",
  "Panda",
  "Sparrow",
  "Lotus",
  "Tiger",
  "Breeze",
  "Fox",
  "Cloud",
  "Lynx",
  "Wolf",
];

export function generateAlias(): string {
  const adjective =
    ALIAS_ADJECTIVES[Math.floor(Math.random() * ALIAS_ADJECTIVES.length)];
  const noun = ALIAS_NOUNS[Math.floor(Math.random() * ALIAS_NOUNS.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${noun} #${suffix}`;
}

const SPAM_PATTERNS = [
  /https?:\/\//i,
  /\b\d{10}\b/,
  /whatsapp/i,
  /telegram/i,
  /instagram\.com/i,
  /(.)\1{7,}/,
];

export function looksLikeSpam(text: string): boolean {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}
