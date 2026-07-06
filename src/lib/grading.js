import { C } from "../theme.js";

// ── 等級定義 ──
export const GRADES = [
  { key: "特級", min: 82, desc: "上絵付け用高級磁器の素地に適合", color: C.gosuDeep },
  { key: "一級", min: 68, desc: "一般磁器・食器用素地に適合", color: C.gosu },
  { key: "二級", min: 50, desc: "タイル・碍子等の工業用途に適合", color: C.stone },
  { key: "規格外", min: 0, desc: "再選別または他用途への転用を推奨", color: C.warn },
];

export function gradeOf(score) {
  return GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];
}
