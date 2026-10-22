/**
 * In-Browser Audio Extractor Engine
 * Decodes video files and extracts audio as clean WAV/MP3 data using the HTML5 Web Audio API.
 * 100% Client-side. Zero server upload.
 */

class AudioExtractorEngine {
    constructor() {
        this.audioCtx = null;
    }

    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        }
        return this.audioCtx;
    }

    /**
     * Extracts audio buffer from a video or audio File/Blob
     * @param {File|Blob} file 
     * @param {Function} onProgress 
     * @returns {Promise<AudioBuffer>}
     */
    async extractAudioBuffer(file, onProgress = () => {}) {
        onProgress(10, 'Reading file into memory...');
        const arrayBuffer = await file.arrayBuffer();

        onProgress(40, 'Decoding audio stream via Web Audio API...');
        const ctx = this.getAudioContext();
        
        return new Promise((resolve, reject) => {
            ctx.decodeAudioData(
                arrayBuffer,
                (audioBuffer) => {
                    onProgress(80, 'Audio successfully decoded!');
                    resolve(audioBuffer);
                },
                (err) => {
                    reject(new Error('Failed to decode audio. The file might not contain an audio track or uses an unsupported codec.'));
                }
            );
        });
    }

    /**
     * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
     * @param {AudioBuffer} audioBuffer 
     * @param {Function} onProgress 
     * @returns {Blob}
     */
    audioBufferToWav(audioBuffer, onProgress = () => {}) {
        onProgress(85, 'Encoding WAV PCM 16-bit container...');
        const numChannels = Math.min(2, audioBuffer.numberOfChannels);
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const left = audioBuffer.getChannelData(0);
        const right = numChannels === 2 ? audioBuffer.getChannelData(1) : left;
        const length = left.length * numChannels * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);

        /* RIFF identifier */
        this.writeString(view, 0, 'RIFF');
        /* file length */
        view.setUint32(4, 36 + length, true);
        /* RIFF type */
        this.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        this.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, format, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * numChannels * 2, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, numChannels * 2, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        this.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, length, true);

        // Interleave samples
        let offset = 44;
        for (let i = 0; i < left.length; i++) {
            // Left channel
            let sample = Math.max(-1, Math.min(1, left[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;

            if (numChannels === 2) {
                // Right channel
                sample = Math.max(-1, Math.min(1, right[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        onProgress(100, 'Audio extraction complete!');
        return new Blob([view], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Formats bytes into human-readable size (MB/KB)
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioExtractorEngine;
}
if (typeof window !== 'undefined') {
    window.AudioExtractorEngine = AudioExtractorEngine;
}
