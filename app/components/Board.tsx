"use client";

import React from "react";
import { useGame } from "./GameContext";
import Piece from "./Piece";
import { PieceType } from "../types";
import { motion } from "framer-motion";

export default function Board() {
  const {
    boardState,
    playerColor,
    selectedPiece,
    possibleMoves,
    selectPiece,
    movePiece,
    gameStatus,
    turn,
    promotionPending,
    promotePawn,
    restartGame,
    check,
    lastMove,
    deselectPiece,
  } = useGame();

  const isPlayerBlack = playerColor === "black";
  const rows = [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];

  // If player is black, reverse rows/cols for display
  const displayRows = isPlayerBlack ? rows : [...rows].reverse();
  const displayCols = isPlayerBlack ? [...cols].reverse() : cols;

  const getPieceAt = (row: number, col: number) => {
    return boardState.find(
      (p) => p.position.row === row && p.position.col === col
    );
  };

  const isPossibleMove = (row: number, col: number) => {
    return possibleMoves.some((m) => m.row === row && m.col === col);
  };

  const handleSquareClick = (e: React.MouseEvent, row: number, col: number) => {
    e.stopPropagation(); // Prevent triggering background click

    if (gameStatus !== "playing") return;

    const piece = getPieceAt(row, col);

    // If clicking on a possible move for selected piece
    if (selectedPiece && isPossibleMove(row, col)) {
      movePiece({ row, col });
    } else {
      // Select piece if it belongs to current turn
      if (piece && piece.color === turn) {
        selectPiece(piece);
      } else {
        // Explicit deselection on invalid click
        deselectPiece();
      }
    }
  };

  const handleBackgroundClick = () => {
    // We need to deselect.
    // Since we can't pass null to selectPiece (type safety), we might need to cast or change type.
    // Or better, just select the currently selected piece again to toggle it off?
    if (selectedPiece) {
      selectPiece(selectedPiece); // This toggles it off in our Context logic!
    }
  };

  if (!playerColor) {
    return (
      <div className="w-[600px] h-[600px] bg-gray-200 animate-pulse rounded-lg"></div>
    );
  }

  return (
    <div className="flex flex-col items-center" onClick={handleBackgroundClick}>
      {/* Turn Indicator */}
      <div className="mb-4 text-xl font-bold text-[#800020]">
        {gameStatus === "playing" ? (
          <span>
            Tour : {turn === "white" ? "Blancs" : "Noirs"}{" "}
            {check && (
              <span className="text-red-600 animate-pulse"> (ECHEC)</span>
            )}
          </span>
        ) : (
          <span>Partie Terminée</span>
        )}
      </div>

      {/* Board Wrapper with Coordinates */}
      <div
        className="relative p-8 bg-[#3d2b2b] rounded-lg shadow-2xl flex justify-center items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rank Coordinates (Left) */}
        <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-around text-[#e0e0e0] font-bold">
          {displayRows.map((r) => (
            <span key={r}>{r + 1}</span>
          ))}
        </div>

        {/* File Coordinates (Bottom) */}
        <div className="absolute left-8 right-8 bottom-2 flex justify-around text-[#e0e0e0] font-bold">
          {displayCols.map((c) => (
            <span key={c}>{String.fromCharCode(97 + c)}</span>
          ))}
        </div>

        <div className="grid grid-cols-8 border-4 border-[#800020] relative bg-[#f0d9b5]">
          {displayRows.map((row) =>
            displayCols.map((col) => {
              // Fix Color Logic:
              // Standard chess: a1 (0,0) is black (dark).
              // (0+0)%2 = 0. So even is dark?
              // Let's check: a1 is black. b1 is white.
              // row 0, col 0 -> black.
              // row 0, col 1 -> white.
              // (0+1)%2 = 1 -> white.
              // So (row+col)%2 === 0 is DARK.
              const isDark = (row + col) % 2 !== 0; // Wait, standard is: a1 is dark?
              // Actually, bottom-left square is always DARK? No, "Light on Right".
              // Bottom-right (h1 for white) must be WHITE.
              // h1 is (0, 7). (0+7) = 7 (odd). So ODD is WHITE.
              // EVEN is DARK.
              // My previous logic: (row + col) % 2 !== 0 (Odd) was Dark?
              // Let's invert it.
              const isSquareDark = (row + col) % 2 === 0; // Even = Dark (Bordeaux)

              const piece = getPieceAt(row, col);
              const isSelected =
                selectedPiece?.position.row === row &&
                selectedPiece?.position.col === col;
              const isMove = isPossibleMove(row, col);

              const isLastMove =
                lastMove &&
                ((lastMove.from.row === row && lastMove.from.col === col) ||
                  (lastMove.to.row === row && lastMove.to.col === col));

              return (
                <div
                  key={`${row}-${col}`}
                  onClick={(e) => handleSquareClick(e, row, col)}
                  className={`w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center relative cursor-pointer
                    ${isSquareDark ? "bg-[#800020]" : "bg-[#f0d9b5]"}
                    ${
                      isLastMove
                        ? "after:absolute after:inset-0 after:bg-yellow-400/40"
                        : ""
                    }
                    ${
                      isSelected ? "ring-inset ring-4 ring-yellow-400 z-10" : ""
                    }
                    `}
                >
                  {/* Move Hint */}
                  {isMove && (
                    <div
                      className={`absolute rounded-full z-20 ${
                        piece
                          ? "w-full h-full border-4 border-gray-400 opacity-50 rounded-none"
                          : "w-4 h-4 bg-gray-400 opacity-50"
                      }`}
                    ></div>
                  )}

                  {piece && (
                    <motion.div
                      layoutId={`piece-${piece.id}`}
                      className="w-full h-full z-10 pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <Piece type={piece.type} color={piece.color} />
                    </motion.div>
                  )}
                </div>
              );
            })
          )}

          {/* Promotion Modal */}
          {promotionPending && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-xl flex gap-4">
                {(["queen", "rook", "bishop", "knight"] as PieceType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => promotePawn(type)}
                      className="w-16 h-16 hover:bg-gray-100 rounded p-2"
                    >
                      <Piece type={type} color={promotionPending.color} />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameStatus !== "playing" && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 text-white">
              <h2 className="text-4xl font-bold mb-4">
                {gameStatus === "checkmate"
                  ? turn === "white"
                    ? "Victoire des Noirs"
                    : "Victoire des Blancs"
                  : gameStatus === "stalemate"
                  ? "Pat (Match Nul)"
                  : gameStatus === "draw-repetition"
                  ? "Nulle par Répétition"
                  : gameStatus === "draw-50-moves"
                  ? "Nulle (50 coups)"
                  : "Match Nul"}
              </h2>
              <button
                onClick={restartGame}
                className="px-6 py-3 bg-[#800020] hover:bg-[#600018] rounded-lg font-bold transition-colors"
              >
                Rejouer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
