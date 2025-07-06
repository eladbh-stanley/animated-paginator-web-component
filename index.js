// Animated Paginator Web Component
// --------------------------------------------------
// Bundled as a single ES module so it can be published directly to npm
// and consumed in any modern (ES module–compatible) environment.
//
// Usage (after installing from npm):
//   import 'animated-paginator-web-component';
//   <animated-paginator pages="5"></animated-paginator>
//
// No build-step required for consumers. All styling is encapsulated in
// the Shadow DOM.

class AnimatedPaginator extends HTMLElement {
  constructor() {
    super();
    // Shadow DOM for full style isolation
    this.attachShadow({ mode: 'open' });

    // Default configuration
    this._config = {
      pageCount: 3,
      initialPage: 0,
      pageColors: ['#4285F4', '#FDBB2D', '#9A40D3']
    };

    // State
    this._currentPage = 0;
    this._isAnimating = false;
    this._dots = [];
    this._selector = null;
  }

  // Attributes to observe for changes
  static get observedAttributes() {
    return ['pages', 'initial-page', 'page-colors', 'orientation', 'page'];
  }

  // React to attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'page') {
      const requestedPage = parseInt(newValue, 10);
      if (!Number.isNaN(requestedPage)) {
        this._goToPage(requestedPage);
      }
      return;
    }

    this._updateConfig();
    // If the component has already rendered, re-render
    if (this.shadowRoot && this.shadowRoot.innerHTML) {
      this._render();
    }
  }

  // ----------------------------------------------
  // Lifecycle
  // ----------------------------------------------
  connectedCallback() {
    this._updateConfig();
    this._render();
    this._initialize();
  }

  // ----------------------------------------------
  // Public API
  // ----------------------------------------------
  /** Move to next page */
  next() {
    this._goToPage(this._currentPage + 1);
  }

  /** Move to previous page */
  previous() {
    this._goToPage(this._currentPage - 1);
  }

  /** Current page index */
  getCurrentPage() {
    return this._currentPage;
  }

  // Getter / setter for `page` property for external control
  get page() {
    return this._currentPage;
  }

  set page(value) {
    const index = parseInt(value, 10);
    if (!Number.isNaN(index)) {
      this._goToPage(index);
    }
  }

  /** Total number of pages */
  getPageCount() {
    return this._config.pageCount;
  }

  // ----------------------------------------------
  // Internal helpers
  // ----------------------------------------------
  _updateConfig() {
    const pages = parseInt(this.getAttribute('pages') ?? `${this._config.pageCount}`, 10);
    const initialPage = parseInt(this.getAttribute('initial-page') ?? `${this._config.initialPage}`, 10);
    const pageColorsAttr = this.getAttribute('page-colors');
    const orientationAttr = this.getAttribute('orientation');
    const orientation = orientationAttr === 'vertical' ? 'vertical' : 'horizontal';
    const pageColors = pageColorsAttr ? pageColorsAttr.split(',') : this._config.pageColors;

    this._config = {
      pageCount: Number.isFinite(pages) && pages > 0 ? pages : 3,
      initialPage: Math.max(0, Math.min(initialPage || 0, (pages || 3) - 1)),
      pageColors,
      orientation
    };
  }

  _render() {
    // Styling & template
    const orientationClass = this._config.orientation === 'vertical' ? 'vertical' : 'horizontal';

    const style = `
      <style>
        :host {
          --start-left: 0px;
          --end-left: 0px;
          --stretch-width: 0px;
          --final-width: 12px;

          --start-top: 0px;
          --end-top: 0px;
          --final-height: 12px;
          --stretch-height: 0px;
          display: inline-block;
        }

        .paginator {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          cursor: pointer;
        }

        /* Orientation modifiers */
        .paginator.vertical {
          flex-direction: column;
        }

        .paginator.horizontal {
          flex-direction: row;
        }

        .paginator-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.5);
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .paginator-dot.active {
          opacity: 0;
        }

        .paginator-selector {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: var(--start-left);
          width: var(--final-width);
          height: 12px;
          background-color: #ffffff;
          border-radius: 6px;
          z-index: 2;
        }

        /* selector style for vertical */
        .paginator.vertical .paginator-selector {
          left: 50%;
          transform: translateX(-50%);
          top: var(--start-top);
          width: 12px;
          height: var(--final-height);
        }

        .paginator-selector.animate-right {
          animation: move-right 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        .paginator-selector.animate-left {
          animation: move-left 0.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        /* vertical animations */
        .paginator-selector.animate-vertical-down {
          animation: move-down 0.4s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        .paginator-selector.animate-vertical-up {
          animation: move-up 0.4s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        @keyframes move-right {
          50% {
            left: var(--start-left);
            width: var(--stretch-width);
          }
          100% {
            left: var(--end-left);
            width: var(--final-width);
          }
        }

        @keyframes move-left {
          50% {
            left: var(--end-left);
            width: var(--stretch-width);
          }
          100% {
            left: var(--end-left);
            width: var(--final-width);
          }
        }

        @keyframes move-down {
          50% {
            top: var(--start-top);
            height: var(--stretch-height);
          }
          100% {
            top: var(--end-top);
            height: var(--final-height);
          }
        }

        @keyframes move-up {
          50% {
            top: var(--end-top);
            height: var(--stretch-height);
          }
          100% {
            top: var(--end-top);
            height: var(--final-height);
          }
        }
      </style>
    `;

    // Generate dots markup
    let dotsHtml = '';
    for (let i = 0; i < this._config.pageCount; i++) {
      dotsHtml += `<div class="paginator-dot" data-index="${i}"></div>`;
    }

    const template = `
      ${style}
      <div class="paginator ${orientationClass}">
        ${dotsHtml}
        <div class="paginator-selector"></div>
      </div>
    `;

    this.shadowRoot.innerHTML = template;

    // Cache references
    this._dots = this.shadowRoot.querySelectorAll('.paginator-dot');
    this._selector = this.shadowRoot.querySelector('.paginator-selector');

    // Add orientation-specific class to selector as helper
    this._selector.classList.add(orientationClass);

    // Attach event listeners
    this._attachEventListeners();
  }

  _attachEventListeners() {
    // Dot click handlers
    this._dots.forEach(dot => {
      dot.addEventListener('click', () => {
        this._goToPage(parseInt(dot.dataset.index, 10));
      });
    });

    // Animation end reset
    this._selector.addEventListener('animationend', () => {
      this._onAnimationEnd();
    });
  }

  _goToPage(targetIndex) {
    if (
      targetIndex < 0 ||
      targetIndex >= this._config.pageCount ||
      targetIndex === this._currentPage ||
      this._isAnimating
    ) {
      return;
    }

    this._isAnimating = true;

    const oldIndex = this._currentPage;
    const oldDot = this._dots[oldIndex];
    const newDot = this._dots[targetIndex];

    // Position calculations rely on layout. Ensure browser has rendered.
    if (this._config.orientation === 'vertical') {
      const oldPos = oldDot.offsetTop;
      const newPos = newDot.offsetTop;
      const distance = Math.abs(newPos - oldPos);
      const selectorWidth = this._selector.offsetWidth; // pill height equals width in vertical

      // Update CSS variables for animation
      this.style.setProperty('--start-top', `${oldPos}px`);
      this.style.setProperty('--end-top', `${newPos}px`);
      this.style.setProperty('--stretch-height', `${distance + selectorWidth}px`);
      this.style.setProperty('--final-height', `${selectorWidth}px`);

      if (targetIndex > oldIndex) {
        this._selector.classList.add('animate-vertical-down');
      } else {
        this._selector.classList.add('animate-vertical-up');
      }
    } else {
      const oldPos = oldDot.offsetLeft;
      const newPos = newDot.offsetLeft;
      const distance = Math.abs(newPos - oldPos);
      const selectorHeight = this._selector.offsetHeight;

      this.style.setProperty('--start-left', `${oldPos}px`);
      this.style.setProperty('--end-left', `${newPos}px`);
      this.style.setProperty('--stretch-width', `${distance + selectorHeight}px`);
      this.style.setProperty('--final-width', `${selectorHeight}px`);

      if (targetIndex > oldIndex) {
        this._selector.classList.add('animate-right');
      } else {
        this._selector.classList.add('animate-left');
      }
    }

    // Update active dot styling
    oldDot.classList.remove('active');
    newDot.classList.add('active');

    // Fire event immediately (could also wait for animation end)
    this.dispatchEvent(
      new CustomEvent('page-changed', {
        detail: {
          oldPage: oldIndex,
          newPage: targetIndex,
          pageColor: this._config.pageColors[targetIndex]
        },
        bubbles: true
      })
    );

    this._currentPage = targetIndex;

    // Reflect to attribute for external observers (avoid loop)
    if (this.getAttribute('page') !== `${targetIndex}`) {
      this.setAttribute('page', `${targetIndex}`);
    }
  }

  _onAnimationEnd() {
    this._selector.classList.remove(
      'animate-right',
      'animate-left',
      'animate-vertical-down',
      'animate-vertical-up'
    );

    const currentDot = this._dots[this._currentPage];

    if (this._config.orientation === 'vertical') {
      this._selector.style.top = `${currentDot.offsetTop}px`;
    } else {
      this._selector.style.left = `${currentDot.offsetLeft}px`;
    }
    this._isAnimating = false;
  }

  _initialize() {
    // Set initial state after first render
    this._currentPage = this._config.initialPage;
    this._dots[this._currentPage]?.classList.add('active');

    const initialDot = this._dots[this._currentPage];
    if (this._config.orientation === 'vertical') {
      this._selector.style.top = `${initialDot.offsetTop}px`;
      this._selector.style.height = `${this._selector.offsetWidth}px`;
    } else {
      this._selector.style.left = `${initialDot.offsetLeft}px`;
      this._selector.style.width = `${this._selector.offsetHeight}px`;
    }

    // Dispatch initial event so host can sync state
    this.dispatchEvent(
      new CustomEvent('page-changed', {
        detail: {
          oldPage: -1,
          newPage: this._currentPage,
          pageColor: this._config.pageColors[this._currentPage]
        },
        bubbles: true
      })
    );
  }
}

// Register the element exactly once
if (!customElements.get('animated-paginator')) {
  customElements.define('animated-paginator', AnimatedPaginator);
}

// Optional: export the class so users can extend or reference it.
export { AnimatedPaginator }; 