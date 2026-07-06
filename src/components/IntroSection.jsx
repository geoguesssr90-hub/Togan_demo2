import { serif } from "../theme.js";

export default function IntroSection() {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 8px" }}>
        熟練の選鉱眼を、次の世代へ。
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.9, color: "#4A4C50", maxWidth: 560, margin: 0 }}>
        陶石の写真を撮影するだけで、白色度・斑点・均一性を解析し等級を推定します。
        有田焼・波佐見焼を支える原料選別の技能を、データとして残すための試作品です。
      </p>
    </section>
  );
}
