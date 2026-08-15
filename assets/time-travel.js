(function () {
  'use strict';

  var monitor = document.getElementById('time-monitor');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-time-scene]'));
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.tm-scene[data-scene]'));
  var controls = Array.prototype.slice.call(document.querySelectorAll('[data-time-target]'));
  var eraLabel = document.getElementById('tm-era-label');

  if (!monitor || !chapters.length || !scenes.length) return;

  var activeId = '';
  var activeIndex = 0;
  var frame = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function activate(id) {
    if (!id || id === activeId) return;

    var chapter = chapters.find(function (item) {
      return item.dataset.timeScene === id;
    });
    if (!chapter) return;

    activeId = id;
    activeIndex = chapters.indexOf(chapter);
    monitor.dataset.era = chapter.dataset.monitorEra;
    if (eraLabel) eraLabel.textContent = chapter.dataset.eraLabel;

    scenes.forEach(function (scene) {
      var selected = scene.dataset.scene === id;
      scene.classList.toggle('is-active', selected);
      scene.setAttribute('aria-hidden', String(!selected));
    });

    chapters.forEach(function (item) {
      item.classList.toggle('is-active', item === chapter);
    });

    controls.forEach(function (button) {
      var selected = button.dataset.timeTarget === id;
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }

  controls.forEach(function (button) {
    button.addEventListener('click', function () {
      var chapter = document.getElementById('time-' + button.dataset.timeTarget);
      if (!chapter) return;
      chapter.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center'
      });
      if (reduceMotion) activate(button.dataset.timeTarget);
    });
  });

  /* Always compare every chapter against the same viewport anchor. The old
     IntersectionObserver compared only entries in each callback, which let
     adjacent chapters briefly reactivate each other at mobile boundaries. */
  function selectCurrentChapter(force) {
    frame = 0;

    var anchor = window.innerHeight * (window.innerWidth <= 900 ? .68 : .5);
    var distances = chapters.map(function (chapter) {
      var rect = chapter.getBoundingClientRect();
      return Math.abs(rect.top + rect.height / 2 - anchor);
    });
    var candidateIndex = distances.indexOf(Math.min.apply(Math, distances));

    if (!activeId || force) {
      activate(chapters[candidateIndex].dataset.timeScene);
      return;
    }

    if (candidateIndex === activeIndex) return;

    /* A new chapter must be clearly closer than the current one. This small
       dead zone absorbs touch-scroll bounce and fractional mobile pixels. */
    var hysteresis = window.innerWidth <= 900 ? 42 : 24;
    if (distances[candidateIndex] + hysteresis < distances[activeIndex]) {
      activate(chapters[candidateIndex].dataset.timeScene);
    }
  }

  function scheduleSelection() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      selectCurrentChapter(false);
    });
  }

  window.addEventListener('scroll', scheduleSelection, { passive: true });
  window.addEventListener('resize', scheduleSelection);
  selectCurrentChapter(true);
})();
