/**
 * Lightweight Zero-Dependency Local Dev Server for Vidoob Suite
 * Serves the multi-brand workspace locally with real-time brand switching.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.webm': 'video/webm',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    const filePath = path.join(ROOT, pathname);

    // Security check
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end('Access denied');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end(`File not found: ${pathname}`);
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 VIDOOB SUITE LOCAL DEV SERVER IS RUNNING`);
    console.log(`======================================================`);
    console.log(`\n👉 Test Brand 1 (Vidoob - Creator Cobalt):`);
    console.log(`   http://localhost:${PORT}/?brand=vidoob`);
    console.log(`\n👉 Test Brand 2 (VideosDrive - Swiss Terracotta):`);
    console.log(`   http://localhost:${PORT}/?brand=drive`);
    console.log(`\n👉 Or toggle in real-time using the floating pill at bottom-right!`);
    console.log(`======================================================\n`);
});
