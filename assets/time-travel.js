(function () {
  'use strict';

  var monitor = document.getElementById('time-monitor');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-time-scene]'));
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.tm-scene[data-scene]'));
  var controls = Array.prototype.slice.call(document.querySelectorAll('[data-time-target]'));
  var eraLabel = document.getElementById('tm-era-label');

  if (!monitor || !chapters.length || !scenes.length) return;

  var activeId = '';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function activate(id) {
    if (!id || id === activeId) return;

    var chapter = chapters.find(function (item) {
      return item.dataset.timeScene === id;
    });
    if (!chapter) return;

    activeId = id;
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
      activate(button.dataset.timeTarget);
    });
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
      activate(visible[0].target.dataset.timeScene);
    }, {
      rootMargin: '-28% 0px -42% 0px',
      threshold: [0, .2, .5, .8]
    });

    chapters.forEach(function (chapter) { observer.observe(chapter); });
  }

  activate(chapters[0].dataset.timeScene);
})();
