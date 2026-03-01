// localStorage CRUD 모듈

const RESULTS_KEY = 'geo_results';

/**
 * 진단 결과 저장
 * @param {Object} result - { id, date, industry, brands }
 */
export function saveResult(result) {
  try {
    const results = loadAllResults();
    results.unshift(result); // 최신 순서로 앞에 추가
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.error('localStorage 용량 초과:', err);
      alert('저장 공간이 부족합니다. 히스토리에서 오래된 결과를 삭제하거나 JSON으로 내보낸 후 삭제해주세요.');
      return false;
    }
    console.error('결과 저장 실패:', err);
    return false;
  }
}

/**
 * 특정 ID의 결과 조회
 * @param {string} id
 * @returns {Object|null}
 */
export function loadResult(id) {
  const results = loadAllResults();
  return results.find(r => r.id === id) || null;
}

/**
 * 전체 결과 조회
 * @returns {Array}
 */
export function loadAllResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('결과 조회 실패:', err);
    return [];
  }
}

/**
 * 특정 결과 삭제
 * @param {string} id
 */
export function deleteResult(id) {
  try {
    const results = loadAllResults().filter(r => r.id !== id);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    return true;
  } catch (err) {
    console.error('결과 삭제 실패:', err);
    return false;
  }
}

/**
 * 전체 결과 삭제
 */
export function deleteAllResults() {
  try {
    localStorage.removeItem(RESULTS_KEY);
    return true;
  } catch (err) {
    console.error('전체 삭제 실패:', err);
    return false;
  }
}

/**
 * 결과 배열 직접 저장 (JSON 가져오기용)
 * @param {Array} results
 */
export function saveAllResults(results) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    return true;
  } catch (err) {
    console.error('전체 저장 실패:', err);
    return false;
  }
}
