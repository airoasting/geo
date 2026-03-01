// GEO 7-Pillar 점수 계산 모듈
// 순수 함수들로 구성 — API 의존성 없음

import { PILLAR_KEYS, PILLAR_NAMES } from './pillars-data.js';

/**
 * GEO 총점 계산 (7개 pillar 평균)
 * @param {Object} pillars - { [key]: { score: number, reason: string } }
 * @returns {number} - 소수점 1자리 평균 (0~10)
 */
export function calculateGeoTotal(pillars) {
  const scores = PILLAR_KEYS.map(key => pillars[key]?.score ?? 0);
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / PILLAR_KEYS.length) * 10) / 10;
}

/**
 * ARS (AI 추천 점수) 계산
 * Veto 규칙 포함, 0~100점
 * @param {Object} pillars
 * @returns {{ ars: number, arsMax: number, grade: string }}
 */
export function calculateARS(pillars) {
  const P1 = pillars.discoverability?.score ?? 0;  // Gate Layer
  const P2 = pillars.source_authority?.score ?? 0;
  const P3 = pillars.info_depth?.score ?? 0;
  const P4 = pillars.recency?.score ?? 0;
  const P5 = pillars.consistency?.score ?? 0;
  const P6 = pillars.distinctiveness?.score ?? 0;
  const P7 = pillars.safety?.score ?? 0;            // Risk Layer

  // Veto 규칙
  let arsMax;
  if (P1 <= 3 || P7 <= 3) {
    arsMax = 20; // 하드 Veto
  } else if (P1 <= 5 || P7 <= 5) {
    arsMax = 50; // 소프트 Veto
  } else {
    arsMax = 100; // 정상
  }

  // 가중 합산: P2, P6는 1.5배 가중, 나머지는 1.0배
  // 정규화: 최대 가능 합 = (P2+P6)*1.5 + (P1+P3+P4+P5+P7)*1.0
  //                      = 10*1.5*2 + 10*1.0*5 = 30 + 50 = 80
  const weightedSum = (P2 + P6) * 1.5 + (P1 + P3 + P4 + P5 + P7) * 1.0;
  const arsRaw = (weightedSum / 80) * 100;

  const ars = Math.min(Math.round(arsRaw * 10) / 10, arsMax);
  const grade = getGrade(ars);

  return { ars, arsMax, grade };
}

/**
 * ARS 점수로 등급 반환
 * @param {number} ars - 0~100
 * @returns {'S'|'A'|'B'|'C'|'D'}
 */
export function getGrade(ars) {
  if (ars >= 91) return 'S';
  if (ars >= 81) return 'A';
  if (ars >= 71) return 'B';
  if (ars >= 51) return 'C';
  return 'D';
}

/**
 * 등급에 따른 CSS 클래스 반환
 * @param {string} grade
 * @returns {string}
 */
export function getGradeClass(grade) {
  return `grade-${grade}`;
}

/**
 * 점수에 따른 색상 CSS 클래스 반환 (점수 셀용)
 * @param {number} score - 0~10
 * @returns {string}
 */
export function getScoreColorClass(score) {
  if (score >= 8) return 'score-cell--high';
  if (score >= 6) return 'score-cell--mid';
  return 'score-cell--low';
}

/**
 * 개선 우선순위 계산
 * - Gate/Risk Pillar (P1, P7)가 낮으면 최우선
 * - 나머지는 점수 낮은 순
 * - 8점 이상은 제외 (양호)
 * @param {Object} pillars
 * @returns {Array<{ key, name, index, score, isVeto }>}
 */
export function getImprovementPriority(pillars) {
  const scored = PILLAR_KEYS.map((key, i) => ({
    key,
    name: PILLAR_NAMES[key],
    index: i + 1,
    score: pillars[key]?.score ?? 0,
    isVeto: key === 'discoverability' || key === 'safety'
  }));

  // 점수가 8점 이상이면 제외 (양호)
  const needsImprovement = scored.filter(p => p.score < 8);

  // Veto 기준 먼저, 나머지는 점수 낮은 순
  const vetoItems = needsImprovement
    .filter(p => p.isVeto)
    .sort((a, b) => a.score - b.score);

  const otherItems = needsImprovement
    .filter(p => !p.isVeto)
    .sort((a, b) => a.score - b.score);

  return [...vetoItems, ...otherItems];
}
