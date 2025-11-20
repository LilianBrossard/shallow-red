"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Color,
  Piece,
  INITIAL_BOARD_STATE,
  Position,
  GameStatus,
  LastMove,
  PieceType,
  MoveHistoryItem,
  CapturedPieces,
} from "../types";
import {
  getValidMoves,
  isCheckmate,
  isStalemate,
  isCheck,
  boardToSignature,
} from "../utils/chessLogic";

interface PromotionPending {
  from: Position;
  to: Position;
  color: Color;
}

interface GameContextType {
  playerColor: Color | null;
  turn: Color;
  boardState: Piece[];
  selectedPiece: Piece | null;
  possibleMoves: Position[];
  gameStatus: GameStatus;
  lastMove: LastMove | null;
  promotionPending: PromotionPending | null;
  check: boolean;
  history: MoveHistoryItem[];
  capturedPieces: CapturedPieces;
  evaluation: number;
  scores: { white: number; black: number };
  selectPiece: (piece: Piece) => void;
  deselectPiece: () => void;
  movePiece: (to: Position) => void;
  promotePawn: (type: PieceType) => void;
  restartGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [turn, setTurn] = useState<Color>("white");
  const [boardState, setBoardState] = useState<Piece[]>(INITIAL_BOARD_STATE);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [promotionPending, setPromotionPending] =
    useState<PromotionPending | null>(null);
  const [check, setCheck] = useState<boolean>(false);
  const [history, setHistory] = useState<MoveHistoryItem[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    white: [],
    black: [],
  });
  const [evaluation, setEvaluation] = useState<number>(0);
  const [scores, setScores] = useState<{ white: number; black: number }>({
    white: 0,
    black: 0,
  });

  // Draw Rules State
  const [halfMoveClock, setHalfMoveClock] = useState<number>(0);
  const [positionHistory, setPositionHistory] = useState<string[]>([]);

  useEffect(() => {
    const randomColor = Math.random() < 0.5 ? "white" : "black";
    setPlayerColor(randomColor);
    // Initialize history with starting position
    setPositionHistory([boardToSignature(INITIAL_BOARD_STATE, "white")]);

    // Initial score calculation
    import("../utils/aiLogic").then(({ getBoardScores, evaluateBoard }) => {
      setScores(getBoardScores(INITIAL_BOARD_STATE));
      setEvaluation(evaluateBoard(INITIAL_BOARD_STATE, "white"));
    });
  }, []);

  // AI Turn Effect
  useEffect(() => {
    if (gameStatus !== "playing") return;

    // If it's AI's turn (turn !== playerColor) and playerColor is set
    if (playerColor && turn !== playerColor) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500); // Delay for realism
      return () => clearTimeout(timer);
    }
  }, [turn, gameStatus, playerColor, boardState]);

  const makeAIMove = async () => {
    // Dynamic import to avoid circular dependencies
    const { getBestMove } = await import("../utils/aiLogic");

    // AI is always the opposite of playerColor
    const aiColor = playerColor === "white" ? "black" : "white";

    // Calculate Dynamic Depth
    const pieceCount = boardState.length;
    let depth = 4;
    if (pieceCount <= 8) depth = 6;
    else if (pieceCount <= 12) depth = 5;

    // Execute AI Move
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { move } = getBestMove(boardState, aiColor, depth, lastMove);

    if (move) {
      const piece = boardState.find(
        (p) =>
          p.position.row === move.from.row && p.position.col === move.from.col
      );
      if (piece) {
        executeMove(piece, move.to, move.promotionType);
      }
    }
  };

  const selectPiece = (piece: Piece) => {
    if (gameStatus !== "playing") return;

    // RESTRICTION: Player can only select their own pieces
    if (playerColor && piece.color !== playerColor) return;

    if (piece.color !== turn) return; // Can only select active color

    if (selectedPiece && selectedPiece.id === piece.id) {
      setSelectedPiece(null);
      setPossibleMoves([]);
      return;
    }

    setSelectedPiece(piece);
    const moves = getValidMoves(piece, boardState, lastMove);
    setPossibleMoves(moves);
  };

  const movePiece = (to: Position) => {
    if (!selectedPiece || gameStatus !== "playing") return;

    // Check if move is valid
    const isValid = possibleMoves.some(
      (m) => m.row === to.row && m.col === to.col
    );
    if (!isValid) return;

    // Check for promotion
    if (selectedPiece.type === "pawn") {
      const promotionRow = selectedPiece.color === "white" ? 7 : 0;
      if (to.row === promotionRow) {
        setPromotionPending({
          from: selectedPiece.position,
          to,
          color: selectedPiece.color,
        });
        return;
      }
    }

    executeMove(selectedPiece, to);
  };

  const executeMove = async (
    piece: Piece,
    to: Position,
    promotionType?: PieceType
  ) => {
    const newBoard = boardState.map((p) => ({ ...p })); // Shallow copy of pieces
    const movingPieceIndex = newBoard.findIndex((p) => p.id === piece.id);
    if (movingPieceIndex === -1) return;

    const movingPiece = newBoard[movingPieceIndex];
    const from = movingPiece.position;

    // Handle Capture
    let captureIndex = newBoard.findIndex(
      (p) => p.position.row === to.row && p.position.col === to.col
    );

    // Handle En Passant Capture
    let isEnPassant = false;
    if (piece.type === "pawn" && captureIndex === -1 && to.col !== from.col) {
      // Captured pawn is at {row: from.row, col: to.col}
      captureIndex = newBoard.findIndex(
        (p) => p.position.row === from.row && p.position.col === to.col
      );
      isEnPassant = true;
    }

    let capturedPieceType: PieceType | null = null;
    if (captureIndex !== -1) {
      capturedPieceType = newBoard[captureIndex].type;
      newBoard.splice(captureIndex, 1);
    }

    // Handle Castling
    if (piece.type === "king" && Math.abs(to.col - from.col) === 2) {
      const isKingSide = to.col > from.col;
      const rookCol = isKingSide ? 7 : 0;
      const rookTargetCol = isKingSide ? 5 : 3;
      const rookRow = from.row;

      const rookIndex = newBoard.findIndex(
        (p) =>
          p.type === "rook" &&
          p.position.row === rookRow &&
          p.position.col === rookCol
      );
      if (rookIndex !== -1) {
        newBoard[rookIndex].position = { row: rookRow, col: rookTargetCol };
        newBoard[rookIndex].hasMoved = true;
      }
    }

    // Update moving piece
    const updatedMovingPieceIndex = newBoard.findIndex(
      (p) => p.id === piece.id
    );
    newBoard[updatedMovingPieceIndex].position = to;
    newBoard[updatedMovingPieceIndex].hasMoved = true;

    if (promotionType) {
      newBoard[updatedMovingPieceIndex].type = promotionType;
    }

    // Update Draw Logic State (Half-Move Clock)
    let newHalfMoveClock = halfMoveClock + 1;
    if (piece.type === "pawn" || capturedPieceType) {
      newHalfMoveClock = 0;
    }
    setHalfMoveClock(newHalfMoveClock);

    // Check Game Status
    const nextTurn = turn === "white" ? "black" : "white";
    const isCheckVal = isCheck(newBoard, nextTurn);
    let isCheckmateVal = false;
    let newGameStatus: GameStatus = "playing";

    // 1. Checkmate / Stalemate
    if (isCheckmate(newBoard, nextTurn, { piece: movingPiece, from, to })) {
      newGameStatus = "checkmate";
      isCheckmateVal = true;
    } else if (
      isStalemate(newBoard, nextTurn, { piece: movingPiece, from, to })
    ) {
      newGameStatus = "stalemate";
    }

    // 2. 50-Move Rule
    if (newGameStatus === "playing" && newHalfMoveClock >= 100) {
      newGameStatus = "draw-50-moves";
    }

    // 3. Threefold Repetition
    const newSignature = boardToSignature(newBoard, nextTurn);
    // We need to check against history + current newSignature
    // Note: positionHistory state update is async, so we use local variable logic
    const occurrences = positionHistory.filter(
      (sig) => sig === newSignature
    ).length;
    if (newGameStatus === "playing" && occurrences >= 2) {
      // 2 previous + 1 current = 3
      newGameStatus = "draw-repetition";
    }

    setGameStatus(newGameStatus);
    setCheck(isCheckVal);
    setBoardState(newBoard);
    setLastMove({ piece: movingPiece, from, to });
    setSelectedPiece(null);
    setPossibleMoves([]);
    setPromotionPending(null);
    setTurn(nextTurn);
    setPositionHistory((prev) => [...prev, newSignature]);

    // Update History
    const { getAlgebraicNotation } = await import("../utils/chessLogic");
    const notation = getAlgebraicNotation(
      piece,
      from,
      to,
      !!capturedPieceType,
      isCheckVal,
      isCheckmateVal,
      boardState, // Use original board for ambiguity check (simplified)
      promotionType
    );

    setHistory((prev) => [
      ...prev,
      {
        piece: { ...piece, type: promotionType || piece.type }, // Store final piece state
        from,
        to,
        notation,
        isCapture: !!capturedPieceType,
        isCheck: isCheckVal,
        isCheckmate: isCheckmateVal,
        turn,
      },
    ]);

    // Update Captured Pieces
    if (capturedPieceType) {
      setCapturedPieces((prev) => ({
        ...prev,
        [turn]: [...prev[turn], capturedPieceType!],
      }));
    }

    // Update Evaluation
    const { evaluateBoard, getBoardScores } = await import("../utils/aiLogic");
    const score = evaluateBoard(newBoard, "white");
    const boardScores = getBoardScores(newBoard);
    setEvaluation(score);
    setScores(boardScores);
  };

  const promotePawn = (type: PieceType) => {
    if (!promotionPending || !selectedPiece) return;
    executeMove(selectedPiece, promotionPending.to, type);
  };

  const restartGame = () => {
    setBoardState(INITIAL_BOARD_STATE);
    setTurn("white");
    setGameStatus("playing");
    setLastMove(null);
    setSelectedPiece(null);
    setPossibleMoves([]);
    setPromotionPending(null);
    setCheck(false);
    setHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setEvaluation(0);
    setScores({ white: 0, black: 0 }); // Reset scores
    setHalfMoveClock(0);
    setPositionHistory([boardToSignature(INITIAL_BOARD_STATE, "white")]);

    const randomColor = Math.random() < 0.5 ? "white" : "black";
    setPlayerColor(randomColor);

    // Recalculate initial scores
    import("../utils/aiLogic").then(({ getBoardScores, evaluateBoard }) => {
      setScores(getBoardScores(INITIAL_BOARD_STATE));
      setEvaluation(evaluateBoard(INITIAL_BOARD_STATE, "white"));
    });
  };

  return (
    <GameContext.Provider
      value={{
        playerColor,
        turn,
        boardState,
        selectedPiece,
        possibleMoves,
        gameStatus,
        lastMove,
        promotionPending,
        check,
        history,
        capturedPieces,
        evaluation,
        scores, // Expose scores
        selectPiece,
        deselectPiece: () => {
          setSelectedPiece(null);
          setPossibleMoves([]);
        },
        movePiece,
        promotePawn,
        restartGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
