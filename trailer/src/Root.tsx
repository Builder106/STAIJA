import "./index.css";
import { Composition } from "remotion";
import { loadFont as loadIBMPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { MyComposition } from "./Composition";

loadIBMPlexSans();
loadIBMPlexMono();
loadInter();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StaijaTrailer"
        component={MyComposition}
        durationInFrames={1080}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
