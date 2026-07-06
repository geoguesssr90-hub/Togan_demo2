// ── 合成サンプル石の生成(デモ用) ──
// パラメータは判定ロジック(imageAnalysis.js)の閾値(暗色判定 mean-40)に
// 合わせて統計的に較正済み。
// 狙い: 高品位=特級(85点前後) / 中品位=一級・二級の境界(68点付近を跨ぐ) /
//       低品位=規格外(40点前後)。デモで4等級すべてを提示できる。
// 注: 暗色判定が平均輝度に適応するため、低品位は base を下げるより
//     noise を強めて分散と暗色テールを作る方が減点される(base が中品位より
//     高いのはそのため)。
export function makeSample(quality) {
  const s = 320;
  const cv = document.createElement("canvas");
  cv.width = s;
  cv.height = s;
  const ctx = cv.getContext("2d");
  const base = quality === "high" ? 162 : quality === "mid" ? 130 : 142;
  const noise = quality === "high" ? 10 : quality === "mid" ? 42 : 100;
  const spots = quality === "high" ? 2 : quality === "mid" ? 38 : 80;

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
