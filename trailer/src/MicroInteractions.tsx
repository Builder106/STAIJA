import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const MicroInteractions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- Phase A (0–120): two real program pages, cursor picks StepUp ----
  const headIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const card1In = spring({ frame, fps, config: { damping: 100 } });
  const card2In = spring({ frame: frame - 8, fps, config: { damping: 100 } });

  // Cursor glides onto the StepUp card, "clicks" at frame 78
  const cursorX = interpolate(frame, [25, 70], [420, -330], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const cursorY = interpolate(frame, [25, 70], [380, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const clicked = frame >= 78;
  const clickDip = spring({ frame: frame - 78, fps, config: { stiffness: 200, damping: 10 } });
  const pickScale = 1 + (clicked ? clickDip * 0.03 - 0.02 : 0);
  const dimOther = interpolate(frame, [78, 92], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const phaseAOut = interpolate(frame, [108, 122], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phaseAScale = interpolate(frame, [108, 122], [1, 0.92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- Phase B (115–210): submit application (overlaps the card fade-out) ----
  const btnIn = spring({ frame: frame - 115, fps, config: { damping: 100 } });
  const btnClick = spring({ frame: frame - 170, fps, config: { stiffness: 200, damping: 10 } });
  const btnScale = btnIn - btnClick * 0.1;
  const btnOut = interpolate(frame, [196, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- Phase C (210–300): mentor matching ----
  const matchIn = interpolate(frame, [210, 225], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const leftX = spring({ frame: frame - 225, fps, config: { damping: 100 }, from: -300, to: -60 });
  const rightX = spring({ frame: frame - 225, fps, config: { damping: 100 }, from: 300, to: 60 });
  const sparkScale = spring({ frame: frame - 255, fps, config: { damping: 12 } });
  const outOp = interpolate(frame, [285, 300], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill className="brand-surface flex items-center justify-center">

      {/* Phase A: real program pages */}
      {frame < 125 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ opacity: phaseAOut, transform: `scale(${phaseAScale})` }}>
          <div className="text-center mb-12" style={{ opacity: headIn }}>
            <div className="text-xl font-medium tracking-[0.35em] mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--color-brand-violet)" }}>
              OUR PROGRAMS
            </div>
            <div className="text-5xl font-bold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
              Two paths to accelerated impact.
            </div>
          </div>

          <div className="flex items-center justify-center gap-16">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border-4"
              style={{
                transform: `scale(${card1In * pickScale})`,
                borderColor: clicked ? "var(--color-brand-violet)" : "rgba(255,255,255,0.6)",
              }}
            >
              <Img src={staticFile("staija_stepup.png")} className="w-[620px] h-auto" />
            </div>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/60"
              style={{ transform: `scale(${card2In})`, opacity: dimOther }}
            >
              <Img src={staticFile("staija_dynamerge.png")} className="w-[620px] h-auto" />
            </div>
          </div>

          {/* Cursor */}
          <div
            className="absolute bg-white/90 w-8 h-8 rounded-full shadow-lg border border-black/10"
            style={{
              top: "50%", left: "50%",
              transform: `translate(${cursorX}px, ${cursorY}px) scale(${clicked && frame < 90 ? 0.8 : 1})`,
              zIndex: 30,
            }}
          />
        </div>
      )}

      {/* Phase B: submit application */}
      {frame >= 115 && frame < 210 && (
        <div style={{ transform: `scale(${btnScale})`, opacity: btnOut }}>
          <div className="bg-gradient-brand text-white text-5xl font-bold py-8 px-16 rounded-[var(--radius-2xl)] shadow-2xl">
            {frame < 175 ? "Submit Application" : "Application Received!"}
          </div>
          <div
            className="absolute bg-white/80 w-8 h-8 rounded-full shadow-lg"
            style={{
              top: "80%", left: "80%",
              transform: `translate(${interpolate(frame, [115, 160], [200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px, ${interpolate(frame, [115, 160], [200, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px) scale(${frame > 170 && frame < 180 ? 0.8 : 1})`,
            }}
          />
        </div>
      )}

      {/* Phase C: mentor matching */}
      {frame >= 210 && (
        <div style={{ opacity: matchIn * outOp }} className="relative flex items-center justify-center w-full h-full">

          <div className="absolute text-center" style={{ transform: `translateX(${leftX}px)` }}>
            <div className="w-48 h-48 rounded-full bg-indigo-500 border-4 border-[var(--color-paper)] shadow-2xl flex items-center justify-center text-white text-6xl font-bold">
              S
            </div>
            <div className="text-[var(--color-ink)] text-2xl font-bold mt-4">Scholar</div>
          </div>

          <div className="absolute text-center" style={{ transform: `translateX(${rightX}px)` }}>
            <div className="w-48 h-48 rounded-full bg-emerald-500 border-4 border-[var(--color-paper)] shadow-2xl flex items-center justify-center text-white text-6xl font-bold">
              M
            </div>
            <div className="text-[var(--color-ink)] text-2xl font-bold mt-4">Mentor</div>
          </div>

          <div
            className="absolute z-10"
            style={{ transform: `scale(${sparkScale})`, top: "23%" }}
          >
            <div className="bg-[var(--color-surface)] text-gradient-brand text-4xl font-black py-4 px-8 rounded-[var(--radius-xl)] shadow-2xl rotate-12" style={{ fontFamily: "var(--font-display)" }}>
              MATCHED! ⚡️
            </div>
          </div>

        </div>
      )}

    </AbsoluteFill>
  );
};
