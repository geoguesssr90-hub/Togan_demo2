// ── 合成サンプル石の生成(デモ用) ──
export function makeSample(quality) {
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
