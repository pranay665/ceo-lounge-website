(function () {
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Scroll cue: a fixed arrow that retires once the foot of the page is
     reached, and never shows on a page too short to scroll.

     Whether to hide is always re-measured from the scroll position; the
     listeners below are only triggers. That matters because no single signal
     is reliable on its own: scroll events do not fire for programmatic jumps
     (an in-page anchor, a restored position), and an IntersectionObserver
     entry can arrive late or not at all when the page moves without a user
     gesture. Recomputing on each trigger means the state can never go stale,
     whichever one wakes it. */
  var cue = document.querySelector('.scroll-cue');
  if (!cue) return;

  var FOOT = 28;   // treat "within this of the bottom" as arrived

  function update() {
    var doc = document.documentElement;
    var y = window.scrollY || doc.scrollTop || 0;
    var view = window.innerHeight;
    var full = Math.max(doc.scrollHeight, document.body.scrollHeight);
    var canScroll = full > view + 8;
    cue.classList.toggle('is-hidden', !canScroll || (y + view >= full - FOOT));
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);

  // Extra trigger: the footer coming into or out of view.
  var foot = document.querySelector('footer');
  if ('IntersectionObserver' in window && foot) {
    new IntersectionObserver(update, { threshold: 0 }).observe(foot);
  }
})();
