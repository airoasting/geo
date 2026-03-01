// result.html 오케스트레이터
// URL params → localStorage 조회 → 렌더링

import { loadResult } from './storage.js';
import { renderResultChart } from './chart.js';
import { getGradeClass, getScoreColorClass } from './calculator.js';
import { PILLAR_KEYS, PILLAR_LABELS, PILLAR_NAMES } from './pillars-data.js';
import { runContextVerification } from './api.js';
import { loadApiKey } from './apikey.js';

// 현재 결과 데이터 (전역 참조)
let currentResult = null;

// 페이지 초기화
(function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError('결과 ID가 없습니다.', '진단 페이지에서 새로 시작해주세요.');
    return;
  }

  const result = loadResult(id);
  if (!result) {
    showError(
      '결과를 찾을 수 없습니다',
      '이 결과는 다른 기기에서 생성되었거나 삭제되었습니다.'
    );
    return;
  }

  currentResult = result;
  renderResultPage(result);
})();

/**
 * 에러 UI 표시
 */
function showError(title, desc) {
  document.getElementById('error-title').textContent = title;
  document.getElementById('error-desc').textContent = desc;
  document.getElementById('error-section').style.display = 'block';
  document.getElementById('result-section').style.display = 'none';
}

/**
 * 결과 페이지 전체 렌더링
 */
function renderResultPage(result) {
  document.getElementById('error-section').style.display = 'none';
  document.getElementById('result-section').style.display = 'block';

  // 성공한 브랜드만 필터링
  const validBrands = result.brands.filter(b => !b._error);

  // 동적 헤더 업데이트
  renderHeader(result, validBrands);

  // 탭 1: 비교
  renderScoreCards(validBrands);
  renderPillarTable(validBrands);

  // 차트는 약간 지연 (DOM 준비)
  setTimeout(() => {
    renderResultChart('result-chart', validBrands);
  }, 100);

  // 탭 2: 개선
  renderImproveTab(validBrands);

  // AI 배너 처리
  if (sessionStorage.getItem('ai_banner_dismissed')) {
    const banner = document.getElementById('ai-banner');
    if (banner) banner.style.display = 'none';
  }
}

/**
 * 동적 헤더 렌더링
 */
function renderHeader(result, validBrands) {
  const date = new Date(result.date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const brandNames = result.brands.map(b => b.brand).filter(Boolean).join(' vs ');

  const subText = `${date} · ${result.industry} · ${brandNames}`;
  document.getElementById('header-sub').textContent = subText;

  // 인쇄용 부제 동기화
  const printSub = document.getElementById('print-sub');
  if (printSub) printSub.textContent = subText;

  // 최고 등급 표시
  const grades = validBrands.map(b => b.ars_grade).filter(Boolean);
  const gradeOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
  const bestGrade = grades.sort((a, b) => gradeOrder[a] - gradeOrder[b])[0];

  if (bestGrade) {
    document.getElementById('header-badge').textContent = `최고 ARS ${bestGrade}등급`;
  }
}

/**
 * 점수 카드 렌더링
 */
function renderScoreCards(brands) {
  const colors = ['var(--brand-a)', 'var(--brand-b)', 'var(--brand-c)'];
  const container = document.getElementById('score-cards');

  container.innerHTML = brands.map((b, i) => {
    const hasInsufficient = b.pillars && Object.values(b.pillars).some(
      p => p?.reason?.includes('정보 불충분')
    );

    return `
    <div class="score-card" style="text-align:center;padding:20px;">
      <div class="score-card__brand" style="margin-bottom:12px;">
        <span class="score-card__brand-dot" style="background:${colors[i]};"></span>
        ${b.brand}
      </div>
      <div class="score-card__geo-value" style="font-size:2.5rem;font-weight:800;">
        ${b.geo_total != null ? Number(b.geo_total).toFixed(1) : '-'}
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">GEO 총점 / 10</div>
      <div class="score-card__divider" style="height:1px;background:var(--border-subtle);margin:12px 0;"></div>
      <div class="score-card__ars-row" style="display:flex;align-items:center;justify-content:center;gap:10px;">
        <span class="score-card__ars-value" style="font-size:1.75rem;font-weight:800;color:${colors[i]};">
          ${b.ars ?? '-'}
        </span>
        <span class="grade-badge ${getGradeClass(b.ars_grade)}">${b.ars_grade ?? '-'}</span>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">ARS 점수</div>
      ${b.ars_max && b.ars_max < 100 ? `
        <div style="font-size:0.75rem;color:var(--red-accent);margin-top:6px;">
          ⚠️ 상한 ${b.ars_max}점 (Veto 적용)
        </div>
      ` : ''}
      ${hasInsufficient ? `
        <div style="font-size:0.7rem;color:var(--red-accent);margin-top:8px;padding:4px 8px;background:rgba(220,53,69,0.08);border-radius:6px;border:1px solid rgba(220,53,69,0.2);">
          ⚠️ 학습 데이터 부족 → 1점 처리
        </div>
      ` : ''}
    </div>
  `;
  }).join('');
}

/**
 * Pillar 상세 테이블 렌더링
 */
function renderPillarTable(brands) {
  const colors = ['var(--brand-a)', 'var(--brand-b)', 'var(--brand-c)'];
  const table = document.getElementById('pillar-detail-table');

  const headerCells = brands.map((b, i) =>
    `<th style="color:${colors[i]};">${b.brand}</th>`
  ).join('');

  const rows = PILLAR_KEYS.map((key, ki) => {
    const cells = brands.map(b => {
      const pillar = b.pillars?.[key];
      const score = pillar?.score ?? '-';
      const reason = pillar?.reason ?? '';
      const colorClass = typeof score === 'number' ? getScoreColorClass(score) : '';
      return `<td class="score-cell ${colorClass}" data-reason="${escapeAttr(reason)}">${score}</td>`;
    }).join('');

    return `
      <tr>
        <td style="text-align:left;color:var(--text-secondary);font-weight:600;">
          ${PILLAR_LABELS[ki]}
        </td>
        ${cells}
      </tr>
    `;
  }).join('');

  table.innerHTML = `
    <thead>
      <tr>
        <th style="text-align:left;color:var(--text-muted);">Pillar</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  `;
}

/**
 * 개선 탭 렌더링
 */
function renderImproveTab(brands) {
  const colors = ['var(--brand-a)', 'var(--brand-b)', 'var(--brand-c)'];
  const container = document.getElementById('improve-content');

  const brandSections = brands.map((b, i) => {
    const actionItems = b.action_items || [];
    const sortedActions = [...actionItems].sort((a, b_) => a.score - b_.score);

    const hasActions = sortedActions.length > 0;

    const actionsHtml = hasActions
      ? sortedActions.map(item => `
        <div class="improvement-card ${item.isVeto || item.score <= 3 ? 'improvement-card--veto' : ''}">
          <div class="improvement-card__header">
            <div>
              <div class="improvement-card__pillar">
                ${PILLAR_NAMES[item.pillar] || item.pillar}
              </div>
              <div class="improvement-card__score" style="color:${item.score >= 8 ? 'var(--green-cta)' : item.score >= 6 ? 'var(--yellow-warn)' : 'var(--red-accent)'};">
                ${item.score}점
              </div>
            </div>
            ${item.score <= 3 ? '<span class="badge badge--red">HARD VETO</span>' : ''}
          </div>
          <div class="improvement-card__actions">
            ${(item.actions || []).map(action =>
              `<div class="improvement-card__action-item">${action}</div>`
            ).join('')}
          </div>
        </div>
      `).join('')
      : `<div class="info-box info-box--success">🎉 모든 Pillar가 양호합니다! ④ 정보 최신성 유지에 집중하세요.</div>`;

    // 추천 검색 쿼리
    const queries = b.recommended_queries || [];
    const queriesHtml = queries.length > 0 ? `
      <div style="margin-top:20px;">
        <h4 style="font-size:0.9rem;color:var(--text-muted);margin-bottom:10px;">🔍 AI 추천 가능 검색 쿼리</h4>
        <div class="query-tags">
          ${queries.map(q => `<span class="query-tag">"${q}"</span>`).join('')}
        </div>
      </div>
    ` : '';

    return `
      <div style="margin-bottom:32px;">
        <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:16px;color:${colors[i]};">
          ${b.brand}
        </h3>
        ${actionsHtml}
        ${queriesHtml}
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:24px;">GEO 점수 개선 방법</h2>
    ${brandSections}
  `;
}

/**
 * 탭 전환 (전역 함수)
 */
window.switchTab = function(tabId, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');

  const pdfBtn = document.getElementById('pdf-btn');
  if (pdfBtn) pdfBtn.style.display = tabId === 'tab-compare' ? '' : 'none';
};

/**
 * AI 배너 닫기 (전역 함수)
 */
window.dismissBanner = function() {
  sessionStorage.setItem('ai_banner_dismissed', '1');
  const banner = document.getElementById('ai-banner');
  if (banner) banner.style.display = 'none';
};

/**
 * 맥락 검증 실행 (전역 함수)
 */
window.runVerification = async function() {
  if (!currentResult) return;

  const queries = [
    document.getElementById('query-1').value.trim(),
    document.getElementById('query-2').value.trim(),
    document.getElementById('query-3').value.trim()
  ].filter(q => q.length > 0);

  if (queries.length === 0) {
    alert('최소 1개의 쿼리를 입력해주세요.');
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    alert('API Key가 필요합니다. 진단 페이지로 돌아가서 Key를 입력해주세요.');
    window.location.href = 'diagnose.html';
    return;
  }

  const btn = document.getElementById('verify-btn');
  btn.disabled = true;
  btn.textContent = '🔄 검증 중...';

  try {
    const brandNames = currentResult.brands
      .filter(b => !b._error)
      .map(b => b.brand);

    const result = await runContextVerification(
      queries, brandNames, currentResult.industry, apiKey
    );

    renderVerifyMatrix(result, brandNames, queries);

  } catch (err) {
    alert(`검증 실패: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔎 맥락 검증 실행';
  }
};

/**
 * 검증 결과 매트릭스 렌더링
 */
function renderVerifyMatrix(result, brandNames, queries) {
  const container = document.getElementById('verify-results');
  const matrix = document.getElementById('verify-matrix');
  container.style.display = 'block';

  const headerCells = brandNames.map(n => `<th>${n}</th>`).join('');
  const rows = (result.results || []).map(r => {
    const cells = brandNames.map(brand => {
      const info = r.brands?.[brand];
      const included = info?.included;
      const reason = info?.reason || '';
      return `
        <td title="${escapeAttr(reason)}" style="cursor:help;">
          ${included ? '✅' : '❌'}
        </td>
      `;
    }).join('');
    return `
      <tr>
        <td style="text-align:left;">${r.query}</td>
        ${cells}
      </tr>
    `;
  }).join('');

  matrix.innerHTML = `
    <thead>
      <tr>
        <th style="text-align:left;">검색 쿼리</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

/**
 * PDF 내보내기 (전역 함수)
 */
window.exportPDF = async function() {
  try {
    const { exportResultToPDF } = await import('./export.js');
    await exportResultToPDF(currentResult);
  } catch (err) {
    alert('PDF 내보내기 실패: ' + err.message);
  }
};

/**
 * HTML attribute 이스케이프
 */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
