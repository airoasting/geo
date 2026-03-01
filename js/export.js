// PDF 내보내기 모듈
// 브라우저 기본 인쇄 기능 사용 (html2canvas 대비 품질 우수)

/**
 * 결과 페이지 PDF 내보내기
 * @param {Object} result - 현재 결과 데이터 (미사용, 호환성 유지)
 */
export async function exportResultToPDF(result) {
  // 인쇄 전 비교 탭 활성화
  const compareTab = document.getElementById('tab-compare');
  const compareBtns = document.querySelectorAll('.tab-btn');
  if (compareTab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    compareTab.classList.add('active');
    compareBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === 'tab-compare');
    });
  }

  // 차트 렌더 대기
  await new Promise(resolve => setTimeout(resolve, 300));

  window.print();
}
