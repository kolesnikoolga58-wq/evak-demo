/* EVAK PRO - демо-лендинг. Без зависимостей. */
(function () {
  'use strict';

  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var mobileBar = document.getElementById('mobile-bar');
  var toastEl = document.getElementById('toast');

  /* ---------- Шапка при прокрутке + мобильная панель ---------- */
  var hero = document.querySelector('.hero');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    if (mobileBar && hero) {
      var pastHero = y > hero.offsetTop + hero.offsetHeight * 0.6;
      mobileBar.classList.toggle('is-visible', pastHero && !document.body.classList.contains('menu-open'));
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  function setMenu(open) {
    if (open) {
      nav.style.setProperty('--nav-top', header.getBoundingClientRect().bottom + 'px');
    }
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', open);
    onScroll();
  }
  burger.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 980 && nav.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Подсветка активного пункта меню ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  // Следим за всеми разделами: на тех, которых нет в меню (преимущества, заявка), подсветка снимается
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Анимации появления ---------- */
  var reveals = document.querySelectorAll('.reveal');
  // Небольшая задержка для элементов, стоящих рядом в сетке
  Array.prototype.forEach.call(reveals, function (el) {
    var parent = el.parentElement;
    var siblings = Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); });
    var index = siblings.indexOf(el);
    if (siblings.length > 2 && index > 0) el.style.setProperty('--delay', (index % 4) * 0.08 + 's');
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('is-visible');
          obs.unobserve(el);
          // После появления убираем служебные классы, чтобы работали собственные hover-эффекты карточек
          var delay = parseFloat(el.style.getPropertyValue('--delay')) || 0;
          setTimeout(function () {
            el.classList.remove('reveal', 'is-visible');
            el.style.removeProperty('--delay');
          }, 900 + delay * 1000);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(reveals, function (el) { revealObserver.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- FAQ ---------- */
  var faqItems = document.querySelectorAll('.faq__item');
  Array.prototype.forEach.call(faqItems, function (item) {
    var btn = item.querySelector('.faq__q');
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      // Открыт только один ответ за раз
      Array.prototype.forEach.call(faqItems, function (other) {
        other.classList.remove('is-open');
        other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Уведомление ---------- */
  var toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3800);
  }

  // Демо-ссылки на мессенджеры
  Array.prototype.forEach.call(document.querySelectorAll('[data-demo-link]'), function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      toast('Демо: ссылка на ' + link.getAttribute('data-demo-link') + ' появится после получения реальных контактов.');
    });
  });

  /* ---------- Форма ---------- */
  var form = document.getElementById('order-form');
  var success = document.getElementById('form-success');
  var resetBtn = document.getElementById('form-reset');
  var submitBtn = form.querySelector('.form__submit');
  var phoneInput = form.elements.phone;
  var msgInput = form.elements.message;
  var carSelect = form.elements.car;

  // Кнопки, ведущие к форме: выбираем цель заявки и подставляем данные
  Array.prototype.forEach.call(document.querySelectorAll('[data-intent]'), function (btn) {
    btn.addEventListener('click', function () {
      var intent = btn.getAttribute('data-intent');
      var radio = form.querySelector('input[name="intent"][value="' + intent + '"]');
      if (radio) radio.checked = true;

      var car = btn.getAttribute('data-car');
      if (car) carSelect.value = car;

      var service = btn.getAttribute('data-service');
      if (service && !msgInput.value.trim()) msgInput.value = 'Услуга: ' + service + '. ';

      // Фокус на первом поле - после окончания плавной прокрутки, чтобы её не прервать
      var focused = false;
      function focusName() {
        if (focused || !success.hidden) return;
        focused = true;
        window.removeEventListener('scrollend', focusName);
        form.elements.name.focus({ preventScroll: true });
      }
      if ('onscrollend' in window) window.addEventListener('scrollend', focusName);
      setTimeout(focusName, 1500);
    });
  });

  // Маска телефона: +7 (XXX) XXX-XX-XX
  function formatPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits[0] !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);
    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) out += ')';
    if (digits.length > 4) out += ' ' + digits.slice(4, 7);
    if (digits.length > 7) out += '-' + digits.slice(7, 9);
    if (digits.length > 9) out += '-' + digits.slice(9, 11);
    return out;
  }
  phoneInput.addEventListener('input', function (e) {
    // При удалении не переформатируем, чтобы можно было стереть скобки и дефисы
    if (e.inputType && e.inputType.indexOf('delete') === 0) return;
    phoneInput.value = formatPhone(phoneInput.value);
  });
  phoneInput.addEventListener('focus', function () {
    if (!phoneInput.value) phoneInput.value = '+7 (';
  });
  phoneInput.addEventListener('blur', function () {
    if (phoneInput.value.replace(/\D/g, '').length <= 1) phoneInput.value = '';
  });

  var rules = {
    name: function (v) {
      if (!v) return 'Укажите имя';
      if (v.length < 2) return 'Имя слишком короткое';
      if (!/^[A-Za-zА-Яа-яЁё\s\-']+$/.test(v)) return 'Используйте только буквы';
      return '';
    },
    phone: function (v) {
      var d = v.replace(/\D/g, '');
      if (!d) return 'Укажите телефон для связи';
      if (d.length !== 11) return 'Введите номер полностью: +7 (XXX) XXX-XX-XX';
      return '';
    },
    from: function (v) {
      if (!v) return 'Укажите, откуда забрать автомобиль';
      if (v.length < 3) return 'Уточните адрес';
      return '';
    },
    to: function (v) {
      // «Куда доставить» необязательно: диспетчер уточнит по телефону
      if (v && v.length < 3) return 'Уточните адрес';
      return '';
    }
  };

  function validateField(name) {
    var input = form.elements[name];
    var field = input.closest('.field');
    var error = rules[name](input.value.trim());
    field.classList.toggle('is-invalid', !!error);
    field.classList.toggle('is-valid', !error);
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    field.querySelector('.field__error').textContent = error;
    return !error;
  }

  function validateAgree() {
    var agree = form.elements.agree;
    var box = agree.closest('.checkbox');
    var err = form.querySelector('.field__error--agree');
    var ok = agree.checked;
    box.classList.toggle('is-invalid', !ok);
    err.textContent = ok ? '' : 'Нужно согласие на обработку данных';
    return ok;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('blur', function () {
      if (input.value.trim() || input.closest('.field').classList.contains('is-invalid')) validateField(name);
    });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) validateField(name);
    });
  });
  form.elements.agree.addEventListener('change', validateAgree);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      if (!validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
    });
    var agreeOk = validateAgree();
    if (!agreeOk && !firstInvalid) firstInvalid = form.elements.agree;

    if (firstInvalid) {
      firstInvalid.focus();
      toast('Проверьте выделенные поля формы');
      return;
    }

    // ДЕМО-РЕЖИМ: данные никуда не отправляются.
    // На рабочем сайте здесь будет отправка на сервер / в Telegram / CRM.
    submitBtn.classList.add('is-loading');
    setTimeout(function () {
      submitBtn.classList.remove('is-loading');
      success.hidden = false;
      resetBtn.focus();
    }, 700);
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) {
      f.classList.remove('is-valid', 'is-invalid');
    });
    Array.prototype.forEach.call(form.querySelectorAll('.field__error'), function (el) { el.textContent = ''; });
    form.querySelector('.checkbox').classList.remove('is-invalid');
    success.hidden = true;
    form.elements.name.focus();
  });

  /* ---------- Год в подвале ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
