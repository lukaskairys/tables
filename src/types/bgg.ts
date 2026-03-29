export interface BggSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
}

export interface BggGameDetails {
  id: number;
  name: string;
  yearPublished?: number;
  minPlayers: number;
  maxPlayers: number;
  thumbnail: string | null;
  image: string | null;
  description: string;
}
