/**
 * In-Browser Subtitle Engine (SRT ⇄ VTT Converter & Millisecond Time-Shifter)
 * Fixes audio desync, formats captions, and extracts clean transcripts.
 */

class SubtitleEngine {
    /**
     * Converts "00:01:23,456" (SRT) or "00:01:23.456" (VTT) into total milliseconds
     */
    timestampToMs(ts) {
        if (!ts) return 0;
        const normalized = ts.trim().replace(',', '.');
        const parts = normalized.split(':');
        let hrs = 0, mins = 0, secs = 0;

        if (parts.length === 3) {
            hrs = parseFloat(parts[0]);
            mins = parseFloat(parts[1]);
            secs = parseFloat(parts[2]);
        } else if (parts.length === 2) {
            mins = parseFloat(parts[0]);
            secs = parseFloat(parts[1]);
        }

        return Math.round((hrs * 3600 + mins * 60 + secs) * 1000);
    }

    /**
     * Converts milliseconds into formatted timestamp string
     * @param {number} ms 
     * @param {boolean} isVtt - true for dot separator, false for comma (SRT)
     */
    msToTimestamp(ms, isVtt = false) {
        if (ms < 0) ms = 0;
        const totalSec = Math.floor(ms / 1000);
        const millis = ms % 1000;
        const s = totalSec % 60;
        const m = Math.floor((totalSec / 60) % 60);
        const h = Math.floor(totalSec / 3600);

        const pad = (n, w = 2) => String(n).padStart(w, '0');
        const sep = isVtt ? '.' : ',';

        return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(millis, 3)}`;
    }

    /**
     * Parses raw subtitle string (SRT or VTT) into cues array
     */
    parse(content) {
        if (!content || typeof content !== 'string') return [];
        const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const cues = [];
        let currentCue = null;

        const timeRegex = /((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{3})/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line === 'WEBVTT') continue;

            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
                if (currentCue) {
                    currentCue.text = currentCue.lines.join('\n').trim();
                    cues.push(currentCue);
                }
                currentCue = {
                    startMs: this.timestampToMs(timeMatch[1]),
                    endMs: this.timestampToMs(timeMatch[2]),
                    lines: []
                };
            } else if (currentCue) {
                currentCue.lines.push(line);
            }
        }

        if (currentCue) {
            currentCue.text = currentCue.lines.join('\n').trim();
            cues.push(currentCue);
        }

        return cues;
    }

    /**
     * Shifts all cues by a given millisecond delta (+ or -)
     */
    shiftTime(cues, deltaMs) {
        return cues.map(cue => ({
            ...cue,
            startMs: Math.max(0, cue.startMs + deltaMs),
            endMs: Math.max(0, cue.endMs + deltaMs)
        }));
    }

    /**
     * Converts cues into SRT format string
     */
    toSrt(cues) {
        return cues.map((cue, idx) => {
            const start = this.msToTimestamp(cue.startMs, false);
            const end = this.msToTimestamp(cue.endMs, false);
            return `${idx + 1}\n${start} --> ${end}\n${cue.text}\n`;
        }).join('\n');
    }

    /**
     * Converts cues into WebVTT format string
     */
    toVtt(cues) {
        const body = cues.map(cue => {
            const start = this.msToTimestamp(cue.startMs, true);
            const end = this.msToTimestamp(cue.endMs, true);
            return `${start} --> ${end}\n${cue.text}`;
        }).join('\n\n');
        return `WEBVTT\n\n${body}\n`;
    }

    /**
     * Strips timestamps, cues, numbers, and tags to create a clean text transcript
     */
    extractCleanText(content) {
        const cues = this.parse(content);
        return cues.map(c => {
            // Remove HTML tags like <b>, <i>, <c.color>
            return c.text.replace(/<[^>]*>/g, '').trim();
        }).filter(Boolean).join('\n\n');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubtitleEngine;
}
if (typeof window !== 'undefined') {
    window.SubtitleEngine = SubtitleEngine;
}
