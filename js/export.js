// PDF 내보내기 모듈
// Print Layer 방식: 기존 탭 DOM을 건드리지 않고 전용 레이어에 콘텐츠를 복제하여 인쇄
// → Chart.js ResizeObserver 트리거 없음, 차트 왜곡 없음

/**
 * 결과 페이지 PDF 내보내기
 */
export async function exportResultToPDF() {

  // ① 차트 PNG 캡처 — DOM 조작 전, 현재 상태 그대로
  const chartCanvas = document.getElementById('result-chart');
  let chartDataUrl = null;
  let chartCssH = 0;
  if (chartCanvas && chartCanvas.width > 0) {
    chartCssH = chartCanvas.offsetHeight || 400;
    // 흰 배경 위에 차트 합성 (투명 PNG 문제 해결)
    const tmp = document.createElement('canvas');
    tmp.width  = chartCanvas.width;
    tmp.height = chartCanvas.height;
    const tc = tmp.getContext('2d');
    tc.fillStyle = '#f8f8f8';
    tc.fillRect(0, 0, tmp.width, tmp.height);
    tc.drawImage(chartCanvas, 0, 0);
    chartDataUrl = tmp.toDataURL('image/png');
  }

  // ② Print Layer 참조 및 콘텐츠 수집
  const printLayer = document.getElementById('geo-print-layer');
  if (!printLayer) { window.print(); return; } // fallback

  const titleBar      = document.querySelector('.print-title-bar');
  const scoreCards    = document.getElementById('score-cards');
  const chartWrapper  = document.getElementById('result-chart')?.closest('.chart-wrapper');
  const pillarHeading = chartWrapper?.nextElementSibling; // "평가 항목별 상세 점수" h3
  const pillarWrap    = pillarHeading?.nextElementSibling; // overflow-x:auto div
  const improveContent = document.getElementById('improve-content');

  // ③ 차트 이미지 HTML
  const chartImgHtml = chartDataUrl
    ? `<img class="print-chart-img" src="${chartDataUrl}"
            style="display:block;width:100%;height:${chartCssH}px;object-fit:contain;">`
    : '';

  // ④ Print Layer HTML 조립
  printLayer.innerHTML = `
    ${titleBar ? titleBar.outerHTML : ''}

    <div class="print-page-1">
      ${scoreCards ? scoreCards.outerHTML : ''}

      <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:12px;
                  padding:24px;margin-bottom:32px;margin-top:20px;">
        ${chartImgHtml}
      </div>

      ${pillarHeading ? pillarHeading.outerHTML : ''}
      ${pillarWrap    ? pillarWrap.outerHTML    : ''}
    </div>

    ${improveContent
      ? `<div class="print-page-2">${improveContent.innerHTML}</div>`
      : ''}
  `;

  // ⑤ 차트 이미지 로드 대기
  const printImg = printLayer.querySelector('.print-chart-img');
  if (printImg && !printImg.complete) {
    await new Promise(resolve => {
      printImg.onload  = resolve;
      printImg.onerror = resolve;
    });
  }

  // ⑥ rAF 2프레임 대기 (DOM 레이아웃 안정화)
  await new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

  // ⑦ 인쇄
  window.print();

  // ⑧ Print Layer 초기화 (차트 canvas는 건드리지 않았으므로 자동 복원)
  printLayer.innerHTML = '';
}
