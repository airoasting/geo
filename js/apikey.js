// API Key 관리 모듈

const STORAGE_KEY = 'geo_api_key';
const SESSION_KEY = 'geo_api_key_session';

/**
 * 저장된 API Key 불러오기
 * localStorage 우선, 없으면 sessionStorage 확인
 * @returns {string|null}
 */
export function loadApiKey() {
  return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY) || null;
}

/**
 * API Key 저장
 * @param {string} key - API Key
 * @param {boolean} persist - true면 localStorage, false면 sessionStorage
 */
export function saveApiKey(key, persist) {
  if (persist) {
    localStorage.setItem(STORAGE_KEY, key);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, key);
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * API Key 형식 검증
 * @param {string} key
 * @returns {boolean}
 */
export function validateKeyFormat(key) {
  return typeof key === 'string' && key.startsWith('sk-ant-') && key.length > 20;
}

/**
 * API Key 삭제
 */
export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
