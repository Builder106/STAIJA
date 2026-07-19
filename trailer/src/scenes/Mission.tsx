import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const lineStyle = (frame: number, start: number) => ({
  opacity: interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  transform: `translateY(${interpolate(frame, [start, start + 12], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
});

export const Mission: React.FC = () => {
  const frame = useCurrentFrame();

  const eyebrowOp = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill className="flex flex-col items-center justify-center" style={{ backgroundColor: "#0B0E12" }}>
      <div
        className="text-2xl font-medium tracking-[0.35em] mb-12"
        style={{ opacity: eyebrowOp, fontFamily: "var(--font-mono)", color: "var(--color-brand-violet)" }}
      >
        OUR MISSION
      </div>

      <div className="text-center" style={{ fontFamily: "var(--font-display)" }}>
        <p className="text-7xl italic font-medium text-white" style={lineStyle(frame, 12)}>
          Talent is evenly distributed.
        </p>
        <p className="text-7xl italic font-medium text-white mt-4" style={lineStyle(frame, 34)}>
          Opportunity is not.
        </p>
        <p className="text-6xl font-bold text-gradient-brand mt-14" style={lineStyle(frame, 62)}>
          We're here to balance the equation.
        </p>
      </div>
    </AbsoluteFill>
  );
};
