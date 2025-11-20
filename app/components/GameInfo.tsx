"use client";

import React, { useEffect, useRef } from "react";
import { MoveHistoryItem, CapturedPieces } from "../types";
import Piece from "./Piece";

interface GameInfoProps {
  history: MoveHistoryItem[];
  capturedPieces: CapturedPieces;
}

export default function GameInfo({ history, capturedPieces }: GameInfoProps) {
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="w-full md:w-80 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 flex flex-col gap-6 h-[600px]">
      {/* Captured Pieces */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-[#800020] border-b border-[#800020]/20 pb-2">
          Pièces Prises
        </h3>

        {/* White Captured (by Black) */}
        <div className="flex flex-wrap gap-1 min-h-[30px] bg-gray-100 p-2 rounded">
          {capturedPieces.white.map((type, i) => (
            <div key={i} className="w-6 h-6">
              <Piece type={type} color="white" />
            </div>
          ))}
          {capturedPieces.white.length === 0 && (
            <span className="text-xs text-gray-400">Aucune</span>
          )}
        </div>

        {/* Black Captured (by White) */}
        <div className="flex flex-wrap gap-1 min-h-[30px] bg-gray-800 p-2 rounded">
          {capturedPieces.black.map((type, i) => (
            <div key={i} className="w-6 h-6">
              <Piece type={type} color="black" />
            </div>
          ))}
          {capturedPieces.black.length === 0 && (
            <span className="text-xs text-gray-500">Aucune</span>
          )}
        </div>
      </div>

      {/* History */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="font-bold text-[#800020] border-b border-[#800020]/20 pb-2 mb-2">
          Historique
        </h3>
        <div className="overflow-y-auto flex-1 pr-2 space-y-1 font-mono text-sm">
          {history.reduce((rows: React.ReactNode[], move, index) => {
            if (index % 2 === 0) {
              // White move
              rows.push(
                <div
                  key={index}
                  className="grid grid-cols-[30px_1fr_1fr] gap-2 py-1 hover:bg-gray-100 rounded px-1"
                >
                  <span className="text-gray-500">
                    {Math.floor(index / 2) + 1}.
                  </span>
                  <span className="font-medium text-gray-800">
                    {move.notation}
                  </span>
                  {/* Placeholder for Black move if not yet made */}
                  <span></span>
                </div>
              );
            } else {
              // Black move - update the last row
              const lastRow = rows[rows.length - 1] as React.ReactElement;
              rows[rows.length - 1] = React.cloneElement(lastRow, {}, [
                lastRow.props.children[0],
                lastRow.props.children[1],
                <span key="black" className="font-medium text-gray-800">
                  {move.notation}
                </span>,
              ]);
            }
            return rows;
          }, [])}
          <div ref={historyEndRef} />
        </div>
      </div>
    </div>
  );
}
