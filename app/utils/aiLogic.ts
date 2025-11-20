import { Piece, Color, Position, PieceType, LastMove } from "../types";
import {
  getValidMoves,
  isCheck,
  cloneBoard,
  getPieceAt,
  isSamePosition,
  isSquareAttacked,
  getPossibleMoves,
} from "./chessLogic";

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

const getPieceValue = (type: PieceType) => PIECE_VALUES[type];

// Piece-Square Tables (PST)
// Values are for White. For Black, we mirror the row index.
// Higher values = better position.

const pawnPST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50], // Rank 8 (Promotion) - Handled by material change usually, but good to have high PST
  [10, 10, 20, 30, 30, 20, 10, 10], // Rank 7
  [5, 5, 10, 80, 80, 10, 5, 5], // Rank 6
  [0, 0, 0, 60, 60, 0, 0, 0], // Rank 5
  [5, -5, -10, 20, 20, -10, -5, 5], // Rank 4
  [5, 10, 10, -40, -40, 10, 10, 5], // Rank 3
  [0, 0, 0, 0, 0, 0, 0, 0], // Rank 2
];

const knightPST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const bishopPST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const rookPST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const queenPST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const kingPSTMiddleGame = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const kingPSTEndGame = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

const getPSTValue = (piece: Piece, row: number, col: number): number => {
  let pst: number[][] = [];
  switch (piece.type) {
    case "pawn":
      pst = pawnPST;
      break;
    case "knight":
      pst = knightPST;
      break;
    case "bishop":
      pst = bishopPST;
      break;
    case "rook":
      pst = rookPST;
      break;
    case "queen":
      pst = queenPST;
      break;
    case "king":
      // For simplicity, let's use middle game PST for now.
      // A more advanced engine would determine if it's endgame.
      pst = kingPSTMiddleGame;
      break;
    default:
      return 0;
  }

  // For black pieces, mirror the row index
  const effectiveRow = piece.color === "white" ? row : 7 - row;
  return pst[effectiveRow][col];
};

const getPawnStructureScore = (board: Piece[], color: Color): number => {
  let score = 0;
  const pawns = board.filter((p) => p.type === "pawn" && p.color === color);

  for (const pawn of pawns) {
    const { row, col } = pawn.position;
    const direction = color === "white" ? 1 : -1;

    // Connected Pawns (Bonus)
    // Check left and right columns for friendly pawns
    const hasNeighbor = pawns.some(
      (p) =>
        p.id !== pawn.id &&
        Math.abs(p.position.col - col) === 1 &&
        Math.abs(p.position.row - row) <= 1 // Adjacent rank or same rank
    );
    if (hasNeighbor) score += 15;

    // Doubled Pawns (Penalty)
    const isDoubled = pawns.some(
      (p) => p.id !== pawn.id && p.position.col === col
    );
    if (isDoubled) score -= 20;

    // Isolated Pawns (Penalty)
    // No friendly pawns on adjacent columns
    const hasAdjacentFilePawns = pawns.some(
      (p) => Math.abs(p.position.col - col) === 1
    );
    if (!hasAdjacentFilePawns) score -= 20;
  }

  return score;
};

const getKingSafetyScore = (board: Piece[], color: Color): number => {
  let score = 0;
  const king = board.find((p) => p.type === "king" && p.color === color);
  if (!king) return -Infinity; // Should not happen

  const { row, col } = king.position;
  const direction = color === "white" ? -1 : 1; // Forward direction for pawns (relative to king)

  // Pawn Shield
  // Check for pawns in front of the king
  const shieldCols = [col - 1, col, col + 1];
  for (const shieldCol of shieldCols) {
    if (shieldCol >= 0 && shieldCol <= 7) {
      const shieldRow = row + direction;
      if (shieldRow >= 0 && shieldRow <= 7) {
        const pawn = getPieceAt(board, { row: shieldRow, col: shieldCol });
        if (pawn && pawn.type === "pawn" && pawn.color === color) {
          score += 20; // Bonus for pawn shield
        } else {
          // Penalty for open file/missing shield
          score -= 10;
        }
      }
    }
  }

  // King Safety Zone
  // Check if squares around king are attacked
  const zoneOffsets = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of zoneOffsets) {
    const targetRow = row + dr;
    const targetCol = col + dc;
    if (targetRow >= 0 && targetRow <= 7 && targetCol >= 0 && targetCol <= 7) {
      if (isSquareAttacked(board, { row: targetRow, col: targetCol }, color)) {
        score -= 15; // Penalty for attacked square near king
      }
    }
  }

  return score;
};

const getPieceDefenseScore = (board: Piece[], color: Color): number => {
  let score = 0;
  const myPieces = board.filter((p) => p.color === color);

  for (const piece of myPieces) {
    // Get all squares this piece attacks/defends
    // We use getPossibleMoves but treat them as attacks (even if friendly piece is there)
    const attacks = getPossibleMoves(piece, board, null); // lastMove null is fine for static eval

    for (const attackPos of attacks) {
      const targetPiece = getPieceAt(board, attackPos);
      if (targetPiece && targetPiece.color === color) {
        // Defending friendly piece
        score += 5; // Base defense bonus
        // Bonus based on value of defended piece (protecting valuable pieces is good)
        score += Math.floor(getPieceValue(targetPiece.type) / 100);
      }
    }
  }

  return score;
};

export const evaluateBoard = (board: Piece[], color: Color): number => {
  let score = 0;

  // Material & PST
  for (const piece of board) {
    const materialValue = PIECE_VALUES[piece.type];
    const pstValue = getPSTValue(piece, piece.position.row, piece.position.col);
    const totalValue = materialValue + pstValue;

    if (piece.color === color) {
      score += totalValue;
    } else {
      score -= totalValue;
    }
  }

  // King Safety
  score += getKingSafetyScore(board, color);
  score -= getKingSafetyScore(board, color === "white" ? "black" : "white");

  // Piece Defense
  score += getPieceDefenseScore(board, color);
  score -= getPieceDefenseScore(board, color === "white" ? "black" : "white");

  // Pawn Structure
  score += getPawnStructureScore(board, color);
  score -= getPawnStructureScore(board, color === "white" ? "black" : "white");

  return score;
};

export const getBestMove = (
  board: Piece[],
  color: Color,
  depth: number,
  lastMove: LastMove | null
): {
  move: { from: Position; to: Position; promotionType?: PieceType } | null;
  score: number;
} => {
  let bestMove = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  // Get all possible moves for the current color
  const myPieces = board.filter((p) => p.color === color);
  let allMoves: { piece: Piece; to: Position; promotionType?: PieceType }[] =
    [];

  for (const piece of myPieces) {
    const moves = getValidMoves(piece, board, lastMove);
    for (const to of moves) {
      if (piece.type === "pawn" && (to.row === 0 || to.row === 7)) {
        allMoves.push({ piece, to, promotionType: "queen" });
      } else {
        allMoves.push({ piece, to });
      }
    }
  }

  // Sort moves to improve pruning (Captures first)
  allMoves.sort((a, b) => {
    const targetA = getPieceAt(board, a.to);
    const targetB = getPieceAt(board, b.to);
    const scoreA = targetA ? getPieceValue(targetA.type) : 0;
    const scoreB = targetB ? getPieceValue(targetB.type) : 0;
    return scoreB - scoreA;
  });

  for (const move of allMoves) {
    const newBoard = cloneBoard(board);
    const movingPiece = newBoard.find((p) => p.id === move.piece.id)!;

    // Execute move logic (simplified for AI simulation)
    // Capture
    const captureIndex = newBoard.findIndex((p) =>
      isSamePosition(p.position, move.to)
    );
    if (captureIndex !== -1) newBoard.splice(captureIndex, 1);

    // En Passant (Simplified check)
    if (
      movingPiece.type === "pawn" &&
      move.to.col !== movingPiece.position.col &&
      captureIndex === -1
    ) {
      // Assume en passant
      const capturedRow =
        movingPiece.color === "white" ? move.to.row - 1 : move.to.row + 1;
      const epIndex = newBoard.findIndex(
        (p) => p.position.row === capturedRow && p.position.col === move.to.col
      );
      if (epIndex !== -1) newBoard.splice(epIndex, 1);
    }

    movingPiece.position = move.to;
    if (move.promotionType) movingPiece.type = move.promotionType;
    movingPiece.hasMoved = true;

    // Minimax with Alpha-Beta
    // Next turn is opponent (minimizing)
    const score = minimax(
      newBoard,
      depth - 1,
      alpha,
      beta,
      false,
      color,
      lastMove
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = {
        from: move.piece.position,
        to: move.to,
        promotionType: move.promotionType,
      };
    }

    alpha = Math.max(alpha, score);
    if (beta <= alpha) {
      break; // Beta Cutoff
    }
  }

  return { move: bestMove, score: bestScore };
};

const minimax = (
  board: Piece[],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  playerColor: Color,
  lastMove: LastMove | null
): number => {
  if (depth === 0) {
    return evaluateBoard(board, playerColor);
  }

  const turn = isMaximizing
    ? playerColor
    : playerColor === "white"
    ? "black"
    : "white";
  const pieces = board.filter((p) => p.color === turn);

  let bestScore = isMaximizing ? -Infinity : Infinity;
  let hasMoves = false;

  for (const piece of pieces) {
    const moves = getValidMoves(piece, board, lastMove);

    if (moves.length > 0) hasMoves = true;

    for (const to of moves) {
      const newBoard = cloneBoard(board);
      const movingPiece = newBoard.find((p) => p.id === piece.id)!;

      // Capture
      const captureIndex = newBoard.findIndex((p) =>
        isSamePosition(p.position, to)
      );
      if (captureIndex !== -1) newBoard.splice(captureIndex, 1);

      movingPiece.position = to;
      // Promotion
      if (movingPiece.type === "pawn" && (to.row === 0 || to.row === 7)) {
        movingPiece.type = "queen";
      }

      if (isMaximizing) {
        const score = minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          false,
          playerColor,
          null
        );
        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      } else {
        const score = minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          true,
          playerColor,
          null
        );
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
    }
    if (isMaximizing && beta <= alpha) break;
    if (!isMaximizing && beta <= alpha) break;
  }

  if (!hasMoves) {
    if (isCheck(board, turn)) {
      return isMaximizing ? -10000 - depth : 10000 + depth;
    }
    return 0;
  }

  return bestScore;
};
