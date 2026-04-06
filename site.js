(function () {
  const body = document.body;
  const isSpanish = document.documentElement.lang.toLowerCase().startsWith('es');
  const quickPicksRoot = document.querySelector('[data-quick-picks]');
  const recommendationSectionsRoot = document.querySelector('[data-recommendation-sections]');
  const photoCarousels = Array.from(document.querySelectorAll('[data-carousel-images]'));

  function updateScrollEffects() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(window.scrollY / maxScroll, 1);
    const focusY = 18 + progress * 46;
    body.style.setProperty('--bg-focus-y', focusY + '%');
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
    const labels = isSpanish
      ? {
          maps: 'Abrir en Google Maps',
          website: 'Abrir sitio web'
        }
      : {
          maps: 'Open in Google Maps',
          website: 'Open website'
        };
    const label = isPrimary ? labels.maps : labels.website;

    return '<a class="action-link ' + (isPrimary ? 'action-link-primary' : 'action-link-secondary') + '" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '">' +
      escapeHtml(label) +
      '</a>';
  }

  function getHostnameLabel(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  function getFaviconUrl(url) {
    try {
      const parsed = new URL(url);
      return 'https://www.google.com/s2/favicons?sz=64&domain_url=' + encodeURIComponent(parsed.origin);
    } catch (error) {
      return '';
    }
  }

  function renderSourceBadge(url, label, kind) {
    if (!url) return '';

    const faviconUrl = getFaviconUrl(url);
    const safeLabel = escapeHtml(label);

    return '<a class="source-badge source-badge-' + escapeHtml(kind) + '" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" title="' + safeLabel + '">' +
      (faviconUrl
        ? '<img class="source-badge-icon" src="' + escapeHtml(faviconUrl) + '" alt="" loading="lazy" />'
        : '<span class="source-badge-fallback" aria-hidden="true">' + (kind === 'maps' ? '📍' : '🌐') + '</span>') +
      '<span class="source-badge-text">' + safeLabel + '</span>' +
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

    const websiteLabel = getHostnameLabel(item.websiteUrl) || (isSpanish ? 'Sitio web' : 'Website');

    return '<article class="card recommendation-card">' +
      '<span class="badge">' + escapeHtml(((item.badgeIcon || '') + ' ' + (item.badge || item.category)).trim()) + '</span>' +
      '<div class="recommendation-body">' +
      '<span class="card-kicker">' + escapeHtml(item.category) + '</span>' +
      '<div class="card-title">' + escapeHtml(item.title) + '</div>' +
      '<p>' + escapeHtml(item.description) + '</p>' +
      phoneMarkup +
      '</div>' +
      '<div class="source-strip source-strip-bottom">' +
      renderSourceBadge(item.googleMapsUrl, isSpanish ? 'Google Maps' : 'Google Maps', 'maps') +
      renderSourceBadge(item.websiteUrl, websiteLabel, 'website') +
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
      dot.setAttribute('aria-label', (isSpanish ? 'Mostrar foto del condominio ' : 'Show condo photo ') + (index + 1));
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

  renderRecommendationSections(window.RECOMMENDATIONS_PAGE_DATA);
  photoCarousels.forEach(initPhotoCarousel);
  updateScrollEffects();
  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  window.addEventListener('resize', updateScrollEffects);
})();
