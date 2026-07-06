import { useState, useRef, useCallback } from "react";

// ── 配色: 磁器の白と呉須(染付の藍) ──
const C = {
  bg: "#F7F6F1",        // 磁肌の白
  ink: "#26282B",       // 墨
  gosu: "#23508F",      // 呉須(染付の藍)
  gosuDeep: "#173863",  // 濃呉須
  stone: "#8D8A82",     // 陶石の灰
  line: "#DDD9CF",      // 素地の罫線
  card: "#FFFFFF",
  warn: "#A4552F",      // 鉄錆(低評価用)
};

const serif = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
const sans = '"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif';

// ── 等級定義 ──
const GRADES = [
  { key: "特級", min: 82, desc: "上絵付け用高級磁器の素地に適合", color: C.gosuDeep },
  { key: "一級", min: 68, desc: "一般磁器・食器用素地に適合", color: C.gosu },
  { key: "二級", min: 50, desc: "タイル・碍子等の工業用途に適合", color: C.stone },
  { key: "規格外", min: 0, desc: "再選別または他用途への転用を推奨", color: C.warn },
];

function gradeOf(score) {
  return GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];
}

// 画像を正方形キャンバスへ object-fit:cover 相当で描画(中央基準でクロップ)
// 表示側の <img style="object-fit:cover"> と同じ切り抜きにすることで、
// 解析結果の座標をそのまま表示画像上の位置に対応させられる。
function drawImageCover(ctx, img, size) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(size / iw, size / ih);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
}

// ── 暗色斑点の検出(判定根拠の可視化用) ──
// 閾値より暗い画素どうしを8近傍で連結し、斑点ごとの塊(連結成分)を求める。
function findSpots(lums, size, darkThreshold) {
  const isDark = (x, y) => lums[y * size + x] < darkThreshold;
  const visited = new Uint8Array(size * size);
  const blobs = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      if (visited[idx] || !isDark(x, y)) continue;

      const queue = [[x, y]];
      visited[idx] = 1;
      let sumX = 0, sumY = 0, count = 0;

      while (queue.length) {
        const [cx, cy] = queue.pop();
        sumX += cx;
        sumY += cy;
        count++;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            const nIdx = ny * size + nx;
            if (visited[nIdx] || !isDark(nx, ny)) continue;
            visited[nIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }

      if (count < 2) continue; // 1画素のノイズは除外

      blobs.push({
        xPct: (sumX / count + 0.5) / size,
        yPct: (sumY / count + 0.5) / size,
        rPct: Math.max(Math.sqrt(count / Math.PI), 1.2) / size,
        size: count,
      });
    }
  }

  // 斑点が過多な場合は大きいものを優先し視認性を確保
  return blobs
    .sort((a, b) => b.size - a.size)
    .slice(0, 60)
    .map(({ xPct, yPct, rPct }) => ({ xPct, yPct, rPct }));
}

// ── 画像のピクセル解析(簡易特徴量抽出) ──
function analyzeImage(img) {
  const size = 160;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");
  drawImageCover(ctx, img, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let sum = 0;
  const lums = new Float32Array(size * size);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lums[p] = l;
    sum += l;
  }
  const mean = sum / lums.length;

  let varSum = 0;
  let dark = 0;
  for (let p = 0; p < lums.length; p++) {
    const l = lums[p];
    varSum += (l - mean) * (l - mean);
    if (l < mean - 55) dark++;
  }
  const std = Math.sqrt(varSum / lums.length);
  const darkRatio = dark / lums.length;

  // 0–100 に正規化した3指標
  const whiteness = Math.max(0, Math.min(100, ((mean - 60) / 195) * 100));
  const spotPenalty = Math.max(0, Math.min(100, 100 - darkRatio * 900));
  const uniformity = Math.max(0, Math.min(100, 100 - (std / 80) * 100));

  const score = Math.round(whiteness * 0.45 + spotPenalty * 0.3 + uniformity * 0.25);
  const spots = findSpots(lums, size, mean - 55);

  return {
    score,
    spots,
    metrics: [
      { label: "白色度", note: "平均輝度から推定", value: Math.round(whiteness) },
      { label: "斑点評価", note: "暗色画素(鉄分等の目安)", value: Math.round(spotPenalty) },
      { label: "均一性", note: "輝度分散から推定", value: Math.round(uniformity) },
    ],
  };
}

// ── 合成サンプル石の生成(デモ用) ──
function makeSample(quality) {
  const s = 320;
  const cv = document.createElement("canvas");
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext("2d");
  const base = quality === "high" ? 232 : quality === "mid" ? 205 : 172;
  const noise = quality === "high" ? 10 : quality === "mid" ? 22 : 34;
  const spots = quality === "high" ? 2 : quality === "mid" ? 14 : 46;

  const im = ctx.createImageData(s, s);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = base + (Math.random() - 0.5) * noise * 2;
    im.data[i] = v;
    im.data[i + 1] = v - 2;
    im.data[i + 2] = v - 6;
    im.data[i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  for (let k = 0; k < spots; k++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = 3 + Math.random() * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(74,52,38,0.85)");
    g.addColorStop(1, "rgba(74,52,38,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return cv.toDataURL("image/png");
}

const STEPS = ["画像を読み込み中", "特徴量を抽出中", "等級モデルで判定中"];

export default function App() {
  const [imgSrc, setImgSrc] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | analyzing | done
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [showSpots, setShowSpots] = useState(true);
  const fileRef = useRef(null);

  const runAnalysis = useCallback((src) => {
    setImgSrc(src);
    setPhase("analyzing");
    setResult(null);
    setStep(0);
    const img = new Image();
    img.onload = () => {
      const res = analyzeImage(img);
      // 演出: 段階的に解析ステップを進める
      setTimeout(() => setStep(1), 600);
      setTimeout(() => setStep(2), 1300);
      setTimeout(() => {
        setResult(res);
        setPhase("done");
      }, 2100);
    };
    img.src = src;
  }, []);

  const onFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => runAnalysis(e.target.result);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImgSrc(null);
    setPhase("idle");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const grade = result ? gradeOf(result.score) : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: sans }}>
      {/* ヘッダー */}
      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: serif, fontSize: 26, margin: 0, letterSpacing: "0.12em" }}>
            陶眼 <span style={{ fontSize: 13, color: C.stone, letterSpacing: "0.05em" }}>TŌGAN</span>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: C.stone }}>天草陶石 AI選鉱システム(デモ版)</p>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* 導入 */}
        {phase === "idle" && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 8px" }}>
              熟練の選鉱眼を、次の世代へ。
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: "#4A4C50", maxWidth: 560, margin: 0 }}>
              陶石の写真を撮影するだけで、白色度・斑点・均一性を解析し等級を推定します。
              有田焼・波佐見焼を支える原料選別の技能を、データとして残すための試作品です。
            </p>
          </section>
        )}

        {/* アップロード領域 */}
        {phase === "idle" && (
          <section>
            <div
              onClick={() => fileRef.current?.click()}
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
                {[
                  { q: "high", label: "高品位サンプル" },
                  { q: "mid", label: "中品位サンプル" },
                  { q: "low", label: "低品位サンプル" },
                ].map((s) => (
                  <button
                    key={s.q}
                    onClick={() => runAnalysis(makeSample(s.q))}
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
        )}

        {/* 解析中 */}
        {phase === "analyzing" && (
          <section style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
            <img
              src={imgSrc}
              alt="解析対象の陶石"
              style={{ width: 240, height: 240, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.line}` }}
            />
            <div style={{ flex: 1, minWidth: 240, paddingTop: 8 }}>
              {STEPS.map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, opacity: i <= step ? 1 : 0.3, transition: "opacity 0.4s" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: i < step ? C.gosu : i === step ? C.gosu : C.line,
                      animation: i === step ? "pulse 1s ease-in-out infinite" : "none",
                    }}
                  />
                  <span style={{ fontSize: 14 }}>{label}</span>
                </div>
              ))}
              <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:0.5} }`}</style>
            </div>
          </section>
        )}

        {/* 結果 */}
        {phase === "done" && result && grade && (
          <section>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ position: "relative", width: 240, height: 240 }}>
                  <img
                    src={imgSrc}
                    alt="解析した陶石"
                    style={{ width: 240, height: 240, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.line}`, display: "block" }}
                  />
                  {showSpots && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 4, overflow: "hidden", pointerEvents: "none" }}>
                      {result.spots.map((s, i) => {
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
                  )}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: C.stone, cursor: "pointer" }}>
                  <input type="checkbox" checked={showSpots} onChange={(e) => setShowSpots(e.target.checked)} />
                  判定根拠(検出した斑点)を表示
                </label>
                <div style={{ fontSize: 11, color: C.stone, marginTop: 4 }}>
                  検出した斑点: {result.spots.length} 件
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                {/* 窯印風の等級表示 */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      border: `2.5px solid ${grade.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: serif,
                      fontSize: grade.key.length > 2 ? 20 : 30,
                      letterSpacing: "0.1em",
                      color: grade.color,
                      flexShrink: 0,
                      writingMode: "vertical-rl",
                    }}
                  >
                    {grade.key}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: C.stone, marginBottom: 4 }}>推定等級</div>
                    <div style={{ fontFamily: serif, fontSize: 22, letterSpacing: "0.06em", color: grade.color, marginBottom: 4 }}>
                      {grade.key}(総合 {result.score} 点)
                    </div>
                    <div style={{ fontSize: 13, color: "#4A4C50" }}>{grade.desc}</div>
                  </div>
                </div>

                {/* 指標ゲージ */}
                {result.metrics.map((m) => (
                  <div key={m.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span>
                        {m.label}
                        <span style={{ color: C.stone, fontSize: 11, marginLeft: 8 }}>{m.note}</span>
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                    </div>
                    <div style={{ height: 6, background: C.line, borderRadius: 3 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${m.value}%`,
                          background: C.gosu,
                          borderRadius: 3,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={reset}
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
        )}
      </main>
    </div>
  );
}