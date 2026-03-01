// Chart.js 래퍼 모듈
// renderDemoChart: framework.html의 하드코딩 데모 차트
// renderResultChart: result.html의 실제 데이터 차트

import { PILLAR_LABELS, PILLAR_KEYS } from './pillars-data.js';

// Chart.js 기본 설정
if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#cccccc';
  Chart.defaults.borderColor = '#333333';
}

// 차트 인스턴스 캐시 (재렌더 방지)
const chartInstances = {};

/**
 * 데모 차트 렌더링 (framework.html용 하드코딩 데이터)
 */
export function renderDemoChart(canvasId) {
  // Chart.js가 로드될 때까지 대기
  if (typeof Chart === 'undefined') {
    setTimeout(() => renderDemoChart(canvasId), 100);
    return;
  }

  const demoData = {
    brands: [
      {
        brand: '스타벅스',
        color: '#e74c3c',
        scores: [9, 9, 8, 9, 8, 7, 8]
      },
      {
        brand: '블루보틀',
        color: '#3498db',
        scores: [7, 8, 9, 7, 8, 9, 7]
      },
      {
        brand: '이디야',
        color: '#2ecc71',
        scores: [8, 6, 7, 7, 6, 5, 8]
      }
    ]
  };

  _renderChart(canvasId, demoData.brands, true);
}

/**
 * 실제 결과 차트 렌더링 (result.html용)
 * @param {string} canvasId
 * @param {Array} brands - 처리된 브랜드 결과 배열
 */
export function renderResultChart(canvasId, brands) {
  if (typeof Chart === 'undefined') {
    setTimeout(() => renderResultChart(canvasId, brands), 100);
    return;
  }

  const colors = ['#e74c3c', '#3498db', '#2ecc71'];

  const chartBrands = brands.map((b, i) => ({
    brand: b.brand || `브랜드 ${String.fromCharCode(65 + i)}`,
    color: colors[i] || '#999',
    scores: PILLAR_KEYS.map(key => b.pillars?.[key]?.score ?? 0),
    reasons: PILLAR_KEYS.map(key => b.pillars?.[key]?.reason ?? '정보 없음')
  }));

  _renderChart(canvasId, chartBrands, false, brands);
}

/**
 * 내부 차트 렌더링 함수
 */
function _renderChart(canvasId, brands, isDemo, originalBrands) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // 기존 차트 인스턴스 제거
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }

  const datasets = brands.map((b, i) => ({
    label: b.brand,
    data: b.scores,
    borderColor: b.color,
    backgroundColor: b.color + '20',
    pointBackgroundColor: b.color,
    pointBorderColor: '#1a1a1a',
    pointBorderWidth: 2,
    pointRadius: 7,
    pointHoverRadius: 10,
    tension: 0.15,
    borderWidth: 2.5
  }));

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: PILLAR_LABELS,
      datasets
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#cccccc',
            padding: 20,
            font: { size: 13, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: '#252525',
          borderColor: '#444',
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#cccccc',
          padding: 12,
          callbacks: {
            label: function(ctx) {
              const lines = [`${ctx.dataset.label}: ${ctx.raw}점`];
              // 실제 결과 차트에서 이유 표시
              if (!isDemo && originalBrands) {
                const brand = originalBrands[ctx.datasetIndex];
                const key = PILLAR_KEYS[ctx.dataIndex];
                const reason = brand?.pillars?.[key]?.reason;
                if (reason) {
                  // 긴 텍스트 줄바꿈
                  const words = reason.split(' ');
                  let line = '';
                  for (const word of words) {
                    if ((line + ' ' + word).length > 40) {
                      lines.push(line.trim());
                      line = word;
                    } else {
                      line += (line ? ' ' : '') + word;
                    }
                  }
                  if (line) lines.push(line.trim());
                }
              }
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: {
            stepSize: 1,
            color: '#999999',
            font: { size: 12 }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.06)'
          }
        },
        y: {
          ticks: {
            color: '#cccccc',
            font: { size: 12 },
            padding: 8
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.04)'
          }
        }
      }
    }
  });

  chartInstances[canvasId] = chart;
  return chart;
}

/**
 * 아코디언 초기화 (framework.html에서 사용, 현재는 인라인 JS로 처리)
 */
export function initAccordion() {
  // framework.html 인라인 스크립트에서 직접 처리
}
