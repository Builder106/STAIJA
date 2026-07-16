import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame, fps, config: { damping: 100 } });

  const textOp = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  const textY = spring({ frame: frame - 40, fps, config: { damping: 100 }, from: 20, to: 0 });

  return (
    <AbsoluteFill className="brand-surface flex flex-col items-center justify-center">
      
      <div style={{ opacity: logoOp, transform: `scale(${logoScale})`, marginBottom: '40px' }}>
        <div className="w-[400px] h-[400px] bg-gradient-brand flex items-center justify-center shadow-2xl" style={{ borderRadius: '40px' }}>
          <h1
            className="text-7xl font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            STAIJA
          </h1>
        </div>
      </div>

      <div 
        style={{ position: 'absolute', bottom: '150px', width: '100%', textAlign: 'center', opacity: textOp, transform: `translateY(${textY}px)` }}
      >
        <p className="text-[var(--color-ink)] text-3xl font-medium tracking-wide">Join the next generation.</p>
        <p className="text-gradient-brand text-4xl font-bold mt-2" style={{ fontFamily: "var(--font-display)" }}>staija.org</p>
      </div>

    </AbsoluteFill>
  );
};
