/**
 * Dashboard web components: <admin-login> and <admin-app>.
 * State lives in the component; form fields bind to state through `data-path`
 * attributes (e.g. "socials.0.url") so no re-render is needed while typing.
 */
import type { Message, Profile, Project } from '../lib/types';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function api<T = any>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  keys.forEach((k) => (obj = obj[k]));
  obj[last] = value;
}

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const move = <T>(arr: T[], i: number, dir: -1 | 1) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

/* ---------- Login ---------- */
class AdminLogin extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <form class="form login">
        <h1>Dashboard</h1>
        <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required autofocus /></div>
        <button class="btn btn-primary" type="submit">Sign in</button>
        <p class="form-status" role="alert"></p>
      </form>`;
    const form = this.querySelector('form')!;
    const status = this.querySelector<HTMLElement>('.form-status')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.dataset.type = '';
      try {
        await api('/api/admin/login', 'POST', { password: (form.querySelector('input') as HTMLInputElement).value });
        location.reload();
      } catch (err) {
        status.dataset.type = 'error';
        status.textContent = (err as Error).message;
      }
    });
  }
}

/* ---------- App ---------- */
type Tab = 'profile' | 'projects' | 'messages';

class AdminApp extends HTMLElement {
  private tab: Tab = 'profile';
  private profile!: Profile;
  private projects: Project[] = [];
  private messages: Message[] = [];
  private editing: number | null = null;
  private msgSel: string | null = null;
  private msgFilter: 'all' | 'unread' = 'all';
  private msgQuery = '';
  private notice: { text: string; type: 'ok' | 'error' | '' } = { text: '', type: '' };

  async connectedCallback() {
    this.innerHTML = '<p class="muted">Loading…</p>';
    try {
      [this.profile, this.projects, this.messages] = await Promise.all([
        api<Profile>('/api/admin/profile'),
        api<Project[]>('/api/admin/projects'),
        api<Message[]>('/api/admin/messages'),
      ]);
    } catch (err) {
      this.innerHTML = `<p class="form-status" data-type="error">${esc((err as Error).message)}</p>`;
      return;
    }
    this.addEventListener('input', this.onInput);
    this.addEventListener('change', this.onInput);
    this.addEventListener('click', this.onClick);
    this.render();
  }

  private say(text: string, type: 'ok' | 'error' | '' = '') {
    this.notice = { text, type };
    const el = this.querySelector<HTMLElement>('.notice');
    if (el) {
      el.textContent = text;
      el.dataset.type = type;
    }
  }

  /* --- bindings --- */
  private target() {
    return this.editing !== null && this.tab === 'projects' ? this.projects[this.editing] : this.profile;
  }

  private onInput = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const path = el.dataset.path;
    if (el.dataset.msgSearch !== undefined) {
      this.msgQuery = el.value;
      this.querySelector('.inbox-list')!.innerHTML = this.inboxList();
      return;
    }
    if (el.type === 'file') return void (e.type === 'change' && this.onUpload(el));
    if (!path) return;
    let value: unknown = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.list !== undefined) value = String(value).split(',').map((s) => s.trim()).filter(Boolean);
    setPath(this.target(), path, value);
  };

  private async onUpload(input: HTMLInputElement) {
    const files = [...(input.files ?? [])];
    if (!files.length) return;
    this.say('Uploading…');
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.set('file', file);
        const { url } = await api<{ url: string }>('/api/admin/upload', 'POST', fd);
        if (input.dataset.upload === 'avatar') this.profile.avatarUrl = url;
        else if (input.dataset.upload === 'resume') this.profile.resumeUrl = url;
        else this.projects[this.editing!].images.push({ url, alt: '' });
      }
      this.say('Uploaded. Remember to save.', 'ok');
      this.render();
    } catch (err) {
      this.say((err as Error).message, 'error');
    }
  }

  private onClick = async (e: Event) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!el) return;
    const act = el.dataset.act!;
    const i = Number(el.dataset.i);
    const list = el.dataset.list ? (this.target() as any)[el.dataset.list] : null;

    switch (act) {
      case 'tab':
        this.tab = el.dataset.tab as Tab;
        this.editing = null;
        this.say('');
        return this.render();
      case 'logout':
        await api('/api/admin/logout', 'POST');
        return location.reload();
      case 'add-item':
        list.push(JSON.parse(el.dataset.blank!));
        return this.render();
      case 'rm-item':
        list.splice(i, 1);
        return this.render();
      case 'up':
      case 'down':
        move(list ?? this.projects, i, act === 'up' ? -1 : 1);
        return this.render();
      case 'save-profile':
        return this.save(async () => (this.profile = await api('/api/admin/profile', 'PUT', this.profile)));
      case 'new-project':
        this.projects.unshift({
          id: crypto.randomUUID(), slug: '', title: 'New project', summary: '', description: '', kind: 'personal',
          role: '', year: String(new Date().getFullYear()), tags: [], images: [], youtubeUrl: '', repoUrl: '', liveUrl: '',
          featured: false, visible: false,
        });
        this.editing = 0;
        return this.render();
      case 'edit-project':
        this.editing = i;
        return this.render();
      case 'back':
        this.editing = null;
        return this.save(async () => (this.projects = await api('/api/admin/projects', 'GET')), 'Discarded unsaved changes.');
      case 'save-projects':
        return this.save(async () => {
          this.projects = await api('/api/admin/projects', 'PUT', this.projects);
          this.editing = null;
        });
      case 'rm-project':
        if (!confirm(`Delete "${this.projects[i].title}"? This cannot be undone.`)) return;
        this.projects.splice(i, 1);
        return this.save(async () => (this.projects = await api('/api/admin/projects', 'PUT', this.projects)));
      case 'toggle-visible':
        this.projects[i].visible = !this.projects[i].visible;
        return this.save(async () => (this.projects = await api('/api/admin/projects', 'PUT', this.projects)));
      case 'save-order':
        return this.save(async () => (this.projects = await api('/api/admin/projects', 'PUT', this.projects)));
      case 'msg-open': {
        this.msgSel = el.dataset.id!;
        const m = this.messages.find((x) => x.id === this.msgSel);
        if (m && !m.read) {
          m.read = true;
          return this.syncMessages();
        }
        return this.render();
      }
      case 'msg-close':
        this.msgSel = null;
        return this.render();
      case 'msg-filter':
        this.msgFilter = el.dataset.filter as 'all' | 'unread';
        return this.render();
      case 'msg-read-all':
        this.messages.forEach((m) => (m.read = true));
        return this.syncMessages();
      case 'msg-unread': {
        const m = this.messages.find((x) => x.id === el.dataset.id);
        if (m) m.read = false;
        return this.syncMessages();
      }
      case 'msg-copy': {
        const m = this.messages.find((x) => x.id === el.dataset.id);
        await navigator.clipboard?.writeText(m?.email ?? '').catch(() => {});
        return this.say('Email copied', 'ok');
      }
      case 'msg-rm':
        if (!confirm('Delete this message?')) return;
        this.messages = this.messages.filter((m) => m.id !== el.dataset.id);
        this.msgSel = null;
        return this.syncMessages();
    }
  };

  private async save(fn: () => Promise<unknown>, okText = 'Saved ✓') {
    this.say('Saving…');
    try {
      await fn();
      this.render();
      this.say(okText, 'ok');
    } catch (err) {
      this.say((err as Error).message, 'error');
    }
  }

  /* --- templates --- */
  private input(label: string, path: string, value: unknown, extra = '') {
    return `<div class="field"><label>${label}<input data-path="${path}" value="${esc(value)}" ${extra} /></label></div>`;
  }
  private area(label: string, path: string, value: unknown, rows = 5) {
    return `<div class="field"><label>${label}<textarea data-path="${path}" rows="${rows}">${esc(value)}</textarea></label></div>`;
  }
  private upload(kind: string, label: string, multiple = false) {
    return `<label class="btn upload">${label}<input type="file" hidden accept="image/*" data-upload="${kind}" ${multiple ? 'multiple' : ''} /></label>`;
  }

  private render() {
    const unread = this.messages.filter((m) => !m.read).length;
    const tabs: [Tab, string][] = [['profile', 'Profile'], ['projects', 'Projects'], ['messages', `Messages${unread ? ` (${unread})` : ''}`]];
    this.innerHTML = `
      <div class="adm-bar">
        <nav class="adm-tabs">${tabs.map(([t, l]) => `<button class="chip-btn" data-act="tab" data-tab="${t}" aria-pressed="${this.tab === t}">${l}</button>`).join('')}</nav>
        <div class="adm-right"><span class="notice form-status" role="status" data-type="${this.notice.type}">${esc(this.notice.text)}</span>
          <a class="btn" href="/" target="_blank">View site ↗</a>
          <button class="btn" data-act="logout">Sign out</button></div>
      </div>
      ${this.tab === 'profile' ? this.profileView() : this.tab === 'projects' ? this.projectsView() : this.messagesView()}`;
  }

  private profileView() {
    const p = this.profile;
    return `
      <div class="adm-grid">
        <section class="card"><h2>Identity</h2>
          ${this.input('Full name', 'name', p.name)}
          ${this.input('Role / headline', 'role', p.role)}
          ${this.area('Tagline', 'tagline', p.tagline, 2)}
          ${this.input('Availability badge (empty to hide)', 'availability', p.availability)}
          ${this.input('Location', 'location', p.location)}
          ${this.input('Public email', 'email', p.email, 'type="email"')}
        </section>
        <section class="card"><h2>Avatar & résumé</h2>
          ${p.avatarUrl ? `<img class="adm-thumb round" src="${esc(p.avatarUrl)}" alt="" />` : ''}
          ${this.input('Avatar URL', 'avatarUrl', p.avatarUrl)}
          <div>${this.upload('avatar', 'Upload avatar')}</div>
          ${this.input('Résumé URL (PDF link, empty to hide)', 'resumeUrl', p.resumeUrl)}
          <h2 class="sub-h">SEO</h2>
          ${this.input('Site title', 'siteTitle', p.siteTitle)}
          ${this.area('Site description', 'siteDescription', p.siteDescription, 2)}
        </section>
        <section class="card wide"><h2>About</h2>${this.area('Bio (blank line = new paragraph)', 'bio', p.bio, 7)}</section>
        <section class="card"><h2>Social links</h2>
          ${p.socials.map((s, i) => `<div class="row">${this.input('Label', `socials.${i}.label`, s.label)}${this.input('URL', `socials.${i}.url`, s.url)}${this.rowActs('socials', i)}</div>`).join('')}
          <p class="muted small">Shown as icons under the hero and in the contact section. Known names get their icon: LinkedIn, GitHub, X, YouTube.</p>
          <div class="acts">
            <button class="btn" data-act="add-item" data-list="socials" data-blank='{"label":"LinkedIn","url":"https://www.linkedin.com/in/"}'>+ LinkedIn</button>
            <button class="btn" data-act="add-item" data-list="socials" data-blank='{"label":"GitHub","url":"https://github.com/"}'>+ GitHub</button>
            <button class="btn" data-act="add-item" data-list="socials" data-blank='{"label":"X","url":"https://x.com/"}'>+ X</button>
            <button class="btn" data-act="add-item" data-list="socials" data-blank='{"label":"YouTube","url":"https://www.youtube.com/@"}'>+ YouTube</button>
            <button class="btn" data-act="add-item" data-list="socials" data-blank='{"label":"","url":"https://"}'>+ Other</button>
          </div>
        </section>
        <section class="card"><h2>Skills</h2>
          ${p.skills.map((g, i) => `<div class="row">${this.input('Group', `skills.${i}.group`, g.group)}${this.input('Items (comma separated)', `skills.${i}.items`, g.items.join(', '), 'data-list')}${this.rowActs('skills', i)}</div>`).join('')}
          <button class="btn" data-act="add-item" data-list="skills" data-blank='{"group":"","items":[]}'>+ Add group</button>
        </section>
        <section class="card wide"><h2>Experience</h2>
          ${p.experience.map((x, i) => `<div class="exp">${this.input('Company', `experience.${i}.company`, x.company)}${this.input('Role', `experience.${i}.role`, x.role)}${this.input('Period', `experience.${i}.period`, x.period)}${this.area('Description', `experience.${i}.description`, x.description, 2)}${this.rowActs('experience', i)}</div>`).join('')}
          <button class="btn" data-act="add-item" data-list="experience" data-blank='{"company":"","role":"","period":"","description":""}'>+ Add experience</button>
        </section>
      </div>
      <div class="savebar"><button class="btn btn-primary" data-act="save-profile">Save profile</button></div>`;
  }

  private rowActs(list: string, i: number) {
    return `<div class="acts"><button class="icon-btn" title="Move up" data-act="up" data-list="${list}" data-i="${i}">↑</button><button class="icon-btn" title="Move down" data-act="down" data-list="${list}" data-i="${i}">↓</button><button class="icon-btn" title="Remove" data-act="rm-item" data-list="${list}" data-i="${i}">✕</button></div>`;
  }

  private projectsView() {
    if (this.editing !== null) return this.projectForm(this.projects[this.editing]);
    const rows = this.projects
      .map(
        (p, i) => `<div class="proj-row">
          ${p.images[0] ? `<img class="adm-thumb" src="${esc(p.images[0].url)}" alt="" />` : '<div class="adm-thumb"></div>'}
          <div class="grow"><strong>${esc(p.title)}</strong>
            <div class="muted small">${p.featured ? '★ Featured · ' : ''}${p.visible ? 'Published' : 'Draft'} · /projects/${esc(p.slug || '…')}</div></div>
          <div class="acts">
            <button class="btn" data-act="toggle-visible" data-i="${i}">${p.visible ? 'Unpublish' : 'Publish'}</button>
            <button class="icon-btn" data-act="up" data-i="${i}" title="Move up">↑</button>
            <button class="icon-btn" data-act="down" data-i="${i}" title="Move down">↓</button>
            <button class="btn" data-act="edit-project" data-i="${i}">Edit</button>
            <button class="icon-btn" data-act="rm-project" data-i="${i}" title="Delete">🗑</button>
          </div></div>`,
      )
      .join('');
    return `<div class="card"><div class="adm-head"><h2>Projects</h2>
      <div><button class="btn" data-act="save-order">Save order</button> <button class="btn btn-primary" data-act="new-project">+ New project</button></div></div>
      ${rows || '<p class="empty">No projects yet.</p>'}</div>`;
  }

  private projectForm(p: Project) {
    const imgs = p.images
      .map(
        (im, i) => `<div class="img-row"><img class="adm-thumb" src="${esc(im.url)}" alt="" />
          ${this.input('Alt text', `images.${i}.alt`, im.alt)}${this.rowActs('images', i)}</div>`,
      )
      .join('');
    return `<div class="card"><div class="adm-head"><h2>${esc(p.title) || 'Project'}</h2><button class="btn" data-act="back">← Discard & back</button></div>
      <div class="adm-grid">
        <div>
          ${this.input('Title', 'title', p.title)}
          ${this.input('URL slug (auto from title if empty)', 'slug', p.slug)}
          ${this.area('Short summary (shown on the card)', 'summary', p.summary, 2)}
          ${this.area('Full description (blank line = new paragraph)', 'description', p.description, 10)}
        </div>
        <div>
          <div class="field"><label>Type<select data-path="kind"><option value="personal" ${p.kind === 'personal' ? 'selected' : ''}>Personal project</option><option value="team" ${p.kind === 'team' ? 'selected' : ''}>Team / client project</option></select></label></div>
          ${this.input('Your role', 'role', p.role)}
          ${this.input('Year', 'year', p.year)}
          ${this.input('Tech tags (comma separated)', 'tags', p.tags.join(', '), 'data-list')}
          ${this.input('YouTube URL', 'youtubeUrl', p.youtubeUrl, 'placeholder="https://youtu.be/…"')}
          ${this.input('Live site URL', 'liveUrl', p.liveUrl)}
          ${this.input('Repository URL', 'repoUrl', p.repoUrl)}
          <label class="check"><input type="checkbox" data-path="featured" ${p.featured ? 'checked' : ''} /> Featured (shown first)</label>
          <label class="check"><input type="checkbox" data-path="visible" ${p.visible ? 'checked' : ''} /> Published</label>
        </div>
      </div>
      <h3>Screenshots <span class="muted small">(first image is the cover)</span></h3>
      ${imgs}${this.upload('project', '+ Upload images', true)}
      <div class="savebar"><button class="btn btn-primary" data-act="save-projects">Save project</button></div></div>`;
  }

  /** Messages matching the current filter and search query. */
  private visibleMessages() {
    const q = this.msgQuery.trim().toLowerCase();
    return this.messages.filter(
      (m) =>
        (this.msgFilter === 'all' || !m.read) &&
        (!q || [m.name, m.email, m.message].some((s) => s.toLowerCase().includes(q))),
    );
  }

  private inboxList() {
    const list = this.visibleMessages();
    if (!list.length) return `<p class="empty">${this.messages.length ? 'No messages match.' : 'No messages yet.'}</p>`;
    return list
      .map(
        (m) => `<button class="inbox-item ${m.read ? '' : 'unread'}" data-act="msg-open" data-id="${esc(m.id)}" aria-current="${m.id === this.msgSel}">
          <span class="avatar-sm">${esc(m.name.trim().charAt(0).toUpperCase() || '?')}</span>
          <span class="inbox-text">
            <span class="inbox-row"><strong>${esc(m.name)}</strong><time>${esc(timeAgo(m.createdAt))}</time></span>
            <span class="inbox-snippet">${esc(m.message.replace(/\s+/g, ' ').slice(0, 90))}</span>
          </span>${m.read ? '' : '<i class="dot" aria-label="Unread"></i>'}</button>`,
      )
      .join('');
  }

  private inboxDetail() {
    const m = this.messages.find((x) => x.id === this.msgSel);
    if (!m) return '<div class="inbox-placeholder"><p class="muted">Select a message to read it.</p></div>';
    const id = esc(m.id);
    const subject = encodeURIComponent('Re: your message');
    const quoted = encodeURIComponent(`\n\n— On ${new Date(m.createdAt).toLocaleString()}, ${m.name} wrote:\n> ${m.message.replace(/\n/g, '\n> ')}`);
    return `<article class="inbox-detail-body">
      <button class="btn back-btn" data-act="msg-close">← Inbox</button>
      <header class="detail-top"><span class="avatar-sm lg">${esc(m.name.trim().charAt(0).toUpperCase() || '?')}</span>
        <div><h3>${esc(m.name)}</h3><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></div></header>
      <p class="muted small">${esc(new Date(m.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }))}</p>
      <div class="msg-body">${esc(m.message)}</div>
      <div class="acts">
        <a class="btn btn-primary" href="mailto:${esc(m.email)}?subject=${subject}&body=${quoted}">Reply</a>
        <button class="btn" data-act="msg-copy" data-id="${id}">Copy email</button>
        <button class="btn" data-act="msg-unread" data-id="${id}">Mark unread</button>
        <button class="btn danger" data-act="msg-rm" data-id="${id}">Delete</button>
      </div></article>`;
  }

  private messagesView() {
    const unread = this.messages.filter((m) => !m.read).length;
    const chip = (f: 'all' | 'unread', label: string) =>
      `<button class="chip-btn" data-act="msg-filter" data-filter="${f}" aria-pressed="${this.msgFilter === f}">${label}</button>`;
    return `<div class="card inbox ${this.msgSel ? 'has-sel' : ''}">
      <div class="inbox-top">
        <h2>Messages</h2>
        <div class="inbox-tools">
          ${chip('all', `All (${this.messages.length})`)}${chip('unread', `Unread (${unread})`)}
          <input class="search" type="search" placeholder="Search…" aria-label="Search messages" data-msg-search value="${esc(this.msgQuery)}" />
          ${unread ? '<button class="btn" data-act="msg-read-all">Mark all read</button>' : ''}
        </div>
      </div>
      <div class="inbox-body">
        <div class="inbox-list">${this.inboxList()}</div>
        <div class="inbox-pane">${this.inboxDetail()}</div>
      </div></div>`;
  }

  /** Applies local inbox changes immediately and persists them in the background. */
  private async syncMessages() {
    this.render();
    try {
      await api('/api/admin/messages', 'PUT', {
        keep: this.messages.map((m) => m.id),
        read: this.messages.filter((m) => m.read).map((m) => m.id),
        unread: this.messages.filter((m) => !m.read).map((m) => m.id),
      });
    } catch (err) {
      this.say((err as Error).message, 'error');
    }
  }
}

customElements.define('admin-login', AdminLogin);
customElements.define('admin-app', AdminApp);
