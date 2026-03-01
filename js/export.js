// PDF 내보내기 모듈
// Print Layer 방식: 기존 탭 DOM을 건드리지 않고 전용 레이어에 콘텐츠를 복제하여 인쇄
// → Chart.js ResizeObserver 트리거 없음, 차트 왜곡 없음

/**
 * 결과 페이지 PDF 내보내기
 */
export async function exportResultToPDF() {

  // ① Print Layer 참조 및 콘텐츠 수집
  const printLayer = document.getElementById('geo-print-layer');
  if (!printLayer) { window.print(); return; } // fallback

  const titleBar      = document.querySelector('.print-title-bar');
  const scoreCards    = document.getElementById('score-cards');
  const chartWrapper  = document.getElementById('result-chart')?.closest('.chart-wrapper');
  const pillarHeading = chartWrapper?.nextElementSibling; // "평가 항목별 상세 점수" h3
  const pillarWrap    = pillarHeading?.nextElementSibling; // overflow-x:auto div
  const improveContent = document.getElementById('improve-content');

  // ② Print Layer HTML 조립 (차트 제외)
  printLayer.innerHTML = `
    ${titleBar ? titleBar.outerHTML : ''}

    <div class="print-page-1">
      ${scoreCards ? scoreCards.outerHTML : ''}

      ${pillarHeading ? pillarHeading.outerHTML : ''}
      ${pillarWrap    ? pillarWrap.outerHTML    : ''}
    </div>

    ${improveContent
      ? `<div class="print-page-2">${improveContent.innerHTML}</div>`
      : ''}
  `;

  // ③ rAF 2프레임 대기 (DOM 레이아웃 안정화)
  await new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

  // ④ 인쇄
  window.print();

  // ⑤ Print Layer 초기화
  printLayer.innerHTML = '';
}
