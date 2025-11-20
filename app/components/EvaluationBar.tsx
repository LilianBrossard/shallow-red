"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Color } from "../types";

interface EvaluationBarProps {
  scores: { white: number; black: number };
  playerColor: Color | null;
}

export default function EvaluationBar({
  scores,
  playerColor,
}: EvaluationBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  const totalScore = Math.max(1, scores.white + scores.black); // Avoid division by zero

  // Calculate percentage for the "active" color (bottom/left)
  // If player is Black, we show Black's percentage from bottom/left.
  // If player is White (or null), we show White's percentage from bottom/left.

  const isInverted = playerColor === "black";
  const relevantScore = isInverted ? scores.black : scores.white;
  const percentage = Math.min(
    100,
    Math.max(0, (relevantScore / totalScore) * 100)
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
          {/* Container Background represents the OPPONENT's color (top/right) */}
          {/* If inverted (Black player), background is White. If normal (White player), background is Black. */}
          <div
            className={`absolute inset-0 ${
              isInverted ? "bg-white" : "bg-black"
            }`}
          ></div>

          {/* Bar represents the PLAYER's color (bottom/left) */}
          {/* If inverted (Black player), bar is Black. If normal (White player), bar is White. */}

          {/* Mobile: Horizontal (Width) */}
          <motion.div
            className={`block md:hidden h-full ${
              isInverted ? "bg-black" : "bg-white"
            }`}
            initial={{ width: "50%" }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          {/* Desktop: Vertical (Height from bottom) */}
          <motion.div
            className={`hidden md:block w-full absolute bottom-0 ${
              isInverted ? "bg-black" : "bg-white"
            }`}
            initial={{ height: "50%" }}
            animate={{ height: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          {/* Center Marker */}
          {/* Mobile: Vertical line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-500/50 md:hidden mix-blend-difference"></div>
          {/* Desktop: Horizontal line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-500/50 mix-blend-difference"></div>
        </div>
      )}
    </div>
  );
}
