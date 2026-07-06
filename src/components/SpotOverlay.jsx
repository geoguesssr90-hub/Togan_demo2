export default function SpotOverlay({ spots }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 4, overflow: "hidden", pointerEvents: "none" }}>
      {spots.map((s, i) => {
        // 直径は表示領域に対する割合で指定し、小さすぎる斑点は 7px を下限に確保
        const d = `max(7px, ${s.rPct * 2 * 100}%)`;
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
