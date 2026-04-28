/* =========================================================================
   STREETSCAPE AI — INTERACTIONS
   Vanilla JS motion polish: smooth scroll (Lenis), reveal-on-scroll,
   stat counters, blob parallax. Runs once per page on DOMContentLoaded.
   ========================================================================= */
(() => {
  // Mark JS-ready so CSS can flip on the staged hero entrance.
  document.documentElement.classList.add("js-ready");

  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----------------------------------------------------------------------- //
  // 1. Smooth scroll (Lenis, optional — degrades to native if absent)        //
  // ----------------------------------------------------------------------- //
  let lenis = null;
  if (motionOK && window.Lenis) {
    try {
      lenis = new window.Lenis({
        lerp: 0.1,
        smoothWheel: true,
        gestureOrientation: "vertical",
      });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);

      // Anchor links — momentum-aware scroll
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const href = a.getAttribute("href");
          if (!href || href.length < 2) return;
          const target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -88 });
        });
      });
    } catch (err) {
      // If Lenis init fails, fall back to native scroll silently.
      lenis = null;
    }
  }

  // ----------------------------------------------------------------------- //
  // 2. Reveal-on-scroll                                                      //
  // ----------------------------------------------------------------------- //
  const REVEAL_SELECTOR = [
    ".section-heading",
    ".card",
    ".step",
    ".stat",
    ".tile",
    ".illustration",
    ".diagram",
    ".cta-card",
    ".callout",
    ".feature-panel",
    ".prose > h2",
    ".prose > h3",
    ".prose > p",
    ".prose > ul",
    ".prose > ol",
    ".prose > div",
  ].join(",");

  const revealNodes = document.querySelectorAll(REVEAL_SELECTOR);
  revealNodes.forEach((el) => el.classList.add("reveal"));

  // Stagger inside grids/lists/step rows
  const STAGGER_PARENTS = ".grid, .stats, .steps, .tile-links, .pipeline-grid";
  document.querySelectorAll(STAGGER_PARENTS).forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => {
      child.style.setProperty("--reveal-delay", `${i * 90}ms`);
    });
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealNodes.forEach((el) => io.observe(el));
  } else {
    revealNodes.forEach((el) => el.classList.add("is-revealed"));
  }

  // ----------------------------------------------------------------------- //
  // 3. Stat counters — count up from 0 when stat enters viewport             //
  // ----------------------------------------------------------------------- //
  if ("IntersectionObserver" in window) {
    const fmt = new Intl.NumberFormat("en-US");
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const raw = (el.dataset.count || el.textContent || "")
            .replace(/,/g, "")
            .trim();
          const target = parseFloat(raw);
          if (Number.isNaN(target)) {
            counterIO.unobserve(el);
            return;
          }
          // Preserve target so app.js's later updates aren't broken
          el.dataset.targetValue = String(target);
          const duration = 1400;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const value = Math.round(target * easeOutCubic(t));
            el.textContent = fmt.format(value);
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = fmt.format(target);
          };
          requestAnimationFrame(tick);
          counterIO.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll(".stat-value").forEach((el) => counterIO.observe(el));
  }

  // ----------------------------------------------------------------------- //
  // 4. Parallax — gentle drift on ambient blobs while scrolling              //
  // ----------------------------------------------------------------------- //
  if (motionOK) {
    const blobs = document.querySelectorAll(".blob");
    if (blobs.length) {
      let ticking = false;
      const update = () => {
        const sy = window.scrollY;
        blobs.forEach((blob, i) => {
          const speed = parseFloat(blob.dataset.speed) || (0.05 + (i % 3) * 0.04);
          // CSS handles the blob's organic shape via class; we only translate
          blob.style.translate = `0 ${sy * speed}px`;
        });
        ticking = false;
      };
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
          }
        },
        { passive: true }
      );
      update();
    }
  }
})();
