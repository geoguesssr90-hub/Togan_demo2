import { ANALYSIS_CROP_RATIO } from "../lib/imageAnalysis.js";
import { C } from "../theme.js";

// 解析対象範囲(中央クロップ領域)を示す点線の枠。
// position:relative な画像コンテナの中に置いて使う。
export default function GuideFrame() {
  const insetPct = ((1 - ANALYSIS_CROP_RATIO) / 2) * 100;
  return (
    <div
      style={{
        position: "absolute",
        inset: `${insetPct}%`,
        border: `2px dashed ${C.gosu}`,
        // 暗い石の上でも枠線が識別できるよう白の縁取りを重ねる
        boxShadow: "0 0 0 1.5px rgba(255,255,255,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.75)",
        borderRadius: 2,
        pointerEvents: "none",
      }}
    />
  );
}
