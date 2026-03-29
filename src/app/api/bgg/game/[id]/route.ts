import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGameDetails } from "@/lib/bgg";
import type { BggGameDetails } from "@/types/bgg";

function mockImage(seed: number) {
  return `https://picsum.photos/seed/${seed}/300/300`;
}

const MOCK_DETAILS: Record<number, BggGameDetails> = {
  13: { id: 13, name: "Catan", yearPublished: 1995, minPlayers: 3, maxPlayers: 4, thumbnail: mockImage(13), image: mockImage(13), description: "Trade and build settlements" },
  174430: { id: 174430, name: "Gloomhaven", yearPublished: 2017, minPlayers: 1, maxPlayers: 4, thumbnail: mockImage(174430), image: mockImage(174430), description: "Cooperative dungeon crawler" },
  167791: { id: 167791, name: "Terraforming Mars", yearPublished: 2016, minPlayers: 1, maxPlayers: 5, thumbnail: mockImage(167791), image: mockImage(167791), description: "Terraform the red planet" },
  224517: { id: 224517, name: "Brass: Birmingham", yearPublished: 2018, minPlayers: 2, maxPlayers: 4, thumbnail: mockImage(224517), image: mockImage(224517), description: "Industrial revolution strategy" },
  162886: { id: 162886, name: "Spirit Island", yearPublished: 2017, minPlayers: 1, maxPlayers: 4, thumbnail: mockImage(162886), image: mockImage(162886), description: "Cooperative island defense" },
  291457: { id: 291457, name: "Gloomhaven: Jaws of the Lion", yearPublished: 2020, minPlayers: 1, maxPlayers: 4, thumbnail: mockImage(291457), image: mockImage(291457), description: "Standalone Gloomhaven adventure" },
  187645: { id: 187645, name: "Star Wars: Rebellion", yearPublished: 2016, minPlayers: 2, maxPlayers: 4, thumbnail: mockImage(187645), image: mockImage(187645), description: "Galactic civil war" },
  233078: { id: 233078, name: "Pandemic Legacy: Season 2", yearPublished: 2017, minPlayers: 2, maxPlayers: 4, thumbnail: mockImage(233078), image: mockImage(233078), description: "Legacy pandemic experience" },
  12333: { id: 12333, name: "Twilight Struggle", yearPublished: 2005, minPlayers: 2, maxPlayers: 2, thumbnail: mockImage(12333), image: mockImage(12333), description: "Cold war strategy" },
  68448: { id: 68448, name: "7 Wonders", yearPublished: 2010, minPlayers: 2, maxPlayers: 7, thumbnail: mockImage(68448), image: mockImage(68448), description: "Card drafting civilization" },
  173346: { id: 173346, name: "7 Wonders Duel", yearPublished: 2015, minPlayers: 2, maxPlayers: 2, thumbnail: mockImage(173346), image: mockImage(173346), description: "Two-player 7 Wonders" },
  230802: { id: 230802, name: "Azul", yearPublished: 2017, minPlayers: 2, maxPlayers: 4, thumbnail: mockImage(230802), image: mockImage(230802), description: "Tile-laying pattern game" },
  266192: { id: 266192, name: "Wingspan", yearPublished: 2019, minPlayers: 1, maxPlayers: 5, thumbnail: mockImage(266192), image: mockImage(266192), description: "Bird collection engine builder" },
  312484: { id: 312484, name: "Lost Ruins of Arnak", yearPublished: 2020, minPlayers: 1, maxPlayers: 4, thumbnail: mockImage(312484), image: mockImage(312484), description: "Deck building and exploration" },
  342942: { id: 342942, name: "Ark Nova", yearPublished: 2021, minPlayers: 1, maxPlayers: 4, thumbnail: mockImage(342942), image: mockImage(342942), description: "Build a modern zoo" },
};

function useMock() {
  return !process.env.BGG_API_TOKEN;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const gameId = parseInt(id, 10);
  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
  }

  if (useMock()) {
    const details = MOCK_DETAILS[gameId];
    if (!details) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json(details);
  }

  try {
    const details = await getGameDetails(gameId);
    if (!details) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({ error: "Failed to fetch game details" }, { status: 500 });
  }
}
