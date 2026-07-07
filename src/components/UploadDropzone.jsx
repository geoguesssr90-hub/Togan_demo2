import { useState, useRef } from "react";
import { C, serif, sans } from "../theme.js";

const SAMPLES = [
  { q: "high", label: "高品位サンプル" },
  { q: "mid", label: "中品位サンプル" },
  { q: "low", label: "低品位サンプル" },
];

// 配色・:active フィードバックはクラス側(下の <style>)で定義。
// インラインだと :active で上書きできないため。
const buttonBase = {
  fontFamily: sans,
  fontSize: 14,
  padding: "12px 28px",
  borderRadius: 3,
  cursor: "pointer",
  minWidth: 200,
};

export default function UploadDropzone({ fileRef, onFile, onSample }) {
  // タッチデバイス判定(カメラボタンの表示と、ゾーンクリック挙動の切り替え)
  const [isTouch] = useState(
    () => window.matchMedia?.("(pointer: coarse)").matches ?? false
  );
  const cameraRef = useRef(null);

  return (
    <section>
      <style>{`
        .dz-btn { -webkit-tap-highlight-color: transparent; }
        .dz-btn-fill { background: ${C.gosu}; color: #fff; border: none; }
        .dz-btn-fill:active { background: ${C.gosuDeep}; }
        .dz-btn-line { background: ${C.card}; color: ${C.gosu}; border: 1px solid ${C.gosu}; }
        .dz-btn-line:active { background: rgba(35, 80, 143, 0.12); color: ${C.gosuDeep}; border-color: ${C.gosuDeep}; }
      `}</style>
      <div
        // ゾーン全体クリックでの選択は PC(pointer: fine)のみ。
        // タッチではボタン2つだけを操作対象にする
        onClick={isTouch ? undefined : () => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files?.[0]);
        }}
        style={{
          border: `1.5px dashed ${C.gosu}`,
          borderRadius: 4,
          background: C.card,
          padding: "40px 24px",
          textAlign: "center",
          cursor: isTouch ? "default" : "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 17, letterSpacing: "0.1em", color: C.gosu, marginBottom: 6 }}>
          陶石の画像を選択
        </div>
        {!isTouch && (
          <div style={{ fontSize: 12, color: C.stone, marginBottom: 18 }}>
            クリックして選択、またはここにドラッグ
          </div>
        )}

        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: isTouch ? 18 : 0 }}
        >
          {isTouch && (
            <button
              className="dz-btn dz-btn-fill"
              onClick={(e) => {
                e.stopPropagation();
                cameraRef.current?.click();
              }}
              style={buttonBase}
            >
              カメラで撮影
            </button>
          )}
          <button
            className="dz-btn dz-btn-line"
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
            style={buttonBase}
          >
            画像を選択
          </button>
        </div>

        {/* 隠しinputへのプログラム的クリックがゾーンの onClick に伝播すると
            ファイル選択が二重に開くため、伝播を止める */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = ""; // 同じ操作の連続撮影でも change が発火するように
          }}
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
