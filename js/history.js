// history.html 모듈

import { loadAllResults, deleteResult, deleteAllResults } from './storage.js';
import { exportJSON, importJSON } from './backup.js';

// AI 배너 처리
if (sessionStorage.getItem('ai_banner_dismissed')) {
  const banner = document.getElementById('ai-banner');
  if (banner) banner.style.display = 'none';
}

window.dismissBanner = function() {
  sessionStorage.setItem('ai_banner_dismissed', '1');
  const banner = document.getElementById('ai-banner');
  if (banner) banner.style.display = 'none';
};

// 초기 렌더링
renderHistory();

/**
 * 히스토리 전체 렌더링
 */
function renderHistory() {
  const results = loadAllResults();
  const sortBy = document.getElementById('sort-select')?.value || 'newest';
  const sorted = sortResults(results, sortBy);

  // 카운트 업데이트
  const countEl = document.getElementById('result-count');
  if (countEl) countEl.textContent = `${results.length}개 결과`;

  // 그리드 렌더링
  const grid = document.getElementById('history-grid');
  if (!grid) return;

  if (sorted.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state__icon">📊</div>
        <h2 class="empty-state__title">진단 기록이 없습니다</h2>
        <p class="empty-state__desc">아직 브랜드를 진단하지 않았습니다.<br>지금 바로 시작해보세요!</p>
        <a href="diagnose.html" class="btn btn--primary">🔍 진단하러 가기</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = sorted.map(result => renderHistoryCard(result)).join('');
}

/**
 * 히스토리 카드 HTML 생성
 */
function renderHistoryCard(result) {
  const date = new Date(parseInt(result.id)).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const brands = result.brands || [];
  const validBrands = brands.filter(b => !b._error);
  const brandNames = validBrands.map(b => b.brand).join(' vs ');

  const gradeItems = validBrands.map(b => {
    const gradeColors = {
      S: 'var(--grade-s)', A: 'var(--grade-a)', B: 'var(--grade-b)',
      C: 'var(--grade-c)', D: 'var(--grade-d)'
    };
    const color = gradeColors[b.ars_grade] || 'var(--text-muted)';
    return `
      <div class="history-card__grade-item">
        <span style="color:${color};font-weight:700;">${b.ars_grade || '-'}</span>
        <span style="color:var(--text-muted);">${b.brand}</span>
        <span style="color:var(--text-dim);">(${b.ars ?? '-'}점)</span>
      </div>
    `;
  }).join('');

  const failedCount = brands.filter(b => b._error).length;
  const failedBadge = failedCount > 0
    ? `<span style="font-size:0.75rem;color:var(--red-accent);">⚠️ ${failedCount}개 실패</span>`
    : '';

  return `
    <a href="result.html?id=${result.id}" class="history-card">
      <button
        class="history-card__delete"
        onclick="handleDelete('${result.id}', event)"
        title="삭제"
      >✕</button>

      <div class="history-card__date">${date}</div>
      <div class="history-card__industry">${result.industry || '산업군 미지정'}</div>
      <div class="history-card__brands">${brandNames || '브랜드 없음'}</div>

      <div class="history-card__grades">
        ${gradeItems}
        ${failedBadge}
      </div>
    </a>
  `;
}

/**
 * 결과 정렬
 */
function sortResults(results, by) {
  const gradeOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };

  if (by === 'newest') {
    return [...results].sort((a, b) => Number(b.id) - Number(a.id));
  }

  if (by === 'grade') {
    return [...results].sort((a, b) => {
      const getBestGrade = (brands) => {
        const grades = (brands || [])
          .filter(br => !br._error && br.ars_grade)
          .map(br => gradeOrder[br.ars_grade] ?? 99);
        return grades.length > 0 ? Math.min(...grades) : 99;
      };
      return getBestGrade(a.brands) - getBestGrade(b.brands);
    });
  }

  return results;
}

/**
 * 개별 삭제 핸들러
 */
window.handleDelete = function(id, event) {
  event.preventDefault();
  event.stopPropagation();

  showConfirmModal(
    '진단 결과 삭제',
    '이 진단 결과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    '삭제',
    () => {
      deleteResult(id);
      renderHistory();
    }
  );
};

/**
 * 전체 삭제 확인
 */
window.confirmDeleteAll = function() {
  const results = loadAllResults();
  if (results.length === 0) {
    alert('삭제할 결과가 없습니다.');
    return;
  }

  showConfirmModal(
    '전체 삭제',
    `진단 기록 ${results.length}개를 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다. JSON으로 먼저 내보내기를 권장합니다.`,
    '모두 삭제',
    () => {
      deleteAllResults();
      renderHistory();
    }
  );
};

/**
 * JSON 내보내기 핸들러
 */
window.exportJSON = function() {
  const results = loadAllResults();
  if (results.length === 0) {
    alert('내보낼 결과가 없습니다.');
    return;
  }
  exportJSON();
};

/**
 * JSON 가져오기 트리거
 */
window.triggerImport = function() {
  document.getElementById('import-file-input').click();
};

/**
 * JSON 가져오기 핸들러
 */
window.handleImport = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const newCount = await importJSON(file);
    if (newCount === 0) {
      alert('이미 모든 결과가 저장되어 있습니다. (중복 없음)');
    } else {
      alert(`${newCount}개 결과를 가져왔습니다.`);
    }
    renderHistory();
  } catch (err) {
    alert(`가져오기 실패: ${err.message}`);
  }

  // 파일 입력 초기화
  event.target.value = '';
};

/**
 * 정렬 변경 시 재렌더
 */
window.renderHistory = renderHistory;

/**
 * 확인 모달 표시
 */
function showConfirmModal(title, desc, confirmText, onConfirm) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-desc').textContent = desc;
  document.getElementById('confirm-ok-btn').textContent = confirmText;

  const modal = document.getElementById('confirm-modal');
  modal.classList.remove('hidden');

  const btn = document.getElementById('confirm-ok-btn');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.onclick = function() {
    onConfirm();
    closeConfirmModal();
  };
}

window.closeConfirmModal = function() {
  document.getElementById('confirm-modal').classList.add('hidden');
};
