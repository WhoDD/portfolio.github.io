(function () {
  'use strict';

  var header = document.getElementById('header');
  var menuToggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav');
  var anchors = document.querySelectorAll('a[href^="#"]');
  var carousels = document.querySelectorAll('.work:not(.work--pending) [data-carousel]');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Header divider on scroll */

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */

  function closeMenu() {
    if (!menuToggle || !nav) return;
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function openMenu() {
    if (!menuToggle || !nav) return;
    menuToggle.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('.header__link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* Smooth anchor scrolling */

  anchors.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');

      if (!href || href === '#') {
        e.preventDefault();
        closeMenu();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        return;
      }

      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      closeMenu();

      var offset = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top: top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });

  /* Video helpers */

  function playVideo(video) {
    var promise = video.play();
    if (promise !== undefined) {
      promise.catch(function () {});
    }
  }

  function pauseVideo(video) {
    if (!video.paused) video.pause();
  }

  function initVideoFade(video) {
    function markReady() {
      video.classList.add('is-ready');
    }

    video.addEventListener('loadeddata', markReady);

    if (video.readyState >= 2) {
      markReady();
    }
  }

  document.querySelectorAll('.video').forEach(initVideoFade);

  /* Carousel */

  function pad(num) {
    return num < 10 ? '0' + num : String(num);
  }

  function Carousel(root) {
    this.root = root;
    root.tabIndex = 0;
    root.setAttribute('role', 'region');
    var projectName = root.closest('.work').querySelector('.work__name').textContent;
    root.setAttribute('aria-label', 'Видео ' + projectName);
    this.work = root.closest('.work');
    this.track = root.querySelector('.carousel__track');
    this.slides = root.querySelectorAll('.carousel__slide');
    this.prevBtn = this.work.querySelector('.carousel__btn--prev');
    this.nextBtn = this.work.querySelector('.carousel__btn--next');
    this.currentEl = this.work.querySelector('.carousel__current');
    this.totalEl = this.work.querySelector('.carousel__total');
    this.index = 0;
    this.total = this.slides.length;
    this.isVisible = false;

    if (this.totalEl) {
      this.totalEl.textContent = pad(this.total);
    }

    this.update();
    this.bindEvents();
    this.observeVisibility();
  }

  Carousel.prototype.bindEvents = function () {
    var self = this;

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', function () {
        self.goTo(self.index - 1);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', function () {
        self.goTo(self.index + 1);
      });
    }

    this.root.addEventListener('keydown', function (event) {
      if (event.target.tagName === 'VIDEO') return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); self.goTo(self.index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); self.goTo(self.index + 1); }
    });
  };

  Carousel.prototype.observeVisibility = function () {
    var self = this;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          self.isVisible = entry.isIntersecting;
          self.syncVideos();
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(this.root);
  };

  Carousel.prototype.getActiveVideo = function () {
    var slide = this.slides[this.index];
    return slide ? slide.querySelector('.video') : null;
  };

  Carousel.prototype.syncVideos = function () {
    var self = this;

    this.slides.forEach(function (slide, i) {
      slide.inert = i !== self.index;
      slide.setAttribute('aria-hidden', String(i !== self.index));
      var video = slide.querySelector('.video');
      if (!video) return;

      if (i === self.index && self.isVisible && !reduceMotion.matches) {
        playVideo(video);
      } else {
        pauseVideo(video);
      }
    });
  };

  Carousel.prototype.update = function () {
    this.track.style.transform = 'translateX(-' + (this.index * 100) + '%)';

    if (this.currentEl) {
      this.currentEl.textContent = pad(this.index + 1);
    }

    if (this.prevBtn) {
      this.prevBtn.disabled = this.index === 0;
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = this.index === this.total - 1;
    }

    this.syncVideos();
  };

  Carousel.prototype.goTo = function (nextIndex) {
    if (nextIndex < 0 || nextIndex >= this.total) return;
    this.index = nextIndex;
    this.update();
  };

  var carouselInstances = [];

  carousels.forEach(function (el) {
    carouselInstances.push(new Carousel(el));
  });


})();
