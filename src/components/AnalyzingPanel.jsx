import { C } from "../theme.js";
import GuideFrame from "./GuideFrame.jsx";

const STEPS = ["画像を読み込み中", "特徴量を抽出中", "等級モデルで判定中"];

export default function AnalyzingPanel({ imgSrc, step }) {
  return (
    <section style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div>
        <div style={{ position: "relative", width: 240, height: 240 }}>
          <img
            src={imgSrc}
            alt="解析対象の陶石"
            style={{ width: 240, height: 240, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.line}`, display: "block" }}
          />
          <GuideFrame />
        </div>
        <div style={{ fontSize: 11, color: C.stone, marginTop: 8 }}>
          点線の枠内が解析対象です。枠内に石が収まるように撮影してください。
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 240, paddingTop: 8 }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, opacity: i <= step ? 1 : 0.3, transition: "opacity 0.4s" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i < step ? C.gosu : i === step ? C.gosu : C.line,
                animation: i === step ? "pulse 1s ease-in-out infinite" : "none",
              }}
            />
            <span style={{ fontSize: 14 }}>{label}</span>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.5} }`}</style>
      </div>
    </section>
  );
}
