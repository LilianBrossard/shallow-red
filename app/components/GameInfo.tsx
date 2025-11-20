"use client";

import React, { useEffect, useRef } from "react";
import { MoveHistoryItem, CapturedPieces } from "../types";
import Piece from "./Piece";

interface GameInfoProps {
  history: MoveHistoryItem[];
  capturedPieces: CapturedPieces;
}

export default function GameInfo({ history, capturedPieces }: GameInfoProps) {
  const historyContainerRef = useRef<HTMLDivElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop =
        historyContainerRef.current.scrollHeight;
    }
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
        <div
          ref={historyContainerRef}
          className="overflow-y-auto flex-1 pr-2 space-y-1 font-mono text-sm"
        >
          {(() => {
            const rows: React.ReactNode[] = [];
            for (let i = 0; i < history.length; i += 2) {
              const whiteMove = history[i];
              const blackMove = history[i + 1];
              rows.push(
                <div
                  key={i}
                  className="grid grid-cols-[30px_1fr_1fr] gap-2 py-1 hover:bg-gray-100 rounded px-1"
                >
                  <span className="text-gray-500">
                    {Math.floor(i / 2) + 1}.
                  </span>
                  <span className="font-medium text-gray-800">
                    {whiteMove.notation}
                  </span>
                  {blackMove ? (
                    <span className="font-medium text-gray-800">
                      {blackMove.notation}
                    </span>
                  ) : (
                    <span></span>
                  )}
                </div>
              );
            }
            return rows;
          })()}
          <div ref={historyEndRef} />
        </div>
      </div>
    </div>
  );
}
