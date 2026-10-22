/**
 * In-Browser Video Trimmer & WebM/GIF Recorder Engine
 * Renders video frames via HTML5 Canvas and MediaRecorder API.
 * 100% Client-Side. No watermarks.
 */

class GifMakerEngine {
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
     * Records a trimmed clip from a video element to a WebM/MP4 Blob
     * @param {HTMLVideoElement} video 
     * @param {Object} options { startTime, endTime, fps, scaleWidth, speed }
     * @param {Function} onProgress 
     * @returns {Promise<Blob>}
     */
    async recordTrimmedClip(video, options = {}, onProgress = () => {}) {
        const {
            startTime = 0,
            endTime = Math.min(video.duration || 10, startTime + 10),
            fps = 24,
            scaleWidth = 480,
            speed = 1.0
        } = options;

        const duration = Math.max(0.5, endTime - startTime);
        const aspect = (video.videoHeight || 9) / (video.videoWidth || 16);
        const scaleHeight = Math.round(scaleWidth * aspect);

        const { canvas, ctx } = this.getCanvas(scaleWidth, scaleHeight);

        // Setup MediaStream from Canvas
        const stream = canvas.captureStream(fps);
        
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2500000 // 2.5 Mbps
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        return new Promise(async (resolve, reject) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                onProgress(100, 'Recording finished!');
                resolve(blob);
            };

            recorder.onerror = (err) => reject(err);

            // Seek to start
            video.currentTime = startTime;
            video.playbackRate = speed;
            await new Promise(r => video.onseeked = r);

            recorder.start(100);
            video.play();

            const interval = 1000 / fps;
            const drawFrame = () => {
                if (video.currentTime >= endTime || video.paused || video.ended) {
                    video.pause();
                    recorder.stop();
                    return;
                }

                ctx.drawImage(video, 0, 0, scaleWidth, scaleHeight);
                const currentProgress = Math.min(99, Math.round(((video.currentTime - startTime) / duration) * 100));
                onProgress(currentProgress, `Processing clip: ${currentProgress}%`);

                setTimeout(drawFrame, interval);
            };

            drawFrame();
        });
    }

    /**
     * Formats bytes into human-readable size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GifMakerEngine;
}
if (typeof window !== 'undefined') {
    window.GifMakerEngine = GifMakerEngine;
}
