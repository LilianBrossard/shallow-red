"use client";

import Board from "./components/Board";
import { GameProvider, useGame } from "./components/GameContext";
import EvaluationBar from "./components/EvaluationBar";
import GameInfo from "./components/GameInfo";

function GameContent() {
  const { evaluation, history, capturedPieces } = useGame();

  return (
    <main className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center p-4 md:flex-row md:gap-8">
      {/* Desktop: Left. Mobile: Top (but we want below board, so we'll use order or just move it) */}
      {/* Actually, let's put it inside the center column for mobile, or use order-last on mobile? */}
      {/* User said "below the board". */}

      {/* Desktop Wrapper for Eval Bar */}
      <div className="hidden md:block">
        <EvaluationBar evaluation={evaluation} />
      </div>

      <div className="flex flex-col items-center gap-4 w-full md:w-auto">
        <h1 className="text-4xl font-bold text-[#800020] font-serif">
          Shallow Red
        </h1>
        <Board />

        {/* Mobile Wrapper for Eval Bar */}
        <div className="md:hidden w-full px-4">
          <EvaluationBar evaluation={evaluation} />
        </div>
      </div>

      <GameInfo history={history} capturedPieces={capturedPieces} />
    </main>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
