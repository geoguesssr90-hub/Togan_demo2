// test-images/ の画像を実アプリの判定ロジック(src/lib/imageAnalysis.js)で
// 一括解析し、スコアと等級を表形式で出力する検証スクリプト。
// 閾値調整のたびに実行して、全画像の判定変化を確認する。
//
// 使い方:
//   npm run analyze:images            # test-images/ を解析
//   npm run analyze:images -- <dir>   # 任意のフォルダを解析
//
// 仕組み: Vite dev サーバー経由で実モジュールをヘッドレスブラウザに読み込む
// (解析が Canvas API に依存するため)。ブラウザはインストール済みの
// Edge / Chrome を使用する(ダウンロードなし)。
import { chromium } from "playwright-core";
import { spawn } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { join, extname, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, process.argv[2] || "test-images");
const PORT = 5199;

const files = readdirSync(dir)
  .filter((f) => [".png", ".jpg", ".jpeg", ".webp"].includes(extname(f).toLowerCase()))
  .sort();
if (files.length === 0) {
  console.error(`画像が見つかりません: ${dir}`);
  process.exit(1);
}

// 既存の dev サーバー(5173)があればそれを使い、なければ 5199 で起動
async function ensureServer() {
  try {
    await fetch("http://localhost:5173");
    return { url: "http://localhost:5173", proc: null };
  } catch {
    /* 起動していない */
  }
  const proc = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: root,
    shell: true,
    stdio: "ignore",
  });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://localhost:${PORT}`);
      return { url: `http://localhost:${PORT}`, proc };
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error("Vite dev サーバーの起動がタイムアウトしました");
}

async function launchBrowser() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel });
    } catch {
      /* 次の候補へ */
    }
  }
  return await chromium.launch(); // PLAYWRIGHT_BROWSERS_PATH にある chromium
}

const { url, proc } = await ensureServer();
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await page.goto(url);

  const mimeOf = (f) =>
    extname(f).toLowerCase() === ".png" ? "image/png"
    : extname(f).toLowerCase() === ".webp" ? "image/webp"
    : "image/jpeg";

  const rows = [];
  for (const file of files) {
    const dataUrl = `data:${mimeOf(file)};base64,${readFileSync(join(dir, file)).toString("base64")}`;
    const r = await page.evaluate(async (src) => {
      const [{ analyzeImage }, { gradeOf }] = await Promise.all([
        import("/src/lib/imageAnalysis.js"),
        import("/src/lib/grading.js"),
      ]);
      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = src;
      });
      const a = analyzeImage(img);
      return {
        score: a.score,
        grade: gradeOf(a.score).key,
        white: a.metrics[0].value,
        spot: a.metrics[1].value,
        unif: a.metrics[2].value,
        marks: a.spots.length,
        mean: a.raw.mean,
        std: a.raw.std,
        darkPct: a.raw.darkRatio,
      };
    }, dataUrl);
    rows.push({ file, ...r });
  }

  // 表形式で出力
  const headers = ["画像", "総合", "等級", "白色度", "斑点評価", "均一性", "検出数", "mean", "std", "dark%"];
  const table = rows.map((r) => [
    r.file, String(r.score), r.grade, String(r.white), String(r.spot), String(r.unif),
    String(r.marks), String(r.mean), String(r.std), String(r.darkPct),
  ]);
  const widths = headers.map((h, i) => Math.max(h.length * 2 - h.replace(/[^\x20-\x7e]/g, "").length, ...table.map((row) => row[i].length)));
  const fmt = (row) => row.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log(fmt(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of table) console.log(fmt(row));
} finally {
  await browser.close();
  if (proc) {
    // Windows では子プロセスツリーごと終了させる
    spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { shell: true, stdio: "ignore" });
  }
}
