// ===== INTRO STRIPE ANIMATION =====
(function () {
  const STRIPE_COUNT = 8;
  const STAGGER_MS   = 70;   // 各ストライプの遅延間隔
  const SLIDE_MS     = 880;  // スライドにかかる時間
  const EASING       = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const START_DELAY  = 200;  // ページ読み込み後の待機時間

  const overlay = document.getElementById('intro-overlay');
  const stripes  = [];

  // ストライプを動的生成（均等幅 + 斜め分の余白）
  for (let i = 0; i < STRIPE_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'stripe';
    el.style.left  = `${i * (100 / STRIPE_COUNT) - 6}%`;
    el.style.width = `${100 / STRIPE_COUNT + 12}%`;
    overlay.appendChild(el);
    stripes.push(el);
  }

  // アニメーション開始
  setTimeout(() => {
    stripes.forEach((stripe, i) => {
      setTimeout(() => {
        stripe.style.transition = `transform ${SLIDE_MS}ms ${EASING}`;
        // 偶数→上へ、奇数→下へ スライドアウト
        stripe.classList.add(i % 2 === 0 ? 'out-up' : 'out-down');
      }, i * STAGGER_MS);
    });

    // 全ストライプ終了後にオーバーレイを除去
    const total = START_DELAY + STRIPE_COUNT * STAGGER_MS + SLIDE_MS + 100;
    setTimeout(() => overlay.remove(), total - START_DELAY);
  }, START_DELAY);
})();

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== SCROLL FADE-IN =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.profile-grid, .profile-quote, .roots-card, .timeline-item, .stat-card, .news-card, .gallery-item, .message-form-wrap'
).forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  observer.observe(el);
});

// ===== STATS COUNTER ANIMATION =====
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      const isDecimal = el.classList.contains('stat-decimal');
      const duration = 1600;
      const start = performance.now();

      const animate = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        if (isDecimal) {
          el.textContent = '.' + String(current).padStart(3, '0');
        } else {
          el.textContent = current.toLocaleString();
        }
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
statNumbers.forEach(el => statsObserver.observe(el));

// ===== FAN MESSAGE FORM =====
const messageForm = document.getElementById('messageForm');
const fanName = document.getElementById('fanName');
const fanMessage = document.getElementById('fanMessage');
const charCount = document.getElementById('charCount');
const messagesBoard = document.getElementById('messagesBoard');

fanMessage.addEventListener('input', () => {
  charCount.textContent = fanMessage.value.length;
  charCount.style.color = fanMessage.value.length >= 180 ? '#ff6b35' : '';
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = fanName.value.trim() || '匿名のファン';
  const text = fanMessage.value.trim();
  if (!text) return;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = `
    <p class="msg-text">${escapeHtml(text)}</p>
    <p class="msg-author">— ${escapeHtml(name)}</p>
  `;
  messagesBoard.prepend(bubble);
  fanName.value = '';
  fanMessage.value = '';
  charCount.textContent = '0';

  bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== RADAR CHART =====
(function () {
  const PLAYER_DATA = [
    { label: '打撃力',   value: 72, icon: '⚾' },
    { label: '走力',     value: 85, icon: '🏃' },
    { label: '守備力',   value: 78, icon: '🧤' },
    { label: '肩の強さ', value: 80, icon: '💪' },
    { label: '勝負強さ', value: 68, icon: '🔥' },
  ];
  const MAX = 100;
  const N = PLAYER_DATA.length;

  // ── SVGヘルパー ──
  const ns = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };

  // ── 座標計算 ──
  const CX = 210, CY = 215, R = 150;
  const angle = i => (Math.PI * 2 * i / N) - Math.PI / 2;
  const pt = (i, ratio) => ({
    x: CX + R * ratio * Math.cos(angle(i)),
    y: CY + R * ratio * Math.sin(angle(i)),
  });

  // ── グリッド描画 ──
  function buildGrid(svg) {
    const LEVELS = 5;
    const g = svgEl('g', {});

    // 同心五角形グリッド
    for (let l = 1; l <= LEVELS; l++) {
      const ratio = l / LEVELS;
      const points = Array.from({ length: N }, (_, i) => {
        const p = pt(i, ratio);
        return `${p.x},${p.y}`;
      }).join(' ');
      g.appendChild(svgEl('polygon', {
        points,
        fill: l === LEVELS ? 'rgba(255,215,0,0.03)' : 'none',
        stroke: l === LEVELS ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.1)',
        'stroke-width': l === LEVELS ? '1.5' : '1',
      }));
    }

    // 軸線
    for (let i = 0; i < N; i++) {
      const p = pt(i, 1);
      g.appendChild(svgEl('line', {
        x1: CX, y1: CY, x2: p.x, y2: p.y,
        stroke: 'rgba(255,255,255,0.12)', 'stroke-width': '1',
      }));
    }

    // グリッド目盛り数値
    [25, 50, 75, 100].forEach(v => {
      const p = pt(0, v / MAX);
      g.appendChild(Object.assign(
        svgEl('text', { x: p.x + 4, y: p.y - 3, fill: 'rgba(255,255,255,0.3)', 'font-size': '9', 'font-family': 'Oswald,sans-serif' }),
        { textContent: v }
      ));
    });

    svg.appendChild(g);
  }

  // ── データポリゴン・ドット・ラベル（アニメーション対象） ──
  function buildData(svg) {
    // データポリゴン
    const polygon = svgEl('polygon', {
      points: Array(N).fill(`${CX},${CY}`).join(' '),
      fill: 'rgba(255,215,0,0.2)',
      stroke: '#FFD700',
      'stroke-width': '2.5',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    });
    svg.appendChild(polygon);

    // ドット
    const dots = PLAYER_DATA.map(() => {
      const c = svgEl('circle', { cx: CX, cy: CY, r: '5', fill: '#FFD700', stroke: '#111118', 'stroke-width': '2', opacity: '0' });
      svg.appendChild(c);
      return c;
    });

    // ラベル
    const OFFSET = 22;
    const labelEls = PLAYER_DATA.map((d, i) => {
      const p = pt(i, 1);
      const dx = p.x - CX, dy = p.y - CY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const lx = p.x + (dx / len) * OFFSET;
      const ly = p.y + (dy / len) * OFFSET;
      const anchor = Math.abs(dx) < 8 ? 'middle' : dx > 0 ? 'start' : 'end';

      const g = svgEl('g', { opacity: '0' });

      const name = svgEl('text', { x: lx, y: ly - 4, 'text-anchor': anchor, fill: 'rgba(255,255,255,0.9)', 'font-size': '12.5', 'font-family': 'Noto Sans JP,sans-serif', 'font-weight': '700' });
      name.textContent = d.label;

      const val = svgEl('text', { x: lx, y: ly + 13, 'text-anchor': anchor, fill: '#FFD700', 'font-size': '13', 'font-family': 'Oswald,sans-serif', 'font-weight': '700' });
      val.textContent = d.value;

      g.appendChild(name);
      g.appendChild(val);
      svg.appendChild(g);
      return g;
    });

    return { polygon, dots, labelEls };
  }

  // ── アニメーション ──
  function animate({ polygon, dots, labelEls }) {
    const DURATION = 1300;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    let start = null;

    function frame(ts) {
      if (!start) start = ts;
      const p = easeOutCubic(Math.min((ts - start) / DURATION, 1));

      // ポリゴン頂点を中心→最終位置へ補間
      const pts = PLAYER_DATA.map((d, i) => {
        const pos = pt(i, (d.value / MAX) * p);
        return `${pos.x},${pos.y}`;
      }).join(' ');
      polygon.setAttribute('points', pts);

      // ドット
      dots.forEach((dot, i) => {
        const pos = pt(i, (PLAYER_DATA[i].value / MAX) * p);
        dot.setAttribute('cx', pos.x);
        dot.setAttribute('cy', pos.y);
        dot.setAttribute('opacity', p);
      });

      // ラベル（60%以降でフェードイン）
      if (p > 0.6) {
        const lp = Math.min((p - 0.6) / 0.4, 1);
        labelEls.forEach(l => l.setAttribute('opacity', lp));
      }

      if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ── 初期化 ──
  const svg = document.getElementById('radarChart');
  if (!svg) return;
  buildGrid(svg);
  const parts = buildData(svg);

  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animate(parts);
      io.unobserve(svg);
    }
  }, { threshold: 0.3 });
  io.observe(svg);

  // ── バーリスト ──
  const barList = document.getElementById('barList');
  if (barList) {
    PLAYER_DATA.forEach(d => {
      const item = document.createElement('div');
      item.className = 'bar-item';
      item.innerHTML = `
        <div class="bar-header">
          <span class="bar-icon">${d.icon}</span>
          <span class="bar-label">${d.label}</span>
          <span class="bar-value">${d.value}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="--target-width:${d.value}%"></div>
        </div>`;
      barList.appendChild(item);
    });

    const barIo = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        barList.querySelectorAll('.bar-fill').forEach((b, i) => {
          setTimeout(() => b.classList.add('animate'), i * 120);
        });
        barIo.unobserve(barList);
      }
    }, { threshold: 0.3 });
    barIo.observe(barList);
  }
})();

// ===== SMOOTH ACTIVE NAV =====
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => activeObserver.observe(s));
