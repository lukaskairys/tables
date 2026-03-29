import { XMLParser } from "fast-xml-parser";
import type { BggSearchResult, BggGameDetails } from "@/types/bgg";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

async function bggFetch(path: string): Promise<string> {
  const baseUrl = process.env.BGG_API_BASE_URL || "https://boardgamegeek.com/xmlapi2";
  const url = `${baseUrl}${path}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const headers: Record<string, string> = {};
    if (process.env.BGG_API_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.BGG_API_TOKEN}`;
    }

    const res = await fetch(url, { headers });

    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    if (!res.ok) {
      throw new Error(`BGG API error: ${res.status}`);
    }

    return res.text();
  }

  throw new Error("BGG API: max retries exceeded");
}

export async function searchGames(query: string): Promise<BggSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<BggSearchResult[]>(cacheKey);
  if (cached) return cached;

  const xml = await bggFetch(`/search?query=${encodeURIComponent(query)}&type=boardgame`);
  const parsed = parser.parse(xml);

  if (!parsed.items?.item) return [];

  const items = Array.isArray(parsed.items.item)
    ? parsed.items.item
    : [parsed.items.item];

  const results: BggSearchResult[] = items.map((item: Record<string, unknown>) => ({
    id: Number((item as Record<string, string>)["@_id"]),
    name: ((item as Record<string, Record<string, string>>).name)?.["@_value"] || "",
    yearPublished: (item as Record<string, Record<string, string>>).yearpublished
      ? Number(((item as Record<string, Record<string, string>>).yearpublished)["@_value"])
      : undefined,
  }));

  setCache(cacheKey, results);
  return results;
}

export async function getGameDetails(id: number): Promise<BggGameDetails | null> {
  const cacheKey = `game:${id}`;
  const cached = getCached<BggGameDetails>(cacheKey);
  if (cached) return cached;

  const xml = await bggFetch(`/thing?type=boardgame&stats=1&id=${id}`);
  const parsed = parser.parse(xml);

  const item = parsed.items?.item;
  if (!item) return null;

  const names = Array.isArray(item.name) ? item.name : [item.name];
  const primaryName = names.find(
    (n: Record<string, string>) => n["@_type"] === "primary"
  );

  const details: BggGameDetails = {
    id: Number(item["@_id"]),
    name: primaryName?.["@_value"] || "",
    yearPublished: item.yearpublished ? Number(item.yearpublished["@_value"]) : undefined,
    minPlayers: Number(item.minplayers?.["@_value"] || 1),
    maxPlayers: Number(item.maxplayers?.["@_value"] || 4),
    thumbnail: item.thumbnail || null,
    image: item.image || null,
    description: item.description || "",
  };

  setCache(cacheKey, details);
  return details;
}
