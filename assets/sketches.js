/*
 * sketches.js — neon canvas re-cuts of the four p5 sketches archived under /archive.
 *
 * No p5 dependency: these are hand-written 2D-canvas renderers so the landing
 * page stays dependency-free. The original p5 sources are untouched in /archive
 * and remain playable.
 *
 * All instances share one requestAnimationFrame loop, only run while on screen,
 * and drop to a single static frame when the visitor prefers reduced motion.
 */
(function (global) {
  'use strict';

  var PALETTE = {
    bg: '#05060a',
    cyan: [34, 232, 255],
    magenta: [255, 43, 176],
    lime: [182, 255, 61],
    violet: [149, 118, 255]
  };

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  var reduceMotion = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  /* ---------------------------------------------------------------------- *
   * Shared scheduler
   * ---------------------------------------------------------------------- */

  var active = new Set();
  var rafId = null;

  function loop(now) {
    rafId = null;
    active.forEach(function (inst) {
      inst._frame(now);
    });
    if (active.size) rafId = global.requestAnimationFrame(loop);
  }

  function wake() {
    if (rafId === null && active.size) rafId = global.requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId !== null) {
        global.cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else {
      wake();
    }
  });

  /* ---------------------------------------------------------------------- *
   * Renderers
   *
   * Each renderer is { fps, warmup, init(s), step(s), draw(s) } where `s` is
   * the instance. `s.w` / `s.h` are CSS pixels; the context is already scaled
   * to the device pixel ratio.
   *
   * `warmup` is the number of steps run before the first paint. Every one of
   * these sketches has an empty opening frame — no streaks, no cell history,
   * no notes on screen yet — so a tile that is paused, off screen, or under
   * prefers-reduced-motion would otherwise show nothing at all.
   * ---------------------------------------------------------------------- */

  var RENDERERS = {};

  /* StarTravel — warp-speed starfield. */
  RENDERERS.stars = function (opts) {
    var count = opts.density === 'low' ? 260 : 420;
    var speed = opts.speed || 12;

    return {
      fps: 60,
      warmup: 90,
      init: function (s) {
        s.stars = [];
        for (var i = 0; i < count; i++) s.stars.push(newStar(s, true));
      },
      step: function (s, dt) {
        var depth = Math.max(s.w, 240);
        for (var i = 0; i < s.stars.length; i++) {
          var st = s.stars[i];
          st.pz = st.z;
          st.z -= speed * dt * 60;
          if (st.z < 1) {
            s.stars[i] = newStar(s, false);
            s.stars[i].z = depth;
            s.stars[i].pz = depth;
          }
        }
      },
      draw: function (s) {
        var ctx = s.ctx;
        ctx.fillStyle = 'rgba(5,6,10,0.32)';
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.save();
        ctx.translate(s.w / 2, s.h / 2);
        ctx.lineCap = 'round';

        var depth = Math.max(s.w, 240);
        for (var i = 0; i < s.stars.length; i++) {
          var st = s.stars[i];
          var sx = (st.x / st.z) * depth;
          var sy = (st.y / st.z) * depth;
          var px = (st.x / st.pz) * depth;
          var py = (st.y / st.pz) * depth;

          var t = 1 - st.z / depth;            // 0 far -> 1 near
          var r = Math.max(0.4, t * 2.1);
          var colour = st.tint < 0.72 ? PALETTE.cyan : PALETTE.magenta;

          ctx.strokeStyle = rgba(colour, Math.min(1, 0.18 + t * 0.9));
          ctx.lineWidth = r;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    function newStar(s, spread) {
      var depth = Math.max(s.w, 240);
      var z = spread ? Math.random() * depth : depth;
      return {
        x: (Math.random() * 2 - 1) * s.w,
        y: (Math.random() * 2 - 1) * s.h,
        z: z,
        pz: z,
        tint: Math.random()
      };
    }
  };

  /* LifeGame — Conway's Game of Life, reseeded when it stalls. */
  RENDERERS.life = function (opts) {
    var cell = opts.density === 'low' ? 7 : 11;

    return {
      fps: 11,
      warmup: 10,
      init: function (s) {
        s.cols = Math.max(4, Math.floor(s.w / cell));
        s.rows = Math.max(4, Math.floor(s.h / cell));
        s.age = null;              // seed() sizes this to the new grid
        seed(s);
        s.stale = 0;
      },
      resize: function (s) {
        this.init(s);
      },
      step: function (s) {
        var cols = s.cols, rows = s.rows;
        var next = new Uint8Array(cols * rows);
        var changed = 0;

        for (var y = 0; y < rows; y++) {
          for (var x = 0; x < cols; x++) {
            var idx = y * cols + x;
            var n = 0;
            for (var dy = -1; dy <= 1; dy++) {
              for (var dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                // Toroidal wrap, matching the original sketch's mod behaviour.
                var nx = (x + dx + cols) % cols;
                var ny = (y + dy + rows) % rows;
                n += s.grid[ny * cols + nx];
              }
            }
            var alive = s.grid[idx];
            next[idx] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
            if (next[idx] !== alive) changed++;
            s.age[idx] = next[idx] ? Math.min(1, s.age[idx] + 0.18) : Math.max(0, s.age[idx] - 0.24);
          }
        }

        s.grid = next;
        s.stale = changed < cols * rows * 0.004 ? s.stale + 1 : 0;
        if (s.stale > 12) {
          seed(s);
          s.stale = 0;
        }
      },
      draw: function (s) {
        var ctx = s.ctx;
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, s.w, s.h);

        var ox = (s.w - s.cols * cell) / 2;
        var oy = (s.h - s.rows * cell) / 2;
        var pad = cell > 8 ? 1.5 : 1;

        for (var y = 0; y < s.rows; y++) {
          for (var x = 0; x < s.cols; x++) {
            var idx = y * s.cols + x;
            var a = s.age[idx];
            if (a <= 0.01) continue;
            // Fresh cells read cyan, long-lived ones drift to magenta.
            var colour = s.grid[idx] ? (a > 0.75 ? PALETTE.magenta : PALETTE.cyan) : PALETTE.violet;
            ctx.fillStyle = rgba(colour, a * 0.85);
            ctx.fillRect(ox + x * cell, oy + y * cell, cell - pad, cell - pad);
          }
        }
      }
    };

    function seed(s) {
      s.grid = new Uint8Array(s.cols * s.rows);
      if (!s.age || s.age.length !== s.grid.length) s.age = new Float32Array(s.grid.length);
      for (var i = 0; i < s.grid.length; i++) {
        s.grid[i] = Math.random() < 0.24 ? 1 : 0;
        s.age[i] = s.grid[i];
      }
    }
  };

  /* Snake — plays itself: greedy toward the food, refuses to eat its own tail. */
  RENDERERS.snake = function (opts) {
    var cell = opts.density === 'low' ? 12 : 18;

    return {
      fps: 9,
      warmup: 14,
      init: function (s) {
        s.cols = Math.max(6, Math.floor(s.w / cell));
        s.rows = Math.max(6, Math.floor(s.h / cell));
        s.body = [{ x: (s.cols / 2) | 0, y: (s.rows / 2) | 0 }];
        s.dir = { x: 1, y: 0 };
        s.len = 5;
        s.food = freeCell(s);
      },
      resize: function (s) {
        this.init(s);
      },
      step: function (s) {
        var head = s.body[s.body.length - 1];
        var options = [
          { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
        ].filter(function (d) {
          // No reversing into the neck.
          if (s.body.length > 1 && d.x === -s.dir.x && d.y === -s.dir.y) return false;
          var nx = head.x + d.x;
          var ny = head.y + d.y;
          if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) return false;
          return !occupied(s, nx, ny, 1);
        });

        if (!options.length) {
          this.init(s);
          return;
        }

        options.sort(function (a, b) {
          return dist(head.x + a.x, head.y + a.y, s.food) - dist(head.x + b.x, head.y + b.y, s.food);
        });

        // Mostly greedy, occasionally not — a perfect player is boring to watch.
        s.dir = options[Math.random() < 0.85 ? 0 : Math.min(1, options.length - 1)];

        var next = { x: head.x + s.dir.x, y: head.y + s.dir.y };
        s.body.push(next);

        if (next.x === s.food.x && next.y === s.food.y) {
          s.len += 3;
          s.food = freeCell(s);
        }
        while (s.body.length > s.len) s.body.shift();
        if (s.len > (s.cols * s.rows) / 3) this.init(s);
      },
      draw: function (s) {
        var ctx = s.ctx;
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, s.w, s.h);

        var ox = (s.w - s.cols * cell) / 2;
        var oy = (s.h - s.rows * cell) / 2;
        var pad = cell > 13 ? 2 : 1;

        ctx.fillStyle = rgba(PALETTE.magenta, 0.95);
        ctx.fillRect(ox + s.food.x * cell, oy + s.food.y * cell, cell - pad, cell - pad);

        for (var i = 0; i < s.body.length; i++) {
          var seg = s.body[i];
          var t = i / s.body.length;           // tail 0 -> head 1
          ctx.fillStyle = rgba(PALETTE.lime, 0.2 + t * 0.75);
          ctx.fillRect(ox + seg.x * cell, oy + seg.y * cell, cell - pad, cell - pad);
        }
      }
    };

    function occupied(s, x, y, skipTail) {
      for (var i = skipTail; i < s.body.length; i++) {
        if (s.body[i].x === x && s.body[i].y === y) return true;
      }
      return false;
    }

    function freeCell(s) {
      for (var tries = 0; tries < 200; tries++) {
        var p = {
          x: (Math.random() * s.cols) | 0,
          y: (Math.random() * s.rows) | 0
        };
        if (!occupied(s, p.x, p.y, 0)) return p;
      }
      return { x: 0, y: 0 };
    }

    function dist(x, y, f) {
      return Math.abs(x - f.x) + Math.abs(y - f.y);
    }
  };

  /* Breakout — plays itself: the paddle tracks the ball and never quite loses. */
  RENDERERS.breakout = function (opts) {
    var ROWS = opts.density === 'low' ? 4 : 5;
    var COLS = opts.density === 'low' ? 7 : 10;

    return {
      fps: 60,
      warmup: 120,
      init: function (s) {
        var pad = 4;
        var top = Math.max(8, s.h * 0.08);
        var bw = (s.w - pad * (COLS + 1)) / COLS;
        var bh = Math.max(5, s.h * 0.045);

        s.bricks = [];
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS; c++) {
            s.bricks.push({
              x: pad + c * (bw + pad),
              y: top + r * (bh + pad),
              w: bw,
              h: bh,
              alive: 1,
              row: r
            });
          }
        }

        s.paddleW = Math.max(34, s.w * 0.18);
        s.paddleX = s.w / 2;
        s.paddleY = s.h - Math.max(12, s.h * 0.07);
        var sp = Math.max(2.4, s.w * 0.006);
        s.ball = { x: s.w / 2, y: s.h * 0.6, r: Math.max(2.2, s.w * 0.008), vx: sp * 0.7, vy: -sp };
      },
      resize: function (s) {
        this.init(s);
      },
      step: function (s) {
        var b = s.ball;

        // Paddle chases the ball with a lag, so the rally looks played, not solved.
        s.paddleX += (b.x - s.paddleX) * 0.09;
        s.paddleX = Math.max(s.paddleW / 2, Math.min(s.w - s.paddleW / 2, s.paddleX));

        b.x += b.vx;
        b.y += b.vy;

        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -1; }
        if (b.x + b.r > s.w) { b.x = s.w - b.r; b.vx *= -1; }
        if (b.y - b.r < 0) { b.y = b.r; b.vy *= -1; }

        if (b.vy > 0 && b.y + b.r >= s.paddleY &&
            b.y - b.r <= s.paddleY + 5 &&
            b.x >= s.paddleX - s.paddleW / 2 - b.r &&
            b.x <= s.paddleX + s.paddleW / 2 + b.r) {
          var rel = Math.max(-1, Math.min(1, (b.x - s.paddleX) / (s.paddleW / 2)));
          var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          var angle = rel * (Math.PI / 3);
          b.vx = speed * Math.sin(angle);
          b.vy = -speed * Math.cos(angle);
          b.y = s.paddleY - b.r - 1;
        }

        for (var i = 0; i < s.bricks.length; i++) {
          var k = s.bricks[i];
          if (!k.alive) continue;
          if (b.x + b.r < k.x || b.x - b.r > k.x + k.w ||
              b.y + b.r < k.y || b.y - b.r > k.y + k.h) continue;
          k.alive = 0;
          var ox = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r));
          var oy = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r));
          if (ox < oy) b.vx *= -1; else b.vy *= -1;
          break;
        }

        var left = 0;
        for (var j = 0; j < s.bricks.length; j++) left += s.bricks[j].alive;
        if (!left || b.y - b.r > s.h) this.init(s);
      },
      draw: function (s) {
        var ctx = s.ctx;
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, s.w, s.h);

        var ROW_COLOURS = [PALETTE.magenta, PALETTE.violet, PALETTE.cyan, PALETTE.lime, PALETTE.cyan];
        for (var i = 0; i < s.bricks.length; i++) {
          var k = s.bricks[i];
          if (!k.alive) continue;
          // Kept low: in the hero mosaic this band sits directly behind body copy.
          ctx.fillStyle = rgba(ROW_COLOURS[k.row % ROW_COLOURS.length], 0.5);
          ctx.fillRect(k.x, k.y, k.w, k.h);
        }

        ctx.fillStyle = rgba(PALETTE.cyan, 0.7);
        ctx.fillRect(s.paddleX - s.paddleW / 2, s.paddleY, s.paddleW, Math.max(3, s.h * 0.018));

        ctx.fillStyle = 'rgba(233,237,246,0.98)';
        ctx.beginPath();
        ctx.arc(s.ball.x, s.ball.y, s.ball.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
  };

  /* ---------------------------------------------------------------------- *
   * Instance
   * ---------------------------------------------------------------------- */

  function mount(canvas, kind, opts) {
    opts = opts || {};
    var factory = RENDERERS[kind];
    if (!factory || !canvas || !canvas.getContext) return null;

    var renderer = factory(opts);
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var s = {
      ctx: ctx,
      canvas: canvas,
      w: 0,
      h: 0
    };

    var acc = 0;
    var last = 0;
    var visible = false;
    var interval = 1 / renderer.fps;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      if (w === s.w && h === s.h) return false;

      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      s.w = w;
      s.h = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    /* Runs the sketch forward to a frame that actually has something in it. */
    function warmUp() {
      var n = renderer.warmup || 0;
      for (var i = 0; i < n; i++) renderer.step(s, interval);
    }

    var inst = {
      _frame: function (now) {
        if (!last) last = now;
        var dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        acc += dt;
        if (acc < interval) return;
        // Never replay more than a few frames after a stall.
        acc = Math.min(acc, interval * 3);
        while (acc >= interval) {
          renderer.step(s, interval);
          acc -= interval;
        }
        renderer.draw(s);
      },
      start: function () {
        if (reduceMotion.matches || active.has(inst)) return;
        last = 0;
        acc = 0;
        active.add(inst);
        wake();
      },
      stop: function () {
        active.delete(inst);
      },
      destroy: function () {
        inst.stop();
        if (ro) ro.disconnect();
        if (io) io.disconnect();
      }
    };

    resize();
    renderer.init(s);
    warmUp();
    renderer.draw(s);

    var ro = global.ResizeObserver
      ? new global.ResizeObserver(function () {
          if (!resize()) return;
          (renderer.resize || renderer.init).call(renderer, s);
          warmUp();
          renderer.draw(s);
        })
      : null;
    if (ro) ro.observe(canvas);

    var io = global.IntersectionObserver
      ? new global.IntersectionObserver(
          function (entries) {
            visible = entries[entries.length - 1].isIntersecting;
            if (visible) inst.start();
            else inst.stop();
          },
          { rootMargin: '120px' }
        )
      : null;

    if (io) {
      io.observe(canvas);
    } else {
      inst.start();
    }

    return inst;
  }

  /** Mounts every [data-sketch] canvas in the document. */
  function mountAll(root) {
    var nodes = (root || document).querySelectorAll('canvas[data-sketch]');
    var made = [];
    Array.prototype.forEach.call(nodes, function (node) {
      var inst = mount(node, node.getAttribute('data-sketch'), {
        density: node.getAttribute('data-density') || 'high',
        speed: parseFloat(node.getAttribute('data-speed')) || 0
      });
      if (inst) made.push(inst);
    });
    return made;
  }

  global.Sketches = { mount: mount, mountAll: mountAll, palette: PALETTE };
})(window);
