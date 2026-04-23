
/* ──────────────────────────────────────────────────
   0. FIX HERO — Force la visibilité si animation bloquée
────────────────────────────────────────────────── */
(function fixHeroVisibility() {
  setTimeout(() => {
    document.querySelectorAll('.animate-fade-up').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, 100);
})();

/* ═══════════════════════════════════════════════════
   PUBLICUS GROUP — script.js
   Vanilla JS · Zéro dépendance
   Modules : Nav dynamique · Scroll animations ·
             Mobile menu · Formulaire · Footer year
═══════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────
   1. NAVIGATION DYNAMIQUE AU SCROLL
   Change l'apparence du header après 80px de scroll
────────────────────────────────────────────────── */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const SCROLL_THRESHOLD = 80;

  function updateHeader() {
    const isScrolled = window.scrollY > SCROLL_THRESHOLD;
    header.classList.toggle('scrolled', isScrolled);
  }

  /* Vérification initiale (rechargement en bas de page) */
  updateHeader();

  /* Listener throttlé pour performance */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateHeader();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ──────────────────────────────────────────────────
   2. MENU MOBILE (BURGER)
   Gestion ouverture/fermeture + aria
────────────────────────────────────────────────── */
(function initMobileMenu() {
  const burger   = document.getElementById('navBurger');
  const mobileNav = document.getElementById('navLinks');
  if (!burger || !mobileNav) return;

  function closeMenu() {
    burger.classList.remove('open');
    mobileNav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
  });

  /* Fermer au clic sur un lien */
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* Fermer si on clique en dehors */
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !mobileNav.contains(e.target)) {
      closeMenu();
    }
  });
})();


/* ──────────────────────────────────────────────────
   3. INTERSECTION OBSERVER — ANIMATIONS AU SCROLL
   Déclenche la classe .visible sur les éléments
   .reveal uniquement quand ils entrent dans le viewport
────────────────────────────────────────────────── */
(function initRevealAnimations() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  /* Respect de prefers-reduced-motion */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px', /* déclenche avant d'atteindre le bas */
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        /* On déconnecte après la première animation (performance) */
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach(el => observer.observe(el));
})();


/* ──────────────────────────────────────────────────
   4. SMOOTH SCROLL — ANCRES INTERNES
   Gère l'offset du header fixe
────────────────────────────────────────────────── */
(function initSmoothScroll() {
  const HEADER_HEIGHT = 0;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ──────────────────────────────────────────────────
   5. VALIDATION & ENVOI DU FORMULAIRE DE CONTACT
   Validation côté client + envoi via Web3Forms
────────────────────────────────────────────────── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    name:    { input: document.getElementById('contactName'),    error: document.getElementById('nameError') },
    email:   { input: document.getElementById('contactEmail'),   error: document.getElementById('emailError') },
    message: { input: document.getElementById('contactMessage'), error: document.getElementById('messageError') },
  };
  const submitBtn  = form.querySelector('.form__submit');
  const successMsg = document.getElementById('formSuccess');

  /* Regex email RFC compliant simplifié */
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ── Validation individuelle d'un champ ── */
  function validateField(key) {
    const { input, error } = fields[key];
    let message = '';

    if (!input.value.trim()) {
      message = key === 'fr' ? 'Ce champ est requis.' : 'Ce champ est requis.';
    } else if (key === 'email' && !EMAIL_REGEX.test(input.value.trim())) {
      message = 'Veuillez entrer une adresse courriel valide.';
    }

    error.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  /* ── Validation live au blur (UX naturel) ── */
  Object.keys(fields).forEach(key => {
    fields[key].input.addEventListener('blur', () => validateField(key));
    fields[key].input.addEventListener('input', () => {
      if (fields[key].error.textContent) validateField(key);
    });
  });

  /* ── Soumission ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* Valider tous les champs */
    const isValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!isValid) {
      /* Focus sur le premier champ invalide */
      const firstInvalid = Object.values(fields).find(f => f.error.textContent);
      if (firstInvalid) firstInvalid.input.focus();
      return;
    }

    /* État de chargement */
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    successMsg.textContent = '';

    const formData = {
      access_key: 'VOTRE_CLE_WEB3FORMS_ICI', /* ← Remplacer par votre clé */
      _subject: 'Nouveau message de contact — Publicus Group',
      _template: 'table',
      _autoresponse: 'Merci pour votre message ! Publicus Group vous répondra sous 24 heures.',
      name:    fields.name.input.value.trim(),
      email:   fields.email.input.value.trim(),
      service: document.getElementById('contactService')?.value || 'Non précisé',
      message: fields.message.input.value.trim(),
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        successMsg.textContent = '✓ Message envoyé ! Nous vous répondrons sous 24 heures.';
        form.reset();
        Object.values(fields).forEach(f => f.input.removeAttribute('aria-invalid'));
      } else {
        throw new Error(result.message || 'Erreur API');
      }
    } catch (err) {
      successMsg.style.color = '#C0392B';
      successMsg.textContent = 'Une erreur est survenue. Appelez-nous au +1 (581) 688-3346.';
      console.error('Form submission error:', err);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
})();


/* ──────────────────────────────────────────────────
   6. ANNÉE DYNAMIQUE DANS LE FOOTER
────────────────────────────────────────────────── */
(function initYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ──────────────────────────────────────────────────
   7. ACTIVE NAV LINK AU SCROLL (highlight de section)
   Met en surbrillance le lien nav correspondant
   à la section visible
────────────────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.style.color = isActive ? 'var(--gold-light)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(section => observer.observe(section));
})();
