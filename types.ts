
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

export interface GameStatus {
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  turn: Color;
  fen: string;
}

export interface HistoryItem {
  move: string;
  san: string;
  color: Color;
  fen: string;
}

export interface Arrow {
  from: string; // e.g., "e2"
  to: string;   // e.g., "e4"
  color: string;
}

export interface Highlight {
  square: string;
  color: string;
}

export interface Lesson {
  id: string;
  title: string;
  fen: string;
  description: string;
  arrows: Arrow[];
  highlights: Highlight[];
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  chapters: Chapter[];
}
