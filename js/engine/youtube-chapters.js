/**
 * YouTube Chapters & Timestamp Engine
 * Parses, validates, and formats timestamps compliant with YouTube algorithm specifications.
 */

class YouTubeChaptersEngine {
    constructor() {
        this.timeRegex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/;
    }

    /**
     * Converts "MM:SS" or "HH:MM:SS" into total seconds
     */
    timeToSeconds(timeStr) {
        const parts = timeStr.trim().split(':').map(Number);
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    }

    /**
     * Converts seconds into formatted timestamp string ("MM:SS" or "HH:MM:SS")
     */
    secondsToTime(totalSeconds, forceHours = false) {
        const sec = Math.floor(totalSeconds % 60);
        const min = Math.floor((totalSeconds / 60) % 60);
        const hrs = Math.floor(totalSeconds / 3600);

        const pad = (n) => String(n).padStart(2, '0');

        if (hrs > 0 || forceHours) {
            return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
        }
        return `${pad(min)}:${pad(sec)}`;
    }

    /**
     * Parses raw input text into structured chapters array
     */
    parse(rawText) {
        if (!rawText || typeof rawText !== 'string') return [];
        const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const chapters = [];

        for (const line of lines) {
            // Find timestamp anywhere in the line
            const match = line.match(/(?:(?:(\d{1,2}):)?(\d{1,2}):(\d{2}))/);
            if (match) {
                const timeStr = match[0];
                const seconds = this.timeToSeconds(timeStr);

                // Clean title by stripping the timestamp and common separators
                let title = line.replace(timeStr, '').trim();
                title = title.replace(/^[\s\-–—|:.)\]]+|[\s\-–—|:.)\]]+$/g, '').trim();
                if (!title) title = 'Untitled Chapter';

                chapters.push({
                    seconds,
                    timeStr: this.secondsToTime(seconds),
                    title
                });
            }
        }

        // Sort chronologically
        chapters.sort((a, b) => a.seconds - b.seconds);
        return chapters;
    }

    /**
     * Validates chapters against YouTube algorithm rules
     */
    validate(chapters) {
        const errors = [];
        const warnings = [];

        if (chapters.length === 0) {
            return {
                valid: false,
                errors: ['No timestamps found in text.'],
                warnings: []
            };
        }

        // Rule 1: First chapter must be 00:00
        if (chapters[0].seconds !== 0) {
            errors.push('The first chapter must start at 00:00 or 0:00.');
        }

        // Rule 2: Minimum of 3 chapters
        if (chapters.length < 3) {
            errors.push(`YouTube requires at least 3 chapters (found ${chapters.length}).`);
        }

        // Rule 3: Minimum 10 seconds duration per chapter
        for (let i = 0; i < chapters.length - 1; i++) {
            const diff = chapters[i + 1].seconds - chapters[i].seconds;
            if (diff < 10) {
                errors.push(`Chapter "${chapters[i].title}" is only ${diff}s long. Each chapter must be at least 10 seconds.`);
            }
        }

        // Suggestions / Warnings
        if (chapters.length > 35) {
            warnings.push('Having more than 35 chapters may crowd the YouTube mobile scrub bar.');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Formats chapters into clean YouTube description text
     */
    format(chapters, separator = '—') {
        const hasHours = chapters.some(c => c.seconds >= 3600);
        return chapters.map(c => {
            const ts = this.secondsToTime(c.seconds, hasHours);
            return `${ts} ${separator} ${c.title}`;
        }).join('\n');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = YouTubeChaptersEngine;
}
if (typeof window !== 'undefined') {
    window.YouTubeChaptersEngine = YouTubeChaptersEngine;
}
