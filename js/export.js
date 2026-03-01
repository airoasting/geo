// PDF 내보내기 모듈
// 브라우저 기본 인쇄 기능 사용 (html2canvas 대비 품질 우수)

/**
 * 결과 페이지 PDF 내보내기
 * @param {Object} result - 현재 결과 데이터 (미사용, 호환성 유지)
 */
export async function exportResultToPDF(result) {
  const compareTab = document.getElementById('tab-compare');
  const improveTab  = document.getElementById('tab-improve');
  const compareBtns = document.querySelectorAll('.tab-btn');

  // ① 차트 캡처를 DOM 조작 전 가장 먼저 수행
  const chartCanvas = document.getElementById('result-chart');
  let chartImg = null;
  if (chartCanvas) {
    const naturalH = chartCanvas.offsetHeight || chartCanvas.height || 400;
    const dataUrl = chartCanvas.toDataURL('image/png');
    chartImg = document.createElement('img');
    chartImg.id = 'chart-print-img';
    chartImg.style.cssText = `display:block;width:100%;height:${naturalH}px;object-fit:contain;`;
    // 데이터 URL 로드 완료 대기
    await new Promise(resolve => {
      chartImg.onload = resolve;
      chartImg.onerror = resolve;
      chartImg.src = dataUrl;
    });
    chartCanvas.parentNode.insertBefore(chartImg, chartCanvas);
  }

  // ② 비교 탭 활성화
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  if (compareTab) {
    compareTab.classList.add('active');
    compareBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === 'tab-compare');
    });
  }

  // ③ 개선 탭을 강제 렌더링 (display:none 상태에서는 Chrome이 콘텐츠 높이를 0으로 계산)
  if (improveTab) {
    improveTab.style.display = 'block';
    improveTab.style.height = 'auto';
    improveTab.style.overflow = 'visible';
    void improveTab.offsetHeight; // 동기 리플로우 강제 유발
  }

  // ④ rAF 2프레임 + 400ms 대기 (Chrome 레이아웃 완료 보장)
  await new Promise(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTimeout(resolve, 400))
    )
  );

  window.print();

  // ⑤ 인쇄 후 원상복귀
  if (chartImg) chartImg.remove();
  if (improveTab) {
    improveTab.style.display = '';
    improveTab.style.height = '';
    improveTab.style.overflow = '';
  }
}
