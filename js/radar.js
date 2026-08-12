/* Radar sweep for the "Built around the objective" section.
 *
 * Canvas rather than SVG/CSS because the connecting lines are drawn between
 * whichever blips happen to be lit at that instant — that is per-frame state,
 * not something a keyframe can express.
 *
 * Blips sit in polar coordinates and stay dark until the sweep passes over
 * them; they then decay, and any two lit blips close enough to each other are
 * joined by a line whose opacity follows the dimmer of the pair. Blips that
 * have fully faded are quietly relocated, so the pattern never repeats.
 */
(function () {
  var canvas = document.querySelector('.radar-canvas');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // copper / bronze / gold
  var HUES = ['201,151,63', '176,124,58', '190,120,70', '224,181,106'];
  var RING = '201,151,63';

  var BLIP_COUNT = 20;
  var LINK_DIST = 0.42;      // as a fraction of radius
  var SWEEP_SECONDS = 11;    // one revolution — slow enough to read as ambient
  var TRAIL = Math.PI * 0.6;

  var size = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  var blips = [], angle = 0, raf = null, last = 0;

  function makeBlip() {
    // sqrt keeps them from bunching in the middle
    var r = Math.sqrt(Math.random()) * 0.92;
    return {
      a: Math.random() * Math.PI * 2,
      r: r,
      size: 0.9 + Math.random() * 2.6,
      hue: HUES[(Math.random() * HUES.length) | 0],
      lit: 0,
      seen: false
    };
  }

  function seed() {
    blips = [];
    for (var i = 0; i < BLIP_COUNT; i++) blips.push(makeBlip());
  }

  function resize() {
    var css = canvas.clientWidth;
    if (!css) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = css;
    canvas.width = Math.round(css * dpr);
    canvas.height = Math.round(css * dpr);
    canvas.style.height = css + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = css / 2; cy = css / 2; R = css / 2 - 2;
  }

  function pos(b) {
    return { x: cx + Math.cos(b.a) * b.r * R, y: cy + Math.sin(b.a) * b.r * R };
  }

  function drawGrid() {
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(function (f, i) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + RING + ',' + (i === 3 ? 0.3 : 0.16) + ')';
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
    ctx.strokeStyle = 'rgba(' + RING + ',0.1)';
    ctx.stroke();
  }

  function drawSweep() {
    var steps = 26;
    for (var i = 0; i < steps; i++) {
      var t = i / steps;
      var a1 = angle - TRAIL * t;
      var a0 = angle - TRAIL * (t + 1 / steps);
      var alpha = Math.pow(1 - t, 2.2) * 0.13;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + RING + ',' + alpha.toFixed(4) + ')';
      ctx.fill();
    }
    // leading edge
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
    ctx.strokeStyle = 'rgba(224,181,106,0.38)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawLinks() {
    var max = LINK_DIST * R;
    for (var i = 0; i < blips.length; i++) {
      if (blips[i].lit < 0.12) continue;
      var p = pos(blips[i]);
      for (var j = i + 1; j < blips.length; j++) {
        if (blips[j].lit < 0.12) continue;
        var q = pos(blips[j]);
        var dx = p.x - q.x, dy = p.y - q.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > max) continue;
        var a = Math.min(blips[i].lit, blips[j].lit) * (1 - d / max) * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = 'rgba(' + RING + ',' + a.toFixed(4) + ')';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }

  function drawBlips() {
    for (var i = 0; i < blips.length; i++) {
      var b = blips[i];
      if (b.lit <= 0.02) continue;
      var p = pos(b);
      ctx.beginPath();
      ctx.shadowColor = 'rgba(' + b.hue + ',0.9)';
      ctx.shadowBlur = 6 * b.lit;
      ctx.fillStyle = 'rgba(' + b.hue + ',' + (b.lit * 0.95).toFixed(3) + ')';
      ctx.arc(p.x, p.y, b.size * (0.6 + b.lit * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawCore() {
    var s = R * 0.11;
    ctx.strokeStyle = 'rgba(224,181,106,0.85)';
    ctx.lineWidth = Math.max(1.6, R * 0.018);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
    ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
    ctx.stroke();
  }

  function frame(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;

    var prev = angle;
    angle += (Math.PI * 2 / SWEEP_SECONDS) * dt;
    if (angle > Math.PI * 2) { angle -= Math.PI * 2; prev -= Math.PI * 2; }

    for (var i = 0; i < blips.length; i++) {
      var b = blips[i];
      // light it the moment the beam crosses its bearing
      var a = b.a;
      if (a < prev) a += Math.PI * 2;
      if (a > prev && a <= angle) b.lit = 1;
      b.lit *= Math.pow(0.55, dt);        // ~half a second to noticeably fade
      if (b.lit < 0.01 && !b.seen) { b.seen = true; }
      if (b.lit < 0.004 && b.seen && Math.random() < 0.01) {
        blips[i] = makeBlip();            // quietly relocate a spent blip
      }
    }

    ctx.clearRect(0, 0, size, size);
    drawGrid();
    drawSweep();
    drawLinks();
    drawBlips();
    drawCore();

    raf = requestAnimationFrame(frame);
  }

  function still() {
    ctx.clearRect(0, 0, size, size);
    drawGrid();
    for (var i = 0; i < blips.length; i++) blips[i].lit = 0.55;
    drawLinks();
    drawBlips();
    drawCore();
  }

  function start() { if (!raf && !reduced) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  resize();
  seed();
  if (reduced) { still(); } else { start(); }

  // only run while it is actually on screen
  if ('IntersectionObserver' in window && !reduced) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.05 }).observe(canvas);
  }

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { resize(); if (reduced) still(); }, 150);
  });
})();
