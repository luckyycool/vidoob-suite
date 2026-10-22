/**
 * Vidoob Suite Static Build Generator
 * Compiles static production builds for vidoob.com (dist/vidoob) and videosdrive.com (dist/videosdrive)
 */

const fs = require('fs');
const path = require('path');
const BRANDS = require('./brands.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (entry.name !== 'dist' && entry.name !== 'node_modules' && entry.name !== '.git') {
                copyDir(srcPath, destPath);
            }
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function buildBrand(brandId) {
    const brand = BRANDS[brandId];
    if (!brand) throw new Error(`Unknown brand ID: ${brandId}`);

    const outDir = path.join(DIST, brandId === 'drive' ? 'videosdrive' : 'vidoob');
    console.log(`\n📦 Building static bundle for ${brand.brandName} (${brand.domain}) -> ${outDir}`);

    // Create target dir
    fs.mkdirSync(outDir, { recursive: true });

    // Copy core assets
    copyDir(ROOT, outDir);

    // Read base index.html
    let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

    // 1. Inject static title, description, and keywords
    html = html.replace(/<title>.*?<\/title>/i, `<title>${brand.meta.title}</title>`);
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${brand.meta.description}" />`);
    if (brand.meta.keywords && !html.includes('name="keywords"')) {
        html = html.replace('</head>', `  <meta name="keywords" content="${brand.meta.keywords}" />\n</head>`);
    }

    // 2. Inject OpenGraph & Twitter Meta Tags
    const ogTags = `
  <!-- OpenGraph & Twitter Social Cards -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${brand.brandName}" />
  <meta property="og:title" content="${brand.meta.title}" />
  <meta property="og:description" content="${brand.meta.description}" />
  <meta property="og:url" content="${brand.meta.canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${brand.meta.title}" />
  <meta name="twitter:description" content="${brand.meta.description}" />
`;
    if (!html.includes('property="og:title"')) {
        html = html.replace('</head>', `${ogTags}\n</head>`);
    }
    
    // 3. Inject canonical link
    if (!html.includes('rel="canonical"')) {
        html = html.replace('</head>', `  <link rel="canonical" href="${brand.meta.canonical}" />\n</head>`);
    }

    // 4. Inject JSON-LD WebApplication Structured Data Schema
    const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "${brand.brandName}",
    "url": "${brand.meta.canonical}",
    "description": "${brand.meta.description}",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All (Web Browser)",
    "browserRequirements": "Requires HTML5, Web Audio, and WebAssembly support",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
`;
    if (!html.includes('"@type": "WebApplication"')) {
        html = html.replace('</head>', `${jsonLd}\n</head>`);
    }

    // 5. Pre-render Static Brand Content for Instant SEO (Googlebot without JS)
    html = html.replace(/<body[^>]*>/i, `<body class="brand-${brandId}">`);
    html = html.replace(/<span class="brand-icon" id="brand-icon-slot">.*?<\/span>/i, `<span class="brand-icon" id="brand-icon-slot">${brand.logoEmoji}</span>`);
    html = html.replace(/<span class="brand-title" id="brand-title-slot">.*?<\/span>/i, `<span class="brand-title" id="brand-title-slot">${brand.brandName}</span>`);
    html = html.replace(/<span class="brand-badge" id="brand-badge-slot">.*?<\/span>/i, `<span class="brand-badge" id="brand-badge-slot">${brand.tagline}</span>`);
    html = html.replace(/<div class="hero-pill" id="hero-pill">.*?<\/div>/i, `<div class="hero-pill" id="hero-pill">${brand.hero.badge}</div>`);
    html = html.replace(/<h1 class="hero-title" id="hero-title">.*?<\/h1>/i, `<h1 class="hero-title" id="hero-title">${brand.hero.title}</h1>`);
    html = html.replace(/<p class="hero-subtitle" id="hero-subtitle">[\s\S]*?<\/p>/i, `<p class="hero-subtitle" id="hero-subtitle">\n        ${brand.hero.subtitle}\n      </p>`);
    html = html.replace(/<span id="hero-primary-cta-label">.*?<\/span>/i, `<span id="hero-primary-cta-label">${brand.hero.primaryCta}</span>`);
    html = html.replace(/<span id="hero-secondary-cta-label">.*?<\/span>/i, `<span id="hero-secondary-cta-label">${brand.hero.secondaryCta}</span>`);
    html = html.replace(/<p style="max-width: 700px; margin: 0 auto; line-height: 1.6;" id="footer-text-slot">[\s\S]*?<\/p>/i, `<p style="max-width: 700px; margin: 0 auto; line-height: 1.6;" id="footer-text-slot">\n        ${brand.footerText}\n      </p>`);

    // 6. In static production build, remove the floating dev switcher pill
    html = html.replace(/<!-- ======================================================== -->\s*<!-- Floating Localhost Brand Switcher Pill for User Testing  -->[\s\S]*?<\/div>/i, '');

    // Write finalized production index.html
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    // Create robots.txt
    const robots = `User-agent: *\nAllow: /\n\nSitemap: https://${brand.domain}/sitemap.xml\n`;
    fs.writeFileSync(path.join(outDir, 'robots.txt'), robots, 'utf8');

    // Create sitemap.xml
    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://${brand.domain}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`;
    fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');

    // Create Cloudflare Pages _headers file for caching and security
    const headers = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/styles.css
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
/*.js
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
`;
    fs.writeFileSync(path.join(outDir, '_headers'), headers, 'utf8');

    console.log(`✓ ${brand.brandName} built successfully.`);
}

function run() {
    const args = process.argv.slice(2);
    const brandArg = args.find(a => a.startsWith('--brand='));

    if (brandArg) {
        const brandId = brandArg.split('=')[1];
        buildBrand(brandId);
    } else {
        // Build both
        buildBrand('vidoob');
        buildBrand('drive');
    }

    console.log('\n🎉 Production builds completed in ./dist directory.');
}

run();
