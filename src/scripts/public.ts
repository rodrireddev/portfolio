/**
 * Public-site web components. They enhance server-rendered light-DOM markup,
 * so the page stays readable even before (or without) JavaScript.
 */

class PfNav extends HTMLElement {
  connectedCallback() {
    const toggle = this.querySelector<HTMLButtonElement>('[data-menu]');
    toggle?.addEventListener('click', () => {
      const open = this.toggleAttribute('data-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    this.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => this.removeAttribute('data-open')));
    const onScroll = () => this.toggleAttribute('data-scrolled', window.scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

class PfThemeToggle extends HTMLElement {
  connectedCallback() {
    const btn = this.querySelector('button')!;
    const root = document.documentElement;
    const sync = () => btn.setAttribute('aria-label', root.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    sync();
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {}
      sync();
    });
  }
}

/** Filters `.project-card[data-tags]` inside the element matched by the `target` attribute. */
class PfProjectFilter extends HTMLElement {
  connectedCallback() {
    const grid = document.querySelector(this.getAttribute('target') ?? '');
    if (!grid) return;
    const buttons = [...this.querySelectorAll<HTMLButtonElement>('button[data-tag]')];
    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        const tag = b.dataset.tag!;
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        grid.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
          const tags = (card.dataset.tags ?? '').split('|');
          card.hidden = tag !== '*' && !tags.includes(tag);
        });
      }),
    );
  }
}

/** Thumbnail grid + accessible lightbox built on <dialog>. */
class PfGallery extends HTMLElement {
  private dialog!: HTMLDialogElement;
  private img!: HTMLImageElement;
  private count!: HTMLElement;
  private index = 0;
  private items: { src: string; alt: string }[] = [];

  connectedCallback() {
    const thumbs = [...this.querySelectorAll<HTMLButtonElement>('button[data-src]')];
    this.items = thumbs.map((t) => ({ src: t.dataset.src!, alt: t.dataset.alt ?? '' }));
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'lightbox';
    this.dialog.setAttribute('aria-label', 'Image viewer');
    this.dialog.innerHTML = `
      <div class="stage"><img alt="" /></div>
      <button class="lb-btn lb-close" aria-label="Close">✕</button>
      <button class="lb-btn lb-prev" aria-label="Previous image">‹</button>
      <button class="lb-btn lb-next" aria-label="Next image">›</button>
      <div class="lb-count" aria-live="polite"></div>`;
    this.append(this.dialog);
    this.img = this.dialog.querySelector('img')!;
    this.count = this.dialog.querySelector('.lb-count')!;

    thumbs.forEach((t, i) => t.addEventListener('click', () => this.open(i)));
    this.dialog.querySelector('.lb-close')!.addEventListener('click', () => this.dialog.close());
    this.dialog.querySelector('.lb-prev')!.addEventListener('click', () => this.show(this.index - 1));
    this.dialog.querySelector('.lb-next')!.addEventListener('click', () => this.show(this.index + 1));
    this.dialog.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('stage')) this.dialog.close();
    });
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.show(this.index - 1);
      if (e.key === 'ArrowRight') this.show(this.index + 1);
    });
  }

  private open(i: number) {
    this.show(i);
    this.dialog.showModal();
  }

  private show(i: number) {
    this.index = (i + this.items.length) % this.items.length;
    const { src, alt } = this.items[this.index];
    this.img.src = src;
    this.img.alt = alt;
    this.count.textContent = `${this.index + 1} / ${this.items.length}`;
  }
}

/** Click-to-load YouTube facade (privacy-friendly nocookie embed, no iframe until clicked). */
class PfYoutube extends HTMLElement {
  connectedCallback() {
    const id = this.getAttribute('video-id');
    if (!id || !/^[\w-]{11}$/.test(id)) return;
    const title = this.getAttribute('title') ?? 'Project video';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Play video: ${title}`);
    btn.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
    btn.innerHTML = `<span class="play"><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>`;
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = title;
      frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(frame);
    });
    this.append(btn);
  }
}

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      reset(id?: string): void;
    };
  }
}

/** Contact form protected by Cloudflare Turnstile (verified server-side in /api/contact). */
class PfContactForm extends HTMLElement {
  private token = '';
  private widgetId?: string;

  connectedCallback() {
    const form = this.querySelector('form')!;
    const status = this.querySelector<HTMLElement>('.form-status')!;
    const submit = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    const slot = this.querySelector<HTMLElement>('.captcha')!;
    const siteKey = this.getAttribute('site-key');

    if (siteKey) this.loadTurnstile(slot, siteKey);

    const say = (text: string, type: 'ok' | 'error' | '' = '') => {
      status.textContent = text;
      status.dataset.type = type;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.token) return say('Please complete the captcha first.', 'error');
      const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
      submit.disabled = true;
      say('Sending…');
      try {
        const res = await fetch(this.getAttribute('endpoint') ?? '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, token: this.token }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error ?? 'Something went wrong.');
        form.reset();
        say('Thanks! Your message was sent — I will get back to you soon.', 'ok');
      } catch (err) {
        say((err as Error).message, 'error');
      } finally {
        // Tokens are single-use: always request a fresh one.
        this.token = '';
        if (this.widgetId) window.turnstile?.reset(this.widgetId);
        submit.disabled = false;
      }
    });
  }

  private loadTurnstile(slot: HTMLElement, sitekey: string) {
    const render = () => {
      this.widgetId = window.turnstile!.render(slot, {
        sitekey,
        theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
        callback: (t: string) => (this.token = t),
        'expired-callback': () => (this.token = ''),
        'error-callback': () => (this.token = ''),
      });
    };
    if (window.turnstile) return render();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = render;
    document.head.append(s);
  }
}

/**
 * Cursor follower for mouse devices: a dot that tracks the pointer and a ring that trails it
 * with inertia, growing over interactive elements. The native cursor stays visible.
 * The animation loop sleeps when the ring has caught up with the pointer.
 */
class PfCursor extends HTMLElement {
  connectedCallback() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return this.remove();
    }
    this.innerHTML = '<span class="cur-ring"></span><span class="cur-dot"></span>';
    const ring = this.firstElementChild as HTMLElement;
    const dot = this.lastElementChild as HTMLElement;
    let x = -100, y = -100, rx = x, ry = y, running = false;

    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      if (Math.hypot(x - rx, y - ry) > 0.1) requestAnimationFrame(tick);
      else running = false;
    };

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      this.dataset.on = '';
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
      const hot = (e.target as Element | null)?.closest('a, button, summary, [role=button], input, textarea, select, label');
      this.toggleAttribute('data-hot', !!hot);
    }, { passive: true });
    addEventListener('pointerdown', () => this.setAttribute('data-down', ''));
    addEventListener('pointerup', () => this.removeAttribute('data-down'));
    document.documentElement.addEventListener('pointerleave', () => this.removeAttribute('data-on'));
  }
}

customElements.define('pf-nav', PfNav);
customElements.define('pf-theme-toggle', PfThemeToggle);
customElements.define('pf-project-filter', PfProjectFilter);
customElements.define('pf-gallery', PfGallery);
customElements.define('pf-youtube', PfYoutube);
customElements.define('pf-contact-form', PfContactForm);
customElements.define('pf-cursor', PfCursor);

export {};
