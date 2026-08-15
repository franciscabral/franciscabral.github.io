/*
 * games.js — the cabinet's game library.
 *
 * Every game is a p5 sketch in INSTANCE mode. The originals in /archive are
 * global-mode (bare setup()/draw()), and two of those cannot share a page —
 * instance mode is what lets the cabinet swap games without a reload.
 *
 * A game is: { id, title, blurb, controls, build(p, api) }
 *   p    — the p5 instance
 *   api  — { w, h, palette, score(n), hiscore(), onGameOver(), pressed(name) }
 *
 * Games draw their own HUD inside the canvas, arcade-style, rather than
 * pushing state out to the DOM.
 */
(function (global) {
  'use strict';

  var C = {
    bg: '#05060a',
    cyan: '#22e8ff',
    magenta: '#ff2bb0',
    lime: '#b6ff3d',
    violet: '#9576ff',
    amber: '#ffb020',
    ink: '#e9edf6',
    dim: '#5b6377'
  };

  var FONT = '"SF Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, monospace';

  /* ---------------------------------------------------------------------- *
   * Shared drawing helpers
   * ---------------------------------------------------------------------- */

  function glowRect(p, x, y, w, h, colour, blur) {
    p.drawingContext.shadowBlur = blur === undefined ? 12 : blur;
    p.drawingContext.shadowColor = colour;
    p.noStroke();
    p.fill(colour);
    p.rect(x, y, w, h);
    p.drawingContext.shadowBlur = 0;
  }

  function hud(p, api, left, right) {
    p.push();
    p.textFont(FONT);
    p.textSize(12);
    p.noStroke();
    p.fill(C.dim);
    p.textAlign(p.LEFT, p.TOP);
    p.text(left, 16, 16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(right, api.w - 16, 16);
    p.pop();
  }

  /* Centred overlay used for title / pause / game-over states. */
  function curtain(p, api, title, lines, accent) {
    p.push();
    p.noStroke();
    p.fill(5, 6, 10, 214);
    p.rect(0, 0, api.w, api.h);

    p.textFont(FONT);
    p.textAlign(p.CENTER, p.CENTER);

    p.drawingContext.shadowBlur = 24;
    p.drawingContext.shadowColor = accent || C.cyan;
    p.fill(accent || C.cyan);
    p.textSize(Math.min(34, api.w * 0.075));
    p.textStyle(p.BOLD);
    p.text(title, api.w / 2, api.h / 2 - 26);
    p.drawingContext.shadowBlur = 0;
    p.textStyle(p.NORMAL);

    p.fill(C.ink);
    p.textSize(Math.min(13, api.w * 0.032));
    for (var i = 0; i < lines.length; i++) {
      p.text(lines[i], api.w / 2, api.h / 2 + 14 + i * 20);
    }
    p.pop();
  }

  var GAMES = {};

  /* ====================================================================== *
   * SNAKE — walls kill, speed ramps, bonus fruit, high score
   * ====================================================================== */

  GAMES.snake = {
    id: 'snake',
    title: 'Snake',
    blurb: 'Cobrinha. Eat, grow, do not touch anything.',
    controls: 'Arrows / WASD · D-pad on touch · P pauses',
    build: function (p, api) {
      var CELL = 20;
      var cols, rows, snake, dir, queued, food, bonus, score, best, over, paused, started;
      var tick = 0, stepEvery = 8, grow = 0;

      function reset() {
        cols = Math.max(10, Math.floor(api.w / CELL));
        rows = Math.max(10, Math.floor((api.h - 34) / CELL));
        snake = [{ x: (cols / 2) | 0, y: (rows / 2) | 0 }];
        dir = { x: 1, y: 0 };
        queued = null;
        grow = 4;
        score = 0;
        stepEvery = 8;
        over = false;
        paused = false;
        bonus = null;
        placeFood();
      }

      function freeCell() {
        for (var i = 0; i < 400; i++) {
          var c = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
          if (!hits(c.x, c.y, 0)) return c;
        }
        return { x: 0, y: 0 };
      }

      function placeFood() { food = freeCell(); }

      function hits(x, y, from) {
        for (var i = from; i < snake.length; i++) {
          if (snake[i].x === x && snake[i].y === y) return true;
        }
        return false;
      }

      function step() {
        if (queued) { dir = queued; queued = null; }

        var head = snake[snake.length - 1];
        var nx = head.x + dir.x;
        var ny = head.y + dir.y;

        // Walls are lethal — that is the whole game.
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || hits(nx, ny, 1)) {
          over = true;
          best = api.hiscore('snake', score);
          api.onGameOver(score);
          return;
        }

        snake.push({ x: nx, y: ny });

        if (nx === food.x && ny === food.y) {
          score += 10;
          grow += 3;
          placeFood();
          // Every 5 fruit the snake speeds up, to a floor of 3 frames/step.
          if (score % 50 === 0 && stepEvery > 3) stepEvery--;
          if (!bonus && Math.random() < 0.28) bonus = { c: freeCell(), life: 300 };
        }

        if (bonus && nx === bonus.c.x && ny === bonus.c.y) {
          score += 50;
          grow += 2;
          bonus = null;
        }

        if (grow > 0) grow--;
        else snake.shift();
      }

      function turn(x, y) {
        // No reversing into your own neck.
        if (snake.length > 1 && x === -dir.x && y === -dir.y) return;
        queued = { x: x, y: y };
      }

      p.setup = function () {
        p.createCanvas(api.w, api.h);
        p.noSmooth();
        best = api.hiscore('snake', 0);
        reset();
        started = false;
      };

      p.draw = function () {
        p.background(C.bg);

        var ox = (api.w - cols * CELL) / 2;
        var oy = 34 + (api.h - 34 - rows * CELL) / 2;

        // Playfield dots.
        p.noStroke();
        p.fill(255, 255, 255, 12);
        for (var gy = 0; gy < rows; gy++) {
          for (var gx = 0; gx < cols; gx++) {
            p.rect(ox + gx * CELL + CELL / 2 - 1, oy + gy * CELL + CELL / 2 - 1, 2, 2);
          }
        }

        p.noFill();
        p.stroke(255, 255, 255, 26);
        p.rect(ox - 1, oy - 1, cols * CELL + 2, rows * CELL + 2);

        if (started && !over && !paused) {
          tick++;
          if (tick % stepEvery === 0) step();
          if (bonus && --bonus.life <= 0) bonus = null;
        }

        // Food.
        var pulse = 2 + Math.sin(p.frameCount * 0.15) * 1.5;
        glowRect(p, ox + food.x * CELL + 3 - pulse / 2, oy + food.y * CELL + 3 - pulse / 2,
          CELL - 6 + pulse, CELL - 6 + pulse, C.magenta, 18);

        // Bonus fruit blinks out as it expires.
        if (bonus && (bonus.life > 80 || p.frameCount % 10 < 5)) {
          glowRect(p, ox + bonus.c.x * CELL + 2, oy + bonus.c.y * CELL + 2,
            CELL - 4, CELL - 4, C.amber, 22);
        }

        // Snake, brightest at the head.
        for (var i = 0; i < snake.length; i++) {
          var t = i / Math.max(1, snake.length - 1);
          var seg = snake[i];
          p.drawingContext.shadowBlur = i === snake.length - 1 ? 16 : 0;
          p.drawingContext.shadowColor = C.lime;
          p.noStroke();
          p.fill(p.lerpColor(p.color(60, 110, 30), p.color(C.lime), 0.25 + t * 0.75));
          p.rect(ox + seg.x * CELL + 1, oy + seg.y * CELL + 1, CELL - 2, CELL - 2, 2);
        }
        p.drawingContext.shadowBlur = 0;

        hud(p, api, 'SCORE ' + score, 'BEST ' + best);

        if (!started) {
          curtain(p, api, 'SNAKE', ['Arrows or WASD to steer', 'Walls and your own tail are fatal', '', 'PRESS ANY KEY / TAP'], C.lime);
        } else if (over) {
          curtain(p, api, 'GAME OVER', ['Score ' + score + (score > 0 && score >= best ? '  — new best!' : ''), '', 'PRESS SPACE / TAP TO RESTART'], C.magenta);
        } else if (paused) {
          curtain(p, api, 'PAUSED', ['PRESS P TO RESUME'], C.cyan);
        }
      };

      // p5 0.7 routes touches through the mouse handlers, so this covers tap.
      p.mousePressed = function () {
        if (!started) started = true;
        else if (over) reset();
        return false;
      };

      p.keyPressed = function () {
        if (!started) { started = true; return false; }
        if (over) { if (p.key === ' ' || p.keyCode === 32) reset(); return false; }
        if (p.key === 'p' || p.key === 'P') { paused = !paused; return false; }
        if (p.keyCode === p.LEFT_ARROW || p.key === 'a' || p.key === 'A') turn(-1, 0);
        else if (p.keyCode === p.RIGHT_ARROW || p.key === 'd' || p.key === 'D') turn(1, 0);
        else if (p.keyCode === p.UP_ARROW || p.key === 'w' || p.key === 'W') turn(0, -1);
        else if (p.keyCode === p.DOWN_ARROW || p.key === 's' || p.key === 'S') turn(0, 1);
        else return true;
        return false;
      };

      api.pressed = function (name) {
        if (!started) { started = true; return; }
        if (over) { if (name === 'fire') reset(); return; }
        if (name === 'left') turn(-1, 0);
        else if (name === 'right') turn(1, 0);
        else if (name === 'up') turn(0, -1);
        else if (name === 'down') turn(0, 1);
        else if (name === 'fire') paused = !paused;
      };
    }
  };

  /* ====================================================================== *
   * BREAKOUT — the new one. Bricks, lives, levels, angle off the paddle.
   * ====================================================================== */

  GAMES.breakout = {
    id: 'breakout',
    title: 'Breakout',
    blurb: 'Clear the wall. Do not drop the ball.',
    controls: 'Mouse / arrows · drag or D-pad on touch · SPACE launches · P pauses',
    build: function (p, api) {
      var ROWS = 6, COLS = 10;
      var bricks, paddle, ball, score, best, lives, level, over, won, paused, started;
      var COLOURS = [C.magenta, C.violet, C.cyan, C.lime, C.amber, C.cyan];

      function layout() {
        var top = 56;
        var pad = 6;
        var bw = (api.w - pad * (COLS + 1)) / COLS;
        var bh = 18;
        bricks = [];
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS; c++) {
            // Top two rows take two hits — they are worth more.
            var tough = r < 2 ? 2 : 1;
            bricks.push({
              x: pad + c * (bw + pad),
              y: top + r * (bh + pad),
              w: bw,
              h: bh,
              hp: tough,
              max: tough,
              colour: COLOURS[r % COLOURS.length],
              points: (ROWS - r) * 10
            });
          }
        }
      }

      function resetBall(hard) {
        paddle = {
          w: Math.max(70, api.w * 0.18),
          h: 11,
          x: api.w / 2,
          y: api.h - 34
        };
        var speed = 4.6 + level * 0.5;
        ball = {
          x: api.w / 2,
          y: paddle.y - 14,
          r: 6,
          vx: (Math.random() < 0.5 ? -1 : 1) * speed * 0.6,
          vy: -speed,
          stuck: true,
          speed: speed
        };
        if (hard) { score = 0; lives = 3; level = 1; }
      }

      function reset() {
        level = 1;
        score = 0;
        lives = 3;
        over = false;
        won = false;
        paused = false;
        layout();
        resetBall(false);
      }

      function nextLevel() {
        level++;
        layout();
        resetBall(false);
      }

      p.setup = function () {
        p.createCanvas(api.w, api.h);
        best = api.hiscore('breakout', 0);
        reset();
        started = false;
      };

      function bounceOffPaddle() {
        // Where you hit the paddle sets the exit angle — the whole skill of it.
        var rel = (ball.x - paddle.x) / (paddle.w / 2);
        rel = Math.max(-1, Math.min(1, rel));
        var angle = rel * (Math.PI / 3);              // up to 60 degrees
        var sp = Math.min(ball.speed + 0.08, 11);
        ball.speed = sp;
        ball.vx = sp * Math.sin(angle);
        ball.vy = -sp * Math.cos(angle);
        ball.y = paddle.y - ball.r - 1;
      }

      function update() {
        if (ball.stuck) {
          ball.x = paddle.x;
          ball.y = paddle.y - 14;
          return;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
        if (ball.x + ball.r > api.w) { ball.x = api.w - ball.r; ball.vx *= -1; }
        if (ball.y - ball.r < 34) { ball.y = 34 + ball.r; ball.vy *= -1; }

        if (ball.y + ball.r >= paddle.y &&
            ball.y - ball.r <= paddle.y + paddle.h &&
            ball.x >= paddle.x - paddle.w / 2 - ball.r &&
            ball.x <= paddle.x + paddle.w / 2 + ball.r &&
            ball.vy > 0) {
          bounceOffPaddle();
        }

        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          if (b.hp <= 0) continue;
          if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + b.w ||
              ball.y + ball.r < b.y || ball.y - ball.r > b.y + b.h) continue;

          b.hp--;
          if (b.hp <= 0) score += b.points;
          else score += 5;

          // Reflect on whichever axis was less deeply penetrated.
          var overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
          var overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
          if (overlapX < overlapY) ball.vx *= -1;
          else ball.vy *= -1;
          break;
        }

        if (bricks.every(function (b) { return b.hp <= 0; })) {
          nextLevel();
          return;
        }

        if (ball.y - ball.r > api.h) {
          lives--;
          if (lives <= 0) {
            over = true;
            best = api.hiscore('breakout', score);
            api.onGameOver(score);
          } else {
            resetBall(false);
          }
        }
      }

      p.draw = function () {
        p.background(C.bg);

        if (started && !over && !paused) update();

        // Bricks — damaged ones dim.
        for (var i = 0; i < bricks.length; i++) {
          var b = bricks[i];
          if (b.hp <= 0) continue;
          var alpha = b.hp / b.max;
          p.drawingContext.shadowBlur = 10;
          p.drawingContext.shadowColor = b.colour;
          p.noStroke();
          var col = p.color(b.colour);
          col.setAlpha(120 + alpha * 135);
          p.fill(col);
          p.rect(b.x, b.y, b.w, b.h, 2);
        }
        p.drawingContext.shadowBlur = 0;

        glowRect(p, paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, C.cyan, 18);

        p.drawingContext.shadowBlur = 20;
        p.drawingContext.shadowColor = C.ink;
        p.noStroke();
        p.fill(C.ink);
        // ellipse, not circle: the vendored p5 is 0.7.2 and predates circle().
        p.ellipse(ball.x, ball.y, ball.r * 2, ball.r * 2);
        p.drawingContext.shadowBlur = 0;

        hud(p, api, 'SCORE ' + score + '   LV ' + level,
          'BEST ' + best + '   ' + '▮'.repeat(Math.max(0, lives)));

        if (!started) {
          curtain(p, api, 'BREAKOUT', ['Move with the mouse or arrow keys', 'Where you hit the paddle sets the angle', '', 'PRESS ANY KEY / TAP'], C.cyan);
        } else if (over) {
          curtain(p, api, 'GAME OVER', ['Score ' + score + (score > 0 && score >= best ? '  — new best!' : ''), '', 'PRESS SPACE / TAP TO RESTART'], C.magenta);
        } else if (paused) {
          curtain(p, api, 'PAUSED', ['PRESS P TO RESUME'], C.cyan);
        } else if (ball.stuck) {
          p.push();
          p.textFont(FONT);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.fill(C.dim);
          p.text('PRESS SPACE / TAP TO LAUNCH', api.w / 2, api.h - 66);
          p.pop();
        }
      };

      function movePaddle(x) {
        paddle.x = Math.max(paddle.w / 2, Math.min(api.w - paddle.w / 2, x));
      }

      p.mousePressed = function () {
        if (!started) started = true;
        else if (over) reset();
        else if (ball.stuck) ball.stuck = false;
        return false;
      };

      p.mouseMoved = function () {
        if (started && !over && !paused) movePaddle(p.mouseX);
      };
      p.mouseDragged = function () {
        if (started && !over && !paused) movePaddle(p.mouseX);
        return false;
      };

      p.keyPressed = function () {
        if (!started) { started = true; return false; }
        if (over) { if (p.key === ' ' || p.keyCode === 32) reset(); return false; }
        if (p.key === 'p' || p.key === 'P') { paused = !paused; return false; }
        if (p.key === ' ' || p.keyCode === 32) { ball.stuck = false; return false; }
        return true;
      };

      p.keyReleased = function () { return true; };

      // Held arrow keys, polled every frame for smooth movement.
      var origDraw = p.draw;
      p.draw = function () {
        if (started && !over && !paused) {
          var sp = 9;
          if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(65)) movePaddle(paddle.x - sp);
          if (p.keyIsDown(p.RIGHT_ARROW) || p.keyIsDown(68)) movePaddle(paddle.x + sp);
        }
        origDraw();
      };

      api.pressed = function (name) {
        if (!started) { started = true; return; }
        if (over) { if (name === 'fire') reset(); return; }
        if (name === 'left') movePaddle(paddle.x - 26);
        else if (name === 'right') movePaddle(paddle.x + 26);
        else if (name === 'fire') {
          if (ball.stuck) ball.stuck = false;
          else paused = !paused;
        }
      };
    }
  };

  /* ====================================================================== *
   * STAR TRAVEL — steerable warp. A toy, not a game: no score, no losing.
   * ====================================================================== */

  GAMES.stars = {
    id: 'stars',
    title: 'Star Travel',
    blurb: 'Viagem nas Estrelas. Steer with the mouse, hold to burn.',
    controls: 'Move to steer · hold click/space to boost',
    build: function (p, api) {
      var stars = [], speed = 6, target = 6, cx, cy, boost = false;

      function make(spread) {
        var d = Math.max(api.w, 240);
        var z = spread ? Math.random() * d : d;
        return {
          x: (Math.random() * 2 - 1) * api.w,
          y: (Math.random() * 2 - 1) * api.h,
          z: z, pz: z,
          tint: Math.random()
        };
      }

      p.setup = function () {
        p.createCanvas(api.w, api.h);
        cx = api.w / 2;
        cy = api.h / 2;
        for (var i = 0; i < 700; i++) stars.push(make(true));
      };

      p.draw = function () {
        target = boost ? 26 : 6;
        speed += (target - speed) * 0.06;

        // Vanishing point eases toward the pointer.
        var mx = p.mouseX > 0 && p.mouseX < api.w ? p.mouseX : api.w / 2;
        var my = p.mouseY > 0 && p.mouseY < api.h ? p.mouseY : api.h / 2;
        cx += (mx - cx) * 0.045;
        cy += (my - cy) * 0.045;

        p.noStroke();
        p.fill(5, 6, 10, boost ? 44 : 78);
        p.rect(0, 0, api.w, api.h);

        p.push();
        p.translate(cx, cy);
        var d = Math.max(api.w, 240);
        p.strokeCap(p.ROUND);

        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          s.pz = s.z;
          s.z -= speed;
          if (s.z < 1) { stars[i] = make(false); continue; }

          var sx = (s.x / s.z) * d, sy = (s.y / s.z) * d;
          var px = (s.x / s.pz) * d, py = (s.y / s.pz) * d;
          var t = 1 - s.z / d;

          p.strokeWeight(Math.max(0.5, t * 2.6));
          var col = p.color(s.tint < 0.7 ? C.cyan : C.magenta);
          col.setAlpha(60 + t * 195);
          p.stroke(col);
          p.line(px, py, sx, sy);
        }
        p.pop();

        hud(p, api, boost ? 'WARP' : 'CRUISE', 'v' + speed.toFixed(1));
      };

      p.mousePressed = function () { boost = true; return false; };
      p.mouseReleased = function () { boost = false; };
      p.keyPressed = function () {
        if (p.key === ' ' || p.keyCode === 32) { boost = true; return false; }
        return true;
      };
      p.keyReleased = function () {
        if (p.key === ' ' || p.keyCode === 32) boost = false;
        return true;
      };

      api.pressed = function (name) { if (name === 'fire') boost = !boost; };
    }
  };

  /* ====================================================================== *
   * LIFE GAME — now paintable, and seeded from local patterns.
   *
   * The archived original loads six SVGs from upload.wikimedia.org inside
   * p5's preload(), so it never starts if those are blocked. These patterns
   * are inline, so this version always runs.
   * ====================================================================== */

  var PATTERNS = {
    'Glider gun': [
      [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
      [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3], [0, 4], [1, 4], [10, 4],
      [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5],
      [22, 5], [24, 5], [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8]
    ],
    'Acorn': [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]],
    'Diehard': [[6, 0], [0, 1], [1, 1], [1, 2], [5, 2], [6, 2], [7, 2]],
    'R-pentomino': [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    'Soup': null
  };

  GAMES.life = {
    id: 'life',
    title: 'Life Game',
    blurb: "Jogo da Vida. Conway's automaton — paint your own soup.",
    controls: 'Drag to draw · SPACE pause · N step · C clear · keys 1-5 load patterns',
    build: function (p, api) {
      var CELL = 8;
      var cols, rows, grid, age, gen, running = true, names = Object.keys(PATTERNS);

      function idx(x, y) { return y * cols + x; }

      function clear() {
        grid = new Uint8Array(cols * rows);
        age = new Float32Array(cols * rows);
        gen = 0;
      }

      function soup() {
        clear();
        for (var i = 0; i < grid.length; i++) {
          grid[i] = Math.random() < 0.22 ? 1 : 0;
          age[i] = grid[i];
        }
      }

      function stamp(name) {
        var pts = PATTERNS[name];
        if (!pts) { soup(); return; }
        clear();
        var ox = ((cols / 2) | 0) - 18;
        var oy = ((rows / 2) | 0) - 5;
        for (var i = 0; i < pts.length; i++) {
          var x = ox + pts[i][0], y = oy + pts[i][1];
          if (x >= 0 && y >= 0 && x < cols && y < rows) {
            grid[idx(x, y)] = 1;
            age[idx(x, y)] = 1;
          }
        }
      }

      function step() {
        var next = new Uint8Array(cols * rows);
        for (var y = 0; y < rows; y++) {
          for (var x = 0; x < cols; x++) {
            var n = 0;
            for (var dy = -1; dy <= 1; dy++) {
              for (var dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue;
                n += grid[idx((x + dx + cols) % cols, (y + dy + rows) % rows)];
              }
            }
            var a = grid[idx(x, y)];
            var alive = (a && (n === 2 || n === 3)) || (!a && n === 3) ? 1 : 0;
            next[idx(x, y)] = alive;
            age[idx(x, y)] = alive ? Math.min(1, age[idx(x, y)] + 0.16) : Math.max(0, age[idx(x, y)] - 0.2);
          }
        }
        grid = next;
        gen++;
      }

      p.setup = function () {
        p.createCanvas(api.w, api.h);
        p.frameRate(24);
        cols = Math.floor(api.w / CELL);
        rows = Math.floor((api.h - 34) / CELL);
        stamp('Glider gun');
      };

      p.draw = function () {
        p.background(C.bg);
        if (running && p.frameCount % 2 === 0) step();

        var oy = 34;
        var pop = 0;
        p.noStroke();
        for (var y = 0; y < rows; y++) {
          for (var x = 0; x < cols; x++) {
            var a = age[idx(x, y)];
            if (grid[idx(x, y)]) pop++;
            if (a <= 0.02) continue;
            var col = p.color(grid[idx(x, y)] ? (a > 0.7 ? C.magenta : C.cyan) : C.violet);
            col.setAlpha(a * 225);
            p.fill(col);
            p.rect(x * CELL, oy + y * CELL, CELL - 1, CELL - 1);
          }
        }

        hud(p, api, 'GEN ' + gen + '   POP ' + pop, running ? 'RUNNING' : 'PAUSED');
      };

      function paint() {
        var x = Math.floor(p.mouseX / CELL);
        var y = Math.floor((p.mouseY - 34) / CELL);
        if (x >= 0 && y >= 0 && x < cols && y < rows) {
          grid[idx(x, y)] = 1;
          age[idx(x, y)] = 1;
        }
      }

      p.mousePressed = function () { paint(); return false; };
      p.mouseDragged = function () { paint(); return false; };

      p.keyPressed = function () {
        if (p.key === ' ' || p.keyCode === 32) { running = !running; return false; }
        if (p.key === 'n' || p.key === 'N') { step(); return false; }
        if (p.key === 'c' || p.key === 'C') { clear(); return false; }
        var n = parseInt(p.key, 10);
        if (n >= 1 && n <= names.length) { stamp(names[n - 1]); return false; }
        return true;
      };

      api.pressed = function (name) {
        if (name === 'fire') running = !running;
        else if (name === 'up') stamp('Glider gun');
        else if (name === 'down') soup();
        else if (name === 'left') clear();
        else if (name === 'right') step();
      };
    }
  };

  global.ArcadeGames = { list: ['snake', 'breakout', 'stars', 'life'], games: GAMES, palette: C };
})(window);
