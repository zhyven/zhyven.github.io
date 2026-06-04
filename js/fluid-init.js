/**
 * Fluid Simulation 初始化与交互优化
 * 依赖：window.__fluidConfig (由 fluid-simulation.js 暴露)
 */
(function () {
  'use strict';

  const header = document.getElementById('page-header');
  const mainContent = document.getElementById('content-inner');
  const fluidCanvas = document.getElementById('fluid-bg');

  if (!header || !fluidCanvas) return;

  // ==================== 1. 启动流体模拟 ====================
  if (typeof initFluidSimulation === 'function') {
    initFluidSimulation(fluidCanvas);
  } else {
    console.warn('initFluidSimulation 未定义，请检查 fluid-simulation.js 加载');
    return;
  }

  // ==================== 2. 离屏暂停 (Intersection Observer) ====================
  if (window.__fluidConfig) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          window.__fluidConfig.PAUSED = !entry.isIntersecting;
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(header);
  }

  // ==================== 3. 页面不可见时暂停 ====================
  document.addEventListener('visibilitychange', () => {
    if (window.__fluidConfig) {
      window.__fluidConfig.PAUSED = document.hidden;
    }
  });

  // ==================== 4. 移动端地址栏高度适配 ====================
  function setHeaderHeight() {
    if (header && header.classList.contains('full_page')) {
      header.style.height = window.innerHeight + 'px';
    }
  }
  setHeaderHeight();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setHeaderHeight, 100);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(setHeaderHeight, 50);
  });

  // ==================== 5. 单向全屏滑动 (intro → main) ====================
  if (!mainContent) return;

  let isScrolling = false;

  function getHeaderHeight() {
    return header.offsetHeight;
  }

  function isInIntroView() {
    return window.scrollY < getHeaderHeight() - 50;
  }

  function scrollToMain() {
    isScrolling = true;
    // 获取 main 容器顶部相对于整个文档的精确位置
    const mainTop = mainContent.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: mainTop,
      behavior: 'smooth'
    });
    setTimeout(() => { isScrolling = false; }, 600);
  }

  // ---- PC 端鼠标滚轮 ----
  window.addEventListener('wheel', function (e) {
    if (isScrolling) {
      e.preventDefault();
      return;
    }
    if (e.deltaY > 0 && isInIntroView()) {
      e.preventDefault();
      scrollToMain();
    }
  }, { passive: false });

  // ---- 移动端触摸 ----
  let touchStartX = 0;
  let touchStartY = 0;
  let hasMovedHorizontally = false;   // 触摸过程中是否有明显的水平移动

  const MIN_SWIPE_DISTANCE = 30;      // 最小向上滑动距离 (px)
  const MAX_HORIZONTAL_DRIFT = 15;    // 允许的最大水平偏移 (px)

  window.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      hasMovedHorizontally = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches.length !== 1) return;
    // 只要过程中水平偏移超过阈值，就标记为“非垂直滑动”
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    if (dx > MAX_HORIZONTAL_DRIFT) {
      hasMovedHorizontally = true;
    }
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (isScrolling) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const endY = touch.clientY;
    const deltaY = touchStartY - endY;   // 正值：向上滑动

    // 触发条件：
    // 1. 起始触摸点在屏幕下半部分
    // 2. 没有明显水平移动（即竖直向上）
    // 3. 向上滑动距离超过阈值
    // 4. 当前仍在 intro 区域
    if (
      touchStartY > window.innerHeight * 0.5 &&
      !hasMovedHorizontally &&
      deltaY > MIN_SWIPE_DISTANCE &&
      isInIntroView()
    ) {
      scrollToMain();
    }
  }, { passive: true });

})();