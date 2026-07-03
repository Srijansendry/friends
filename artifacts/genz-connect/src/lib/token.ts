export function getTokens(): string[] {
  const tokens = localStorage.getItem("anon-tokens");
  if (!tokens) return [];
  try {
    return JSON.parse(tokens);
  } catch {
    return [];
  }
}

export function addToken(token: string) {
  const tokens = getTokens();
  if (!tokens.includes(token)) {
    tokens.push(token);
    localStorage.setItem("anon-tokens", JSON.stringify(tokens));
  }
}

export function getTokensHeader(): Record<string, string> {
  const tokens = getTokens();
  if (tokens.length === 0) return {};
  return { "x-anon-token": tokens.join(",") };
}
