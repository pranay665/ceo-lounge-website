/* Glitter around the Enter link on the landing page.
 *
 * The CSS version could only twinkle a fixed set of dots in place, because
 * background positions are static. Each speck here has its own lifetime: it
 * fades up, glows, fades out, and is then reborn somewhere new — so the
 * pattern never settles.
 */
(function () {
  var host = document.querySelector('.art-enter .spark');
  if (!host || !host.getContext && !document.createElement('canvas').getContext) return;

  var canvas = document.createElement('canvas');
  host.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Dimmer end of the gold range — the brightest creams read as too showy at
     this size. */
  var HUES = ['236,206,150', '224,181,106', '201,151,63', '206,163,92'];
  var COUNT = 9;
  var PEAK = 0.5;      /* brightest a speck ever gets */

  var w = 0, h = 0, dpr = 1, specks = [], raf = null, last = 0;

  function spawn(seeded) {
    return {
      x: Math.random(),
      y: Math.random(),
      r: 0.25 + Math.random() * 0.5,         // 0.5-1.5px across
      hue: HUES[(Math.random() * HUES.length) | 0],
      life: seeded ? Math.random() : 0,       // stagger the first cycle
      speed: 0.28 + Math.random() * 0.5,      // cycles per second
      drift: (Math.random() - 0.5) * 0.015,
      rise: -(0.004 + Math.random() * 0.012)
    };
  }

  function seed() {
    specks = [];
    for (var i = 0; i < COUNT; i++) specks.push(spawn(true));
  }

  function resize() {
    var cw = host.clientWidth, chh = host.clientHeight;
    if (!cw || !chh) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cw; h = chh;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(chh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < specks.length; i++) {
      var s = specks[i];
      // ease in and out over the speck's life
      var a = Math.sin(Math.min(s.life, 1) * Math.PI);
      if (a <= 0.01) continue;
      ctx.beginPath();
      ctx.shadowColor = 'rgba(' + s.hue + ',0.6)';
      ctx.shadowBlur = 2.2 * a;
      ctx.fillStyle = 'rgba(' + s.hue + ',' + (a * PEAK).toFixed(3) + ')';
      ctx.arc(s.x * w, s.y * h, s.r * (0.6 + a * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    for (var i = 0; i < specks.length; i++) {
      var s = specks[i];
      s.life += s.speed * dt;
      s.x += s.drift * dt;
      s.y += s.rise * dt;
      if (s.life >= 1) specks[i] = spawn(false);   // reborn elsewhere
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf && !reduced) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  resize();
  seed();
  if (reduced) { for (var i = 0; i < specks.length; i++) specks[i].life = 0.5; draw(); }
  else start();

  if ('IntersectionObserver' in window && !reduced) {
    new IntersectionObserver(function (e) {
      e[0].isIntersecting ? start() : stop();
    }, { threshold: 0.05 }).observe(host);
  }

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { resize(); if (reduced) draw(); }, 150);
  });
})();
