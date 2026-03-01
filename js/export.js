// PDF 내보내기 모듈
// html2canvas + jsPDF CDN 사용

/**
 * 결과 페이지 PDF 내보내기
 * @param {Object} result - 현재 결과 데이터
 */
export async function exportResultToPDF(result) {
  // html2canvas, jsPDF CDN 동적 로드
  await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');

  const { jsPDF } = window.jspdf;

  // 캡처 대상 요소
  const element = document.getElementById('result-section');
  if (!element) throw new Error('결과 섹션을 찾을 수 없습니다.');

  // 잠시 대기 (차트 렌더 완료 보장)
  await new Promise(resolve => setTimeout(resolve, 500));

  // 현재 활성 탭을 비교 탭으로 전환 (차트 캡처용)
  const compareTab = document.getElementById('tab-compare');
  if (compareTab) compareTab.classList.add('active');

  // html2canvas 캡처
  const canvas = await html2canvas(element, {
    backgroundColor: '#1a1a1a',
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    scrollX: 0,
    scrollY: 0
  });

  const imgData = canvas.toDataURL('image/png');

  // PDF 생성
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // 다중 페이지 처리
  let position = 0;
  let isFirstPage = true;

  while (position < imgHeight) {
    if (!isFirstPage) pdf.addPage();

    pdf.addImage(
      imgData,
      'PNG',
      0,
      -position,
      imgWidth,
      imgHeight
    );

    position += pageHeight;
    isFirstPage = false;
  }

  const brandNames = result.brands
    .filter(b => !b._error)
    .map(b => b.brand)
    .join('_');

  pdf.save(`GEO_진단결과_${brandNames}_${result.id}.pdf`);
}

/**
 * 스크립트 동적 로드
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우 스킵
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
    document.head.appendChild(script);
  });
}
