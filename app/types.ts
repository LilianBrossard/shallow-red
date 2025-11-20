export type Color = "white" | "black";
export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";

export interface Position {
  row: number; // 0-7
  col: number; // 0-7
}

export interface Piece {
  type: PieceType;
  color: Color;
  position: Position;
  id: string; // Unique ID for React keys and movement tracking
  hasMoved?: boolean; // Important for Castling and Pawn initial move
}

export interface Move {
  from: Position;
  to: Position;
  isCapture?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  promotionType?: PieceType;
}

export type GameStatus =
  | "playing"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "draw-repetition"
  | "draw-50-moves";

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface LastMove {
  piece: Piece;
  from: Position;
  to: Position;
}

export interface MoveHistoryItem {
  piece: Piece;
  from: Position;
  to: Position;
  notation: string;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  turn: Color;
}

export interface CapturedPieces {
  white: PieceType[];
  black: PieceType[];
}

export const INITIAL_BOARD_STATE: Piece[] = [
  // White Pieces
  {
    id: "w_r1",
    type: "rook",
    color: "white",
    position: { row: 0, col: 0 },
    hasMoved: false,
  },
  {
    id: "w_n1",
    type: "knight",
    color: "white",
    position: { row: 0, col: 1 },
    hasMoved: false,
  },
  {
    id: "w_b1",
    type: "bishop",
    color: "white",
    position: { row: 0, col: 2 },
    hasMoved: false,
  },
  {
    id: "w_q",
    type: "queen",
    color: "white",
    position: { row: 0, col: 3 },
    hasMoved: false,
  },
  {
    id: "w_k",
    type: "king",
    color: "white",
    position: { row: 0, col: 4 },
    hasMoved: false,
  },
  {
    id: "w_b2",
    type: "bishop",
    color: "white",
    position: { row: 0, col: 5 },
    hasMoved: false,
  },
  {
    id: "w_n2",
    type: "knight",
    color: "white",
    position: { row: 0, col: 6 },
    hasMoved: false,
  },
  {
    id: "w_r2",
    type: "rook",
    color: "white",
    position: { row: 0, col: 7 },
    hasMoved: false,
  },
  {
    id: "w_p1",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 0 },
    hasMoved: false,
  },
  {
    id: "w_p2",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 1 },
    hasMoved: false,
  },
  {
    id: "w_p3",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 2 },
    hasMoved: false,
  },
  {
    id: "w_p4",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 3 },
    hasMoved: false,
  },
  {
    id: "w_p5",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 4 },
    hasMoved: false,
  },
  {
    id: "w_p6",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 5 },
    hasMoved: false,
  },
  {
    id: "w_p7",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 6 },
    hasMoved: false,
  },
  {
    id: "w_p8",
    type: "pawn",
    color: "white",
    position: { row: 1, col: 7 },
    hasMoved: false,
  },

  // Black Pieces
  {
    id: "b_r1",
    type: "rook",
    color: "black",
    position: { row: 7, col: 0 },
    hasMoved: false,
  },
  {
    id: "b_n1",
    type: "knight",
    color: "black",
    position: { row: 7, col: 1 },
    hasMoved: false,
  },
  {
    id: "b_b1",
    type: "bishop",
    color: "black",
    position: { row: 7, col: 2 },
    hasMoved: false,
  },
  {
    id: "b_q",
    type: "queen",
    color: "black",
    position: { row: 7, col: 3 },
    hasMoved: false,
  },
  {
    id: "b_k",
    type: "king",
    color: "black",
    position: { row: 7, col: 4 },
    hasMoved: false,
  },
  {
    id: "b_b2",
    type: "bishop",
    color: "black",
    position: { row: 7, col: 5 },
    hasMoved: false,
  },
  {
    id: "b_n2",
    type: "knight",
    color: "black",
    position: { row: 7, col: 6 },
    hasMoved: false,
  },
  {
    id: "b_r2",
    type: "rook",
    color: "black",
    position: { row: 7, col: 7 },
    hasMoved: false,
  },
  {
    id: "b_p1",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 0 },
    hasMoved: false,
  },
  {
    id: "b_p2",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 1 },
    hasMoved: false,
  },
  {
    id: "b_p3",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 2 },
    hasMoved: false,
  },
  {
    id: "b_p4",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 3 },
    hasMoved: false,
  },
  {
    id: "b_p5",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 4 },
    hasMoved: false,
  },
  {
    id: "b_p6",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 5 },
    hasMoved: false,
  },
  {
    id: "b_p7",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 6 },
    hasMoved: false,
  },
  {
    id: "b_p8",
    type: "pawn",
    color: "black",
    position: { row: 6, col: 7 },
    hasMoved: false,
  },
];
