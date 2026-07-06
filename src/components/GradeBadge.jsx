import { C, serif } from "../theme.js";

export default function GradeBadge({ grade, score }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          border: `2.5px solid ${grade.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: serif,
          fontSize: grade.key.length > 2 ? 20 : 30,
          letterSpacing: "0.1em",
          color: grade.color,
          flexShrink: 0,
          writingMode: "vertical-rl",
        }}
      >
        {grade.key}
      </div>
      <div>
        <div style={{ fontSize: 12, color: C.stone, marginBottom: 4 }}>推定等級</div>
        <div style={{ fontFamily: serif, fontSize: 22, letterSpacing: "0.06em", color: grade.color, marginBottom: 4 }}>
          {grade.key}(総合 {score} 点)
        </div>
        <div style={{ fontSize: 13, color: "#4A4C50" }}>{grade.desc}</div>
      </div>
    </div>
  );
}
