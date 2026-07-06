import { C, serif } from "../theme.js";

export default function Header() {
  return (
    <header style={{ borderBottom: `1px solid ${C.line}`, padding: "20px 24px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: serif, fontSize: 26, margin: 0, letterSpacing: "0.12em" }}>
          陶眼 <span style={{ fontSize: 13, color: C.stone, letterSpacing: "0.05em" }}>TŌGAN</span>
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: C.stone }}>天草陶石 AI選鉱システム(デモ版)</p>
      </div>
    </header>
  );
}
