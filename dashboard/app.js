/* ═══════════════════════════════════════════════════════════
   Swiggy PriceOps Dashboard — Application Logic
   ═══════════════════════════════════════════════════════════ */

const D = DASHBOARD_DATA;

/* ── Colour Palette ─────────────────────────────────────── */
const C = {
  orange:     '#fc8019',
  orangeA:    'rgba(252,128,25,0.25)',
  green:      '#60b246',
  greenA:     'rgba(96,178,70,0.25)',
  red:        '#e23744',
  redA:       'rgba(226,55,68,0.15)',
  blue:       '#5d8ed5',
  purple:     '#8b5cf6',
  grey:       '#93959f',
  dark:       '#3d4152',
  border:     '#e9e9eb',
  bgPage:     '#f7f7f8',
};

/* Chart.js global defaults */
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = C.grey;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;

/* ┌──────────────────────────────────────────────────────┐
   │ 1. TAB NAVIGATION                                   │
   └──────────────────────────────────────────────────────┘ */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('tab-' + link.dataset.tab).classList.add('active');
  });
});

/* ┌──────────────────────────────────────────────────────┐
   │ 2. KPI CARDS — OVERVIEW                             │
   └──────────────────────────────────────────────────────┘ */
function renderOverviewKPIs() {
  const f = D.kpis.food;
  const im = D.kpis.im;
  const totalOrders = f.totalOrders + im.totalOrders;
  const totalGMV    = f.gmv + im.gmv;

  const cards = [
    { label: 'Total Orders',       value: fmtNum(totalOrders),      accent: 'orange', delta: 'Combined BLs', cls: 'neutral' },
    { label: 'Total GMV',          value: '₹' + fmtCr(totalGMV),    accent: 'green',  delta: 'All orders',    cls: 'neutral' },
    { label: 'Food Avg AOV',       value: '₹' + fmtNum(f.avgOrderValue),  accent: 'orange', delta: `Take Rate ${f.takeRate}%`, cls: 'neutral' },
    { label: 'IM Avg AOV',         value: '₹' + fmtNum(im.avgOrderValue), accent: 'green',  delta: `Take Rate ${im.takeRate}%`, cls: 'neutral' },
    { label: 'Food Fee Load',      value: f.avgFeeLoad + '%',       accent: 'orange', delta: `${f.dangerZoneRate}% in danger`, cls: f.dangerZoneRate > 25 ? 'negative' : 'positive' },
    { label: 'IM Fee Load',        value: im.avgFeeLoad + '%',      accent: 'green',  delta: `${im.dangerZoneRate}% in danger`, cls: im.dangerZoneRate > 25 ? 'negative' : 'positive' },
    { label: 'Food Surge Hit Rate',value: f.surgeHitRate + '%',     accent: 'red',    delta: 'Orders with surge', cls: 'neutral' },
    { label: 'Food Avg Rating',    value: f.avgRating.toFixed(1),   accent: 'blue',   delta: 'Out of 5',     cls: 'neutral' },
    { label: 'IM Avg Rating',      value: im.avgRating.toFixed(1),  accent: 'blue',   delta: 'Out of 5',     cls: 'neutral' },
    { label: 'Food Repeat %',      value: f.repeatOrderRate + '%',  accent: 'purple', delta: 'Returning users', cls: 'positive' },
  ];

  const grid = document.getElementById('kpi-grid-overview');
  grid.innerHTML = cards.map(c => `
    <div class="kpi-card accent-${c.accent}">
      <span class="kpi-label">${c.label}</span>
      <span class="kpi-value">${c.value}</span>
      <span class="kpi-delta ${c.cls}">${c.delta}</span>
    </div>`).join('');
}

/* ┌──────────────────────────────────────────────────────┐
   │ 3. CHARTS — OVERVIEW                                │
   └──────────────────────────────────────────────────────┘ */
function renderOverviewCharts() {
  // ── Fee Load Distribution ─────────────────────────────
  new Chart(document.getElementById('chart-fee-dist'), {
    type: 'bar',
    data: {
      labels: D.feeLoadDist.food.bins.map(b => b + '%'),
      datasets: [
        { label: 'Food BL', data: D.feeLoadDist.food.counts, backgroundColor: C.orangeA, borderColor: C.orange, borderWidth: 1.5 },
        { label: 'Instamart BL', data: D.feeLoadDist.im.counts, backgroundColor: C.greenA, borderColor: C.green, borderWidth: 1.5 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        annotation: {}
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'Order Count' } }
      }
    },
    plugins: [{
      id: 'dangerLine',
      afterDraw(chart) {
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        // Find the label index closest to 20%
        const idx = D.feeLoadDist.food.bins.findIndex(b => b >= 20);
        if (idx === -1) return;
        const x = xScale.getPixelForValue(idx);
        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(x, yScale.top);
        ctx.lineTo(x, yScale.bottom);
        ctx.stroke();
        ctx.fillStyle = C.red;
        ctx.font = '600 11px Inter';
        ctx.fillText('Danger Zone →', x + 6, yScale.top + 14);
        ctx.restore();
      }
    }]
  });

  // ── Fee Stack Breakdown ───────────────────────────────
  const fs = D.feeStack;
  new Chart(document.getElementById('chart-fee-stack'), {
    type: 'bar',
    data: {
      labels: ['Food Delivery', 'Instamart'],
      datasets: [
        { label: 'Delivery Fee', data: [fs.food['Delivery Fee'], fs.im['Delivery Fee']], backgroundColor: C.orange },
        { label: 'Surge Fee',    data: [fs.food['Surge Fee'],    fs.im['Surge Fee']],    backgroundColor: '#fcaf75' },
        { label: 'Platform Fee', data: [fs.food['Platform Fee'], fs.im['Platform Fee']], backgroundColor: C.dark },
        { label: 'Handling Fee', data: [0,                       fs.im['Handling Fee'] || 0], backgroundColor: C.green },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { color: '#f0f0f0' }, title: { display: true, text: 'INR' } }
      }
    }
  });

  // ── Weather vs Surge ──────────────────────────────────
  const ws = D.weatherSurge;
  new Chart(document.getElementById('chart-weather'), {
    type: 'bar',
    data: {
      labels: ws.map(w => w.rainy_weather === 'Yes' ? '🌧 Rainy' : '☀ Clear'),
      datasets: [
        { label: 'Avg Surge (INR)', data: ws.map(w => w.avg_surge), backgroundColor: [C.orangeA, C.orangeA], borderColor: [C.orange, C.orange], borderWidth: 2 },
        { label: 'Avg Fee Load (%)', data: ws.map(w => w.avg_fee_load), backgroundColor: [C.greenA, C.greenA], borderColor: [C.green, C.green], borderWidth: 2 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f0f0f0' } }
      }
    }
  });

  // ── City-wise Fee Load (Food) ────────────────────────
  if (D.cityAnalysis && D.cityAnalysis.food) {
    const cities = D.cityAnalysis.food;
    const sorted = [...cities].sort((a, b) => b.avg_fee_load - a.avg_fee_load);
    new Chart(document.getElementById('chart-city-fee'), {
      type: 'bar',
      data: {
        labels: sorted.map(c => c.city),
        datasets: [{
          label: 'Avg Fee Load (%)',
          data: sorted.map(c => c.avg_fee_load),
          backgroundColor: sorted.map(c => c.avg_fee_load > 25 ? C.redA : C.orangeA),
          borderColor: sorted.map(c => c.avg_fee_load > 25 ? C.red : C.orange),
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'Fee Load %' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // ── Cuisine Breakdown ─────────────────────────────────
  if (D.cuisineBreakdown) {
    new Chart(document.getElementById('chart-cuisine'), {
      type: 'bar',
      data: {
        labels: D.cuisineBreakdown.map(c => c.cuisine),
        datasets: [{
          label: 'Avg AOV (₹)',
          data: D.cuisineBreakdown.map(c => c.avg_aov),
          backgroundColor: C.orangeA,
          borderColor: C.orange,
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f0f0' }, title: { display: true, text: '₹ AOV' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // ── Category Breakdown (IM) ───────────────────────────
  if (D.categoryBreakdown) {
    new Chart(document.getElementById('chart-category'), {
      type: 'bar',
      data: {
        labels: D.categoryBreakdown.map(c => c.Product_Category),
        datasets: [{
          label: 'Avg AOV (₹)',
          data: D.categoryBreakdown.map(c => c.avg_aov),
          backgroundColor: C.greenA,
          borderColor: C.green,
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#f0f0f0' }, title: { display: true, text: '₹ AOV' } },
          y: { grid: { display: false } }
        }
      }
    });
  }
}

/* ┌──────────────────────────────────────────────────────┐
   │ 4. BL DEEP DIVE (Independent Analysis)              │
   └──────────────────────────────────────────────────────┘ */
function renderComparison() {
  const f = D.kpis.food, im = D.kpis.im;

  const foodRows = [
    ['Avg Order Value', '₹' + f.avgOrderValue],
    ['Avg Total Fees', '₹' + f.avgTotalFees],
    ['Avg Fee Load', f.avgFeeLoad + '%'],
    ['Avg Delivery Fee', '₹' + f.avgDeliveryFee],
    ['Avg Surge Fee', '₹' + f.avgSurgeFee],
    ['Platform Fee', '₹' + f.avgPlatformFee],
    ['Take Rate', f.takeRate + '%'],
    ['Surge Hit Rate', f.surgeHitRate + '%'],
    ['Danger Zone %', f.dangerZoneRate + '%'],
    ['Avg Rating', f.avgRating],
    ['Competes With', 'Zomato, MagicPin'],
  ];
  const imRows = [
    ['Avg Order Value', '₹' + im.avgOrderValue],
    ['Avg Total Fees', '₹' + im.avgTotalFees],
    ['Avg Fee Load', im.avgFeeLoad + '%'],
    ['Avg Delivery Fee', '₹' + im.avgDeliveryFee],
    ['Avg Surge Fee', '₹' + im.avgSurgeFee],
    ['Platform Fee', '₹' + im.avgPlatformFee],
    ['Handling Fee', '₹' + (im.avgHandlingFee || 'N/A')],
    ['Take Rate', im.takeRate + '%'],
    ['Danger Zone %', im.dangerZoneRate + '%'],
    ['Avg Rating', im.avgRating],
    ['Competes With', 'Blinkit, Zepto, BigBasket'],
  ];

  document.getElementById('comparison-grid').innerHTML = `
    <div class="comp-col food">
      <div class="comp-header">
        <div class="comp-icon">F</div>
        <h3>Food Delivery</h3>
      </div>
      ${foodRows.map(([l,v]) => `<div class="comp-row"><span class="comp-row-label">${l}</span><span class="comp-row-value">${v}</span></div>`).join('')}
    </div>
    <div class="comp-col im">
      <div class="comp-header">
        <div class="comp-icon">IM</div>
        <h3>Instamart (Quick-Commerce)</h3>
      </div>
      ${imRows.map(([l,v]) => `<div class="comp-row"><span class="comp-row-label">${l}</span><span class="comp-row-value">${v}</span></div>`).join('')}
    </div>`;

  // City-wise AOV chart - separate charts for each BL
  if (D.cityAnalysis && D.cityAnalysis.food) {
    const foodCities = D.cityAnalysis.food;
    const imCities = D.cityAnalysis.im || [];

    new Chart(document.getElementById('chart-city-aov'), {
      type: 'bar',
      data: {
        labels: foodCities.map(c => c.city),
        datasets: [
          {
            label: 'Food AOV by City',
            data: foodCities.map(c => c.avg_aov),
            backgroundColor: C.orangeA,
            borderColor: C.orange,
            borderWidth: 1.5,
          },
          {
            label: 'Food Fee Load % by City',
            data: foodCities.map(c => c.avg_fee_load),
            backgroundColor: C.redA,
            borderColor: C.red,
            borderWidth: 1.5,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'Value' } }
        }
      }
    });
  }

  // Time analysis chart
  if (D.timeAnalysis) {
    new Chart(document.getElementById('chart-time'), {
      type: 'bar',
      data: {
        labels: D.timeAnalysis.map(t => t.order_time),
        datasets: [
          { label: 'Avg AOV', data: D.timeAnalysis.map(t => t.avg_aov), backgroundColor: C.orangeA, borderColor: C.orange, borderWidth: 1.5, yAxisID: 'y' },
          { label: 'Avg Fee Load %', data: D.timeAnalysis.map(t => t.avg_fee_load), backgroundColor: C.greenA, borderColor: C.green, borderWidth: 1.5, yAxisID: 'y1' },
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { grid: { display: false } },
          y:  { position: 'left',  grid: { color: '#f0f0f0' }, title: { display: true, text: '₹ AOV' } },
          y1: { position: 'right', grid: { display: false },   title: { display: true, text: 'Fee Load %' } },
        }
      }
    });
  }

  // Discount impact chart - AOV and Fee Load instead of ratings
  if (D.discountImpact) {
    new Chart(document.getElementById('chart-discount'), {
      type: 'bar',
      data: {
        labels: D.discountImpact.map(d => d.discount_applied === 'Yes' ? 'Discount Applied' : 'No Discount'),
        datasets: [
          {
            label: 'Avg AOV (Rs.)',
            data: D.discountImpact.map(d => d.avg_aov),
            backgroundColor: [C.greenA, C.orangeA],
            borderColor: [C.green, C.orange],
            borderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Avg Fee Load (%)',
            data: D.discountImpact.map(d => d.avg_fee_load),
            backgroundColor: [C.redA, C.redA],
            borderColor: [C.red, C.red],
            borderWidth: 2,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { grid: { display: false } },
          y:  { position: 'left',  grid: { color: '#f0f0f0' }, title: { display: true, text: 'Rs. AOV' } },
          y1: { position: 'right', grid: { display: false },   title: { display: true, text: 'Fee Load %' } },
        }
      }
    });
  }

  // Insights - framed per BL, not cross-BL comparison
  document.getElementById('comparison-insights').innerHTML = `
    <div class="insight-card warning">
      <h4>Food BL: Weather-Driven Surge Volatility</h4>
      <p>${f.surgeHitRate}% of Food orders are hit by surge pricing. The primary driver is rain. With a take rate of ${f.takeRate}%, surge is a key revenue lever but also a major source of user frustration when applied too aggressively.</p>
    </div>
    <div class="insight-card info">
      <h4>Instamart: Handling Fee as a Structural Cost</h4>
      <p>Unlike food delivery, Instamart carries a Handling Fee (avg ₹${im.avgHandlingFee}) driven by item count and packing complexity. This is a cost that competitors like Blinkit and Zepto also face, making it a key dimension for competitive benchmarking.</p>
    </div>
    <div class="insight-card danger">
      <h4>Instamart: High Danger Zone Exposure</h4>
      <p>${im.dangerZoneRate}% of Instamart orders have total fees exceeding 20% of cart value. For small basket sizes (under ₹300), the compound effect of Delivery + Platform + Handling pushes fees to unsustainable levels.</p>
    </div>`;
}

/* ┌──────────────────────────────────────────────────────┐
   │ 5. SURGE SIMULATOR                                  │
   └──────────────────────────────────────────────────────┘ */
let simChart = null;

function initSimulator() {
  const sb = D.surgeSimBase;
  const cc = D.conversionCurve;

  // Draw initial chart
  simChart = new Chart(document.getElementById('chart-sim-conversion'), {
    type: 'bar',
    data: {
      labels: cc.labels,
      datasets: [
        {
          label: 'Baseline Conversion',
          data: cc.baseConversion.map(v => v * 100),
          backgroundColor: C.orangeA,
          borderColor: C.orange,
          borderWidth: 2,
          order: 2,
        },
        {
          label: 'Simulated Conversion',
          data: cc.baseConversion.map(v => v * 100),
          backgroundColor: C.greenA,
          borderColor: C.green,
          borderWidth: 2,
          order: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { grid: { display: false }, title: { display: true, text: 'Fee Load Bucket' } },
        y: { grid: { color: '#f0f0f0' }, title: { display: true, text: 'Conversion Rate %' }, min: 0, max: 100 }
      }
    }
  });

  // Attach listeners
  ['slider-surge', 'slider-delivery', 'slider-platform'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateSimulator);
  });
  document.getElementById('toggle-cap').addEventListener('change', updateSimulator);

  updateSimulator();
}

function updateSimulator() {
  const surgeMult    = parseFloat(document.getElementById('slider-surge').value);
  const deliveryMult = parseFloat(document.getElementById('slider-delivery').value);
  const platformFee  = parseInt(document.getElementById('slider-platform').value);
  const capEnabled   = document.getElementById('toggle-cap').checked;

  document.getElementById('val-surge').textContent    = surgeMult.toFixed(1) + 'x';
  document.getElementById('val-delivery').textContent = deliveryMult.toFixed(1) + 'x';
  document.getElementById('val-platform').textContent = platformFee;
  document.getElementById('val-cap').textContent      = capEnabled ? 'ON' : 'OFF';

  const sb = D.surgeSimBase;
  const cc = D.conversionCurve;

  // Calculate new fees
  const newDelivery = sb.avgFoodDeliveryFee * deliveryMult;
  const newSurge    = sb.avgFoodSurgeFee * surgeMult;
  const newTotal    = newDelivery + newSurge + platformFee;
  let newFeeLoad    = (newTotal / sb.avgFoodSubtotal) * 100;

  if (capEnabled && newFeeLoad > 20) newFeeLoad = 20;

  // Simulate conversion impact
  const feeShiftRatio = newFeeLoad / D.kpis.food.avgFeeLoad;
  const simConversions = cc.baseConversion.map((base, i) => {
    let adjusted = base;
    if (feeShiftRatio > 1) {
      adjusted = base * Math.pow(0.92, (feeShiftRatio - 1) * (i + 1));
    } else {
      adjusted = Math.min(0.99, base * Math.pow(1.05, (1 - feeShiftRatio) * (i + 1)));
    }
    if (capEnabled && i >= 4) adjusted = Math.min(0.99, adjusted * 1.35);
    return Math.round(adjusted * 1000) / 10;
  });

  simChart.data.datasets[1].data = simConversions;
  simChart.update();

  // Compute revenue impact
  const baseRevPerOrder = D.kpis.food.avgTotalFees;
  const newRevPerOrder  = capEnabled ? Math.min(newTotal, sb.avgFoodSubtotal * 0.2) : newTotal;
  const revDelta = ((newRevPerOrder - baseRevPerOrder) / baseRevPerOrder * 100).toFixed(1);

  // Compute conversion delta
  const baseAvgConv = cc.baseConversion.reduce((a,b) => a+b, 0) / cc.baseConversion.length * 100;
  const simAvgConv  = simConversions.reduce((a,b) => a+b, 0) / simConversions.length;
  const convDelta   = (simAvgConv - baseAvgConv).toFixed(1);

  document.getElementById('sim-kpis').innerHTML = `
    <div class="sim-kpi">
      <span class="kpi-label">Fee Load</span>
      <span class="kpi-value" style="color: ${newFeeLoad > 20 ? C.red : C.green}">${newFeeLoad.toFixed(1)}%</span>
    </div>
    <div class="sim-kpi">
      <span class="kpi-label">Rev / Order</span>
      <span class="kpi-value">₹${newRevPerOrder.toFixed(0)}</span>
    </div>
    <div class="sim-kpi">
      <span class="kpi-label">Rev Δ</span>
      <span class="kpi-value" style="color: ${revDelta >= 0 ? C.green : C.red}">${revDelta > 0 ? '+' : ''}${revDelta}%</span>
    </div>
    <div class="sim-kpi">
      <span class="kpi-label">Conv Δ</span>
      <span class="kpi-value" style="color: ${convDelta >= 0 ? C.green : C.red}">${convDelta > 0 ? '+' : ''}${convDelta}%</span>
    </div>`;
}

/* ┌──────────────────────────────────────────────────────┐
   │ 6. COMPETITIVE BENCHMARKING                         │
   └──────────────────────────────────────────────────────┘ */
function renderCompetitive() {
  const foodData = [
    ['Base Delivery Fee',     '₹25-90 (distance-based)',  '₹25-80 (distance-based)', '₹15-50 (flat zones)'],
    ['Surge Pricing',         'Dynamic (rain + demand)',   'Dynamic (demand-based)',   'Fixed peak-hour fee'],
    ['Platform Fee',          '₹18 flat',                 '₹15 flat',                  '₹10 flat'],
    ['Small Cart Fee',        'Not applied',               '₹30 under ₹200',          '₹20 under ₹150'],
    ['Subscription Discount', 'Swiggy ONE: Free delivery', 'Zomato Gold: Free delivery','None'],
    ['Surge Transparency',    'Low - no breakdown shown',  'Medium - "high demand"',   'Low'],
    ['Fee Cap Logic',         '❌ None',                   '❌ None',                  '❌ None'],
    ['Rain Surge Formula',    'Binary (on/off)',           'Gradient (light/heavy)',    'Not applied'],
  ];

  const qcomData = [
    ['Base Delivery Fee',     '₹15-35 (distance-based)',  '₹15-25 (zone-based)',      '₹10-29 (distance-based)'],
    ['Handling / Packing Fee','₹4-25 (item count)',        '₹6-20 (flat)',             '₹2-15 (cart value)'],
    ['Platform Fee',          '₹18 flat',                  '₹20 flat',                 '₹12 flat'],
    ['Surge Pricing',         'Rush-hour + distance',      'Demand-based',             'Demand + slot-based'],
    ['Small Cart Fee',        'Not applied',               '₹25 under ₹200',          '₹20 under ₹99'],
    ['Free Delivery Threshold','₹199+',                    '₹199+',                   '₹149+'],
    ['Subscription',          'Swiggy ONE',                'Blinkit Plus (planned)',   'Zepto Pass'],
    ['Fee Cap Logic',         '❌ None',                   '❌ None',                  '❌ None'],
  ];

  const foodTbody = document.querySelector('#bench-food tbody');
  foodTbody.innerHTML = foodData.map(row => `
    <tr>${row.map((cell, i) => `<td${i === 1 ? ' style="font-weight:600; color: var(--sw-orange)"' : ''}>${cell}</td>`).join('')}</tr>`).join('');

  const qcomTbody = document.querySelector('#bench-qcom tbody');
  qcomTbody.innerHTML = qcomData.map(row => `
    <tr>${row.map((cell, i) => `<td${i === 1 ? ' style="font-weight:600; color: var(--sw-orange)"' : ''}>${cell}</td>`).join('')}</tr>`).join('');

  document.getElementById('competitive-insights').innerHTML = `
    <div class="insight-card success">
      <h4>✅ Swiggy ONE Advantage</h4>
      <p>Both Food and IM benefit from the unified Swiggy ONE subscription, which competitors (especially MagicPin and Zepto) cannot match in breadth.</p>
    </div>
    <div class="insight-card danger">
      <h4>🚨 Missing Fee Cap</h4>
      <p>No major player implements a smart fee cap. This is a first-mover opportunity for Swiggy to differentiate on pricing transparency and user trust.</p>
    </div>
    <div class="insight-card warning">
      <h4>⚡ Zepto's Aggressive Pricing</h4>
      <p>Zepto undercuts on delivery and handling fees in Q-Com. Swiggy Instamart must counter with value-adds (wider selection, quality) rather than a fee war.</p>
    </div>`;
}

/* ┌──────────────────────────────────────────────────────┐
   │ 7. GAP ANALYSIS & ROADMAP                           │
   └──────────────────────────────────────────────────────┘ */
function renderRoadmap() {
  const gaps = [
    {
      severity: 'critical', label: 'Critical',
      title: 'Compound Fee Cart Abandonment',
      desc: 'No "Smart Cap" logic exists. When Surge + Delivery + Platform + Handling all stack, total fees can exceed 30% of cart value for small IM orders. This drives disproportionate cart abandonment in the ₹100–₹300 cart range.',
      impact: `Impact: ${D.kpis.im.dangerZoneRate}% of IM orders in the Danger Zone`
    },
    {
      severity: 'critical', label: 'Critical',
      title: 'Binary Weather Surge Logic',
      desc: 'The current pricing engine treats weather as a binary: rain or no rain. There is no gradient for "drizzle" vs "heavy storm." This causes either over-surging (losing orders) or under-surging (losing margin) depending on the actual weather severity.',
      impact: 'Impact: Surge revenue leakage estimated 8-12% during moderate weather'
    },
    {
      severity: 'major', label: 'Major',
      title: 'IM Handling Fee Ceiling',
      desc: 'Handling fees cap arbitrarily at ₹25 regardless of items. For bulk orders (30+ items) requiring multiple bags, Swiggy absorbs the packing and runner-capacity cost beyond the cap.',
      impact: 'Impact: Negative unit economics on 15%+ of bulk IM orders'
    },
    {
      severity: 'major', label: 'Major',
      title: 'No Cross-BL Dashboard View',
      desc: 'Category managers for Food and IM use separate dashboards with different metrics definitions. There is no unified "PriceOps" view to compare fee effectiveness across business lines.',
      impact: 'Impact: Siloed decision-making, duplicated effort'
    },
    {
      severity: 'moderate', label: 'Moderate',
      title: 'Fee Transparency Gap',
      desc: 'Users see a lump "Delivery Fee" without understanding the surge, platform, and handling components. Competitors (Zomato) have started showing partial breakdowns, creating a transparency expectation.',
      impact: 'Impact: Lower perceived trust, higher support tickets'
    },
    {
      severity: 'moderate', label: 'Moderate',
      title: 'Missing Small-Cart Fee',
      desc: 'Unlike Zomato (₹30 under ₹200) and Blinkit (₹25 under ₹200), Swiggy does not charge a small cart surcharge. This affects unit economics on low-value orders without providing margin recovery.',
      impact: 'Impact: Subsidy leak on low-AOV orders'
    },
  ];

  document.getElementById('gap-grid').innerHTML = gaps.map(g => `
    <div class="gap-card ${g.severity}">
      <div class="gap-severity">${g.label}</div>
      <h4>${g.title}</h4>
      <p>${g.desc}</p>
      <div class="gap-impact">${g.impact}</div>
    </div>`).join('');

  const roadmap = [
    {
      phase: 'P1', title: 'Holistic Fee Stack Viewer',
      desc: 'Replace individual fee columns in the Pricing Dashboard with a unified "Total Effective Fee %" metric. Category managers see one number that represents the user\'s true cost burden. Add red-amber-green color coding for danger thresholds.',
      tags: ['both', 'Dashboard', 'Quick Win'],
    },
    {
      phase: 'P2', title: 'Smart Cap Engine',
      desc: 'Implement a configurable fee-cap rule: if total fees exceed X% of cart value, automatically subsidize the most elastic component (typically Delivery Fee) to bring the stack below the threshold. Default cap at 20%.',
      tags: ['both', 'Pricing Engine', 'High Impact'],
    },
    {
      phase: 'P3', title: 'Granular Weather Surge Model',
      desc: 'Replace the binary rain/no-rain surge trigger with a 5-tier weather model (Clear → Cloudy → Drizzle → Rain → Storm). Each tier maps to a calibrated surge multiplier. Integrate real-time weather API data.',
      tags: ['food', 'ML/Data', 'Medium Effort'],
    },
    {
      phase: 'P4', title: 'IM Stepped Handling Fee',
      desc: 'Replace flat ₹25 cap with a step function: Tier 1 (1–10 items, ₹4–12), Tier 2 (11–25 items, ₹12–25), Tier 3 (26+ items, ₹25–40). Recovers packing cost on bulk orders while staying fair.',
      tags: ['im', 'Unit Economics', 'Medium Effort'],
    },
    {
      phase: 'P5', title: 'Competitive Price Tracker Module',
      desc: 'Add a tab in the Pricing Dashboard that shows weekly aggregated fee comparisons vs Zomato, Blinkit, and Zepto across top 10 cities. Auto-flag areas where Swiggy\'s fees are >15% higher than nearest competitor.',
      tags: ['both', 'Competitive Intel', 'Long-Term'],
    },
  ];

  document.getElementById('roadmap-timeline').innerHTML = roadmap.map(r => `
    <div class="roadmap-item" data-phase="${r.phase}">
      <div class="rm-phase">Phase ${r.phase.slice(1)}</div>
      <h4>${r.title}</h4>
      <p>${r.desc}</p>
      <div class="rm-tags">
        ${r.tags.map(t => {
          let cls = '';
          if (t === 'food') cls = 'food';
          else if (t === 'im') cls = 'im';
          else if (t === 'both') cls = 'both';
          return `<span class="rm-tag ${cls}">${t === 'food' ? 'Food BL' : t === 'im' ? 'Instamart BL' : t === 'both' ? 'Both BLs' : t}</span>`;
        }).join('')}
      </div>
    </div>`).join('');
}

/* ┌──────────────────────────────────────────────────────┐
   │ HELPERS                                              │
   └──────────────────────────────────────────────────────┘ */
function fmtNum(n) {
  if (typeof n === 'number') return n.toLocaleString('en-IN');
  return n;
}

function fmtCr(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000)   return (n / 100000).toFixed(1) + ' L';
  return n.toLocaleString('en-IN');
}

/* ┌──────────────────────────────────────────────────────┐
   │ INIT                                                 │
   └──────────────────────────────────────────────────────┘ */
document.addEventListener('DOMContentLoaded', () => {
  renderOverviewKPIs();
  renderOverviewCharts();
  renderComparison();
  initSimulator();
  renderCompetitive();
  renderRoadmap();
});
