// JSON 백업 모듈 (내보내기/가져오기)

import { loadAllResults, saveAllResults } from './storage.js';

/**
 * JSON 내보내기
 * 전체 결과를 JSON 파일로 다운로드
 */
export function exportJSON() {
  const results = loadAllResults();
  const exportData = {
    version: '1.0',
    exported: new Date().toISOString(),
    count: results.length,
    results
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `GEO_히스토리_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * JSON 가져오기
 * 기존 결과와 병합 (중복 ID 제외)
 * @param {File} file - JSON 파일
 * @returns {Promise<number>} - 새로 추가된 항목 수
 */
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result);

        // 형식 검증
        if (!raw.results || !Array.isArray(raw.results)) {
          throw new Error('올바른 형식의 GEO 히스토리 JSON 파일이 아닙니다.');
        }

        const existing = loadAllResults();
        const existingIds = new Set(existing.map(r => r.id));

        // 중복 제거
        const newItems = raw.results.filter(r => r.id && !existingIds.has(r.id));

        // 병합 후 최신순 정렬
        const merged = [...existing, ...newItems]
          .sort((a, b) => Number(b.id) - Number(a.id));

        saveAllResults(merged);
        resolve(newItems.length);

      } catch (err) {
        reject(new Error(err.message || '파일 파싱 실패'));
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file, 'UTF-8');
  });
}
