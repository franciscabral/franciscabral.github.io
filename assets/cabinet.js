/*
 * cabinet.js — drives the arcade machine.
 *
 * Mounts one p5 instance at a time into the screen, swaps it on slot change,
 * and forwards the physical panel (joystick, FIRE, D-pad) into whichever game
 * is loaded via the game's api.pressed() hook.
 */
(function () {
  'use strict';

  var LIB = window.ArcadeGames;
  var screenEl = document.getElementById('screen');
  var bootEl = document.getElementById('boot');
  var slotsEl = document.getElementById('slots');
  var nowEl = document.getElementById('nowPlaying');
  var controlsEl = document.getElementById('controlsText');
  var stickEl = document.getElementById('stick');
  var fireEl = document.getElementById('btnFire');
  var resetEl = document.getElementById('btnReset');
  var padEl = document.getElementById('touchPad');

  if (!LIB || !screenEl) return;

  var current = null;      // { id, p5, api }
  var tiltTimer = null;

  /* Internal resolution of the screen. Games are written against this and the
     canvas is stretched by CSS, so the picture is identical at every size. */
  var W = 640, H = 480;

  function hiscore(id, candidate) {
    var key = 'arcade.hi.' + id;
    var stored = 0;
    try { stored = parseInt(localStorage.getItem(key), 10) || 0; } catch (e) { stored = 0; }
    if (candidate > stored) {
      stored = candidate;
      try { localStorage.setItem(key, String(stored)); } catch (e) { /* private mode */ }
    }
    return stored;
  }

  function unload() {
    if (current && current.p5) current.p5.remove();
    current = null;
    // p5 appends its canvas to the mount point; clear any stragglers.
    Array.prototype.forEach.call(screenEl.querySelectorAll('canvas'), function (c) {
      c.parentNode.removeChild(c);
    });
  }

  function load(id) {
    var game = LIB.games[id];
    if (!game) return;

    unload();
    bootEl.hidden = true;

    var api = {
      w: W,
      h: H,
      palette: LIB.palette,
      hiscore: hiscore,
      onGameOver: function () { },
      pressed: function () { }        // games overwrite this
    };

    var instance = new p5(function (p) { game.build(p, api); }, screenEl);

    current = { id: id, p5: instance, api: api };

    nowEl.innerHTML = '<b>' + game.title + '</b> — ' + game.blurb;
    controlsEl.textContent = game.controls;

    Array.prototype.forEach.call(slotsEl.querySelectorAll('.slot'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
    });

    // Keyboard should reach the game immediately, not the button you just clicked.
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  /* --- slots ------------------------------------------------------------ */

  LIB.list.forEach(function (id) {
    var game = LIB.games[id];
    var b = document.createElement('button');
    b.className = 'slot';
    b.type = 'button';
    b.dataset.id = id;
    b.textContent = game.title;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      // Keep the URL shareable; hashchange is a no-op when we already loaded it.
      if (location.hash !== '#' + id) location.hash = id;
      load(id);
    });
    slotsEl.appendChild(b);
  });

  /* --- panel ------------------------------------------------------------ */

  function tilt(dir) {
    stickEl.dataset.tilt = dir;
    clearTimeout(tiltTimer);
    tiltTimer = setTimeout(function () { stickEl.removeAttribute('data-tilt'); }, 160);
  }

  function send(name) {
    if (!current) return;
    if (name === 'left' || name === 'right' || name === 'up' || name === 'down') tilt(name);
    current.api.pressed(name);
  }

  fireEl.addEventListener('click', function () {
    flash(fireEl);
    send('fire');
  });

  resetEl.addEventListener('click', function () {
    flash(resetEl);
    if (current) load(current.id);         // a fresh instance is the cleanest reset
  });

  function flash(el) {
    el.dataset.lit = '1';
    setTimeout(function () { delete el.dataset.lit; }, 120);
  }

  Array.prototype.forEach.call(padEl.querySelectorAll('button[data-dir]'), function (b) {
    // pointerdown so held presses feel immediate on touch.
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      send(b.dataset.dir);
    });
  });

  /* Mirror real arrow keys onto the joystick so the machine looks alive. */
  window.addEventListener('keydown', function (e) {
    var map = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down',
      A: 'left', D: 'right', W: 'up', S: 'down'
    };
    var dir = map[e.key];
    if (dir) tilt(dir);
    if (e.key === ' ') flash(fireEl);

    // The page must not scroll while someone is playing.
    if (current && (dir || e.key === ' ')) e.preventDefault();
  }, { passive: false });

  /* --- deep links -------------------------------------------------------
     arcade/#snake loads Snake directly, so the cards on the home page can
     point straight at a game. */

  function fromHash() {
    var id = (location.hash || '').replace('#', '');
    return LIB.games[id] ? id : null;
  }

  window.addEventListener('hashchange', function () {
    var id = fromHash();
    if (id && (!current || current.id !== id)) load(id);
  });

  /* Boot straight into a game so the machine is never a dead box. */
  load(fromHash() || LIB.list[0]);
})();
