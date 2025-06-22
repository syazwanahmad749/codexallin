// ==UserScript==
// @name         VideoFX Suite Reborn
// @namespace    https://labs.google/
// @version      1.0.0
// @description  Unified Prompt Enhancer, Image Deconstructor and Promptless Generator with a refreshed UI
// @author       Combined
// @match        https://labs.google/fx/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const FONT_URL = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Material+Symbols+Outlined:wght@400&display=swap';
    const STYLE_ID = 'vfx-suite-styles';

    const SUITE_ID = 'vfx-suite';
    const FAB_ID = 'vfx-suite-fab';
    const OVERLAY_ID = 'vfx-suite-overlay';
    const TABS = { ENHANCE: 'enhance', DECON: 'decon', PROMPTLESS: 'promptless' };

    function addGlobalStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = FONT_URL;
        document.head.appendChild(link);
        GM_addStyle(`
            :root {
                --vfx-bg: #1e1e1e;
                --vfx-bg-light: #2a2a2a;
                --vfx-border: #3a3a3a;
                --vfx-text: #fff;
                --vfx-accent: #4285f4;
                --vfx-radius: 6px;
                --vfx-shadow: rgba(0,0,0,0.4) 0 4px 20px;
            }
            #${FAB_ID} { position:fixed; bottom:20px; right:20px; width:56px; height:56px; border-radius:50%; background:var(--vfx-accent); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10000; box-shadow:var(--vfx-shadow); }
            #${FAB_ID} span { font-size:32px; }
            #${OVERLAY_ID} { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--vfx-bg); color:var(--vfx-text); width:clamp(600px,60%,900px); height:80vh; border-radius:var(--vfx-radius); box-shadow:var(--vfx-shadow); display:none; flex-direction:column; z-index:10000; }
            #${OVERLAY_ID}.show { display:flex; }
            #${OVERLAY_ID} header { display:flex; justify-content:space-between; align-items:center; padding:12px 20px; border-bottom:1px solid var(--vfx-border); }
            #${OVERLAY_ID} nav { display:flex; gap:8px; padding:10px 20px; border-bottom:1px solid var(--vfx-border); }
            #${OVERLAY_ID} nav button { background:var(--vfx-bg-light); border:none; color:var(--vfx-text); padding:6px 12px; border-radius:var(--vfx-radius); cursor:pointer; }
            #${OVERLAY_ID} nav button.active { background:var(--vfx-accent); }
            #${OVERLAY_ID} .content { flex:1; overflow-y:auto; padding:20px; }
        `, STYLE_ID);
    }

    function createFab() {
        const fab = document.createElement('div');
        fab.id = FAB_ID;
        fab.innerHTML = '<span class="material-symbols-outlined">videocam</span>';
        fab.addEventListener('click', () => toggleOverlay());
        document.body.appendChild(fab);
    }

    let overlay, contentAreas = {};

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        const header = document.createElement('header');
        const h = document.createElement('h3');
        h.textContent = 'VideoFX Suite';
        const close = document.createElement('button');
        close.innerHTML = '<span class="material-symbols-outlined">close</span>';
        close.addEventListener('click', toggleOverlay);
        header.append(h, close);
        const nav = document.createElement('nav');
        Object.values(TABS).forEach(tab => {
            const btn = document.createElement('button');
            btn.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
            btn.addEventListener('click', () => switchTab(tab));
            nav.appendChild(btn);
            contentAreas[tab] = document.createElement('div');
        });
        const content = document.createElement('div');
        content.className = 'content';
        overlay.append(header, nav, content);
        document.body.appendChild(overlay);
        Object.values(TABS).forEach(tab => content.appendChild(contentAreas[tab]));
        switchTab(TABS.ENHANCE);
    }

    function switchTab(tab) {
        const nav = overlay.querySelector('nav');
        nav.querySelectorAll('button').forEach(btn => {
            const active = btn.textContent.toLowerCase() === tab;
            btn.classList.toggle('active', active);
        });
        Object.entries(contentAreas).forEach(([t, el]) => {
            el.style.display = t === tab ? 'block' : 'none';
        });
    }

    function toggleOverlay() {
        overlay.classList.toggle('show');
    }

    // --- Module: Prompt Enhancer -------------------------------------------------
    function initEnhancer(container) {
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Enter your prompt...';
        textarea.style.width = '100%';
        textarea.style.minHeight = '120px';
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Enhance';
        runBtn.addEventListener('click', () => enhancePrompt(textarea.value));
        container.append(textarea, runBtn);
    }

    function enhancePrompt(prompt) {
        if (!prompt.trim()) return;
        gmFetch('https://labs.google/fx/api/trpc/videoFx.generateNextScenePrompts', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        }).then(res => res.json()).then(data => {
            alert('Enhanced prompt generated');
        }).catch(() => alert('Failed to enhance prompt'));
    }

    // --- Module: Image Deconstructor ---------------------------------------------
    function initDeconstructor(container) {
        const input = document.createElement('input');
        input.type = 'file';
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Deconstruct';
        runBtn.addEventListener('click', () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { alert('Image too large'); return; }
            const reader = new FileReader();
            reader.onload = () => requestDeconstruction(reader.result);
            reader.readAsDataURL(file);
        });
        container.append(input, runBtn);
    }

    function requestDeconstruction(imageDataUrl) {
        gmFetch('https://labs.google/fx/api/trpc/backbone.captionImage', {
            method: 'POST',
            body: JSON.stringify({ image: imageDataUrl })
        }).then(res => res.json()).then(data => {
            alert('Image deconstructed');
        }).catch(() => alert('Failed to deconstruct'));
    }

    // --- Module: Promptless Image-to-Prompt -------------------------------------
    function initPromptless(container) {
        const input = document.createElement('input');
        input.type = 'file';
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Generate Prompt';
        runBtn.addEventListener('click', () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { alert('Image too large'); return; }
            const reader = new FileReader();
            reader.onload = () => requestPromptless(reader.result);
            reader.readAsDataURL(file);
        });
        container.append(input, runBtn);
    }

    function requestPromptless(imageDataUrl) {
        gmFetch('https://labs.google/fx/api/trpc/general.generatePromptlessI2VPrompt', {
            method: 'POST',
            body: JSON.stringify({ image: imageDataUrl })
        }).then(res => res.json()).then(data => {
            alert('Prompt generated');
        }).catch(() => alert('Failed to generate prompt'));
    }

    // --- Utility -----------------------------------------------------------------
    function gmFetch(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url,
                method: options.method || 'GET',
                data: options.body,
                headers: { 'Content-Type': 'application/json' },
                onload: res => resolve({ json: () => JSON.parse(res.responseText) }),
                onerror: reject
            });
        });
    }

    // --- Initialize --------------------------------------------------------------
    addGlobalStyles();
    createFab();
    createOverlay();
    initEnhancer(contentAreas[TABS.ENHANCE]);
    initDeconstructor(contentAreas[TABS.DECON]);
    initPromptless(contentAreas[TABS.PROMPTLESS]);
})();

