import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const TheHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text1Op = interpolate(frame, [0, 15, 60, 75], [0, 1, 1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const op1 = interpolate(frame, [0, 15, 60, 75], [0, 1, 1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y1 = interpolate(frame, [0, 15], [20, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const op2 = interpolate(frame, [75, 90, 135, 150], [0, 1, 1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const y2 = interpolate(frame, [75, 90], [20, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill className="bg-gradient-hero flex items-center justify-center">
      <div 
        className="absolute text-8xl font-bold tracking-tighter text-white text-center"
        style={{ opacity: op1, transform: `translateY(${y1}px)`, fontFamily: "var(--font-display)" }}
      >
        <span>Africa's next </span><br/>
        <span className="italic" style={{ color: 'var(--color-brand-sky)' }}>scientist-leaders</span>
      </div>

      <div 
        className="absolute text-8xl font-bold tracking-tighter text-white"
        style={{ opacity: op2, transform: `translateY(${y2}px)`, fontFamily: "var(--font-display)" }}
      >
        start here.
      </div>
    </AbsoluteFill>
  );
};
