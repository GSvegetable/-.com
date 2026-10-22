document.addEventListener('DOMContentLoaded', () => {
  const bgImages = document.querySelectorAll('.bg-image');
  const heroSection = document.querySelector('.hero-section');
  const heroStage = document.getElementById('hero-masthead');
  const fadeMask = document.getElementById('fade-mask');
  const progressRingFill = document.getElementById('progress-ring-fill');
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
  const cases = Array.from(document.querySelectorAll('.case'));
  const ticks = Array.from(document.querySelectorAll('.tick'));
  const segFills = Array.from(document.querySelectorAll('.seg i'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  heroStage.classList.add('loaded');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  // 圆环周长
  const CIRCUMFERENCE = 2 * Math.PI * 16;

  let currentIndex = 0;
  setInterval(() => {
    bgImages[currentIndex].classList.remove('active');
    bgImages[currentIndex].style.zIndex = '0';
    currentIndex = (currentIndex + 1) % bgImages.length;
    const newBg = bgImages[currentIndex];
    newBg.style.zIndex = '1';
    newBg.classList.add('active');
  }, 30000);

  const suspectBtn = document.getElementById('suspect-btn');
  const whiteScreen = document.getElementById('white-screen');

  if (suspectBtn) {
    suspectBtn.addEventListener('click', () => {
      if (suspectBtn.classList.contains('is-zooming')) return;
      suspectBtn.classList.add('is-zooming');
      whiteScreen.classList.add('active');
    });
  }

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
    
    // 更新圆环进度 (stroke-dashoffset)
    if (progressRingFill) {
      const offset = CIRCUMFERENCE - (globalProgress * CIRCUMFERENCE);
      progressRingFill.style.strokeDashoffset = offset;
    }

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

    infoSection.style.transform = e > 0
      ? `translate3d(0, ${(-e * 4).toFixed(3)}vh, 0) scale(${(1 - e * 0.08).toFixed(4)})`
      : 'none';
    infoDim.style.opacity = (e * 0.9).toFixed(3);
    infoSection.style.visibility = rise >= 1 ? 'hidden' : 'visible';

    const contentTriggerStart = windowHeight * 0.5;
    const contentTriggerEnd = windowHeight * 1.0; 
    const p = clamp((scrollY - contentTriggerStart) / (contentTriggerEnd - contentTriggerStart));
    const ease = smooth(p);

    if (ease >= 0.99) {
      rolesGrid.style.transform = 'none';
      rolesGrid.style.opacity = '1';
      actionArea.style.transform = 'none';
      actionArea.style.opacity = '1';
    } else {
      rolesGrid.style.transform = `translate3d(0, ${150 * (1 - ease) - lift}px, 0)`;
      rolesGrid.style.opacity = ease;
      
      const pBtn = clamp((p - 0.2) / 0.8); 
      const easeBtn = smooth(pBtn);
      actionArea.style.transform = `translate3d(0, ${180 * (1 - easeBtn) - lift * 0.6}px, 0)`;
      actionArea.style.opacity = easeBtn;
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
