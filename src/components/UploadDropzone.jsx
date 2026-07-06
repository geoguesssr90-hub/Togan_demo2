import { C, serif, sans } from "../theme.js";

const SAMPLES = [
  { q: "high", label: "高品位サンプル" },
  { q: "mid", label: "中品位サンプル" },
  { q: "low", label: "低品位サンプル" },
];

export default function UploadDropzone({ fileRef, onFile, onSample }) {
  return (
    <section>
      <div
        role="button"
        tabIndex={0}
        aria-label="陶石の画像を選択"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0]);
        }}
        style={{
          border: `1.5px dashed ${C.gosu}`,
          borderRadius: 4,
          background: C.card,
          padding: "56px 24px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 17, letterSpacing: "0.1em", color: C.gosu, marginBottom: 6 }}>
          陶石の画像を選択
        </div>
        <div style={{ fontSize: 12, color: C.stone }}>クリックして選択、またはここにドラッグ</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: C.stone, marginBottom: 10 }}>
          手元に画像がない場合は、合成サンプルで試せます:
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {SAMPLES.map((s) => (
            <button
              key={s.q}
              onClick={() => onSample(s.q)}
              style={{
                fontFamily: sans,
                fontSize: 13,
                padding: "10px 18px",
                background: C.card,
                color: C.gosu,
                border: `1px solid ${C.gosu}`,
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
