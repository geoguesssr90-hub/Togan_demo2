export default function SpotOverlay({ spots }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 4, overflow: "hidden", pointerEvents: "none" }}>
      {spots.map((s, i) => {
        const d = Math.max(7, s.rPct * 2 * 240);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.xPct * 100}%`,
              top: `${s.yPct * 100}%`,
              width: d,
              height: d,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: "1.5px solid #E23B3B",
              background: "rgba(226,59,59,0.28)",
              boxShadow: "0 0 0 1px rgba(226,59,59,0.15)",
            }}
          />
        );
      })}
    </div>
  );
}
