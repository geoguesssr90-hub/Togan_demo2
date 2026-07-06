import { C, serif, sans } from "../theme.js";
import SpotOverlay from "./SpotOverlay.jsx";
import GuideFrame from "./GuideFrame.jsx";
import GradeBadge from "./GradeBadge.jsx";
import MetricGauge from "./MetricGauge.jsx";

export default function ResultPanel({ imgSrc, result, grade, showSpots, onToggleSpots, onReset }) {
  return (
    <section>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ position: "relative", width: 240, height: 240 }}>
            <img
              src={imgSrc}
              alt="解析した陶石"
              style={{ width: 240, height: 240, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.line}`, display: "block" }}
            />
            {showSpots && <SpotOverlay spots={result.spots} />}
            <GuideFrame />
          </div>
          <div style={{ fontSize: 11, color: C.stone, marginTop: 8 }}>
            点線の枠内が解析対象です。枠内に石が収まるように撮影してください。
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: C.stone, cursor: "pointer" }}>
            <input type="checkbox" checked={showSpots} onChange={(e) => onToggleSpots(e.target.checked)} />
            判定根拠(検出した斑点)を表示
          </label>
          <div style={{ fontSize: 11, color: C.stone, marginTop: 4 }}>
            検出した斑点: {result.spots.length} 件
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <GradeBadge grade={grade} score={result.score} />

          {result.metrics.map((m) => (
            <MetricGauge key={m.label} metric={m} />
          ))}

          <button
            onClick={onReset}
            style={{
              marginTop: 12,
              fontFamily: sans,
              fontSize: 13,
              padding: "10px 22px",
              background: C.gosu,
              color: "#fff",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            別の画像を判定する
          </button>
        </div>
      </div>

      <p style={{ marginTop: 32, fontSize: 11, color: C.stone, lineHeight: 1.8 }}>
        ※ 本デモは画像の輝度統計に基づく簡易解析です。実運用版では現場で収集した陶石画像と
        熟練者の等級判定データを教師とした機械学習モデルに置き換えます。
      </p>
    </section>
  );
}
