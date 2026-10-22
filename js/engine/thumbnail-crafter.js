/**
 * AI YouTube Thumbnail & Expressive Face Crafter Engine
 * Renders 16:9 1280x720 click-worthy thumbnails with subject cutout, glow contours,
 * dynamic gradient backdrops, and bold high-CTR typography.
 * 100% Client-Side Canvas Engine.
 */

class ThumbnailCrafterEngine {
    constructor() {
        this.width = 1280;
        this.height = 720;
    }

    /**
     * Renders a complete thumbnail onto an HTML5 canvas element
     */
    renderThumbnail(canvas, options = {}) {
        const {
            theme = 'cyberpunk',
            titleText = 'DON\'T DO THIS',
            textStyle = 'yellow-badge',
            subjectImg = null,
            glowColor = '#06b6d4',
            glowIntensity = 20,
            subjectPosition = 'right'
        } = options;

        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        // 1. Draw Background Theme
        this.drawBackground(ctx, theme);

        // 2. Draw Subject / Face with Glow Contour
        if (subjectImg && subjectImg.complete && subjectImg.naturalWidth > 0) {
            this.drawSubjectWithGlow(ctx, subjectImg, subjectPosition, glowColor, glowIntensity);
        } else {
            this.drawPlaceholderSubject(ctx, subjectPosition);
        }

        // 3. Draw Bold High-CTR Title Text
        if (titleText && titleText.trim()) {
            this.drawTitleText(ctx, titleText.trim().toUpperCase(), textStyle, subjectPosition);
        }

        // 4. Subtle Vignette & Frame Polish
        this.drawVignette(ctx);
    }

    drawBackground(ctx, theme) {
        const w = this.width;
        const h = this.height;

        if (theme === 'cyberpunk') {
            // Dark navy with electric cyan & magenta flares
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#090d16');
            grad.addColorStop(0.5, '#0f172a');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Cyan glow orb
            const orb1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 10, w * 0.2, h * 0.3, 400);
            orb1.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
            orb1.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = orb1;
            ctx.fillRect(0, 0, w, h);

            // Magenta secondary flare
            const orb2 = ctx.createRadialGradient(w * 0.8, h * 0.8, 10, w * 0.8, h * 0.8, 500);
            orb2.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
            orb2.addColorStop(1, 'rgba(236, 72, 153, 0)');
            ctx.fillStyle = orb2;
            ctx.fillRect(0, 0, w, h);
        } else if (theme === 'danger') {
            // Red alert high stakes
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#1c0a0a');
            grad.addColorStop(0.5, '#2a0c0c');
            grad.addColorStop(1, '#0a0303');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            const orb = ctx.createRadialGradient(w * 0.4, h * 0.4, 20, w * 0.4, h * 0.4, 450);
            orb.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
            orb.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = orb;
            ctx.fillRect(0, 0, w, h);
        } else if (theme === 'gold') {
            // Luxury & Wealth
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#131109');
            grad.addColorStop(0.5, '#1e1b10');
            grad.addColorStop(1, '#080704');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            const orb = ctx.createRadialGradient(w * 0.3, h * 0.4, 10, w * 0.3, h * 0.4, 420);
            orb.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
            orb.addColorStop(1, 'rgba(234, 179, 8, 0)');
            ctx.fillStyle = orb;
            ctx.fillRect(0, 0, w, h);
        } else if (theme === 'studio') {
            // Fresh Daylight Cobalt Studio
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#1e3a8a');
            grad.addColorStop(0.6, '#172554');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            const orb = ctx.createRadialGradient(w * 0.5, h * 0.2, 50, w * 0.5, h * 0.2, 550);
            orb.addColorStop(0, 'rgba(96, 165, 250, 0.45)');
            orb.addColorStop(1, 'rgba(96, 165, 250, 0)');
            ctx.fillStyle = orb;
            ctx.fillRect(0, 0, w, h);
        } else {
            // Matrix Tech Green
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#021811');
            grad.addColorStop(0.5, '#04281d');
            grad.addColorStop(1, '#010f0b');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            const orb = ctx.createRadialGradient(w * 0.3, h * 0.3, 10, w * 0.3, h * 0.3, 450);
            orb.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
            orb.addColorStop(1, 'rgba(34, 197, 94, 0)');
            ctx.fillStyle = orb;
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawSubjectWithGlow(ctx, img, position, glowColor, glowIntensity) {
        const targetHeight = this.height * 0.95;
        const aspect = img.naturalWidth / img.naturalHeight;
        const targetWidth = targetHeight * aspect;

        const x = position === 'right' ? this.width - targetWidth - 20 : 20;
        const y = this.height - targetHeight;

        ctx.save();

        // Multi-pass glow contour
        if (glowIntensity > 0) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowIntensity * 1.5;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
        }

        // Draw crisp subject on top
        ctx.shadowBlur = 0;
        ctx.drawImage(img, x, y, targetWidth, targetHeight);
        ctx.restore();
    }

    drawPlaceholderSubject(ctx, position) {
        ctx.save();
        const x = position === 'right' ? this.width * 0.65 : this.width * 0.1;
        const y = this.height * 0.25;
        const w = this.width * 0.3;
        const h = this.height * 0.68;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👤 Drop Selfie / Face Here', x + w / 2, y + h / 2 - 10);
        ctx.font = '16px sans-serif';
        ctx.fillText('(Glow contour applied automatically)', x + w / 2, y + h / 2 + 20);

        ctx.restore();
    }

    drawTitleText(ctx, text, style, subjectPosition) {
        ctx.save();
        // Place text on opposite side of subject
        const x = subjectPosition === 'right' ? 80 : this.width * 0.45;
        const y = this.height * 0.42;

        const words = text.split(' ');
        ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        words.forEach((word, index) => {
            const wordY = y + index * 95;

            if (style === 'yellow-badge') {
                // Yellow with red badge highlight
                const metrics = ctx.measureText(word);
                const padX = 20;
                const padY = 12;

                ctx.fillStyle = index === 0 ? '#dc2626' : '#1e1b4b';
                ctx.fillRect(x - padX, wordY - 45 - padY / 2, metrics.width + padX * 2, 85 + padY);

                ctx.fillStyle = index === 0 ? '#ffffff' : '#facc15';
                ctx.fillText(word, x, wordY);
            } else if (style === 'white-stroke') {
                // Thick black stroke around bright white letters
                ctx.lineWidth = 18;
                ctx.strokeStyle = '#000000';
                ctx.strokeText(word, x, wordY);

                ctx.fillStyle = '#ffffff';
                ctx.fillText(word, x, wordY);
            } else {
                // Neon Cyan glow
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 24;
                ctx.fillStyle = '#22d3ee';
                ctx.fillText(word, x, wordY);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(word, x, wordY);
            }
        });

        ctx.restore();
    }

    drawVignette(ctx) {
        ctx.save();
        const grad = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.4,
            this.width / 2, this.height / 2, this.width * 0.7
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThumbnailCrafterEngine;
}
if (typeof window !== 'undefined') {
    window.ThumbnailCrafterEngine = ThumbnailCrafterEngine;
}
