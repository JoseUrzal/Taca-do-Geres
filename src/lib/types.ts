export type Team = { id: string; name: string; colour_hex: string };
export type Player = {
  id: string;
  name: string;
  short_name: string;
  emoji: string;
  team_id: string | null;
};
export type Mission = {
  id: string;
  text: string;
  points: number;
  difficulty: 1 | 2 | 3;
  active: boolean;
};
export type AssignmentStatus =
  | "ativa"
  | "reclamada"
  | "confirmada"
  | "chumbada"
  | "apanhada"
  | "expirada";

export type RoundStatus = "a_responder" | "a_adivinhar" | "revelado";

export type LeaderboardRow = {
  player: Player & { team_id: string | null };
  points: number;
  rank: number;
};

export type FeedItem = {
  id: string;
  points: number;
  reason: string;
  source: string;
  created_at: string;
  player: { name: string; emoji: string } | null;
};
