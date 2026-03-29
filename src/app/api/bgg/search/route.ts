import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchGames } from "@/lib/bgg";
import type { BggSearchResult } from "@/types/bgg";

const MOCK_GAMES: BggSearchResult[] = [
  { id: 13, name: "Catan", yearPublished: 1995 },
  { id: 174430, name: "Gloomhaven", yearPublished: 2017 },
  { id: 167791, name: "Terraforming Mars", yearPublished: 2016 },
  { id: 224517, name: "Brass: Birmingham", yearPublished: 2018 },
  { id: 162886, name: "Spirit Island", yearPublished: 2017 },
  { id: 291457, name: "Gloomhaven: Jaws of the Lion", yearPublished: 2020 },
  { id: 187645, name: "Star Wars: Rebellion", yearPublished: 2016 },
  { id: 233078, name: "Pandemic Legacy: Season 2", yearPublished: 2017 },
  { id: 12333, name: "Twilight Struggle", yearPublished: 2005 },
  { id: 68448, name: "7 Wonders", yearPublished: 2010 },
  { id: 173346, name: "7 Wonders Duel", yearPublished: 2015 },
  { id: 230802, name: "Azul", yearPublished: 2017 },
  { id: 266192, name: "Wingspan", yearPublished: 2019 },
  { id: 312484, name: "Lost Ruins of Arnak", yearPublished: 2020 },
  { id: 342942, name: "Ark Nova", yearPublished: 2021 },
];

function useMock() {
  return !process.env.BGG_API_TOKEN;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  if (useMock()) {
    const q = query.toLowerCase();
    const results = MOCK_GAMES.filter((g) => g.name.toLowerCase().includes(q));
    return NextResponse.json(results);
  }

  try {
    const results = await searchGames(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Failed to search games" }, { status: 500 });
  }
}
