"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface EvaluationBarProps {
  evaluation: number; // Positive for White advantage, Negative for Black
}

export default function EvaluationBar({ evaluation }: EvaluationBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Normalize evaluation to percentage (50% = 0 advantage)
  // Max advantage capped at +/- 1000 (mate) or say +/- 20 pawn units
  // Let's say 1 pawn = 10 units (from aiLogic).
  // Range: -200 to +200?
  // Let's clamp it.
  const MAX_EVAL = 300; // 30 pawns advantage
  const clampedEval = Math.max(-MAX_EVAL, Math.min(MAX_EVAL, evaluation));

  // White percentage:
  // 0 eval -> 50%
  // +300 eval -> 100%
  // -300 eval -> 0%
  const whitePercentage = Math.max(
    0,
    Math.min(100, ((clampedEval + MAX_EVAL) / (2 * MAX_EVAL)) * 100)
  );

  return (
    <div
      className={`flex md:flex-col items-center gap-2 z-40 ${
        isVisible ? "" : "opacity-50 hover:opacity-100"
      }`}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors shadow-lg text-xs md:text-sm"
        title="Toggle Evaluation Bar"
      >
        {isVisible ? "Hide" : "Eval"}
      </button>

      {isVisible && (
        <div
          className="relative bg-gray-800 border-2 border-gray-600 shadow-xl overflow-hidden
            w-full h-6 flex-row rounded-md
            md:w-6 md:h-64 md:flex-col md:rounded-full"
        >
          {/* Black Background is the container bg */}

          {/* White Bar */}
          {/* Mobile: Horizontal (Width) */}
          <motion.div
            className="block md:hidden h-full bg-white"
            initial={{ width: "50%" }}
            animate={{ width: `${whitePercentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          {/* Desktop: Vertical (Height from bottom) */}
          <motion.div
            className="hidden md:block w-full bg-white absolute bottom-0"
            initial={{ height: "50%" }}
            animate={{ height: `${whitePercentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          {/* Center Marker */}
          {/* Mobile: Vertical line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-500/50 md:hidden"></div>
          {/* Desktop: Horizontal line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-500/50"></div>
        </div>
      )}
    </div>
  );
}
