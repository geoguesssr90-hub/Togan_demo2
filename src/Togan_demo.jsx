import { useState, useRef, useCallback } from "react";
import { C, sans } from "./theme.js";
import { gradeOf } from "./lib/grading.js";
import { analyzeImage } from "./lib/imageAnalysis.js";
import { makeSample } from "./lib/sampleStone.js";
import Header from "./components/Header.jsx";
import IntroSection from "./components/IntroSection.jsx";
import UploadDropzone from "./components/UploadDropzone.jsx";
import AnalyzingPanel from "./components/AnalyzingPanel.jsx";
import ResultPanel from "./components/ResultPanel.jsx";

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
      <Header />

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 64px" }}>
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
      </main>
    </div>
  );
}
