// 注意: 本ファイルの各閾値(白色度の正規化基準、暗色判定の -55 等)は仮設定。
// 現場での実データ収集後に較正する。

// 解析対象は画像中央のこの割合の領域のみ(現場撮影では周辺に背景が写り込むため)
export const ANALYSIS_CROP_RATIO = 0.6;

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
// 表示画像(object-fit:cover)のうち中央 ANALYSIS_CROP_RATIO の領域だけを解析する。
export function analyzeImage(img) {
  const size = 160;
  const cropSize = Math.round(size * ANALYSIS_CROP_RATIO);
  const cropOffset = Math.round((size - cropSize) / 2);
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");
  drawImageCover(ctx, img, size);
  const { data } = ctx.getImageData(cropOffset, cropOffset, cropSize, cropSize);

  let sum = 0;
  const lums = new Float32Array(cropSize * cropSize);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lums[p] = l;
    sum += l;
  }
  const mean = sum / lums.length;

  // 暗色判定の閾値。白色度の基準緩和(下記)で明るい石の判別が斑点・均一性に
  // 寄るため、旧設定(mean-55 / x900 / std÷80)から感度を強めている。
  // mean-50 では薄い斑点のコア輝度が閾値を僅かに上回り検出漏れするため mean-40 に調整。
  // ノイズ由来の孤立暗点は findSpots 側の最小サイズ条件(2画素以上)で除外される。
  const darkThreshold = mean - 40;

  let varSum = 0;
  let dark = 0;
  for (let p = 0; p < lums.length; p++) {
    const l = lums[p];
    varSum += (l - mean) * (l - mean);
    if (l < darkThreshold) dark++;
  }
  const std = Math.sqrt(varSum / lums.length);
  const darkRatio = dark / lums.length;

  // 0–100 に正規化した3指標
  const whiteness = Math.max(0, Math.min(100, ((mean - 50) / 150) * 100));
  const spotPenalty = Math.max(0, Math.min(100, 100 - darkRatio * 1600));
  const uniformity = Math.max(0, Math.min(100, 100 - (std / 60) * 100));

  const score = Math.round(whiteness * 0.45 + spotPenalty * 0.3 + uniformity * 0.25);
  // 斑点座標はクロップ領域基準 → 表示画像全体基準に変換
  const spots = findSpots(lums, cropSize, darkThreshold).map((s) => ({
    xPct: (cropOffset + s.xPct * cropSize) / size,
    yPct: (cropOffset + s.yPct * cropSize) / size,
    rPct: (s.rPct * cropSize) / size,
  }));

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
