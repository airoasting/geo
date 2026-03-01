// Chart.js 래퍼 모듈
// renderDemoChart: framework.html의 하드코딩 데모 차트
// renderResultChart: result.html의 실제 데이터 차트

import { PILLAR_LABELS, PILLAR_KEYS } from './pillars-data.js';

// 차트 인스턴스 캐시 (재렌더 방지)
const chartInstances = {};

// 브랜드 이름을 첫 번째 점(P1) 위에 그리는 커스텀 플러그인
const brandLabelPlugin = {
  id: 'brandLabels',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const datasets = chart.data.datasets;

    // 각 데이터셋의 첫 번째 점(P1) 위치 수집
    const points = datasets.map((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (!meta.visible || !meta.data[0]) return null;
      return {
        x: meta.data[0].x,
        y: meta.data[0].y,
        color: dataset.borderColor,
        label: dataset.label
      };
    }).filter(Boolean);

    if (points.length === 0) return;

    // x 위치 기준 정렬 (좌→우)
    points.sort((a, b) => a.x - b.x);

    // 겹침 방지: x 거리가 가까우면 y를 엇갈리게
    const labelYList = points.map((p, i) => {
      let baseY = p.y - 14;
      for (let j = 0; j < i; j++) {
        if (Math.abs(points[j].x - p.x) < 50) {
          baseY = Math.min(baseY, points[j].y - 28 - (i - j - 1) * 14);
        }
      }
      return baseY;
    });

    ctx.save();
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    points.forEach((pt, i) => {
      const text = pt.label;
      const textWidth = ctx.measureText(text).width;
      const x = pt.x;
      const y = labelYList[i];

      // 텍스트 배경 (가독성)
      ctx.fillStyle = 'rgba(248,248,248,0.88)';
      ctx.fillRect(x - textWidth / 2 - 4, y - 13, textWidth + 8, 16);

      // 브랜드명
      ctx.fillStyle = pt.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, x, y);
    });
    ctx.restore();
  }
};

/**
 * 데모 차트 렌더링 (framework.html용 하드코딩 데이터)
 */
export function renderDemoChart(canvasId) {
  if (typeof Chart === 'undefined') {
    setTimeout(() => renderDemoChart(canvasId), 100);
    return;
  }

  const demoData = {
    brands: [
      { brand: '스타벅스', color: '#e74c3c', scores: [9, 9, 8, 9, 8, 7, 8] },
      { brand: '블루보틀', color: '#3498db', scores: [7, 8, 9, 7, 8, 9, 7] },
      { brand: '이디야',   color: '#2ecc71', scores: [8, 6, 7, 7, 6, 5, 8] }
    ]
  };

  _renderChart(canvasId, demoData.brands, true);
}

/**
 * 실제 결과 차트 렌더링 (result.html용)
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

  // 기존 인스턴스 제거
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }

  const datasets = brands.map((b) => ({
    label: b.brand,
    data: b.scores,
    borderColor: b.color,
    backgroundColor: b.color + '18',
    pointBackgroundColor: b.color,
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    pointRadius: 7,
    pointHoverRadius: 10,
    tension: 0.15,
    borderWidth: 2.5,
    clip: false  // 10점 원이 잘리지 않도록
  }));

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: PILLAR_LABELS,
      datasets
    },
    plugins: [brandLabelPlugin],
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { right: 28, top: 36, left: 4, bottom: 4 }
      },
      plugins: {
        legend: {
          display: false  // 커스텀 브랜드 라벨로 대체
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
              if (!isDemo && originalBrands) {
                const brand = originalBrands[ctx.datasetIndex];
                const key = PILLAR_KEYS[ctx.dataIndex];
                const reason = brand?.pillars?.[key]?.reason;
                if (reason) {
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
            color: '#555555',
            font: { size: 12, weight: '500' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.08)'
          }
        },
        y: {
          ticks: {
            color: '#333333',
            font: { size: 12, weight: '600' },
            padding: 8
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });

  chartInstances[canvasId] = chart;
  return chart;
}

/**
 * 아코디언 초기화 (framework.html에서 사용)
 */
export function initAccordion() {
  // framework.html 인라인 스크립트에서 직접 처리
}
