(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function cssNum(name, fallback) {
    const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  function cssEase(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function initHeroStagger() {
    const block = document.querySelector('#hero-stagger');
    if (!block || reduce.matches) {
      block?.classList.add('is-shown');
      return;
    }

    requestAnimationFrame(() => {
      block.classList.remove('is-shown');
      void block.offsetHeight;
      block.classList.add('is-shown');
    });
  }

  function initScrollReveal() {
    const nodes = document.querySelectorAll('.t-scroll-reveal');
    if (!nodes.length) return;

    if (reduce.matches) {
      nodes.forEach((node) => node.classList.add('is-revealed'));
      return;
    }

    nodes.forEach((node) => {
      const delay = node.getAttribute('data-reveal-delay');
      if (delay != null) {
        node.style.setProperty('--reveal-delay', delay);
      }
    });

    const immediate = [];
    const observed = [];

    nodes.forEach((node) => {
      if (node.hasAttribute('data-reveal-immediate')) {
        immediate.push(node);
      } else {
        observed.push(node);
      }
    });

    immediate.forEach((node, index) => {
      const delay = Number(node.getAttribute('data-reveal-delay') || index) * cssNum('--duration-stagger', 40);
      window.setTimeout(() => node.classList.add('is-revealed'), 280 + delay);
    });

    if (!observed.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );

    observed.forEach((node) => observer.observe(node));
  }

  function initAvatarGroups() {
    if (reduce.matches) return;

    document.querySelectorAll('.t-avatar-group').forEach((root) => {
      const avatars = Array.from(root.querySelectorAll('.t-avatar'));
      if (!avatars.length) return;

      const lift = cssNum('--avatar-lift', -4);
      const falloff = cssNum('--avatar-falloff', 0.45);
      const scale = cssNum('--avatar-scale', 1.05);

      function setShifts(activeIdx, phase) {
        const timing =
          phase === 'out'
            ? cssEase('--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
            : cssEase('--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)');

        avatars.forEach((el, index) => {
          el.style.transitionTimingFunction = timing;
          if (activeIdx == null) {
            el.style.setProperty('--shift', '0px');
            el.style.setProperty('--scale-active', '1');
            return;
          }

          const distance = Math.abs(index - activeIdx);
          el.style.setProperty('--shift', (lift * Math.pow(falloff, distance)).toFixed(3) + 'px');
          el.style.setProperty('--scale-active', index === activeIdx ? String(scale) : '1');
        });
      }

      avatars.forEach((el, index) => {
        el.addEventListener('mouseenter', () => setShifts(index, 'in'));
      });
      root.addEventListener('mouseleave', () => setShifts(null, 'out'));
    });
  }

  function initCardTilt() {
    if (reduce.matches) return;

    const MAX = 12;

    document.querySelectorAll('.showcase-tilt').forEach((tilt) => {
      const card = tilt.querySelector('.t-tilt-card');
      if (!card) return;

      function reset() {
        tilt.classList.remove('is-hover');
        card.classList.remove('is-tilting');
        card.style.setProperty('--tilt-rx', '0deg');
        card.style.setProperty('--tilt-ry', '0deg');
      }

      function track(event) {
        const rect = tilt.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

        tilt.classList.add('is-hover');
        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-ry', ((px - 0.5) * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-rx', ((0.5 - py) * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--tilt-gy', (py * 100).toFixed(1) + '%');
      }

      tilt.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse') {
          try {
            tilt.setPointerCapture(event.pointerId);
          } catch (_) {
            /* ignore */
          }
        }
      });
      tilt.addEventListener('pointermove', track);
      tilt.addEventListener('pointerup', reset);
      tilt.addEventListener('pointercancel', reset);
      tilt.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') reset();
      });
    });
  }

  function init() {
    initHeroStagger();
    initScrollReveal();
    initAvatarGroups();
    initCardTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
