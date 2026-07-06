import { C } from "../theme.js";

export default function MetricGauge({ metric }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span>
          {metric.label}
          <span style={{ color: C.stone, fontSize: 11, marginLeft: 8 }}>{metric.note}</span>
        </span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{metric.value}</span>
      </div>
      <div style={{ height: 6, background: C.line, borderRadius: 3 }}>
        <div
          style={{
            height: "100%",
            width: `${metric.value}%`,
            background: C.gosu,
            borderRadius: 3,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}
