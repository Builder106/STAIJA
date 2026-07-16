import { Sequence, Audio, interpolate, staticFile } from "remotion";
import { TheHook } from "./TheHook";
import { Mission } from "./Mission";
import { TheSolution } from "./TheSolution";
import { MicroInteractions } from "./MicroInteractions";
import { TheClimax } from "./TheClimax";
import { Outro } from "./Outro";
import "./index.css";

export const MyComposition = () => {
  return (
    <>
      {/* Music bed: Kevin MacLeod — "Wholesome" (incompetech.com), CC BY 4.0 */}
      <Audio
        src={staticFile("audio.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 1010, 1075], [0, 0.55, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* UI sound effects, frame-aligned to the on-screen beats */}
      <Sequence from={450}>
        <Audio src={staticFile("sfx_whoosh.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={558}>
        <Audio src={staticFile("sfx_click.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={650}>
        <Audio src={staticFile("sfx_click.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={735}>
        <Audio src={staticFile("sfx_chime.wav")} volume={0.45} />
      </Sequence>

      <Sequence from={0} durationInFrames={150}>
        <TheHook />
      </Sequence>
      <Sequence from={150} durationInFrames={120}>
        <Mission />
      </Sequence>
      <Sequence from={270} durationInFrames={210}>
        <TheSolution />
      </Sequence>
      <Sequence from={480} durationInFrames={300}>
        <MicroInteractions />
      </Sequence>
      <Sequence from={780} durationInFrames={150}>
        <TheClimax />
      </Sequence>
      <Sequence from={930} durationInFrames={150}>
        <Outro />
      </Sequence>
    </>
  );
};
