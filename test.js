/**
 * Automated Verification Suite for Vidoob Suite
 * Tests brand configs, engine logic, SEO metadata, and build pipelines.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BRANDS = require('./brands.js');
const YouTubeChaptersEngine = require('./js/engine/youtube-chapters.js');
const SubtitleEngine = require('./js/engine/subtitles.js');
const { SafeZoneEngine } = require('./js/engine/safe-zones.js');
const AudioExtractorEngine = require('./js/engine/audio-extractor.js');
const { VIRAL_HOOKS } = require('./js/engine/hooks-data.js');
const GeminiAIEngine = require('./js/engine/gemini-ai.js');
const VideoCompressorEngine = require('./js/engine/video-compressor.js');
const ThumbnailCrafterEngine = require('./js/engine/thumbnail-crafter.js');

let passes = 0;
let fails = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ PASS: ${name}`);
        passes++;
    } catch (err) {
        console.error(`  ✗ FAIL: ${name} -> ${err.message}`);
        fails++;
    }
}

console.log('=== RUNNING VIDOOB SUITE AUTOMATED VERIFICATION ===\n');

// 1. Test Brand Configurations
test('Brands registry has vidoob and drive brands', () => {
    assert(BRANDS.vidoob, 'Missing vidoob brand');
    assert(BRANDS.drive, 'Missing drive brand');
});

test('Brands have unique non-overlapping color palettes', () => {
    assert(BRANDS.vidoob.theme.primaryColor !== BRANDS.drive.theme.primaryColor, 'Primary colors must differ');
    assert(BRANDS.vidoob.theme.bodyBg !== BRANDS.drive.theme.bodyBg, 'Body backgrounds must differ');
});

test('Brands have unique titles and meta descriptions', () => {
    assert(BRANDS.vidoob.meta.title !== BRANDS.drive.meta.title, 'Titles must be unique');
    assert(BRANDS.vidoob.meta.description !== BRANDS.drive.meta.description, 'Meta descriptions must be unique');
    assert(BRANDS.vidoob.meta.canonical.includes('vidoob.com'), 'Vidoob canonical must match domain');
    assert(BRANDS.drive.meta.canonical.includes('videosdrive.com'), 'VideosDrive canonical must match domain');
});

// 2. Test YouTube Chapters Engine
test('YouTube Chapters parses timestamps correctly', () => {
    const engine = new YouTubeChaptersEngine();
    const raw = `00:00 Intro\n01:30 Setup\n04:15 The Secret\n08:00 Results`;
    const chapters = engine.parse(raw);
    assert.strictEqual(chapters.length, 4);
    assert.strictEqual(chapters[0].seconds, 0);
    assert.strictEqual(chapters[1].seconds, 90);
    assert.strictEqual(chapters[2].seconds, 255);
});

test('YouTube Chapters validates compliance rules', () => {
    const engine = new YouTubeChaptersEngine();
    
    // Valid chapters
    const validRaw = `00:00 Intro\n01:00 Step 1\n02:00 Step 2`;
    const validCh = engine.parse(validRaw);
    assert(engine.validate(validCh).valid === true, 'Should pass validation');

    // Invalid: Doesn't start at 00:00
    const invalidRaw = `00:15 Intro\n01:00 Step 1\n02:00 Step 2`;
    const invalidCh = engine.parse(invalidRaw);
    assert(engine.validate(invalidCh).valid === false, 'Must fail if not starting at 00:00');
});

// 3. Test Subtitle Engine
test('Subtitle Engine parses and shifts timestamps', () => {
    const engine = new SubtitleEngine();
    const srt = `1\n00:00:02,000 --> 00:00:05,000\nHello World\n`;
    const cues = engine.parse(srt);
    assert.strictEqual(cues.length, 1);
    assert.strictEqual(cues[0].startMs, 2000);
    assert.strictEqual(cues[0].endMs, 5000);

    // Shift by +1000ms
    const shifted = engine.shiftTime(cues, 1000);
    assert.strictEqual(shifted[0].startMs, 3000);
    assert.strictEqual(shifted[0].endMs, 6000);

    // Convert to WebVTT
    const vtt = engine.toVtt(shifted);
    assert(vtt.startsWith('WEBVTT'), 'Must have WEBVTT header');
    assert(vtt.includes('00:00:03.000 --> 00:00:06.000'), 'Must format with dot milliseconds in VTT');
});

// 4. Test Safe Zone Engine
test('Safe Zone Engine has TikTok, Reels, Shorts data', () => {
    const engine = new SafeZoneEngine();
    const tiktok = engine.getOverlay('tiktok');
    assert(tiktok && tiktok.zones.length >= 3, 'TikTok overlay must have zones');
    const reels = engine.getOverlay('reels');
    assert(reels && reels.zones.length >= 3, 'Reels overlay must have zones');
});

// 5. Test Viral Hooks Library
test('Viral Hooks library has entries across diverse niches', () => {
    assert(VIRAL_HOOKS.length >= 20, 'Should have at least 20 initial hooks');
    const niches = [...new Set(VIRAL_HOOKS.map(h => h.niche))];
    assert(niches.length >= 4, 'Must span at least 4 distinct niches');
});

// 6. Test Gemini AI Engine (Simulation & Algorithm Compliance)
test('Gemini AI Engine generates simulated SEO fallback with 5 titles and tags', () => {
    // Mock minimal localStorage if running in pure node
    global.localStorage = {
        store: {},
        getItem(k) { return this.store[k] || null; },
        setItem(k, v) { this.store[k] = String(v); },
        removeItem(k) { delete this.store[k]; }
    };
    const engine = new GeminiAIEngine();
    const seo = engine.getFallbackSEO('NextJS 15 Tutorial');
    assert(Array.isArray(seo.titles) && seo.titles.length === 5, 'Must generate exactly 5 titles');
    assert(typeof seo.description === 'string' && seo.description.length > 50, 'Must generate full description');
    assert(Array.isArray(seo.tags) && seo.tags.length >= 8, 'Must generate search tags');
});

test('Gemini AI Engine generates 5 psychological viral hook styles', () => {
    const engine = new GeminiAIEngine();
    const hooks = engine.getFallbackHooks('How to invest your first $1000');
    assert(Array.isArray(hooks) && hooks.length === 5, 'Must have 5 hooks');
    assert(hooks[0].style && hooks[0].hook && hooks[0].explanation, 'Hook must contain style, quote, and explanation');
    const styles = hooks.map(h => h.style);
    assert(styles.includes('The Curiosity Gap'), 'Must include Curiosity Gap');
    assert(styles.includes('The Contrarian / Mythbuster'), 'Must include Contrarian');
});

// 7. Test Video Compressor Engine
test('Video Compressor calculates exact bitrate for Discord 25MB target', () => {
    const engine = new VideoCompressorEngine();
    // 60-second video targeting 24.8 MB
    const bitrate = engine.calculateBitrate(60, 24.8);
    assert(bitrate > 1000000, 'Bitrate must be greater than 1 Mbps for 60s @ 24.8MB');
    assert(bitrate < 4000000, 'Bitrate must not exceed total budget');

    const res = engine.getOptimalResolution(1920, 1080, 500000);
    assert(res.width <= 640, 'Low bitrate should automatically downscale to prevent pixelation');
});

// 8. Test Thumbnail Crafter Engine
test('Thumbnail Crafter engine initializes with YouTube 1280x720 standard', () => {
    const engine = new ThumbnailCrafterEngine();
    assert.strictEqual(engine.width, 1280, 'Must be 1280px wide');
    assert.strictEqual(engine.height, 720, 'Must be 720px tall');
});

// 9. Test File Assets
test('Core project files exist on disk', () => {
    assert(fs.existsSync(path.join(__dirname, 'index.html')), 'index.html must exist');
    assert(fs.existsSync(path.join(__dirname, 'styles.css')), 'styles.css must exist');
    assert(fs.existsSync(path.join(__dirname, 'app.js')), 'app.js must exist');
    assert(fs.existsSync(path.join(__dirname, 'server.js')), 'server.js must exist');
    assert(fs.existsSync(path.join(__dirname, 'build.js')), 'build.js must exist');
});

console.log(`\nTests Completed: ${passes} Passed, ${fails} Failed.`);
if (fails > 0) process.exit(1);
else process.exit(0);
