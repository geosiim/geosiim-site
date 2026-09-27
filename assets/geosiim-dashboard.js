// <geosiim-dashboard> — animação ilustrativa do painel de inteligência territorial.
// Geometria e números inventados. Atributos: speed (multiplicador), freeze-step (0 = ciclo, 1–5 = fixa a etapa).
(() => {
if (customElements.get('geosiim-dashboard')) return;

const W = 600, H = 420, TILT = 50 * Math.PI / 180;
const BLUE = ['#dbe9f7', '#a9cbeb', '#6fa6d9', '#2a78d6', '#174a8c'];
const WARM = ['#fde6cf', '#f9b98a', '#eb6834', '#c24a1c', '#8f3510'];
const NIGHT = ['#1f4f86', '#2a78d6', '#5f9be0', '#9cc3ee', '#dbe9f7'];
const GREY = '#C9D3D7', START = '#EEF2F4', PAT = '#DCE4E7', PUB = '#0E6B7D';
const CAT = ['#2a78d6', '#1baf7a', '#eda100', '#eb6834'];
const CAT_NAMES = ['Educação', 'Saúde', 'Assist. social', 'Cultura/esporte'];
const TABS = ['Visão geral', 'Valores', 'Edificações', 'Idade', 'Terrenos', 'Verticalização', 'Território', 'Infraestrutura', 'Patrimônio'];
const KPI_LABELS = ['Imóveis cadastrados', 'Valor venal total', 'Área construída', 'Área de terrenos', 'Venal mediano/m²', 'Idade média'];
const KPI_FMT = [[0, '', ''], [1, 'R$ ', ' bi'], [1, '', ' mi m²'], [1, '', ' mi m²'], [0, 'R$ ', ''], [0, '', ' anos']];
const KPI_VALS = [
  [48274, 9.8, 6.1, 18.4, 1240, 27],
  [41906, 8.9, 6.1, 12.7, 1310, 27],
  [3482, 1.9, 0.8, 1.1, 2960, 14],
  [48274, 9.8, 6.1, 18.4, 1240, 27],
  [612, 1.2, 0.4, 2.3, 980, 34]
];
const KPI_COV = [[96, 92, 88, 97, 90, 81], [94, 91, 89, 95, 88, 80], [99, 97, 95, 99, 96, 92], [96, 92, 88, 97, 90, 81], [100, 98, 93, 100, 95, 88]];
const STEPS = [{ dur: 4200, tab: 1 }, { dur: 3600, tab: 2 }, { dur: 3600, tab: 2 }, { dur: 4300, tab: 5 }, { dur: 3700, tab: 8 }];

const rng = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb = (c, k = 1) => `rgb(${c[0] * k | 0},${c[1] * k | 0},${c[2] * k | 0})`;
const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const dstr = (p) => 'M' + p.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
const ease = (t) => 1 - Math.pow(1 - t, 3);
function hull(pts) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop(); return lo.concat(up);
}

function genLots() {
  const R = rng(11), COLS = 6, ROWS = 5, ST = 10, nodes = [];
  for (let i = 0; i <= COLS; i++) { nodes[i] = []; for (let j = 0; j <= ROWS; j++) {
    const bx = i === 0 || i === COLS, by = j === 0 || j === ROWS;
    nodes[i][j] = [i * W / COLS + (bx ? 0 : (R() - .5) * 28), j * H / ROWS + (by ? 0 : (R() - .5) * 26)];
  } }
  const lots = [];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    let q = [nodes[i][j], nodes[i + 1][j], nodes[i + 1][j + 1], nodes[i][j + 1]];
    const bcx = q.reduce((s, p) => s + p[0], 0) / 4, bcy = q.reduce((s, p) => s + p[1], 0) / 4;
    q = q.map((p) => { const dx = bcx - p[0], dy = bcy - p[1], d = Math.hypot(dx, dy); return [p[0] + dx / d * ST * .72, p[1] + dy / d * ST * .72]; });
    const [A, B, C, D] = q;
    const P = (u, v) => { const x1 = A[0] + (B[0] - A[0]) * u, y1 = A[1] + (B[1] - A[1]) * u, x2 = D[0] + (C[0] - D[0]) * u, y2 = D[1] + (C[1] - D[1]) * u; return [x1 + (x2 - x1) * v, y1 + (y2 - y1) * v]; };
    const wide = Math.hypot(B[0] - A[0], B[1] - A[1]) > Math.hypot(D[0] - A[0], D[1] - A[1]);
    const k = R() < .5 ? 3 : 4, cuts = [0];
    for (let c = 1; c < k; c++) cuts.push(c / k + (R() - .5) * .12);
    cuts.push(1);
    const mid = .5 + (R() - .5) * .14;
    for (const [a0, a1] of [[0, mid], [mid, 1]]) for (let c = 0; c < k; c++) {
      const b0 = cuts[c], b1 = cuts[c + 1];
      const uv = wide ? [[b0, a0], [b1, a0], [b1, a1], [b0, a1]] : [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
      const base = uv.map(([u, v]) => P(u, v));
      let poly = [];
      base.forEach((p, vi) => {
        const [u, v] = uv[vi], corner = (u === 0 || u === 1) && (v === 0 || v === 1);
        if (corner && R() < .5) {
          const pr = base[(vi + 3) % 4], nx = base[(vi + 1) % 4];
          poly.push([p[0] + (pr[0] - p[0]) * .3, p[1] + (pr[1] - p[1]) * .3], [p[0] + (nx[0] - p[0]) * .3, p[1] + (nx[1] - p[1]) * .3]);
        } else poly.push(p);
      });
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      poly = poly.map((p) => { const dx = cx - p[0], dy = cy - p[1], d = Math.hypot(dx, dy) || 1; return [p[0] + dx / d * .9, p[1] + dy / d * .9]; });
      lots.push({ poly, cx, cy });
    }
  }
  lots.forEach((l) => {
    const { cx: x, cy: y } = l;
    l.v1 = Math.exp(-((x - 330) ** 2 / (2 * 170 ** 2) + (y - 200) ** 2 / (2 * 130 ** 2))) * .75 + .15 * Math.sin(x * .03 + y * .02) + R() * .25;
    l.v2 = (1 - y / H) * .35 + .3 * Math.sin(x * .018 + 1) + R() * .4;
    l.n1 = R() < .07; l.n2 = R() < .05; l.pub = R() < .07;
  });
  const classify = (key, nkey, out) => {
    const vals = lots.filter((l) => !l[nkey]).map((l) => l[key]).sort((a, b) => a - b);
    const th = [.2, .4, .6, .8].map((p) => vals[Math.floor(vals.length * p)]);
    lots.forEach((l) => { l[out] = th.filter((t) => l[key] >= t).length; });
  };
  classify('v1', 'n1', 'c1'); classify('v2', 'n2', 'c2');
  const byV = lots.slice().sort((a, b) => a.v1 - b.v1), cum = [.582, .828, .937, .985, 1.01];
  byV.forEach((l, r) => { const p = r / lots.length; l.fc = cum.findIndex((c) => p < c); l.h = [4, 9, 17, 31, 56][l.fc] + R() * 4; });
  lots.forEach((l) => { l.pass = !l.n2 && l.c2 >= 3 && l.c1 >= 3; });
  lots.sort((a, b) => a.cy - b.cy);
  const anchors = [[80, 70], [260, 55], [480, 85], [150, 205], [370, 180], [540, 250], [220, 350], [440, 345]];
  const donuts = anchors.map(([ax, ay]) => {
    const l = lots.reduce((b, c) => (Math.hypot(c.cx - ax, c.cy - ay) < Math.hypot(b.cx - ax, b.cy - ay) ? c : b));
    let counts = CAT.map(() => Math.floor(R() * 6));
    if (counts.filter((c) => c > 0).length < 2) counts = [2, 1, counts[2] + 1, counts[3]];
    return { x: l.cx, y: l.cy, counts };
  });
  const stat = (ck, nk) => { const n = lots.length, out = [0, 0, 0, 0, 0, 0]; lots.forEach((l) => { out[l[nk] ? 5 : l[ck]]++; }); return out.map((c) => c / n * 100); };
  return { lots, donuts, s1: stat('c1', 'n1'), s2: stat('c2', 'n2') };
}

const CSS = `
:host{display:block;height:100%;font-family:var(--font-body,'Barlow',system-ui,sans-serif);color:#16222B}
*{box-sizing:border-box}
.app{height:100%;display:flex;flex-direction:column;border:1px solid #DBE3E6;border-right:0;border-radius:10px 0 0 10px;background:#FFFFFF;box-shadow:0 6px 24px rgba(11,63,73,.10);overflow:hidden}
.bar,.tabs,.kpis{flex:none}
.bar{display:flex;align-items:center;gap:10px;height:30px;padding:0 12px;background:#F7F9FA;border-bottom:1px solid #DBE3E6;font-size:11px;color:#55666F;white-space:nowrap}
.dots{display:flex;gap:5px}.dots i{width:8px;height:8px;border-radius:50%;background:#DBE3E6}
.ttl{font-weight:600;color:#0B3F49;overflow:hidden;text-overflow:ellipsis}
.muni{margin-left:auto}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
.tabs{position:relative;display:flex;gap:2px;overflow:hidden;border-bottom:1px solid #DBE3E6;padding:0 6px}
.tab{flex:none;padding:9px 9px 8px;font-size:11px;font-weight:600;color:#55666F;white-space:nowrap;transition:color .6s}
.tab.on{color:#0B3F49}
.ind{position:absolute;bottom:0;left:0;height:2px;background:#0E6B7D;transition:left .7s cubic-bezier(.4,0,.2,1),width .7s cubic-bezier(.4,0,.2,1)}
.kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid #DBE3E6}
.kpi{padding:9px 10px 10px;border-left:1px solid #DBE3E6;min-width:0}
.kpi:first-child{border-left:0}
.kl{font-size:9px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#55666F;line-height:1.25;min-height:23px}
.kv{font-size:15px;font-weight:500;color:#0B3F49;margin-top:3px;white-space:nowrap;overflow:hidden}
.kb{height:3px;background:#EEF2F4;margin-top:7px}
.kb i{display:block;height:100%;background:#0E6B7D;transition:width .7s ease}
.body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 188px}
.mapw{position:relative;min-height:220px;background:#FFFFFF;transition:background-color .7s ease;overflow:hidden}
.mapw.dark{background:#0F1A20}
svg{display:block;width:100%;height:auto}
.mapw>svg{position:absolute;inset:0;height:100%}
.chip{position:absolute;top:10px;left:10px;padding:5px 9px;background:#FFFFFF;border:1px solid #DBE3E6;border-radius:6px;box-shadow:0 6px 24px rgba(11,63,73,.10);font-size:11px;opacity:0;transform:translateY(-4px);transition:opacity .6s,transform .6s}
.chip.on{opacity:1;transform:none}
.chip b{font-weight:600;color:#0B3F49}
.ruler{position:absolute;left:14px;top:22%;height:46%;width:40px;opacity:0;transition:opacity .7s;color:#DBE3E6;font-size:10px}
.ruler.on{opacity:1}
.ruler .ln{position:absolute;left:0;top:0;bottom:0;border-left:1px solid rgba(255,255,255,.55)}
.ruler .tk{position:absolute;left:0;display:flex;align-items:center;gap:4px;transform:translateY(-50%)}
.ruler .tk::before{content:"";width:6px;border-top:1px solid rgba(255,255,255,.55)}
.ruler .cap{position:absolute;left:0;top:-17px;letter-spacing:.07em;text-transform:uppercase;font-size:9px;font-weight:600}
.side{border-left:1px solid #DBE3E6;padding:10px 10px 12px;display:flex;flex-direction:column;gap:14px;min-width:0}
.st{font-size:9px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#55666F;margin-bottom:7px;transition:opacity .4s}
.lg{display:flex;flex-direction:column;gap:5px}
.lr{display:flex;align-items:flex-start;gap:6px;font-size:10.5px;line-height:1.2;opacity:0;transform:translateX(6px);transition:opacity .45s,transform .45s}
.lr.in{opacity:1;transform:none}
.sw{width:10px;height:10px;flex:none;border-radius:2px;margin-top:1px}
.lr .t{min-width:0}
.lr .pc{margin-left:auto;font-size:10px;color:#0B3F49;padding-left:4px;white-space:nowrap}
.bars{display:flex;flex-direction:column;gap:6px}
.bl{display:flex;justify-content:space-between;gap:4px;font-size:10px;line-height:1.2}
.bl .t{min-width:0}
.bt{height:5px;background:#EEF2F4;margin-top:2px}
.bt i{display:block;height:100%;width:0;background:#0E6B7D;transition:width .7s ease}
.narrow .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}
.narrow .kpi:nth-child(4){border-left:0}
.narrow .kpi:nth-child(n+4){border-top:1px solid #DBE3E6}
.narrow .body{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}
.narrow .side{border-left:0;border-top:1px solid #DBE3E6;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}
.narrow .muni{display:none}
.narrow .kv{font-size:12.5px}
.narrow .kpi{padding:8px 8px 9px}
.don{opacity:0;transform:scale(.4);transform-box:fill-box;transform-origin:center;transition:opacity .5s ease,transform .55s cubic-bezier(.3,1.4,.5,1)}
.don.on{opacity:1;transform:none}
`;
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sv = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

class GeosiimDashboard extends HTMLElement {
  static get observedAttributes() { return ['speed', 'freeze-step', 'freezestep']; }
  constructor() {
    super();
    this._speed = 1; this._freeze = 0;
    this.frame = this.frame.bind(this);
  }
  set speed(v) { const n = parseFloat(v); this._speed = n > 0 ? n : 1; }
  get speed() { return this._speed; }
  set freezeStep(v) { this._setFreeze(v); }
  get freezeStep() { return this._freeze; }
  attributeChangedCallback(name, o, v) { if (name === 'speed') this.speed = v; else this._setFreeze(v); }
  _setFreeze(v) {
    const n = parseInt(v, 10), f = n >= 1 && n <= 5 ? n : 0;
    if (f === this._freeze) return;
    this._freeze = f;
    if (this.ready) { this.enter(f ? f - 1 : 0); if (this.reduced) this.settle(); }
  }

  connectedCallback() {
    if (this.ready) return;
    this.ready = true;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>`;
    const data = genLots();
    Object.assign(this, data);
    this.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.build(root);
    this.time = 0; this.local = 0; this.tweens = [];
    this.tilt = 0; this.tiltT = 0;
    this.lots.forEach((l) => { l.col = hex(START); l.colT = l.col.slice(); l.op = 1; l.opT = 1; l.hc = 0; l.hT = 0; l.pend = null; });
    this.visible = true;
    this.enter(this._freeze ? this._freeze - 1 : 0);
    if (this.reduced) { this.settle(); return; }
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(this);
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; this.sync(); });
      this.io.observe(this);
    }
    this.onVis = () => this.sync();
    document.addEventListener('visibilitychange', this.onVis);
    this.sync();
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.raf); this.raf = null;
    if (this.ro) this.ro.disconnect();
    if (this.io) this.io.disconnect();
    if (this.onVis) document.removeEventListener('visibilitychange', this.onVis);
  }
  sync() {
    const run = this.visible && !document.hidden && !this.reduced;
    if (run && !this.raf) { this.last = null; this.raf = requestAnimationFrame(this.frame); }
    if (!run && this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
  }

  build(root) {
    const app = this.app = el('div', 'app');
    app.setAttribute('aria-hidden', 'true');
    app.innerHTML = `<div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="ttl">GEOSIIM · Inteligência territorial</span><span class="muni">Município exemplo · <span class="mono">2026</span></span></div>`;
    const tabs = this.tabsEl = el('div', 'tabs');
    this.tabEls = TABS.map((t) => { const e = el('span', 'tab', t); tabs.appendChild(e); return e; });
    this.ind = el('span', 'ind'); tabs.appendChild(this.ind);
    app.appendChild(tabs);
    const kp = el('div', 'kpis');
    this.kpis = KPI_LABELS.map((lab, i) => {
      const k = el('div', 'kpi', `<div class="kl">${lab}</div><div class="kv mono"></div><div class="kb"><i></i></div>`);
      kp.appendChild(k);
      const o = { v: KPI_VALS[0][i], vEl: k.querySelector('.kv'), bEl: k.querySelector('.kb i'), i };
      this.paintKpi(o);
      return o;
    });
    app.appendChild(kp);
    const body = el('div', 'body');
    const mapw = this.mapw = el('div', 'mapw');
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice' });
    const gl = sv('g', {});
    this.lots.forEach((l) => {
      const g = sv('g', {}); l.wall = sv('path', {}); l.top = sv('path', {});
      g.appendChild(l.wall); g.appendChild(l.top); gl.appendChild(g); l.g = g;
    });
    svg.appendChild(gl);
    const gd = sv('g', {});
    this.donEls = this.donuts.map((d) => {
      const g = sv('g', { class: 'don' }); const r = 13, C = 2 * Math.PI * r, tot = d.counts.reduce((a, b) => a + b, 0);
      g.appendChild(sv('circle', { cx: d.x, cy: d.y, r: r + 5, fill: '#FFFFFF', stroke: '#DBE3E6', 'stroke-width': 1 }));
      let off = 0;
      d.counts.forEach((c, ci) => {
        if (!c) return;
        const len = c / tot * C;
        g.appendChild(sv('circle', { cx: d.x, cy: d.y, r, fill: 'none', stroke: CAT[ci], 'stroke-width': 6, 'stroke-dasharray': `${Math.max(len - 1.2, .5)} ${C}`, 'stroke-dashoffset': -off, transform: `rotate(-90 ${d.x} ${d.y})` }));
        off += len;
      });
      const t = sv('text', { x: d.x, y: d.y + 3.6, 'text-anchor': 'middle', fill: '#0B3F49', 'font-size': 10.5, 'font-weight': 600, 'font-family': "'IBM Plex Mono',ui-monospace,monospace" });
      t.textContent = tot; g.appendChild(t);
      gd.appendChild(g); return g;
    });
    svg.appendChild(gd);
    mapw.appendChild(svg);
    this.chip = el('div', 'chip', `<b class="mono">48.274</b> de <span class="mono">48.274</span> imóveis`);
    this.chipN = this.chip.querySelector('b');
    mapw.appendChild(this.chip);
    this.ruler = el('div', 'ruler', `<span class="cap">Pav.</span><span class="ln"></span><span class="tk mono" style="top:100%">0</span><span class="tk mono" style="top:50%">12</span><span class="tk mono" style="top:0">24</span>`);
    mapw.appendChild(this.ruler);
    body.appendChild(mapw);
    const side = el('div', 'side');
    const a = el('div'); this.lgT = el('div', 'st'); this.lg = el('div', 'lg'); a.append(this.lgT, this.lg);
    const b = el('div'); this.brT = el('div', 'st'); this.br = el('div', 'bars'); b.append(this.brT, this.br);
    side.append(a, b); body.appendChild(side);
    app.appendChild(body);
    root.appendChild(app);
    this.layout();
  }
  layout() {
    const w = this.getBoundingClientRect().width;
    this.app.classList.toggle('narrow', w > 0 && w < 540);
    this.placeInd(false);
  }
  placeInd(smooth) {
    const t = this.tabEls[this.tab || 0];
    this.ind.style.left = t.offsetLeft + 'px'; this.ind.style.width = t.offsetWidth + 'px';
    const target = Math.max(0, t.offsetLeft - 40);
    if (this.tabsEl.scrollTo) this.tabsEl.scrollTo({ left: target, behavior: smooth && !this.reduced ? 'smooth' : 'auto' });
  }
  paintKpi(o) {
    const [d, pre, suf] = KPI_FMT[o.i];
    o.vEl.textContent = pre + fmt(o.v, d) + suf;
  }
  tween(from, to, dur, apply, delay = 0) { this.tweens.push({ from, to, dur, apply, t0: this.time + delay }); }

  side(kind) {
    let title, rows, btitle, bars;
    if (kind === 'A') {
      title = 'Valor venal por m²';
      rows = ['até R$ 600', 'R$ 600 – 950', 'R$ 950 – 1.400', 'R$ 1.400 – 2.100', 'acima de R$ 2.100', 'Sem informação']
        .map((t, i) => [i < 5 ? BLUE[i] : GREY, t, fmt(this.s1[i], 1) + '%']);
      btitle = 'Imóveis por uso'; bars = [['Residencial', 71], ['Comercial', 16], ['Misto', 7], ['Serviços', 4], ['Outros', 2]];
    } else if (kind === 'B') {
      title = 'Área construída (m²)';
      rows = ['até 70', '70 – 120', '120 – 200', '200 – 350', 'acima de 350', 'Sem informação']
        .map((t, i) => [i < 5 ? WARM[i] : GREY, t, fmt(this.s2[i], 1) + '%']);
      btitle = 'Padrão construtivo'; bars = [['Baixo', 22], ['Médio-baixo', 31], ['Médio', 28], ['Médio-alto', 13], ['Alto', 6]];
    } else if (kind === 'C') {
      title = 'Pavimentos';
      rows = ['1', '2', '3 – 4', '5 – 8', '9 ou mais'].map((t, i) => [NIGHT[i], t, fmt([58.2, 24.6, 10.9, 4.8, 1.5][i], 1) + '%']);
      btitle = 'Com 3 ou mais pavimentos'; bars = [['Centro', 34], ['Norte', 12], ['Sul', 9], ['Leste', 7], ['Oeste', 5]];
    } else {
      title = 'Equipamentos públicos';
      const tot = CAT.map((_, ci) => this.donuts.reduce((s, d) => s + d.counts[ci], 0));
      rows = CAT_NAMES.map((t, i) => [CAT[i], t, String(tot[i])]);
      btitle = 'Imóveis públicos por uso'; bars = [['Escolas', 38], ['Unidades de saúde', 21], ['Praças', 19], ['Administração', 14], ['Outros', 8]];
    }
    this.lgT.textContent = title; this.brT.textContent = btitle;
    this.lg.innerHTML = ''; this.br.innerHTML = '';
    const lr = rows.map(([c, t, p]) => {
      const r = el('div', 'lr', `<span class="sw" style="background:${c}"></span><span class="t">${t}</span><span class="pc mono">${p}</span>`);
      this.lg.appendChild(r); return r;
    });
    const max = Math.max(...bars.map((b) => b[1]));
    const bi = bars.map(([t, v]) => {
      const r = el('div', '', `<div class="bl"><span class="t">${t}</span><span class="mono">${v}${kind === 'C' ? '%' : kind === 'D' ? '%' : '%'}</span></div><div class="bt"><i></i></div>`);
      this.br.appendChild(r); return [r.querySelector('.bt i'), v / max * 100];
    });
    if (this.reduced) { lr.forEach((r) => { r.style.transition = 'none'; r.classList.add('in'); }); bi.forEach(([i, w]) => { i.style.transition = 'none'; i.style.width = w + '%'; }); return; }
    lr.forEach((r, i) => setTimeout(() => r.classList.add('in'), 80 + i * 110));
    requestAnimationFrame(() => requestAnimationFrame(() => bi.forEach(([i, w]) => { i.style.width = w + '%'; })));
  }

  enter(i) {
    this.step = i; this.local = 0;
    const R = rng(100 + i);
    this.tab = STEPS[i].tab;
    this.tabEls.forEach((t, k) => t.classList.toggle('on', k === this.tab));
    this.placeInd(true);
    this.kpis.forEach((o, k) => {
      const to = KPI_VALS[i][k]; o.bEl.style.width = KPI_COV[i][k] + '%';
      if (this.reduced) { o.v = to; this.paintKpi(o); return; }
      this.tween(o.v, to, 750, (v) => { o.v = v; this.paintKpi(o); });
    });
    const set = (fn) => this.lots.forEach((l) => { l.pend = fn(l); });
    const lens = i === 0 ? 'A' : i <= 2 ? 'B' : i === 3 ? 'C' : 'D';
    if (lens !== this.lens) { this.lens = lens; this.side(lens); }
    if (i !== 2) this.chip.classList.remove('on');
    if (i !== 3) { this.ruler.classList.remove('on'); this.mapw.classList.remove('dark'); this.tiltT = 0; }
    if (i !== 4) this.donEls.forEach((d) => d.classList.remove('on'));
    if (i === 0) {
      set((l) => ({ at: 150 + l.cx / W * 1300 + R() * 180, col: l.n1 ? GREY : BLUE[l.c1], op: 1, h: 0 }));
    } else if (i === 1) {
      set((l) => ({ at: l.cx / W * 600 + R() * 120, col: l.n2 ? GREY : WARM[l.c2], op: 1, h: 0 }));
    } else if (i === 2) {
      this.chip.classList.add('on');
      if (this.reduced) this.chipN.textContent = fmt(3482, 0);
      else this.tween(48274, 3482, 900, (v) => { this.chipN.textContent = fmt(Math.round(v), 0); }, 200);
      set((l) => ({ at: 250 + R() * 400, col: l.n2 ? GREY : WARM[l.c2], op: l.pass ? 1 : .15, h: 0 }));
    } else if (i === 3) {
      this.mapw.classList.add('dark'); this.tiltT = TILT;
      setTimeout(() => this.step === 3 && this.ruler.classList.add('on'), this.reduced ? 0 : 600);
      set((l) => ({ at: 350 + (l.cy / H) * 700, col: NIGHT[l.fc], op: 1, h: l.h }));
    } else {
      set((l) => ({ at: l.cx / W * 300, col: l.pub ? PUB : PAT, op: 1, h: 0 }));
      this.donEls.forEach((d, k) => setTimeout(() => this.step === 4 && d.classList.add('on'), this.reduced ? 0 : 900 + k * 130));
    }
  }
  applyPend(l) {
    const p = l.pend; if (!p) return;
    if (p.col) l.colT = hex(p.col);
    if (p.op != null) l.opT = p.op;
    if (p.h != null) l.hT = p.h;
    l.pend = null;
  }
  settle() {
    this.lots.forEach((l) => { this.applyPend(l); l.col = l.colT.slice(); l.op = l.opT; l.hc = l.hT; });
    this.tilt = this.tiltT; this.render();
  }
  frame(now) {
    const dt = this.last == null ? 16 : Math.min(50, now - this.last);
    this.last = now;
    const d = dt * this._speed;
    this.time += d; this.local += d;
    if (!this._freeze && this.local >= STEPS[this.step].dur) this.enter((this.step + 1) % STEPS.length);
    this.tweens = this.tweens.filter((t) => {
      const p = (this.time - t.t0) / t.dur; if (p < 0) return true;
      t.apply(t.from + (t.to - t.from) * ease(Math.min(1, p))); return p < 1;
    });
    const kc = 1 - Math.exp(-d / 150), kh = 1 - Math.exp(-d / 210), kt = 1 - Math.exp(-d / 260);
    this.lots.forEach((l) => {
      if (l.pend && this.local >= l.pend.at) this.applyPend(l);
      for (let c = 0; c < 3; c++) l.col[c] += (l.colT[c] - l.col[c]) * kc;
      l.op += (l.opT - l.op) * kc; l.hc += (l.hT - l.hc) * kh;
    });
    this.tilt += (this.tiltT - this.tilt) * kt;
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  }
  render() {
    const sT = Math.sin(this.tilt), cT = Math.cos(this.tilt), kz = this.tilt / TILT, zoom = 1 - .1 * kz, offY = 30 * kz;
    const proj = (x, y, h) => { const dy = y - H / 2, f = 900 / (900 - dy * sT); return [W / 2 + (x - W / 2) * f * zoom, H / 2 + offY + (dy * cT - h * sT) * f * zoom]; };
    this.lots.forEach((l) => {
      const base = l.poly.map((p) => proj(p[0], p[1], 0));
      const lift = l.hc * sT;
      let top = base;
      if (lift > .4) {
        top = l.poly.map((p) => proj(p[0], p[1], l.hc));
        l.wall.setAttribute('d', dstr(hull(base.concat(top))));
        l.wall.setAttribute('fill', rgb(l.col, .6));
      } else l.wall.setAttribute('d', '');
      l.top.setAttribute('d', dstr(top));
      l.top.setAttribute('fill', rgb(l.col));
      l.g.setAttribute('opacity', l.op.toFixed(3));
    });
  }
}
customElements.define('geosiim-dashboard', GeosiimDashboard);
})();
