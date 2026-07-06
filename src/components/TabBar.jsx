import { C, sans } from "../theme.js";

const TABS = [
  { key: "judge", label: "判定" },
  { key: "history", label: "履歴" },
];

export default function TabBar({ tab, onChange, historyCount }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.line}`, marginBottom: 28 }}>
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            fontFamily: sans,
            fontSize: 13,
            padding: "10px 20px",
            background: "transparent",
            color: tab === t.key ? C.gosu : C.stone,
            border: "none",
            borderBottom: tab === t.key ? `2px solid ${C.gosu}` : "2px solid transparent",
            cursor: "pointer",
            marginBottom: -1,
          }}
        >
          {t.label}
          {t.key === "history" && historyCount > 0 ? `(${historyCount})` : ""}
        </button>
      ))}
    </div>
  );
}
