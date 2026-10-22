document.addEventListener('DOMContentLoaded', () => {
  const bgImages = document.querySelectorAll('.bg-image');
  const heroSection = document.querySelector('.hero-section');
  const heroStage = document.getElementById('hero-masthead');
  const fadeMask = document.getElementById('fade-mask');
  const progressIndicator = document.getElementById('progress-indicator');
  const infoSection = document.getElementById('info-section');
  const infoDim = document.getElementById('info-dim');
  const rolesGrid = document.getElementById('roles-grid');
  const actionArea = document.getElementById('action-area');

  const dwell = document.getElementById('p2-dwell');
  const pageThree = document.getElementById('page-three');
  const stage = document.getElementById('p3-stage');
  const lantern = document.getElementById('p3-lantern');
  const fogA = document.getElementById('fog-a');
  const fogB = document.getElementById('fog-b');
  const tearBase = document.getElementById('tear-base');
  const tearFibre = document.getElementById('tear-fibre');
  const cases = Array.from(document.querySelectorAll('.case'));
  const ticks = Array.from(document.querySelectorAll('.tick'));
  const segFills = Array.from(document.querySelectorAll('.seg i'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  heroStage.classList.add('loaded');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  let currentIndex = 0;
  setInterval(() => {
    bgImages[currentIndex].classList.remove('active');
    bgImages[currentIndex].style.zIndex = '0';
    currentIndex = (currentIndex + 1) % bgImages.length;
    const newBg = bgImages[currentIndex];
    newBg.style.zIndex = '1';
    newBg.classList.add('active');
  }, 5000);

  const buildTear = () => {
    const rand = mulberry32(1888);
    const n = 300; 
    const base = [];
    const fibre = [];
    let drift = 0;
    
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      drift = drift * 0.8 + (rand() - 0.5) * 6;
      const wave = Math.sin(t * Math.PI * 18) * 2 + Math.sin(t * Math.PI * 45 + 1.3) * 1.5;
      const jag = (rand() - 0.5) * 8;
      let y = clamp(50 + wave + drift + jag, 15, 85);
      
      if (rand() > 0.94) {
        y = clamp(y - (rand() * 15 + 5), 5, 85);
      }
      base.push([t * 100, y]);
      
      let fY = y - (1 + rand() * 4);
      if (rand() > 0.9) {
        fY = fY - (rand() * 10); 
      }
      fibre.push([t * 100, Math.max(2, fY)]);
    }
    
    const toPoly = (pts) => 'polygon(0% 100%, ' + pts.map(([x, y]) => x.toFixed(3) + '% ' + y.toFixed(2) + '%').join(', ') + ', 100% 100%)';
    tearBase.style.clipPath = toPoly(base);
    tearFibre.style.clipPath = toPoly(fibre);
  };
  buildTear();

  let step = -2;
  const setStep = (s) => {
    if (s === step) return;
    step = s;
    cases.forEach((el, i) => {
      el.classList.toggle('is-active', i === s);
      el.classList.toggle('is-past', i < s);
    });
    ticks.forEach((t, i) => t.classList.toggle('is-on', s >= i + 1));
  };

  let ptr = null;
  let lastQ = 0;
  const placeLantern = (q) => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const x = ptr ? ptr.x : w * (0.2 + 0.6 * q);
    const y = ptr ? ptr.y : h * (0.34 + 0.12 * Math.sin(q * Math.PI * 2));
    lantern.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  };
  const clearPtr = () => { ptr = null; placeLantern(lastQ); };
  stage.addEventListener('pointermove', (ev) => {
    const r = stage.getBoundingClientRect();
    ptr = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    placeLantern(lastQ);
  }, { passive: true });
  stage.addEventListener('pointerleave', clearPtr);
  stage.addEventListener('pointercancel', clearPtr);
  stage.addEventListener('pointerup', (ev) => { if (ev.pointerType !== 'mouse') clearPtr(); });

  ticks.forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = Number(btn.dataset.k);
      const r = pageThree.getBoundingClientRect();
      const absTop = r.top + window.scrollY;
      const run = Math.max(1, r.height - stage.offsetHeight);
      window.scrollTo({ top: absTop + run * (0.25 * (k + 1) + 0.04), behavior: 'smooth' });
    });
  });

  const update = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    const totalScrollable = Math.max(1, document.documentElement.scrollHeight - windowHeight);
    const globalProgress = clamp(scrollY / totalScrollable);
    progressIndicator.textContent = Math.round(globalProgress * 100) + '%';

    const p3 = pageThree.getBoundingClientRect();
    const rise = clamp(1 - p3.top / windowHeight);
    const e = smooth(rise); 
    const run = Math.max(1, p3.height - stage.offsetHeight);
    const q = clamp(-p3.top / run);
    lastQ = q;
    const dwellH = Math.max(1, dwell.offsetHeight);
    const d = clamp(1 - (p3.top - windowHeight) / dwellH);
    const lift = d * 18 + e * 30;

    const heroRawProgress = scrollY / windowHeight;
    const rotateX = Math.min(89, heroRawProgress * 70); 
    const rad = rotateX * Math.PI / 180;
    const stretchY = (1 / Math.cos(rad)) * 1.05; 
    const translateY = -10 + (Math.pow(heroRawProgress, 2) * 8); 

    heroStage.style.transform = `
      translate3d(0, ${translateY}vh, 0) 
      rotateX(${rotateX}deg) 
      scaleY(${stretchY})
    `;
    heroStage.style.opacity = Math.max(0, 1 - (heroRawProgress * 0.3)) * (1 - rise);
    heroSection.style.visibility = rise >= 1 ? 'hidden' : 'visible';
    fadeMask.style.opacity = Math.max(0, (heroRawProgress - 0.3) * 1.5);

    // ====== 核心修改：到 17% 时彻底变实体 ======
    let maskStop = 35 - (globalProgress / 0.17) * 35;
    maskStop = Math.max(0, maskStop);
    
    if (maskStop > 0.1) {
      infoSection.style.webkitMaskImage = `linear-gradient(to bottom, transparent 0%, black ${maskStop}%)`;
      infoSection.style.maskImage = `linear-gradient(to bottom, transparent 0%, black ${maskStop}%)`;
    } else {
      infoSection.style.webkitMaskImage = 'none';
      infoSection.style.maskImage = 'none';
    }

    infoSection.style.transform = e > 0
      ? `translate3d(0, ${(-e * 4).toFixed(3)}vh, 0) scale(${(1 - e * 0.08).toFixed(4)})`
      : 'none';
    infoDim.style.opacity = (e * 0.9).toFixed(3);
    infoSection.style.visibility = rise >= 1 ? 'hidden' : 'visible';

    const contentTriggerStart = windowHeight * 0.5;
    const contentTriggerEnd = windowHeight * 1.0; 

    if (scrollY > contentTriggerStart) {
      const p = Math.min(1, (scrollY - contentTriggerStart) / (contentTriggerEnd - contentTriggerStart));
      const ease = 1 - Math.pow(1 - p, 3);

      rolesGrid.style.transform = `translateY(${150 * (1 - ease) - lift}px)`;
      rolesGrid.style.opacity = ease;

      const pBtn = Math.max(0, (p - 0.2) / 0.8); 
      const easeBtn = 1 - Math.pow(1 - pBtn, 3);
      
      actionArea.style.transform = `translateY(${180 * (1 - easeBtn) - lift * 0.6}px)`;
      actionArea.style.opacity = easeBtn;
    } else {
      rolesGrid.style.transform = `translateY(150px)`;
      rolesGrid.style.opacity = 0;
      actionArea.style.transform = `translateY(180px)`;
      actionArea.style.opacity = 0;
    }

    if (!reduceMotion) {
      const env = Math.pow(Math.sin(Math.PI * rise), 1.4);
      fogA.style.opacity = (env * 0.95).toFixed(3);
      fogB.style.opacity = (env * 0.8).toFixed(3);
      fogA.style.transform = `translate3d(${(-8 + rise * 20).toFixed(2)}%, 0, 0)`;
      fogB.style.transform = `translate3d(${(10 - rise * 20).toFixed(2)}%, 0, 0)`;
    }

    const s = rise > 0.2 ? Math.min(3, Math.floor(q * 4)) : -1;
    setStep(s);
    segFills[0].style.transform = `scaleX(${clamp((q - 0.25) / 0.25).toFixed(3)})`;
    segFills[1].style.transform = `scaleX(${clamp((q - 0.5) / 0.25).toFixed(3)})`;
    if (!reduceMotion) placeLantern(q);
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
});
