// Chart.js 래퍼 모듈
// renderDemoChart: framework.html의 하드코딩 데모 차트
// renderResultChart: result.html의 실제 데이터 차트

import { PILLAR_LABELS, PILLAR_KEYS } from './pillars-data.js';

// 차트 인스턴스 캐시 (재렌더 방지)
const chartInstances = {};

// 브랜드 이름을 첫 번째 점(P1) 위에 그리는 커스텀 플러그인
const brandLabelPlugin = {
  id: 'brandLabels',
  afterDraw(chart) {
    const ctx = chart.ctx;
    const datasets = chart.data.datasets;

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

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, chart.canvas.width, chart.canvas.height);
    ctx.clip();
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';

    // 각 라벨 텍스트 너비 측정
    points.forEach(pt => { pt.tw = ctx.measureText(pt.label).width; });

    // x 기준 그룹핑: 10px 이내 = 같은 x 위치로 간주 → 수평 1열 배치
    const groups = [];
    points.forEach(pt => {
      const g = groups.find(g => Math.abs(g.cx - pt.x) < 10);
      if (g) {
        g.items.push(pt);
        g.cx = g.items.reduce((s, p) => s + p.x, 0) / g.items.length;
      } else {
        groups.push({ cx: pt.x, cy: pt.y, items: [pt] });
      }
    });

    // 그룹별 배치: 같은 그룹은 수평으로 펼침, 다른 그룹은 y를 올려 충돌 회피
    const GAP = 8; // 라벨 간 수평 간격
    const placed = [];
    groups.forEach(group => {
      const widths  = group.items.map(p => p.tw);
      const totalW  = widths.reduce((s, w) => s + w, 0) + GAP * (group.items.length - 1);
      const baseY   = Math.max(group.cy - 22, 12);
      let   startX  = group.cx - totalW / 2;

      group.items.forEach((pt, i) => {
        const lx = startX + widths[i] / 2;
        placed.push({ lx, ly: baseY, label: pt.label, color: pt.color, tw: pt.tw });
        startX += widths[i] + GAP;
      });
    });

    // 라벨 렌더링
    placed.forEach(({ lx, ly, label, color, tw }) => {
      const pad = 5;
      const h = 17;
      // 흰 배경 + 브랜드 컬러 테두리
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      ctx.fillRect(lx - tw / 2 - pad, ly - h + 3, tw + pad * 2, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx - tw / 2 - pad, ly - h + 3, tw + pad * 2, h);
      // 텍스트
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, lx, ly);
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

  const chartBrands = brands.map((b, i) => {
    const baseName = b.brand || `브랜드 ${String.fromCharCode(65 + i)}`;
    const labelName = b.ars_max && b.ars_max < 100
      ? `${baseName} (상한 ${b.ars_max}점)`
      : baseName;
    return {
      brand: labelName,
      color: colors[i] || '#999',
      scores: PILLAR_KEYS.map(key => b.pillars?.[key]?.score ?? 0),
      reasons: PILLAR_KEYS.map(key => b.pillars?.[key]?.reason ?? '정보 없음')
    };
  });

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
        padding: { right: 80, top: 56, left: 4, bottom: 4 }
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
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          padding: 12,
          callbacks: {
            label: function(ctx) {
              const lines = [` ${ctx.dataset.label}: ${ctx.raw}점`];
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
              lines.push(''); // 브랜드별 구분 빈 줄
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          afterFit(scale) { scale.paddingRight = 24; },
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
