(function () {
  const body = document.body;
  const topButtons = Array.from(document.querySelectorAll('[data-back-to-top]'));
  const quickPicksRoot = document.querySelector('[data-quick-picks]');
  const recommendationSectionsRoot = document.querySelector('[data-recommendation-sections]');
  const photoCarousels = Array.from(document.querySelectorAll('[data-carousel-images]'));

  function updateScrollEffects() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(window.scrollY / maxScroll, 1);
    const focusY = 18 + progress * 46;
    body.style.setProperty('--bg-focus-y', focusY + '%');

    topButtons.forEach((button) => {
      button.classList.toggle('is-visible', window.scrollY > 280);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderActionLink(url, kind) {
    if (!url) return '';

    const isPrimary = kind === 'maps';
    const label = isPrimary
      ? 'Open in Google Maps / Abrir en Google Maps'
      : 'Open website / Abrir sitio web';

    return '<a class="action-link ' + (isPrimary ? 'action-link-primary' : 'action-link-secondary') + '" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '">' +
      escapeHtml(label) +
      '</a>';
  }

  function renderQuickPickCard(item) {
    return '<article class="card quick-pick-card">' +
      '<span class="card-kicker">' + escapeHtml(item.featuredLabel || item.category) + '</span>' +
      '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
      '<p>' + escapeHtml(item.description) + '</p>' +
      '</article>';
  }

  function renderRecommendationCard(item) {
    const phoneMarkup = item.phone
      ? '<div class="recommendation-meta"><span class="meta-label">Phone</span><a class="inline-link" href="tel:' +
        escapeHtml(item.phone.replace(/[^\d+]/g, '')) + '">' + escapeHtml(item.phone) + '</a></div>'
      : '';

    return '<article class="card recommendation-card">' +
      '<span class="badge">' + escapeHtml(((item.badgeIcon || '') + ' ' + (item.badge || item.category)).trim()) + '</span>' +
      '<div class="recommendation-body">' +
      '<span class="card-kicker">' + escapeHtml(item.category) + '</span>' +
      '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
      '<p>' + escapeHtml(item.description) + '</p>' +
      phoneMarkup +
      '</div>' +
      '<div class="action-cluster">' +
      renderActionLink(item.googleMapsUrl, 'maps') +
      renderActionLink(item.websiteUrl, 'website') +
      '</div>' +
      '</article>';
  }

  function renderRecommendationSections(data) {
    if (!quickPicksRoot || !recommendationSectionsRoot || !data || !Array.isArray(data.recommendations)) {
      return;
    }

    const activeRecommendations = data.recommendations
      .filter((item) => item && item.active !== false)
      .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));

    const featuredItems = activeRecommendations.filter((item) => item.featured);
    quickPicksRoot.innerHTML = featuredItems.map(renderQuickPickCard).join('');

    const sections = Array.isArray(data.sections) ? data.sections : [];
    recommendationSectionsRoot.innerHTML = sections.map((section) => {
      const sectionItems = activeRecommendations.filter((item) => item.section === section.id);
      if (!sectionItems.length) return '';

      return '<section class="section" id="' + escapeHtml(section.id) + '">' +
        '<div class="container">' +
        '<div class="section-header">' +
        '<div>' +
        '<h2 class="section-title">' + escapeHtml(section.title) + '</h2>' +
        '<p class="section-subtitle">' + escapeHtml(section.subtitle) + '</p>' +
        '</div>' +
        '</div>' +
        '<div class="recommendation-grid">' +
        sectionItems.map(renderRecommendationCard).join('') +
        '</div>' +
        '</div>' +
        '</section>';
    }).join('');
  }

  function initPhotoCarousel(root) {
    const images = (root.getAttribute('data-carousel-images') || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);

    if (images.length <= 1) {
      if (images[0]) {
        root.style.backgroundImage =
          'linear-gradient(180deg, rgba(17, 33, 40, 0.05), rgba(17, 33, 40, 0.22) 44%, rgba(17, 33, 40, 0.58)), url("' +
          images[0] +
          '")';
      }
      return;
    }

    root.innerHTML = '';

    const slides = images.map((image, index) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide' + (index === 0 ? ' is-active' : '');
      slide.style.backgroundImage = 'url("' + image + '")';
      root.appendChild(slide);
      return slide;
    });

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';

    let activeIndex = 0;

    function showSlide(index) {
      activeIndex = index;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });
      Array.from(dots.children).forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
    }

    images.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (index === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Show condo photo ' + (index + 1));
      dot.addEventListener('click', () => {
        showSlide(index);
      });
      dots.appendChild(dot);
    });

    root.appendChild(dots);

    window.setInterval(() => {
      showSlide((activeIndex + 1) % slides.length);
    }, 4200);
  }

  topButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  renderRecommendationSections(window.RECOMMENDATIONS_PAGE_DATA);
  photoCarousels.forEach(initPhotoCarousel);
  updateScrollEffects();
  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  window.addEventListener('resize', updateScrollEffects);
})();
