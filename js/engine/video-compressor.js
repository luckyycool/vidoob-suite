/**
 * In-Browser Video Compressor & Exact-MB Size Reducer Engine
 * Powered by HTML5 Canvas, Web Audio API, and MediaRecorder API.
 * 100% Client-Side. No server uploads.
 */

class VideoCompressorEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }

    getCanvas(width, height) {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
        this.canvas.width = width;
        this.canvas.height = height;
        return { canvas: this.canvas, ctx: this.ctx };
    }

    /**
     * Calculates the optimal video bitrate (in bps) to hit an exact target file size (in MB)
     * @param {number} durationSeconds - Video length in seconds
     * @param {number} targetMB - Target size in megabytes (e.g. 24.8 for Discord)
     * @param {number} audioBitrateBps - Estimated audio bitrate (default 128 kbps)
     * @returns {number} videoBitrateBps
     */
    calculateBitrate(durationSeconds, targetMB, audioBitrateBps = 128000) {
        if (!durationSeconds || durationSeconds <= 0) return 1500000;
        const targetBits = targetMB * 8 * 1024 * 1024;
        const totalBitrateBps = targetBits / durationSeconds;
        // Allocate audio bitrate and leave 5% container overhead buffer
        const videoBitrateBps = Math.max(150000, Math.floor((totalBitrateBps - audioBitrateBps) * 0.95));
        return videoBitrateBps;
    }

    /**
     * Determines optimal output resolution based on target bitrate
     */
    getOptimalResolution(videoWidth, videoHeight, bitrateBps) {
        let scaleWidth = videoWidth;
        let scaleHeight = videoHeight;

        // Downscale if bitrate is constrained to prevent severe macroblocking
        if (bitrateBps < 600000) {
            scaleWidth = Math.min(640, videoWidth);
        } else if (bitrateBps < 1800000) {
            scaleWidth = Math.min(1280, videoWidth);
        } else {
            scaleWidth = Math.min(1920, videoWidth);
        }

        const aspect = videoHeight / videoWidth;
        scaleHeight = Math.round(scaleWidth * aspect);
        // Ensure even dimensions for codecs
        scaleWidth = scaleWidth % 2 === 0 ? scaleWidth : scaleWidth - 1;
        scaleHeight = scaleHeight % 2 === 0 ? scaleHeight : scaleHeight - 1;

        return { width: scaleWidth, height: scaleHeight };
    }

    /**
     * Compresses a video element to a target file size in MB
     * @param {HTMLVideoElement} videoElement 
     * @param {number} targetMB 
     * @param {Function} onProgress - (percent, statusMessage) => void
     * @returns {Promise<Blob>}
     */
    async compressVideo(videoElement, targetMB, onProgress = () => {}) {
        return new Promise((resolve, reject) => {
            const duration = videoElement.duration;
            if (!duration || isNaN(duration)) {
                return reject(new Error('Invalid video duration. Please ensure the video is fully loaded.'));
            }

            const videoBitrate = this.calculateBitrate(duration, targetMB);
            const { width, height } = this.getOptimalResolution(
                videoElement.videoWidth || 1280,
                videoElement.videoHeight || 720,
                videoBitrate
            );

            onProgress(5, `Configuring encoder: ${width}x${height} @ ${(videoBitrate / 1000).toFixed(0)} kbps...`);

            const { canvas, ctx } = this.getCanvas(width, height);
            const fps = 24;
            const stream = canvas.captureStream(fps);

            // Add audio track if present
            try {
                if (videoElement.captureStream) {
                    const originalStream = videoElement.captureStream();
                    const audioTracks = originalStream.getAudioTracks();
                    if (audioTracks.length > 0) {
                        stream.addTrack(audioTracks[0]);
                    }
                } else if (videoElement.mozCaptureStream) {
                    const originalStream = videoElement.mozCaptureStream();
                    const audioTracks = originalStream.getAudioTracks();
                    if (audioTracks.length > 0) {
                        stream.addTrack(audioTracks[0]);
                    }
                }
            } catch (e) {
                console.warn('Audio pass-through note:', e);
            }

            // Determine best supported codec
            let mimeType = 'video/webm;codecs=vp9,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: videoBitrate
            });

            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                onProgress(100, `Compression complete: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
                resolve(blob);
            };

            recorder.onerror = (err) => reject(err);

            // Start recording
            recorder.start(100);
            videoElement.currentTime = 0;
            videoElement.play();

            const interval = 1000 / fps;
            const drawFrame = () => {
                if (videoElement.paused || videoElement.ended) {
                    if (videoElement.ended) {
                        recorder.stop();
                        return;
                    }
                }

                ctx.drawImage(videoElement, 0, 0, width, height);

                const pct = Math.min(99, Math.round((videoElement.currentTime / duration) * 95) + 5);
                onProgress(pct, `Crunching frames: ${pct}% (Time: ${videoElement.currentTime.toFixed(1)}s / ${duration.toFixed(1)}s)`);

                if (videoElement.currentTime < duration && !videoElement.ended) {
                    setTimeout(drawFrame, interval);
                } else {
                    recorder.stop();
                }
            };

            drawFrame();
        });
    }

    formatMB(bytes) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoCompressorEngine;
}
if (typeof window !== 'undefined') {
    window.VideoCompressorEngine = VideoCompressorEngine;
}
