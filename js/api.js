// Claude API 호출 모듈
// Cloudflare Worker 프록시를 통해 CORS 문제 해결

import { SYSTEM_PROMPT, buildUserMessage, VERIFY_SYSTEM_PROMPT, buildVerifyMessage } from './prompt.js';
import { parseApiResponse } from './fallback.js';

// Cloudflare Worker 프록시 URL (배포 후 여기에 실제 URL 입력)
// 예: 'https://geo-proxy.YOUR-ACCOUNT.workers.dev'
export const PROXY_URL = 'https://geo-proxy.YOUR-ACCOUNT.workers.dev';

const TIMEOUT_MS = 90000; // 90초
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2000;

/**
 * 단일 브랜드 Claude API 호출
 * @param {string} brand - 브랜드명
 * @param {string} industry - 산업군
 * @param {string} apiKey - Claude API Key
 * @returns {Promise<Object>} - 파싱된 브랜드 평가 결과
 */
async function callClaudeAPI(brand, industry, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserMessage(brand, industry) }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // HTTP 에러 처리
    if (response.status === 401) throw new Error('INVALID_KEY');
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 503) throw new Error('SERVICE_UNAVAILABLE');
    if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

    const data = await response.json();

    // Anthropic API 에러 응답 처리
    if (data.error) {
      if (data.error.type === 'authentication_error') throw new Error('INVALID_KEY');
      if (data.error.type === 'rate_limit_error') throw new Error('RATE_LIMIT');
      throw new Error('API_ERROR');
    }

    const text = data.content?.[0]?.text;
    if (!text) throw new Error('EMPTY_RESPONSE');

    // JSON 파싱
    const parsed = parseApiResponse(text);
    if (!parsed) throw new Error('PARSE_ERROR');

    // 필수 필드 검증
    if (!parsed.pillars) throw new Error('INVALID_RESPONSE_FORMAT');

    return { ...parsed, brand };

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

/**
 * 에러 메시지 한국어 변환
 * @param {string} errorCode
 * @returns {string}
 */
function getErrorMessage(errorCode) {
  const messages = {
    'INVALID_KEY': 'API Key가 유효하지 않습니다. Key를 확인해주세요.',
    'RATE_LIMIT': 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    'TIMEOUT': '요청 시간이 초과되었습니다 (90초). 네트워크를 확인해주세요.',
    'SERVICE_UNAVAILABLE': 'Claude API 서비스가 일시적으로 이용 불가합니다.',
    'EMPTY_RESPONSE': 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.',
    'PARSE_ERROR': 'AI 응답 형식 오류. 다시 시도해주세요.',
    'INVALID_RESPONSE_FORMAT': 'AI 응답 구조 오류. 다시 시도해주세요.',
  };
  return messages[errorCode] || `알 수 없는 오류: ${errorCode}`;
}

/**
 * 3개 브랜드 병렬 분석
 * @param {string[]} brands - 브랜드명 배열 (3개)
 * @param {string} industry - 산업군
 * @param {string} apiKey - Claude API Key
 * @param {Function} onStatusUpdate - (index, success) => void 상태 업데이트 콜백
 * @returns {Promise<Array>} - 결과 배열 (실패 시 { brand, _error } 포함)
 */
export async function analyzeAllBrands(brands, industry, apiKey, onStatusUpdate) {
  const brandPromises = brands.map((brand, i) => {
    const p = callClaudeAPI(brand, industry, apiKey);

    // 개별 완료 상태 업데이트 (Promise.all 이전에 처리)
    p.then(() => {
      if (onStatusUpdate) onStatusUpdate(i, true);
    }).catch(() => {
      if (onStatusUpdate) onStatusUpdate(i, false);
    });

    // 부분 실패 격리: 에러를 resolve로 변환
    return p.catch(err => ({
      brand,
      _error: err.message,
      _errorMessage: getErrorMessage(err.message)
    }));
  });

  return Promise.all(brandPromises);
}

/**
 * 맥락 검증 API 호출
 * @param {string[]} queries - 검색 쿼리 배열
 * @param {string[]} brands - 브랜드명 배열
 * @param {string} industry - 산업군
 * @param {string} apiKey - Claude API Key
 * @returns {Promise<Object>} - 검증 결과
 */
export async function runContextVerification(queries, brands, industry, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: VERIFY_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildVerifyMessage(queries, brands, industry) }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('EMPTY_RESPONSE');

    return parseApiResponse(text);

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}
