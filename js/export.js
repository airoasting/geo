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

  // 비교 탭 활성화
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  if (compareTab) {
    compareTab.classList.add('active');
    compareBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === 'tab-compare');
    });
  }

  // 개선 탭을 강제 렌더링 (display:none 상태에서는 Chrome이 콘텐츠 높이를 0으로 계산)
  if (improveTab) improveTab.style.display = 'block';

  // DOM 레이아웃 반영 대기
  await new Promise(resolve => setTimeout(resolve, 300));

  window.print();

  // 인쇄 후 개선 탭 원상복귀 (print CSS가 별도로 제어)
  if (improveTab) improveTab.style.display = '';
}
