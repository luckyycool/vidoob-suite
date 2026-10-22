/**
 * Social Video Safe-Zone & Aspect Ratio Engine
 * Simulates mobile platform UI overlays (TikTok, Reels, Shorts) to prevent caption/face clipping.
 */

const SOCIAL_OVERLAYS = {
    tiktok: {
        id: 'tiktok',
        name: 'TikTok 9:16',
        aspectRatio: '9:16',
        description: 'Covers right interaction column (like, comment, bookmark, share), bottom username & sound pill, and top search tab.',
        zones: [
            { id: 'top-nav', label: 'Top Search & Live Tab', top: '0%', left: '0%', width: '100%', height: '10%', color: 'rgba(239, 68, 68, 0.25)' },
            { id: 'right-actions', label: 'Right Action Buttons (Like/Comment/Share)', top: '35%', right: '0%', width: '20%', height: '52%', color: 'rgba(239, 68, 68, 0.35)' },
            { id: 'bottom-caption', label: 'Bottom Username, Caption & Sound Disc', bottom: '0%', left: '0%', width: '80%', height: '22%', color: 'rgba(239, 68, 68, 0.35)' }
        ],
        safeBox: { top: '12%', left: '5%', right: '22%', bottom: '24%' }
    },
    reels: {
        id: 'reels',
        name: 'Instagram Reels 9:16',
        aspectRatio: '9:16',
        description: 'Covers right engagement icons, bottom profile handle & audio attribution, and top camera icons.',
        zones: [
            { id: 'top-bar', label: 'Top Camera & Audio Header', top: '0%', left: '0%', width: '100%', height: '8%', color: 'rgba(249, 115, 22, 0.25)' },
            { id: 'right-actions', label: 'Right Engagement Icons (Like, Comment, Share)', top: '48%', right: '0%', width: '18%', height: '40%', color: 'rgba(249, 115, 22, 0.35)' },
            { id: 'bottom-caption', label: 'Bottom Caption & Audio Tag', bottom: '0%', left: '0%', width: '82%', height: '18%', color: 'rgba(249, 115, 22, 0.35)' }
        ],
        safeBox: { top: '10%', left: '5%', right: '20%', bottom: '20%' }
    },
    shorts: {
        id: 'shorts',
        name: 'YouTube Shorts 9:16',
        aspectRatio: '9:16',
        description: 'Covers right like/dislike/remix icons, bottom channel name & subscribe pill, and top search icon.',
        zones: [
            { id: 'top-header', label: 'Top Search & Camera Bar', top: '0%', left: '0%', width: '100%', height: '9%', color: 'rgba(59, 130, 246, 0.25)' },
            { id: 'right-actions', label: 'Right Engagement Icons (Like, Dislike, Remix)', top: '42%', right: '0%', width: '18%', height: '46%', color: 'rgba(59, 130, 246, 0.35)' },
            { id: 'bottom-channel', label: 'Bottom Channel Name & Subscribe Button', bottom: '0%', left: '0%', width: '82%', height: '16%', color: 'rgba(59, 130, 246, 0.35)' }
        ],
        safeBox: { top: '11%', left: '5%', right: '20%', bottom: '18%' }
    }
};

class SafeZoneEngine {
    constructor() {
        this.overlays = SOCIAL_OVERLAYS;
    }

    getOverlay(platformId) {
        return this.overlays[platformId] || this.overlays.tiktok;
    }

    getAllPlatforms() {
        return Object.values(this.overlays);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SafeZoneEngine, SOCIAL_OVERLAYS };
}
if (typeof window !== 'undefined') {
    window.SafeZoneEngine = SafeZoneEngine;
    window.SOCIAL_OVERLAYS = SOCIAL_OVERLAYS;
}
