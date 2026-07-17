(function () {
  const STORAGE_KEY = 'markeron-lang';
  const SUPPORTED = ['en', 'zh-CN'];

  function kbdCombo(keys) {
    const keysHtml = keys
      .map((key, index) => {
        const plus = index > 0 ? '<span class="kbd-plus" aria-hidden="true">+</span>' : '';
        return `${plus}<kbd>${key}</kbd>`;
      })
      .join('');
    return `<span class="kbd-combo">${keysHtml}</span>`;
  }

  const enterCombo = kbdCombo(['Ctrl', 'Shift', 'D']);
  const clickThroughCombo = kbdCombo(['Ctrl', 'Shift', 'X']);

  const messages = {
    en: {
      'meta.title': 'MarkerOn - Lightweight Screen Annotation Tool',
      'meta.description':
        'MarkerOn is a lightweight open-source screen annotation tool with click-through mode, whiteboard mode, and keyboard-first drawing for Windows and macOS.',
      'meta.keywords':
        'screen annotation tool, desktop drawing overlay, click-through annotation, desktop whiteboard, Tauri app, screen drawing',
      'meta.ogTitle': 'MarkerOn - Lightweight Screen Annotation Tool',
      'meta.ogDescription':
        'Draw, highlight, and annotate anywhere on your desktop. Click-through mode keeps annotations visible while you interact with apps below.',
      'skip': 'Skip to content',
      'nav.aria': 'Primary navigation',
      'nav.brandAria': 'MarkerOn home',
      'nav.linksAria': 'Product links',
      'nav.features': 'Features',
      'nav.download': 'Download',
      'nav.faq': 'FAQ',
      'nav.sponsor': 'Sponsor',
      'nav.github': 'GitHub',
      'nav.langAria': 'Language',
      'nav.langEn': 'English',
      'nav.langZh': 'Chinese',
      'hero.eyebrow': 'Open source / Tauri v2 / ~1.5\u00a0MB',
      'hero.copy':
        'A keyboard-first screen annotation tool for demos, teaching, meetings, and recordings. Draw over any app, then switch to click-through mode while your marks stay visible.',
      'hero.downloadAria': 'Download actions',
      'hero.downloadLatest': 'Download Latest',
      'hero.msStore': 'Microsoft Store',
      'hero.chipsAria': 'Core capabilities',
      'hero.chip.tools': '8 drawing tools',
      'hero.chip.clickThrough': 'Click-through mode',
      'hero.chip.whiteboard': 'Whiteboard mode',
      'hero.chip.platforms': 'Win / macOS',
      'hero.quickStartAria': 'Quick start',
      'hero.quickStartTitle': 'Quick Start',
      'hero.quickStep1': 'Launch — runs in the system tray',
      'hero.quickStep2': `${enterCombo} — enter annotation`,
      'hero.quickStep3': '<kbd>X</kbd> — click through; <kbd>Esc</kbd> — exit',
      'hero.quickStep4': '<kbd>Space</kbd> — toolbar',
      'proof.aria': 'Why MarkerOn',
      'proof.instantTitle': 'Instant',
      'proof.instantBody': `Press ${enterCombo} and start drawing over any app.`,
      'proof.unintrusiveTitle': 'Unintrusive',
      'proof.unintrusiveBody': 'Runs in the tray — no account, telemetry, or cloud dependency.',
      'proof.preciseTitle': 'Precise',
      'proof.preciseBody': 'Shortcuts, angle snapping, custom widths, undo/redo — no menus required.',
      'features.eyebrow': 'Built for live explanation',
      'features.title': 'Keep the screen moving while your marks stay put.',
      'features.clickThroughTitle': 'Click-through mode',
      'features.clickThroughBody': `Toggle from the toolbar or with ${clickThroughCombo}. Annotations stay visible while clicks, scrolls, and typing reach the app underneath.`,
      'features.keyboardTitle': 'Keyboard-first tools',
      'features.keyboardBody':
        'Number keys switch tools. <kbd>Ctrl</kbd>+scroll adjusts width. <kbd>Q</kbd>/<kbd>E</kbd> cycle colors. Copy and clear without opening menus.',
      'features.whiteboardTitle': 'Whiteboard when needed',
      'features.whiteboardBody':
        'Press <kbd>W</kbd> for a clean board, keep content between sessions, and copy as an image for docs or chats.',
      'showcase.surfaceEyebrow': 'Product surface',
      'showcase.toolsTitle': 'Annotation tools',
      'showcase.toolsAlt': 'MarkerOn annotation tools',
      'showcase.toolsCaption': 'Pen, highlighter, arrow, shapes, eraser, text, and colors.',
      'showcase.settingsTitle': 'Settings panel',
      'showcase.settingsAlt': 'MarkerOn settings panel',
      'showcase.settingsCaption': 'Toolbar, whiteboard, drag modes, shortcuts, and startup.',
      'showcase.demoEyebrow': 'Live demo',
      'showcase.demoTitle': 'Click-through mode',
      'showcase.demoAlt':
        'Click-through demo: draw on screen, press X, then select text in the app below while annotations remain visible',
      'showcase.demoCaption': 'Draw, press <kbd>X</kbd>, then keep working underneath.',
      'shortcuts.aria': 'Essential shortcuts',
      'shortcuts.enter': 'Enter',
      'shortcuts.toolbar': 'Toolbar',
      'shortcuts.through': 'Through',
      'shortcuts.board': 'Board',
      'bottom.eyebrow': 'Get started',
      'bottom.title': 'Download MarkerOn or read the FAQ.',
      'bottom.lead': 'Official installers and quick answers when comparing screen annotation tools.',
      'bottom.downloadLabel': 'Official downloads',
      'bottom.faqLabel': 'Common questions',
      'bottom.githubTitle': 'GitHub Releases',
      'bottom.githubDesc': 'Windows and macOS assets',
      'bottom.storeTitle': 'Microsoft Store',
      'bottom.storeDesc': 'Windows install and updates',
      'bottom.sourceTitle': 'Source Code',
      'bottom.sourceDesc': 'MIT licensed on GitHub',
      'bottom.faq1Title': 'What is MarkerOn for?',
      'bottom.faq1Desc':
        'Live screen annotation for demos, teaching, and meetings — keyboard-first tools and click-through mode built in.',
      'bottom.faq2Title': 'How does click-through mode work?',
      'bottom.faq2Desc': `Toggle from the toolbar, with ${clickThroughCombo} (global), or press <kbd>X</kbd> while drawing. Marks stay visible while you click, scroll, and type in apps below.`,
      'bottom.faq3Title': 'Account or cloud upload?',
      'bottom.faq3Desc': 'No. Local-first, open source, and account-free.',
      'footer.license':
        '<a href="https://github.com/ifer47/markeron" translate="no">MarkerOn</a> is open source under the MIT License.',
      'footer.sponsor': 'Support development',
      'footer.feedback': 'Feedback and issues',
    },
    'zh-CN': {
      'meta.title': 'MarkerOn - 轻量级屏幕标注工具',
      'meta.description':
        'MarkerOn 是一款轻量级开源屏幕标注工具，支持穿透模式、白板模式与快捷键优先绘制，适用于 Windows 和 macOS。',
      'meta.keywords':
        '屏幕标注工具, 桌面标注, 穿透模式, 桌面白板, Tauri 应用, 屏幕绘画',
      'meta.ogTitle': 'MarkerOn - 轻量级屏幕标注工具',
      'meta.ogDescription':
        '在桌面任意位置绘画、高亮与标注。穿透模式下标注保持可见，同时可操作下层应用。',
      'skip': '跳到主要内容',
      'nav.aria': '主导航',
      'nav.brandAria': 'MarkerOn 首页',
      'nav.linksAria': '产品链接',
      'nav.features': '功能',
      'nav.download': '下载',
      'nav.faq': '常见问题',
      'nav.sponsor': '赞助',
      'nav.github': 'GitHub',
      'nav.langAria': '语言',
      'nav.langEn': '英语',
      'nav.langZh': '中文',
      'hero.eyebrow': '开源 / Tauri v2 / 约 1.5 MB',
      'hero.copy':
        '面向演示、教学、会议与录屏的快捷键优先屏幕标注工具。可在任意应用上方绘画，并切换到穿透模式，标注保持可见。',
      'hero.downloadAria': '下载操作',
      'hero.downloadLatest': '下载最新版',
      'hero.msStore': '微软商店',
      'hero.chipsAria': '核心能力',
      'hero.chip.tools': '8 种绘画工具',
      'hero.chip.clickThrough': '穿透模式',
      'hero.chip.whiteboard': '白板模式',
      'hero.chip.platforms': 'Win / macOS',
      'hero.quickStartAria': '快速开始',
      'hero.quickStartTitle': '快速开始',
      'hero.quickStep1': '启动 — 在系统托盘运行',
      'hero.quickStep2': `${enterCombo} — 进入标注`,
      'hero.quickStep3': '<kbd>X</kbd> — 穿透操作；<kbd>Esc</kbd> — 退出',
      'hero.quickStep4': '<kbd>Space</kbd> — 呼出工具栏',
      'proof.aria': '为什么选择 MarkerOn',
      'proof.instantTitle': '即开即用',
      'proof.instantBody': `按 ${enterCombo}，即可在任意应用上方开始标注。`,
      'proof.unintrusiveTitle': '轻量无扰',
      'proof.unintrusiveBody': '托盘常驻 — 无需账号、遥测或云端依赖。',
      'proof.preciseTitle': '精准高效',
      'proof.preciseBody': '快捷键、角度吸附、自定义线宽、撤销重做 — 无需打开菜单。',
      'features.eyebrow': '为现场讲解而生',
      'features.title': '屏幕继续操作，标注留在原地。',
      'features.clickThroughTitle': '穿透模式',
      'features.clickThroughBody': `在工具栏或按 ${clickThroughCombo} 切换。标注保持可见，点击、滚动与输入可到达下层应用。`,
      'features.keyboardTitle': '快捷键优先',
      'features.keyboardBody':
        '数字键切换工具。<kbd>Ctrl</kbd>+滚轮调整线宽。<kbd>Q</kbd>/<kbd>E</kbd> 切换颜色。复制与清空无需打开菜单。',
      'features.whiteboardTitle': '需要时使用白板',
      'features.whiteboardBody':
        '按 <kbd>W</kbd> 打开干净白板，内容可跨会话保留，并复制为图片用于文档或聊天。',
      'showcase.surfaceEyebrow': '产品界面',
      'showcase.toolsTitle': '标注工具',
      'showcase.toolsAlt': 'MarkerOn 标注工具',
      'showcase.toolsCaption': '画笔、荧光笔、箭头、形状、橡皮擦、文字与颜色。',
      'showcase.settingsTitle': '设置面板',
      'showcase.settingsAlt': 'MarkerOn 设置面板',
      'showcase.settingsCaption': '工具栏、白板、拖拽模式、快捷键与启动项。',
      'showcase.demoEyebrow': '动态演示',
      'showcase.demoTitle': '穿透模式',
      'showcase.demoAlt': '穿透模式演示：在屏幕上绘画，按 X 后可在保留标注的同时操作下层应用',
      'showcase.demoCaption': '绘画后按 <kbd>X</kbd>，继续操作下层内容。',
      'shortcuts.aria': '常用快捷键',
      'shortcuts.enter': '进入',
      'shortcuts.toolbar': '工具栏',
      'shortcuts.through': '穿透',
      'shortcuts.board': '白板',
      'bottom.eyebrow': '开始使用',
      'bottom.title': '下载 MarkerOn 或查看常见问题。',
      'bottom.lead': '官方安装包与对比屏幕标注工具时的快速解答。',
      'bottom.downloadLabel': '官方下载',
      'bottom.faqLabel': '常见问题',
      'bottom.githubTitle': 'GitHub Releases',
      'bottom.githubDesc': 'Windows、macOS 安装包',
      'bottom.storeTitle': '微软商店',
      'bottom.storeDesc': 'Windows 安装与更新',
      'bottom.sourceTitle': '源代码',
      'bottom.sourceDesc': 'GitHub 开源，MIT 协议',
      'bottom.faq1Title': 'MarkerOn 适合什么场景？',
      'bottom.faq1Desc': '演示、教学、会议与录屏时的屏幕标注，内置快捷键工具与穿透模式。',
      'bottom.faq2Title': '穿透模式怎么用？',
      'bottom.faq2Desc': `在工具栏切换，或按 ${clickThroughCombo}（全局）、绘制中按 <kbd>X</kbd>。标注保持可见，同时可点击、滚动并在下层应用中输入。`,
      'bottom.faq3Title': '需要账号或上传截图吗？',
      'bottom.faq3Desc': '不需要。本地优先、开源、无需账号。',
      'footer.license':
        '<a href="https://github.com/ifer47/markeron" translate="no">MarkerOn</a> 基于 MIT 协议开源。',
      'footer.sponsor': '赞助开发',
      'footer.feedback': '反馈与 Issue',
    },
  };

  function normalizeLocale(locale) {
    if (!locale) return 'en';
    if (locale === 'zh' || locale.startsWith('zh-')) return 'zh-CN';
    return SUPPORTED.includes(locale) ? locale : 'en';
  }

  function detectLocale() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('lang');
    if (fromQuery) return normalizeLocale(fromQuery);

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeLocale(stored);

    return normalizeLocale(navigator.language || 'en');
  }

  function t(locale, key) {
    return messages[locale]?.[key] ?? messages.en[key] ?? '';
  }

  function setMeta(name, content, attr) {
    const selector = attr === 'property' ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    const node = document.querySelector(selector);
    if (node) node.setAttribute('content', content);
  }

  function applyTextNodes(locale) {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      node.textContent = t(locale, key);
    });
  }

  function applyHtmlNodes(locale) {
    document.querySelectorAll('[data-i18n-html]').forEach((node) => {
      const key = node.getAttribute('data-i18n-html');
      node.innerHTML = t(locale, key);
    });
  }

  function applyAriaNodes(locale) {
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
      const key = node.getAttribute('data-i18n-aria');
      node.setAttribute('aria-label', t(locale, key));
    });
  }

  function applyAltNodes(locale) {
    document.querySelectorAll('[data-i18n-alt]').forEach((node) => {
      const key = node.getAttribute('data-i18n-alt');
      node.setAttribute('alt', t(locale, key));
    });
  }

  function updateLangSwitcher(locale) {
    document.querySelectorAll('[data-lang]').forEach((button) => {
      const active = button.getAttribute('data-lang') === locale;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyLocale(locale) {
    const normalized = normalizeLocale(locale);
    document.documentElement.lang = normalized === 'zh-CN' ? 'zh-CN' : 'en';
    document.documentElement.dataset.locale = normalized;

    document.title = t(normalized, 'meta.title');
    setMeta('description', t(normalized, 'meta.description'));
    setMeta('keywords', t(normalized, 'meta.keywords'));
    setMeta('og:title', t(normalized, 'meta.ogTitle'), 'property');
    setMeta('og:description', t(normalized, 'meta.ogDescription'), 'property');

    applyTextNodes(normalized);
    applyHtmlNodes(normalized);
    applyAriaNodes(normalized);
    applyAltNodes(normalized);
    updateLangSwitcher(normalized);

    localStorage.setItem(STORAGE_KEY, normalized);
  }

  function init() {
    const locale = detectLocale();
    applyLocale(locale);

    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', () => {
        applyLocale(button.getAttribute('data-lang'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
