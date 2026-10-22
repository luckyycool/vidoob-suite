/**
 * Vidoob Suite Master Application Controller
 * Handles Multi-Brand Rendering (Vidoob ⇄ VideosDrive) & Client-Side Media Tools
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Identify Active Brand
    const urlParams = new URLSearchParams(window.location.search);
    let currentBrandId = urlParams.get('brand') || localStorage.getItem('vidoob_dev_brand') || 'vidoob';
    if (!window.VIDOOB_BRANDS[currentBrandId]) {
        currentBrandId = 'vidoob';
    }

    // Active tool state
    let activeTool = 'chapters';

    // Tool Engines
    const geminiEngine = new window.GeminiAIEngine();
    const chaptersEngine = new window.YouTubeChaptersEngine();
    const audioEngine = new window.AudioExtractorEngine();
    const subtitleEngine = new window.SubtitleEngine();
    const safeZoneEngine = new window.SafeZoneEngine();
    const gifEngine = new window.GifMakerEngine();
    const compressorEngine = new window.VideoCompressorEngine();
    const thumbnailEngine = new window.ThumbnailCrafterEngine();

    // --- Brand Initialization ---
    function applyBrand(brandId) {
        currentBrandId = brandId;
        localStorage.setItem('vidoob_dev_brand', brandId);

        const brand = window.VIDOOB_BRANDS[brandId];
        if (!brand) return;

        // Apply body class
        document.body.className = `brand-${brandId}`;

        // Update Document Meta
        document.title = brand.meta.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', brand.meta.description);

        // Update Header Branding
        const brandIcon = document.getElementById('brand-icon-slot');
        const brandTitle = document.getElementById('brand-title-slot');
        const brandBadge = document.getElementById('brand-badge-slot');

        if (brandIcon) brandIcon.textContent = brand.logoEmoji;
        if (brandTitle) brandTitle.textContent = brand.brandName;
        if (brandBadge) brandBadge.textContent = brand.tagline;

        // Update Hero Section
        const heroPill = document.getElementById('hero-pill');
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');

        if (heroPill) heroPill.textContent = brand.hero.badge;
        if (heroTitle) heroTitle.textContent = brand.hero.title;
        if (heroSubtitle) heroSubtitle.textContent = brand.hero.subtitle;

        // Update Hero CTAs
        const heroPrimaryBtn = document.getElementById('hero-primary-cta');
        const heroSecondaryBtn = document.getElementById('hero-secondary-cta');
        const heroPrimaryLabel = document.getElementById('hero-primary-cta-label');
        const heroSecondaryLabel = document.getElementById('hero-secondary-cta-label');

        if (heroPrimaryLabel) heroPrimaryLabel.textContent = brand.hero.primaryCta;
        if (heroSecondaryLabel) heroSecondaryLabel.textContent = brand.hero.secondaryCta;

        if (heroPrimaryBtn) {
            heroPrimaryBtn.onclick = () => {
                switchTool(brand.hero.primaryTarget || brand.defaultTool);
                window.scrollTo({ top: 240, behavior: 'smooth' });
            };
        }
        if (heroSecondaryBtn) {
            heroSecondaryBtn.onclick = () => {
                switchTool(brand.hero.secondaryTarget || brand.toolsOrder[1]);
                window.scrollTo({ top: 240, behavior: 'smooth' });
            };
        }

        // Set default active tool if not explicitly specified
        activeTool = brand.defaultTool || brand.toolsOrder[0];

        // Render Tool Tabs in Brand's Custom Order
        renderNavTabs(brand);

        // Update Dev Switcher Pill state
        document.querySelectorAll('.dev-switcher-btn').forEach(btn => {
            if (btn.dataset.brand === brandId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Activate the brand's default tool
        switchTool(activeTool);
    }

    function renderNavTabs(brand) {
        const tabsContainer = document.getElementById('tool-nav-tabs');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = brand.toolsOrder.map(toolId => {
            const meta = brand.toolLabels[toolId];
            const isActive = toolId === activeTool;
            const isFeatured = toolId === brand.featuredTool;
            return `
                <button type="button" class="nav-tab-btn ${isActive ? 'active' : ''}" data-tool="${toolId}">
                    <span>${meta.icon}</span>
                    <span>${meta.name}</span>
                    ${isFeatured ? `<span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; background: var(--primary-light); color: var(--primary-color); border: 1px solid var(--border-color); margin-left: 2px; text-transform: uppercase;">★ Featured</span>` : ''}
                </button>
            `;
        }).join('');

        // Attach listeners
        tabsContainer.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchTool(btn.dataset.tool);
            });
        });
    }

    function switchTool(toolId) {
        activeTool = toolId;

        // Update tab buttons
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            if (btn.dataset.tool === toolId) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Toggle tool sections
        document.querySelectorAll('.tool-panel').forEach(panel => {
            if (panel.id === `tool-panel-${toolId}`) {
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
            }
        });
    }

    // --- Dev Switcher Handlers ---
    document.querySelectorAll('.dev-switcher-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const newBrand = btn.dataset.brand;
            // Update URL query string cleanly without page reload
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('brand', newBrand);
            window.history.pushState({}, '', newUrl);

            applyBrand(newBrand);
        });
    });

    // Helper sanitizers for safe DOM injection
    function escapeHtml(str) {
        return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(str) {
        return (str || '').toString().replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    // ==========================================
    // TOOL 0: Native Gemini AI Studio Handlers
    // ==========================================
    const apiKeyDrawer = document.getElementById('api-key-drawer');
    const toggleApiKeyBtn = document.getElementById('btn-toggle-api-key');
    const apiKeyStatusLabel = document.getElementById('api-key-status-label');
    const geminiKeyInput = document.getElementById('gemini-key-input');
    const saveKeyBtn = document.getElementById('btn-save-key');
    const clearKeyBtn = document.getElementById('btn-clear-key');

    function updateApiKeyUI() {
        if (!apiKeyStatusLabel) return;
        if (geminiEngine.hasApiKey()) {
            apiKeyStatusLabel.textContent = 'Google AI Key: Connected ✓';
            if (geminiKeyInput) geminiKeyInput.value = geminiEngine.apiKey;
        } else {
            apiKeyStatusLabel.textContent = 'Google AI Key: Free Mode';
            if (geminiKeyInput) geminiKeyInput.value = '';
        }
    }
    updateApiKeyUI();

    if (toggleApiKeyBtn && apiKeyDrawer) {
        toggleApiKeyBtn.addEventListener('click', () => {
            const isHidden = apiKeyDrawer.style.display === 'none' || !apiKeyDrawer.style.display;
            apiKeyDrawer.style.display = isHidden ? 'block' : 'none';
        });
    }

    if (saveKeyBtn && geminiKeyInput) {
        saveKeyBtn.addEventListener('click', () => {
            const key = geminiKeyInput.value.trim();
            if (!key) {
                alert('Please paste a valid Google AI Studio API key.');
                return;
            }
            geminiEngine.setApiKey(key);
            updateApiKeyUI();
            if (apiKeyDrawer) apiKeyDrawer.style.display = 'none';
            alert('Gemini API key saved in browser localStorage!');
        });
    }

    if (clearKeyBtn) {
        clearKeyBtn.addEventListener('click', () => {
            geminiEngine.setApiKey('');
            updateApiKeyUI();
            if (apiKeyDrawer) apiKeyDrawer.style.display = 'none';
            alert('Switched to simulated AI zero-config test mode.');
        });
    }

    // Subtab navigation in AI Studio (SEO / Hooks / Chapters)
    const aiSubtabBtns = document.querySelectorAll('.ai-subtab-btn');
    const aiSubpanels = {
        'seo': document.getElementById('ai-subpanel-seo'),
        'hooks': document.getElementById('ai-subpanel-hooks'),
        'chapters': document.getElementById('ai-subpanel-chapters')
    };

    aiSubtabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.subtab;
            aiSubtabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            Object.keys(aiSubpanels).forEach(key => {
                if (aiSubpanels[key]) {
                    aiSubpanels[key].style.display = (key === target) ? 'block' : 'none';
                }
            });
        });
    });

    // Subtool 1: YouTube SEO Architect
    const seoTopicInput = document.getElementById('ai-seo-topic');
    const seoNicheSelect = document.getElementById('ai-seo-niche');
    const btnGenerateSeo = document.getElementById('btn-generate-ai-seo');
    const seoResultsBox = document.getElementById('ai-seo-results');
    const seoTitlesList = document.getElementById('ai-seo-titles-list');
    const seoDescOutput = document.getElementById('ai-seo-desc-output');
    const btnCopyDesc = document.getElementById('btn-copy-ai-desc');
    const seoTagsContainer = document.getElementById('ai-seo-tags-container');
    const btnCopyAllTags = document.getElementById('btn-copy-all-tags');
    let currentSeoTags = [];

    if (btnGenerateSeo) {
        btnGenerateSeo.addEventListener('click', async () => {
            const topic = (seoTopicInput?.value || '').trim();
            if (!topic) {
                alert('Please enter a video topic or working title.');
                if (seoTopicInput) seoTopicInput.focus();
                return;
            }

            const niche = seoNicheSelect?.value || 'General';
            const originalBtnText = btnGenerateSeo.innerHTML;
            btnGenerateSeo.innerHTML = '<span>⏳ Generating Algorithmic SEO with Gemini...</span>';
            btnGenerateSeo.disabled = true;

            try {
                const data = await geminiEngine.generateYouTubeSEO(topic, niche);
                
                // Render Titles
                if (seoTitlesList && Array.isArray(data.titles)) {
                    seoTitlesList.innerHTML = data.titles.map((title, i) => `
                        <li style="padding: 10px 14px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 13px;">
                            <span style="font-weight: 600; color: var(--text-primary);"><strong style="color: var(--primary-color);">#${i+1}</strong> ${escapeHtml(title)}</span>
                            <button type="button" class="btn-secondary" style="font-size: 11px; padding: 4px 10px; white-space: nowrap;" onclick="navigator.clipboard.writeText('${escapeAttr(title)}'); this.textContent='✓ Copied!'; setTimeout(()=>this.textContent='Copy', 1500);">Copy</button>
                        </li>
                    `).join('');
                }

                // Render Description
                if (seoDescOutput) {
                    seoDescOutput.value = data.description || '';
                }

                // Render Tags
                if (seoTagsContainer && Array.isArray(data.tags)) {
                    currentSeoTags = data.tags;
                    seoTagsContainer.innerHTML = data.tags.map(tag => `
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--surface-card); border: 1px solid var(--border-color); border-radius: 999px; font-size: 12px; font-weight: 500; cursor: pointer;" title="Click to copy tag" onclick="navigator.clipboard.writeText('${escapeAttr(tag)}'); this.style.borderColor='var(--primary-color)';">
                            <span>#</span><span>${escapeHtml(tag)}</span>
                        </span>
                    `).join('');
                }

                if (seoResultsBox) seoResultsBox.style.display = 'block';
            } catch (err) {
                alert('Error generating SEO: ' + err.message);
            } finally {
                btnGenerateSeo.innerHTML = originalBtnText;
                btnGenerateSeo.disabled = false;
            }
        });
    }

    if (btnCopyAllTags) {
        btnCopyAllTags.addEventListener('click', () => {
            if (!currentSeoTags.length) {
                alert('Generate SEO tags first.');
                return;
            }
            navigator.clipboard.writeText(currentSeoTags.join(', '));
            const orig = btnCopyAllTags.textContent;
            btnCopyAllTags.textContent = '✓ Copied All Tags!';
            setTimeout(() => btnCopyAllTags.textContent = orig, 1800);
        });
    }

    if (btnCopyDesc && seoDescOutput) {
        btnCopyDesc.addEventListener('click', () => {
            if (!seoDescOutput.value) return;
            navigator.clipboard.writeText(seoDescOutput.value);
            const orig = btnCopyDesc.textContent;
            btnCopyDesc.textContent = '✓ Copied!';
            setTimeout(() => btnCopyDesc.textContent = orig, 1800);
        });
    }

    // Subtool 2: Viral Hook Rewriter
    const hookInput = document.getElementById('ai-hook-input');
    const btnRewriteHooks = document.getElementById('btn-rewrite-hooks');
    const hooksResultsBox = document.getElementById('ai-hooks-results');

    if (btnRewriteHooks) {
        btnRewriteHooks.addEventListener('click', async () => {
            const rawDraft = (hookInput?.value || '').trim();
            if (!rawDraft) {
                alert('Please enter a draft video opening line.');
                if (hookInput) hookInput.focus();
                return;
            }

            const originalBtnText = btnRewriteHooks.innerHTML;
            btnRewriteHooks.innerHTML = '<span>⚡ Crafting 5 Psychological Hooks with Gemini...</span>';
            btnRewriteHooks.disabled = true;

            try {
                const hooks = await geminiEngine.rewriteViralHook(rawDraft);
                if (hooksResultsBox && Array.isArray(hooks)) {
                    hooksResultsBox.innerHTML = hooks.map((h, i) => `
                        <div style="background: var(--surface-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary-color); background: rgba(37,99,235,0.08); padding: 3px 8px; border-radius: 4px;">
                                    ${escapeHtml(h.style || `Style #${i+1}`)}
                                </span>
                                <button type="button" class="btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="navigator.clipboard.writeText('${escapeAttr(h.hook)}'); this.textContent='✓ Copied!'; setTimeout(()=>this.textContent='Copy Hook', 1500);">
                                    Copy Hook
                                </button>
                            </div>
                            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; line-height: 1.4;">
                                "${escapeHtml(h.hook)}"
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); font-style: italic;">
                                💡 Why it works: ${escapeHtml(h.explanation || '')}
                            </div>
                        </div>
                    `).join('');
                    hooksResultsBox.style.display = 'flex';
                }
            } catch (err) {
                alert('Error rewriting hooks: ' + err.message);
            } finally {
                btnRewriteHooks.innerHTML = originalBtnText;
                btnRewriteHooks.disabled = false;
            }
        });
    }

    // Subtool 3: Auto-Chapter Extractor
    const aiChaptersRaw = document.getElementById('ai-chapters-raw');
    const btnAiExtractChapters = document.getElementById('btn-ai-extract-chapters');
    const aiChaptersOutput = document.getElementById('ai-chapters-output');

    if (btnAiExtractChapters) {
        btnAiExtractChapters.addEventListener('click', async () => {
            const rawTranscript = (aiChaptersRaw?.value || '').trim();
            if (!rawTranscript) {
                alert('Please paste rough notes or a transcript first.');
                if (aiChaptersRaw) aiChaptersRaw.focus();
                return;
            }

            const originalBtnText = btnAiExtractChapters.innerHTML;
            btnAiExtractChapters.innerHTML = '<span>⏱️ Analyzing Transcript with Gemini...</span>';
            btnAiExtractChapters.disabled = true;

            try {
                const chaptersText = await geminiEngine.transcriptToChapters(rawTranscript);
                if (aiChaptersOutput) {
                    aiChaptersOutput.value = chaptersText;
                }
            } catch (err) {
                alert('Error extracting chapters: ' + err.message);
            } finally {
                btnAiExtractChapters.innerHTML = originalBtnText;
                btnAiExtractChapters.disabled = false;
            }
        });
    }

    // --- TOOL 1: YouTube Chapters Generator ---
    const rawChaptersInput = document.getElementById('chapters-input');
    const chaptersTimeline = document.getElementById('chapters-timeline');
    const chaptersOutput = document.getElementById('chapters-output');
    const chaptersValidation = document.getElementById('chapters-validation');
    const copyChaptersBtn = document.getElementById('btn-copy-chapters');

    function updateChapters() {
        const text = rawChaptersInput.value;
        const chapters = chaptersEngine.parse(text);
        const validation = chaptersEngine.validate(chapters);

        // Render Validation Box
        if (chapters.length === 0) {
            chaptersValidation.innerHTML = `<span class="text-slate-400">Enter timestamps to validate against YouTube algorithm rules.</span>`;
        } else if (validation.valid) {
            chaptersValidation.innerHTML = `
                <div style="color: #16a34a; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <span>✓</span> <span>100% YouTube Algorithm Compliant (${chapters.length} chapters found)</span>
                </div>
            `;
        } else {
            chaptersValidation.innerHTML = `
                <div style="color: #dc2626; font-size: 13px;">
                    <strong>Fix Required for YouTube Indexation:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px;">
                        ${validation.errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Render Output Text
        chaptersOutput.value = chaptersEngine.format(chapters);

        // Render Visual Timeline
        if (chapters.length > 0) {
            const totalDuration = chapters[chapters.length - 1].seconds + 30; // buffer
            chaptersTimeline.innerHTML = chapters.map((c, idx) => {
                const nextSec = idx < chapters.length - 1 ? chapters[idx + 1].seconds : totalDuration;
                const widthPercent = Math.max(3, ((nextSec - c.seconds) / totalDuration) * 100);
                const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#f97316', '#fb923c'];
                const color = colors[idx % colors.length];
                return `<div class="chapter-segment" style="width: ${widthPercent}%; background: ${color};" title="${c.timeStr} - ${c.title}"></div>`;
            }).join('');
        } else {
            chaptersTimeline.innerHTML = '';
        }
    }

    if (rawChaptersInput) {
        rawChaptersInput.addEventListener('input', updateChapters);
    }

    if (copyChaptersBtn) {
        copyChaptersBtn.addEventListener('click', () => {
            if (!chaptersOutput.value) return;
            navigator.clipboard.writeText(chaptersOutput.value);
            const originalText = copyChaptersBtn.innerHTML;
            copyChaptersBtn.innerHTML = `<span>✓</span> <span>Copied to Clipboard!</span>`;
            setTimeout(() => copyChaptersBtn.innerHTML = originalText, 2000);
        });
    }

    // Load sample chapters button
    const sampleChaptersBtn = document.getElementById('btn-sample-chapters');
    if (sampleChaptersBtn) {
        sampleChaptersBtn.addEventListener('click', () => {
            rawChaptersInput.value = `00:00 - Introduction & The Hook\n01:15 - Why Traditional Methods Fail\n03:40 - The In-Browser WebAssembly Breakthrough\n06:20 - Step-by-Step Implementation Protocol\n08:50 - Live Benchmarks & Speed Test\n10:30 - Final Verdict & Download Links`;
            updateChapters();
        });
    }

    // --- TOOL 2: Audio Extractor ---
    const audioFileInput = document.getElementById('audio-file-input');
    const audioDropzone = document.getElementById('audio-dropzone');
    const audioProgress = document.getElementById('audio-progress');
    const audioProgressBar = document.getElementById('audio-progress-bar');
    const audioResultCard = document.getElementById('audio-result-card');
    const audioPlayer = document.getElementById('extracted-audio-player');
    const downloadAudioBtn = document.getElementById('btn-download-audio');

    async function handleAudioFile(file) {
        if (!file) return;
        audioProgress.style.display = 'block';
        audioResultCard.style.display = 'none';

        try {
            const buffer = await audioEngine.extractAudioBuffer(file, (pct, msg) => {
                audioProgressBar.style.width = pct + '%';
                document.getElementById('audio-progress-label').textContent = msg;
            });

            const wavBlob = audioEngine.audioBufferToWav(buffer);
            const blobUrl = URL.createObjectURL(wavBlob);

            audioPlayer.src = blobUrl;
            downloadAudioBtn.href = blobUrl;
            downloadAudioBtn.download = file.name.replace(/\.[^/.]+$/, "") + '_audio.wav';
            document.getElementById('extracted-audio-size').textContent = audioEngine.formatFileSize(wavBlob.size);

            audioProgress.style.display = 'none';
            audioResultCard.style.display = 'block';
        } catch (err) {
            audioProgress.style.display = 'none';
            alert(err.message);
        }
    }

    if (audioDropzone) {
        audioDropzone.addEventListener('click', () => audioFileInput.click());
        audioFileInput.addEventListener('change', (e) => handleAudioFile(e.target.files[0]));
    }

    // --- TOOL 3: Subtitle Converter & Time-Shifter ---
    const srtInput = document.getElementById('subtitle-input');
    const shiftMsInput = document.getElementById('shift-ms-input');
    const btnShiftSubtitles = document.getElementById('btn-shift-subtitles');
    const btnToVtt = document.getElementById('btn-convert-vtt');
    const btnToSrt = document.getElementById('btn-convert-srt');
    const btnExtractText = document.getElementById('btn-extract-text');
    const subtitleOutput = document.getElementById('subtitle-output');
    const btnCopySubtitle = document.getElementById('btn-copy-subtitle');

    if (btnShiftSubtitles) {
        btnShiftSubtitles.addEventListener('click', () => {
            const raw = srtInput.value;
            const delta = parseInt(shiftMsInput.value, 10) || 0;
            const cues = subtitleEngine.parse(raw);
            const shifted = subtitleEngine.shiftTime(cues, delta);
            subtitleOutput.value = subtitleEngine.toSrt(shifted);
        });
    }

    if (btnToVtt) {
        btnToVtt.addEventListener('click', () => {
            const cues = subtitleEngine.parse(srtInput.value);
            subtitleOutput.value = subtitleEngine.toVtt(cues);
        });
    }

    if (btnToSrt) {
        btnToSrt.addEventListener('click', () => {
            const cues = subtitleEngine.parse(srtInput.value);
            subtitleOutput.value = subtitleEngine.toSrt(cues);
        });
    }

    if (btnExtractText) {
        btnExtractText.addEventListener('click', () => {
            subtitleOutput.value = subtitleEngine.extractCleanText(srtInput.value);
        });
    }

    if (btnCopySubtitle) {
        btnCopySubtitle.addEventListener('click', () => {
            navigator.clipboard.writeText(subtitleOutput.value);
            const orig = btnCopySubtitle.textContent;
            btnCopySubtitle.textContent = '✓ Copied!';
            setTimeout(() => btnCopySubtitle.textContent = orig, 2000);
        });
    }

    const btnDownloadSrt = document.getElementById('btn-download-srt');
    const btnDownloadVtt = document.getElementById('btn-download-vtt');

    if (btnDownloadSrt) {
        btnDownloadSrt.addEventListener('click', () => {
            const raw = subtitleOutput.value || srtInput.value;
            if (!raw.trim()) { alert('No subtitle content to download.'); return; }
            const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'subtitles.srt';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    if (btnDownloadVtt) {
        btnDownloadVtt.addEventListener('click', () => {
            const raw = subtitleOutput.value || srtInput.value;
            if (!raw.trim()) { alert('No subtitle content to download.'); return; }
            const cues = subtitleEngine.parse(raw);
            const vttText = subtitleEngine.toVtt(cues);
            const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'subtitles.vtt';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Sample Subtitle Loader
    const sampleSubBtn = document.getElementById('btn-sample-subtitle');
    if (sampleSubBtn) {
        sampleSubBtn.addEventListener('click', () => {
            srtInput.value = `1\n00:00:01,200 --> 00:00:04,500\nWelcome to this comprehensive tutorial on in-browser media utilities.\n\n2\n00:00:05,000 --> 00:00:09,800\nEverything you see here is executed on your device CPU with zero server uploads.\n\n3\n00:00:10,200 --> 00:00:14,400\nNotice how subtitle desynchronization can be fixed in a single click.`;
        });
    }

    // --- TOOL 4: Social Safe-Zone Previewer ---
    const platformButtons = document.querySelectorAll('.platform-pill-btn');
    const safeZoneOverlaysContainer = document.getElementById('safe-zone-overlays');
    const safeBoxContainer = document.getElementById('safe-box-container');
    const safeZoneFileInput = document.getElementById('safe-zone-file-input');
    const btnUploadSafeZone = document.getElementById('btn-upload-safe-zone');
    const btnResetSafeZone = document.getElementById('btn-reset-safe-zone');
    const safeZoneVideo = document.getElementById('safe-zone-video');
    const safeZoneImg = document.getElementById('safe-zone-img-preview');

    function renderSafeZones(platformId) {
        const overlay = safeZoneEngine.getOverlay(platformId);
        if (!overlay) return;

        safeZoneOverlaysContainer.innerHTML = overlay.zones.map(z => `
            <div class="dead-zone-box" style="
                ${z.top ? `top: ${z.top};` : ''}
                ${z.bottom ? `bottom: ${z.bottom};` : ''}
                ${z.left ? `left: ${z.left};` : ''}
                ${z.right ? `right: ${z.right};` : ''}
                width: ${z.width};
                height: ${z.height};
                background: ${z.color};
            ">${z.label}</div>
        `).join('');

        if (overlay.safeBox) {
            safeBoxContainer.innerHTML = `
                <div class="safe-box-indicator" style="
                    top: ${overlay.safeBox.top};
                    bottom: ${overlay.safeBox.bottom};
                    left: ${overlay.safeBox.left};
                    right: ${overlay.safeBox.right};
                ">RECOMMENDED SAFE ZONE</div>
            `;
        }
    }

    platformButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            platformButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderSafeZones(btn.dataset.platform);
        });
    });

    if (btnUploadSafeZone && safeZoneFileInput) {
        btnUploadSafeZone.addEventListener('click', () => safeZoneFileInput.click());
        safeZoneFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const url = URL.createObjectURL(file);
            if (file.type.startsWith('video/')) {
                safeZoneVideo.style.display = 'block';
                safeZoneImg.style.display = 'none';
                safeZoneVideo.src = url;
                safeZoneVideo.play().catch(() => {});
            } else if (file.type.startsWith('image/')) {
                safeZoneVideo.style.display = 'none';
                safeZoneImg.style.display = 'block';
                safeZoneImg.src = url;
            }
        });
    }

    if (btnResetSafeZone) {
        btnResetSafeZone.addEventListener('click', () => {
            if (safeZoneVideo) {
                safeZoneVideo.removeAttribute('src');
                safeZoneVideo.load();
                safeZoneVideo.style.display = 'block';
            }
            if (safeZoneImg) {
                safeZoneImg.style.display = 'none';
                safeZoneImg.src = '';
            }
            if (safeZoneFileInput) safeZoneFileInput.value = '';
        });
    }

    renderSafeZones('tiktok');

    // --- TOOL 5: Video to GIF / WebM Trimmer ---
    const gifDropzone = document.getElementById('gif-dropzone');
    const gifFileInput = document.getElementById('gif-file-input');
    const gifTrimmerWorkspace = document.getElementById('gif-trimmer-workspace');
    const gifVideoPlayer = document.getElementById('gif-video-player');
    const gifStartTime = document.getElementById('gif-start-time');
    const gifEndTime = document.getElementById('gif-end-time');
    const gifDurationLabel = document.getElementById('gif-duration-label');
    const btnExportClip = document.getElementById('btn-export-clip');
    const gifProgress = document.getElementById('gif-progress');
    const gifProgressBar = document.getElementById('gif-progress-bar');
    const gifProgressLabel = document.getElementById('gif-progress-label');
    const gifResultCard = document.getElementById('gif-result-card');
    const gifResultVideo = document.getElementById('gif-result-video');
    const btnDownloadClip = document.getElementById('btn-download-clip');

    function updateTrimmerDuration() {
        const start = parseFloat(gifStartTime?.value) || 0;
        const end = parseFloat(gifEndTime?.value) || 0;
        const dur = Math.max(0, end - start).toFixed(1);
        if (gifDurationLabel) gifDurationLabel.textContent = `${dur}s`;
    }

    if (gifDropzone && gifFileInput) {
        gifDropzone.addEventListener('click', () => gifFileInput.click());
        gifFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const url = URL.createObjectURL(file);
            gifVideoPlayer.src = url;
            gifTrimmerWorkspace.style.display = 'block';
            gifDropzone.style.display = 'none';

            gifVideoPlayer.onloadedmetadata = () => {
                const totalDur = gifVideoPlayer.duration || 10;
                gifStartTime.value = 0;
                gifEndTime.value = Math.min(10, totalDur).toFixed(1);
                gifStartTime.max = totalDur;
                gifEndTime.max = totalDur;
                updateTrimmerDuration();
            };
        });
    }

    if (gifStartTime) gifStartTime.addEventListener('input', updateTrimmerDuration);
    if (gifEndTime) gifEndTime.addEventListener('input', updateTrimmerDuration);

    if (btnExportClip) {
        btnExportClip.addEventListener('click', async () => {
            const start = parseFloat(gifStartTime.value) || 0;
            const end = parseFloat(gifEndTime.value) || 5;
            if (end <= start) {
                alert('End time must be greater than start time.');
                return;
            }

            gifProgress.style.display = 'block';
            gifResultCard.style.display = 'none';
            btnExportClip.disabled = true;

            try {
                const blob = await gifEngine.recordTrimmedClip(
                    gifVideoPlayer,
                    { startTime: start, endTime: end, fps: 24, scaleWidth: 480 },
                    (pct, msg) => {
                        gifProgressBar.style.width = pct + '%';
                        gifProgressLabel.textContent = msg;
                    }
                );

                const clipUrl = URL.createObjectURL(blob);
                gifResultVideo.src = clipUrl;
                btnDownloadClip.href = clipUrl;
                btnDownloadClip.download = 'trimmed_clip.webm';

                gifProgress.style.display = 'none';
                gifResultCard.style.display = 'block';
            } catch (err) {
                gifProgress.style.display = 'none';
                alert('Trimming error: ' + err.message);
            } finally {
                btnExportClip.disabled = false;
            }
        });
    }

    // --- TOOL 6: Viral Hooks Library ---
    const hooksContainer = document.getElementById('hooks-grid');
    const hooksSearch = document.getElementById('hooks-search');
    const hookNicheFilter = document.getElementById('hooks-niche-filter');

    function renderHooks() {
        if (!hooksContainer) return;
        const query = (hooksSearch?.value || '').toLowerCase();
        const niche = hookNicheFilter?.value || 'All';

        const filtered = window.VIRAL_HOOKS.filter(h => {
            const matchesQuery = h.hook.toLowerCase().includes(query) || h.script.toLowerCase().includes(query);
            const matchesNiche = niche === 'All' || h.niche === niche;
            return matchesQuery && matchesNiche;
        });

        if (filtered.length === 0) {
            hooksContainer.innerHTML = `<p class="text-slate-400 p-8 text-center col-span-full">No hooks match your filter.</p>`;
            return;
        }

        hooksContainer.innerHTML = filtered.map(h => `
            <div class="hook-card">
                <div>
                    <div class="hook-niche-tag">${h.niche} • ${h.category}</div>
                    <div class="hook-text">"${h.hook}"</div>
                    <div class="hook-script">${h.script}</div>
                </div>
                <button type="button" class="btn-secondary w-full justify-center" onclick="navigator.clipboard.writeText('${h.hook.replace(/'/g, "\\'")}'); this.textContent='✓ Copied Hook!'; setTimeout(()=>this.textContent='Copy Hook Starter', 1500)">
                    Copy Hook Starter
                </button>
            </div>
        `).join('');
    }

    if (hooksSearch) hooksSearch.addEventListener('input', renderHooks);
    if (hookNicheFilter) hookNicheFilter.addEventListener('change', renderHooks);
    renderHooks();

    // ==========================================
    // TOOL: Exact-MB Video Compressor Handlers
    // ==========================================
    const compressorDropzone = document.getElementById('compressor-dropzone');
    const compressorFileInput = document.getElementById('compressor-file-input');
    const compressorWorkspace = document.getElementById('compressor-workspace');
    const compressorVideo = document.getElementById('compressor-video-preview');
    const compressorOrigSize = document.getElementById('compressor-orig-size');
    const compressorOrigDur = document.getElementById('compressor-orig-duration');
    const compressorTargetLabel = document.getElementById('compressor-target-label');
    const compressorTargetInput = document.getElementById('compressor-target-input');
    const customMbContainer = document.getElementById('custom-mb-container');
    const presetButtons = document.querySelectorAll('#compressor-presets .preset-btn');
    const btnStartCompression = document.getElementById('btn-start-compression');
    const compressorProgress = document.getElementById('compressor-progress');
    const compressorProgressBar = document.getElementById('compressor-progress-bar');
    const compressorProgressStatus = document.getElementById('compressor-progress-status');
    const compressorProgressPct = document.getElementById('compressor-progress-pct');
    const compressorResultCard = document.getElementById('compressor-result-card');
    const compressorFinalSize = document.getElementById('compressor-final-size');
    const btnDownloadCompressed = document.getElementById('btn-download-compressed');

    let currentTargetMB = 24.8;
    let selectedCompressorFile = null;

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mbVal = btn.dataset.mb;
            if (mbVal === 'custom') {
                if (customMbContainer) customMbContainer.style.display = 'block';
                currentTargetMB = parseFloat(compressorTargetInput?.value) || 20;
            } else {
                if (customMbContainer) customMbContainer.style.display = 'none';
                currentTargetMB = parseFloat(mbVal);
            }
            if (compressorTargetLabel) compressorTargetLabel.textContent = `${currentTargetMB} MB`;
        });
    });

    if (compressorTargetInput) {
        compressorTargetInput.addEventListener('input', () => {
            currentTargetMB = parseFloat(compressorTargetInput.value) || 10;
            if (compressorTargetLabel) compressorTargetLabel.textContent = `${currentTargetMB} MB`;
        });
    }

    if (compressorDropzone && compressorFileInput) {
        compressorDropzone.addEventListener('click', () => compressorFileInput.click());
        compressorFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            selectedCompressorFile = file;
            const url = URL.createObjectURL(file);
            compressorVideo.src = url;
            compressorOrigSize.textContent = compressorEngine.formatMB(file.size);

            compressorVideo.onloadedmetadata = () => {
                compressorOrigDur.textContent = `${compressorVideo.duration.toFixed(1)} seconds`;
                compressorWorkspace.style.display = 'block';
                compressorDropzone.style.display = 'none';
            };
        });
    }

    if (btnStartCompression) {
        btnStartCompression.addEventListener('click', async () => {
            if (!selectedCompressorFile || !compressorVideo.duration) {
                alert('Please select a video first.');
                return;
            }

            compressorProgress.style.display = 'block';
            compressorResultCard.style.display = 'none';
            btnStartCompression.disabled = true;

            try {
                const blob = await compressorEngine.compressVideo(
                    compressorVideo,
                    currentTargetMB,
                    (pct, msg) => {
                        compressorProgressBar.style.width = pct + '%';
                        compressorProgressPct.textContent = pct + '%';
                        compressorProgressStatus.textContent = msg;
                    }
                );

                const blobUrl = URL.createObjectURL(blob);
                compressorFinalSize.textContent = compressorEngine.formatMB(blob.size);
                btnDownloadCompressed.href = blobUrl;
                btnDownloadCompressed.download = selectedCompressorFile.name.replace(/\.[^/.]+$/, "") + `_compressed_${currentTargetMB}mb.webm`;

                compressorProgress.style.display = 'none';
                compressorResultCard.style.display = 'block';
            } catch (err) {
                compressorProgress.style.display = 'none';
                alert('Compression error: ' + err.message);
            } finally {
                btnStartCompression.disabled = false;
            }
        });
    }

    // ==========================================
    // TOOL: AI YouTube Thumbnail Crafter Handlers
    // ==========================================
    const thumbCanvas = document.getElementById('thumb-canvas');
    const thumbSubjectInput = document.getElementById('thumb-subject-input');
    const btnUploadSubject = document.getElementById('btn-upload-thumb-subject');
    const btnClearSubject = document.getElementById('btn-clear-thumb-subject');
    const thumbThemeSelect = document.getElementById('thumb-theme-select');
    const thumbTitleInput = document.getElementById('thumb-title-input');
    const glowColorButtons = document.querySelectorAll('#thumb-glow-colors .glow-color-btn');
    const styleButtons = document.querySelectorAll('.thumb-style-btn');
    const btnAiSlogans = document.getElementById('btn-ai-thumb-slogans');
    const btnDownloadThumb = document.getElementById('btn-download-thumbnail');

    let currentSubjectImg = null;
    let currentGlowColor = '#06b6d4';
    let currentTheme = 'cyberpunk';
    let currentTitleText = "DON'T DO THIS";
    let currentTextStyle = 'yellow-badge';

    function updateThumbnail() {
        if (!thumbCanvas) return;
        thumbnailEngine.renderThumbnail(thumbCanvas, {
            theme: currentTheme,
            titleText: currentTitleText,
            textStyle: currentTextStyle,
            subjectImg: currentSubjectImg,
            glowColor: currentGlowColor,
            glowIntensity: 22,
            subjectPosition: 'right'
        });
    }

    if (btnUploadSubject && thumbSubjectInput) {
        btnUploadSubject.addEventListener('click', () => thumbSubjectInput.click());
        thumbSubjectInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    currentSubjectImg = img;
                    if (btnClearSubject) btnClearSubject.style.display = 'inline-flex';
                    updateThumbnail();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnClearSubject) {
        btnClearSubject.addEventListener('click', () => {
            currentSubjectImg = null;
            btnClearSubject.style.display = 'none';
            if (thumbSubjectInput) thumbSubjectInput.value = '';
            updateThumbnail();
        });
    }

    glowColorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            glowColorButtons.forEach(b => {
                b.classList.remove('active');
                b.style.boxShadow = 'none';
            });
            btn.classList.add('active');
            currentGlowColor = btn.dataset.color;
            btn.style.boxShadow = `0 0 6px ${currentGlowColor}`;
            updateThumbnail();
        });
    });

    if (thumbThemeSelect) {
        thumbThemeSelect.addEventListener('change', (e) => {
            currentTheme = e.target.value;
            updateThumbnail();
        });
    }

    if (thumbTitleInput) {
        thumbTitleInput.addEventListener('input', (e) => {
            currentTitleText = e.target.value;
            updateThumbnail();
        });
    }

    styleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            styleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTextStyle = btn.dataset.style;
            updateThumbnail();
        });
    });

    // Viral 3-word slogan presets
    const viralSlogans = [
        "DON'T DO THIS",
        "$0 TO $10,000",
        "WHY 99% FAIL",
        "THE SECRET HACK",
        "STOP DOING THIS",
        "BEFORE YOU BUY",
        "I REGRET THIS",
        "DO THIS INSTEAD"
    ];
    let sloganIdx = 0;

    if (btnAiSlogans) {
        btnAiSlogans.addEventListener('click', () => {
            sloganIdx = (sloganIdx + 1) % viralSlogans.length;
            currentTitleText = viralSlogans[sloganIdx];
            if (thumbTitleInput) thumbTitleInput.value = currentTitleText;
            updateThumbnail();
        });
    }

    if (btnDownloadThumb && thumbCanvas) {
        btnDownloadThumb.addEventListener('click', () => {
            const dataUrl = thumbCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `youtube_thumbnail_${Date.now()}.png`;
            a.click();
        });
    }

    // Initial render of thumbnail canvas
    setTimeout(updateThumbnail, 100);

    // Finalize Brand Initialization
    applyBrand(currentBrandId);
});
