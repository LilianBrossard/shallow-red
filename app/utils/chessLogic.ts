import { Piece, Position, Color, PieceType, LastMove, Move } from "../types";

// Helper to check if position is on board
export const isOnBoard = (pos: Position) =>
  pos.row >= 0 && pos.row <= 7 && pos.col >= 0 && pos.col <= 7;

// Helper to check if positions are equal
export const isSamePosition = (p1: Position, p2: Position) =>
  p1.row === p2.row && p1.col === p2.col;

// Helper to get piece at position
export const getPieceAt = (board: Piece[], pos: Position) =>
  board.find((p) => isSamePosition(p.position, pos));

// Deep copy board
export const cloneBoard = (board: Piece[]) =>
  board.map((p) => ({ ...p, position: { ...p.position } }));

// Generate a unique signature for the board state
// Includes: Piece positions/types/colors, Turn color.
// Ideally should include Castling Rights and En Passant target, but for now we'll stick to pieces + turn for simplicity
// unless we want strict FEN compliance.
// Let's make it robust enough for 3-fold repetition.
export const boardToSignature = (board: Piece[], turn: Color): string => {
  // Sort pieces to ensure consistent order
  const sortedPieces = [...board].sort((a, b) => {
    if (a.position.row !== b.position.row)
      return a.position.row - b.position.row;
    return a.position.col - b.position.col;
  });

  const pieceStr = sortedPieces
    .map((p) => `${p.color[0]}${p.type[0]}${p.position.row}${p.position.col}`)
    .join("|");
  return `${turn}:${pieceStr}`;
};

export const getPossibleMoves = (
  piece: Piece,
  board: Piece[],
  lastMove: LastMove | null
): Position[] => {
  const moves: Position[] = [];
  const { row, col } = piece.position;
  const direction = piece.color === "white" ? 1 : -1;

  const addMoveIfValid = (
    r: number,
    c: number,
    isCaptureOnly = false,
    isMoveOnly = false
  ) => {
    const targetPos = { row: r, col: c };
    if (!isOnBoard(targetPos)) return false;

    const targetPiece = getPieceAt(board, targetPos);

    if (isMoveOnly && targetPiece) return false; // Blocked
    if (isCaptureOnly && !targetPiece) return false; // Nothing to capture

    if (targetPiece) {
      if (targetPiece.color !== piece.color && !isMoveOnly) {
        moves.push(targetPos);
        return false; // Capture, but stop sliding (for sliding pieces)
      }
      return false; // Blocked by own piece or blocked in general
    }

    if (!isCaptureOnly) {
      moves.push(targetPos);
      return true; // Continue sliding
    }
    return false;
  };

  switch (piece.type) {
    case "pawn":
      // Forward 1
      if (addMoveIfValid(row + direction, col, false, true)) {
        // Forward 2 (initial)
        if (
          !piece.hasMoved &&
          ((piece.color === "white" && row === 1) ||
            (piece.color === "black" && row === 6))
        ) {
          addMoveIfValid(row + direction * 2, col, false, true);
        }
      }
      // Captures
      addMoveIfValid(row + direction, col - 1, true, false);
      addMoveIfValid(row + direction, col + 1, true, false);

      // En Passant
      if (lastMove && lastMove.piece.type === "pawn") {
        const isAdjacent =
          lastMove.to.row === row && Math.abs(lastMove.to.col - col) === 1;
        const isDoubleMove =
          Math.abs(lastMove.from.row - lastMove.to.row) === 2;
        if (isAdjacent && isDoubleMove) {
          moves.push({ row: row + direction, col: lastMove.to.col });
        }
      }
      break;

    case "rook":
      [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMoveIfValid(row + dr * i, col + dc * i)) break;
        }
      });
      break;

    case "knight":
      [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ].forEach(([dr, dc]) => addMoveIfValid(row + dr, col + dc));
      break;

    case "bishop":
      [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMoveIfValid(row + dr * i, col + dc * i)) break;
        }
      });
      break;

    case "queen":
      [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          if (!addMoveIfValid(row + dr * i, col + dc * i)) break;
        }
      });
      break;

    case "king":
      [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].forEach(([dr, dc]) => addMoveIfValid(row + dr, col + dc));

      // Castling
      if (!piece.hasMoved && !isCheck(board, piece.color)) {
        // Kingside
        const kingsideRook = getPieceAt(board, { row, col: 7 });
        if (
          kingsideRook &&
          kingsideRook.type === "rook" &&
          !kingsideRook.hasMoved
        ) {
          if (
            !getPieceAt(board, { row, col: 5 }) &&
            !getPieceAt(board, { row, col: 6 })
          ) {
            // Check if path is attacked
            if (
              !isSquareAttacked(board, { row, col: 5 }, piece.color) &&
              !isSquareAttacked(board, { row, col: 6 }, piece.color)
            ) {
              moves.push({ row, col: 6 });
            }
          }
        }
        // Queenside
        const queensideRook = getPieceAt(board, { row, col: 0 });
        if (
          queensideRook &&
          queensideRook.type === "rook" &&
          !queensideRook.hasMoved
        ) {
          if (
            !getPieceAt(board, { row, col: 1 }) &&
            !getPieceAt(board, { row, col: 2 }) &&
            !getPieceAt(board, { row, col: 3 })
          ) {
            // Check if path is attacked
            if (
              !isSquareAttacked(board, { row, col: 3 }, piece.color) &&
              !isSquareAttacked(board, { row, col: 2 }, piece.color)
            ) {
              moves.push({ row, col: 2 });
            }
          }
        }
      }
      break;
  }

  return moves;
};

export const isSquareAttacked = (
  board: Piece[],
  pos: Position,
  color: Color
): boolean => {
  const enemyColor = color === "white" ? "black" : "white";
  const enemyPieces = board.filter((p) => p.color === enemyColor);

  for (const enemy of enemyPieces) {
    const { row: r, col: c } = enemy.position;
    const dr = pos.row - r;
    const dc = pos.col - c;

    switch (enemy.type) {
      case "pawn":
        const dir = enemy.color === "white" ? 1 : -1;
        if (dr === dir && Math.abs(dc) === 1) return true;
        break;
      case "knight":
        if (
          (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
          (Math.abs(dr) === 1 && Math.abs(dc) === 2)
        )
          return true;
        break;
      case "king":
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
        break;
      // Sliding pieces
      case "rook":
      case "bishop":
      case "queen":
        if (enemy.type === "rook" && dr !== 0 && dc !== 0) break;
        if (enemy.type === "bishop" && Math.abs(dr) !== Math.abs(dc)) break;
        if (
          enemy.type === "queen" &&
          dr !== 0 &&
          dc !== 0 &&
          Math.abs(dr) !== Math.abs(dc)
        )
          break;

        // Check obstruction
        const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
        const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
        let currR = r + stepR;
        let currC = c + stepC;
        let blocked = false;
        while (currR !== pos.row || currC !== pos.col) {
          if (getPieceAt(board, { row: currR, col: currC })) {
            blocked = true;
            break;
          }
          currR += stepR;
          currC += stepC;
        }
        if (!blocked) return true;
        break;
    }
  }
  return false;
};

export const isCheck = (board: Piece[], color: Color): boolean => {
  const king = board.find((p) => p.type === "king" && p.color === color);
  if (!king) return false; // Should not happen
  return isSquareAttacked(board, king.position, color);
};

export const getValidMoves = (
  piece: Piece,
  board: Piece[],
  lastMove: LastMove | null
): Position[] => {
  const pseudoMoves = getPossibleMoves(piece, board, lastMove);
  return pseudoMoves.filter((move) => {
    // Simulate move
    const newBoard = cloneBoard(board);
    const movingPiece = newBoard.find((p) => p.id === piece.id)!;

    // Handle capture
    let capturedIndex = newBoard.findIndex((p) =>
      isSamePosition(p.position, move)
    );

    // Handle En Passant capture
    if (
      piece.type === "pawn" &&
      !capturedIndex &&
      move.col !== piece.position.col
    ) {
      // If moving diagonally to empty square, it's en passant
      const capturedPawnRow =
        piece.color === "white" ? move.row - 1 : move.row + 1;
      capturedIndex = newBoard.findIndex(
        (p) => p.position.row === capturedPawnRow && p.position.col === move.col
      );
    }

    if (capturedIndex !== -1) {
      newBoard.splice(capturedIndex, 1);
    }

    movingPiece.position = move;

    return !isCheck(newBoard, piece.color);
  });
};

export const isCheckmate = (
  board: Piece[],
  color: Color,
  lastMove: LastMove | null
): boolean => {
  if (!isCheck(board, color)) return false;

  const pieces = board.filter((p) => p.color === color);
  for (const piece of pieces) {
    if (getValidMoves(piece, board, lastMove).length > 0) return false;
  }
  return true;
};

export const isStalemate = (
  board: Piece[],
  color: Color,
  lastMove: LastMove | null
): boolean => {
  if (isCheck(board, color)) return false;
  const pieces = board.filter((p) => p.color === color);
  for (const piece of pieces) {
    if (getValidMoves(piece, board, lastMove).length > 0) return false;
  }
  return true;
};

export const getAlgebraicNotation = (
  piece: Piece,
  from: Position,
  to: Position,
  isCapture: boolean,
  isCheck: boolean,
  isCheckmate: boolean,
  board: Piece[], // Board BEFORE move to check for ambiguity (simplified for now)
  promotionType?: PieceType
): string => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];

  // Basic notation
  let notation = "";

  if (piece.type === "pawn") {
    if (isCapture) {
      notation += files[from.col];
      notation += "x";
    }
  } else {
    switch (piece.type) {
      case "rook":
        notation += "R";
        break;
      case "knight":
        notation += "N";
        break;
      case "bishop":
        notation += "B";
        break;
      case "queen":
        notation += "Q";
        break;
      case "king":
        notation += "K";
        break;
    }
    if (isCapture) notation += "x";
  }

  notation += files[to.col] + ranks[to.row];

  if (promotionType) {
    notation +=
      "=" +
      (promotionType === "knight"
        ? "N"
        : promotionType.charAt(0).toUpperCase());
  }

  if (isCheckmate) notation += "#";
  else if (isCheck) notation += "+";

  return notation;
};
