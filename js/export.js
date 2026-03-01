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
  let chartInstance = null;
  if (chartCanvas) {
    const cssW = chartCanvas.offsetWidth || 800;
    const cssH = chartCanvas.offsetHeight || 400;

    // Chart.js 반응형 리사이즈 비활성화 (DOM 조작 중 차트 늘어남 방지)
    chartInstance = typeof Chart !== 'undefined' ? Chart.getChart(chartCanvas) : null;
    if (chartInstance) chartInstance.options.responsive = false;

    // 흰 배경 위에 차트 합성 (투명 PNG 문제 해결)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = chartCanvas.width;
    tempCanvas.height = chartCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = '#f8f8f8';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(chartCanvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    chartImg = document.createElement('img');
    chartImg.id = 'chart-print-img';
    chartImg.style.cssText = `display:block;width:${cssW}px;height:${cssH}px;max-width:100%;`;
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
  if (chartInstance) {
    chartInstance.options.responsive = true;
    chartInstance.resize(); // 원래 크기로 복원
  }
  if (improveTab) {
    improveTab.style.display = '';
    improveTab.style.height = '';
    improveTab.style.overflow = '';
  }
}
