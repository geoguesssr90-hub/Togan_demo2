import { C, serif } from "../theme.js";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default function HistoryPanel({ history }) {
  if (history.length === 0) {
    return (
      <section>
        <p style={{ fontSize: 13, color: C.stone }}>まだ判定履歴がありません。</p>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {history.map((h) => (
        <div
          key={h.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 16px",
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 4,
          }}
        >
          <img
            src={h.imgSrc}
            alt="判定した陶石のサムネイル"
            style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 3, border: `1px solid ${C.line}`, flexShrink: 0 }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `2px solid ${h.grade.color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: serif,
              fontSize: h.grade.key.length > 2 ? 12 : 16,
              letterSpacing: "0.05em",
              color: h.grade.color,
              flexShrink: 0,
              writingMode: "vertical-rl",
            }}
          >
            {h.grade.key}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: serif, fontSize: 15, letterSpacing: "0.04em", color: h.grade.color }}>
              {h.grade.key}(総合 {h.score} 点)
            </div>
            <div style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>
              {dateFormatter.format(h.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
