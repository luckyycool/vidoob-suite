/**
 * Multi-Brand Configuration Registry for Vidoob Suite
 * Defines distinct styling, metadata, hierarchy, and SEO for vidoob.com and videosdrive.com
 */

const BRANDS = {
    vidoob: {
        id: 'vidoob',
        brandName: 'Vidoob',
        domain: 'vidoob.com',
        tagline: 'Creator Studio',
        logoEmoji: '⚡',
        themeName: 'Fresh Studio Daylight & Royal Cobalt',
        defaultTool: 'chapters',
        featuredTool: 'chapters',
        meta: {
            title: 'Vidoob — In-Browser Creator & Social Video Studio',
            description: 'Free, zero-upload in-browser video tools for creators. Generate YouTube chapters, inspect TikTok/Reels safe zones, and make social video clips 100% privately.',
            canonical: 'https://vidoob.com/',
            keywords: 'youtube chapter generator, tiktok safe zone overlay, reels safe zone, video to gif, in-browser video tools, vidoob'
        },
        hero: {
            badge: '⚡ CREATOR STUDIO • ZERO UPLOADS • 100% PRIVATE',
            title: 'Professional Video Tools For Creators. Built For Your Browser.',
            subtitle: 'Format YouTube chapters with algorithmic precision, inspect TikTok and Instagram Reels dead-zones, and convert video clips directly on your computer. Zero watermarks, zero wait times.',
            primaryCta: '⏱️ Launch YouTube Chapter Maker →',
            primaryTarget: 'chapters',
            secondaryCta: '✨ Launch Gemini AI Studio',
            secondaryTarget: 'ai-studio'
        },
        theme: {
            bodyBg: '#ffffff',
            surfaceBg: '#f8fafc',
            surfaceCard: '#ffffff',
            surfaceMuted: '#f1f5f9',
            borderColor: '#e2e8f0',
            borderSubtle: '#cbd5e1',
            textPrimary: '#0f172a',
            textSecondary: '#475569',
            textMuted: '#64748b',
            primaryColor: '#2563eb', // Royal Cobalt
            primaryHover: '#1d4ed8',
            primaryLight: '#eff6ff',
            accentColor: '#f97316',  // Vibrant Coral/Tangerine
            accentHover: '#ea580c',
            accentLight: '#fff7ed',
            badgeBg: '#eff6ff',
            badgeText: '#1e40af',
            fontHeading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontBody: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            headerClass: 'theme-vidoob-header'
        },
        toolsOrder: ['chapters', 'thumbnail-crafter', 'ai-studio', 'safe-zones', 'gif-maker', 'compressor', 'audio-extractor', 'subtitles', 'hooks'],
        toolLabels: {
            chapters: { name: 'YouTube Chapters', badge: '⭐ Flagship', icon: '⏱️' },
            'thumbnail-crafter': { name: 'AI Thumbnail Crafter', badge: 'High CTR', icon: '🎨' },
            'ai-studio': { name: '✨ AI Video Studio', badge: 'Gemini AI', icon: '✨' },
            'safe-zones': { name: 'Social Safe-Zones', badge: 'TikTok & Reels', icon: '📱' },
            'gif-maker': { name: 'Video to GIF / WebM', badge: '0 Watermarks', icon: '🎬' },
            compressor: { name: 'Exact-MB Compressor', badge: 'Discord / Email', icon: '📦' },
            'audio-extractor': { name: 'Audio Extractor', badge: 'Lightning Fast', icon: '🎵' },
            subtitles: { name: 'Subtitle Formatter', badge: 'SRT ⇄ VTT', icon: '📝' },
            hooks: { name: 'Viral Hooks Library', badge: '300+ Hooks', icon: '💡' }
        },
        footerText: 'Vidoob provides 100% in-browser video utilities powered by client-side WebAssembly, Canvas, and Web Audio APIs. No files ever leave your machine.'
    },

    drive: {
        id: 'drive',
        brandName: 'VideosDrive',
        domain: 'videosdrive.com',
        tagline: 'Media Drive',
        logoEmoji: '📁',
        themeName: 'Warm Paper & Swiss Terracotta',
        defaultTool: 'audio-extractor',
        featuredTool: 'audio-extractor',
        meta: {
            title: 'VideosDrive — Instant In-Browser Video & Audio Converter',
            description: 'Zero-upload media drive. Extract MP3 audio from video, fix subtitle desync, and convert video clips at lightning speed on your computer. 100% private.',
            canonical: 'https://videosdrive.com/',
            keywords: 'video to mp3, extract audio from video, srt to vtt converter, fix subtitle desync, video trimmer in-browser, videosdrive'
        },
        hero: {
            badge: '📁 MEDIA DRIVE • CLIENT-SIDE COMPUTING • ZERO STORAGE',
            title: 'Your Private In-Browser Video & Audio Converter Drive.',
            subtitle: 'Extract crisp audio tracks, repair desynchronized subtitles, and convert media formats without uploading a single megabyte to external servers. Fast, confidential, and completely free.',
            primaryCta: '🎵 Extract Audio From Video →',
            primaryTarget: 'audio-extractor',
            secondaryCta: '📝 Repair Desynced Subtitles',
            secondaryTarget: 'subtitles'
        },
        theme: {
            bodyBg: '#fafaf8',
            surfaceBg: '#ffffff',
            surfaceCard: '#ffffff',
            surfaceMuted: '#f5f5f0',
            borderColor: '#e7e5e4',
            borderSubtle: '#d6d3d1',
            textPrimary: '#1c1917',
            textSecondary: '#44403c',
            textMuted: '#78716c',
            primaryColor: '#ea580c', // Warm Terracotta / Rust
            primaryHover: '#c2410c',
            primaryLight: '#fff7ed',
            accentColor: '#0d9488',  // Deep Forest Teal
            accentHover: '#0f766e',
            accentLight: '#f0fdfa',
            badgeBg: '#fff7ed',
            badgeText: '#9a3412',
            fontHeading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            headerClass: 'theme-drive-header'
        },
        toolsOrder: ['audio-extractor', 'compressor', 'subtitles', 'gif-maker', 'thumbnail-crafter', 'ai-studio', 'chapters', 'safe-zones', 'hooks'],
        toolLabels: {
            'audio-extractor': { name: 'Audio Extractor', badge: '⭐ Flagship', icon: '🎵' },
            compressor: { name: 'Exact-MB Compressor', badge: 'Discord / Email', icon: '📦' },
            subtitles: { name: 'Subtitle Time-Shifter', badge: 'SRT ⇄ VTT Repair', icon: '📝' },
            'gif-maker': { name: 'Video Trimmer & GIF', badge: 'Fast WebM/GIF', icon: '🎬' },
            'thumbnail-crafter': { name: 'Thumbnail Crafter', badge: 'YouTube Art', icon: '🎨' },
            'ai-studio': { name: '✨ AI Media Optimizer', badge: 'Gemini AI', icon: '✨' },
            chapters: { name: 'Timestamp Formatter', badge: 'Audio & Video', icon: '⏱️' },
            'safe-zones': { name: 'Dimension & Aspect Ratio', badge: 'Media Formats', icon: '📱' },
            hooks: { name: 'Script Hooks Archive', badge: 'Reference Kit', icon: '💡' }
        },
        footerText: 'VideosDrive is a privacy-first personal media utility drive. All conversions and audio extractions are processed locally on your hardware with zero cloud storage.'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BRANDS;
}
if (typeof window !== 'undefined') {
    window.VIDOOB_BRANDS = BRANDS;
}
