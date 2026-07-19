import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const TheSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The 60-frame Blender sequence is a seamless 360° loop (front → back → front),
  // so cycle it at half speed for a continuous slow rotation across the scene.
  const phoneFrame = (Math.floor(frame / 2) % 60) + 1;
  const paddedFrame = String(phoneFrame).padStart(4, "0");
  const phoneSrc = staticFile(`staija_phone_${paddedFrame}.png`);

  const phoneScale = spring({ frame, fps, config: { damping: 100 } });
  
  // Floating cards
  const card1Op = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });
  const card1Y = spring({ frame: frame - 30, fps, config: { damping: 100 }, from: 50, to: 0 });

  const card2Op = interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" });
  const card2Y = spring({ frame: frame - 60, fps, config: { damping: 100 }, from: 50, to: 0 });

  const card3Op = interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp" });
  const card3Y = spring({ frame: frame - 90, fps, config: { damping: 100 }, from: 50, to: 0 });

  // Exit: cards get sucked into the phone, then the phone shrinks away
  const suck = interpolate(frame, [175, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const phoneExit = interpolate(frame, [195, 210], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const glowOp = interpolate(frame, [190, 210], [0.2, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill className="brand-surface flex items-center justify-center overflow-hidden">

      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-[var(--color-brand-violet)] to-[var(--color-brand-sky)] blur-[120px] rounded-full z-0" style={{ opacity: glowOp }} />

      {/* 3D Phone Render */}
      <div style={{ transform: `scale(${phoneScale * phoneExit})`, zIndex: 10 }}>
        <Img src={phoneSrc} className="w-[820px] h-auto drop-shadow-2xl" />
      </div>

      {/* Floating Cards */}
      <div
        className="absolute left-[15%] top-[15%] bg-white/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/60 shadow-2xl min-w-[360px] overflow-hidden"
        style={{ opacity: card1Op, transform: `translate(${suck * 452}px, ${card1Y + suck * 293}px) scale(${1 - suck})`, zIndex: 20 }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand opacity-80" />
        <h2 className="text-5xl font-bold text-gradient-brand" style={{ fontFamily: "var(--font-display)" }}>Apply.</h2>
        <p className="opacity-80 text-2xl mt-3 font-[family-name:var(--font-sans)] text-[var(--color-ink)] font-medium">Frictionless entry.</p>
      </div>

      <div 
        className="absolute right-[12%] top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/60 shadow-2xl min-w-[360px] overflow-hidden"
        style={{ opacity: card2Op, transform: `translate(${suck * -510}px, ${card2Y}px) scale(${1 - suck})`, zIndex: 20 }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand opacity-80" />
        <h2 className="text-5xl font-bold text-gradient-brand" style={{ fontFamily: "var(--font-display)" }}>Learn.</h2>
        <p className="opacity-80 text-2xl mt-3 font-[family-name:var(--font-sans)] text-[var(--color-ink)] font-medium">World-class LMS.</p>
      </div>

      <div 
        className="absolute left-[20%] bottom-[15%] bg-white/60 backdrop-blur-2xl p-10 rounded-3xl border border-white/60 shadow-2xl min-w-[360px] overflow-hidden"
        style={{ opacity: card3Op, transform: `translate(${suck * 356}px, ${card3Y + suck * -293}px) scale(${1 - suck})`, zIndex: 20 }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand opacity-80" />
        <h2 className="text-5xl font-bold text-gradient-brand" style={{ fontFamily: "var(--font-display)" }}>Lead.</h2>
        <p className="opacity-80 text-2xl mt-3 font-[family-name:var(--font-sans)] text-[var(--color-ink)] font-medium">Mentorship powered.</p>
      </div>

    </AbsoluteFill>
  );
};
