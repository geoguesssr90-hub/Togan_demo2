import { useState, useRef, useCallback } from "react";
import { C, sans } from "./theme.js";
import { gradeOf } from "./lib/grading.js";
import { analyzeImage } from "./lib/imageAnalysis.js";
import { makeSample } from "./lib/sampleStone.js";
import Header from "./components/Header.jsx";
import TabBar from "./components/TabBar.jsx";
import IntroSection from "./components/IntroSection.jsx";
import UploadDropzone from "./components/UploadDropzone.jsx";
import AnalyzingPanel from "./components/AnalyzingPanel.jsx";
import ResultPanel from "./components/ResultPanel.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";

export default function ToganDemo() {
  const [imgSrc, setImgSrc] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | analyzing | done
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [showSpots, setShowSpots] = useState(true);
  const [tab, setTab] = useState("judge"); // judge | history
  const [history, setHistory] = useState([]);
  const fileRef = useRef(null);
  // 実行中の解析を識別するトークン。連続してサンプル/画像を選んだ場合に、
  // 古い解析の setTimeout が後から状態を上書きしてしまうのを防ぐ。
  const analysisId = useRef(0);
  // ファイル読み込みにも同じ仕組みを適用(FileReader は完了順が前後しうる)
  const fileReadId = useRef(0);

  const runAnalysis = useCallback((src) => {
    const id = ++analysisId.current;
    setImgSrc(src);
    setPhase("analyzing");
    setResult(null);
    setStep(0);
    const img = new Image();
    img.onload = () => {
      if (id !== analysisId.current) return; // 新しい解析が始まっていれば破棄
      const res = analyzeImage(img);
      // 演出: 段階的に解析ステップを進める
      setTimeout(() => {
        if (id === analysisId.current) setStep(1);
      }, 600);
      setTimeout(() => {
        if (id === analysisId.current) setStep(2);
      }, 1300);
      setTimeout(() => {
        if (id !== analysisId.current) return;
        setResult(res);
        setPhase("done");
        setHistory((prev) => [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            imgSrc: src,
            score: res.score,
            grade: gradeOf(res.score),
            timestamp: new Date(),
          },
          ...prev,
        ]);
      }, 2100);
    };
    img.onerror = () => {
      if (id !== analysisId.current) return;
      setImgSrc(null);
      setPhase("idle");
      if (fileRef.current) fileRef.current.value = "";
    };
    img.src = src;
  }, []);

  const onFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const id = ++fileReadId.current;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (id !== fileReadId.current) return; // より新しいファイルの読み込みを優先
      runAnalysis(e.target.result);
    };
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
      <Header />

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 64px" }}>
        <TabBar tab={tab} onChange={setTab} historyCount={history.length} />

        {tab === "judge" && (
          <>
            {phase === "idle" && <IntroSection />}

            {phase === "idle" && (
              <UploadDropzone
                fileRef={fileRef}
                onFile={onFile}
                onSample={(q) => runAnalysis(makeSample(q))}
              />
            )}

            {phase === "analyzing" && <AnalyzingPanel imgSrc={imgSrc} step={step} />}

            {phase === "done" && result && grade && (
              <ResultPanel
                imgSrc={imgSrc}
                result={result}
                grade={grade}
                showSpots={showSpots}
                onToggleSpots={setShowSpots}
                onReset={reset}
              />
            )}
          </>
        )}

        {tab === "history" && <HistoryPanel history={history} />}
      </main>
    </div>
  );
}
