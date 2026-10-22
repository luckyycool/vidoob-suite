/**
 * Gemini AI Creator & Media Optimization Engine
 * Powered by Google Gemini 1.5 Flash (Free Tier: 15 RPM, 1,500 RPD)
 * Runs 100% in-browser with offline simulation fallback for instant zero-config testing.
 */

class GeminiAIEngine {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

    setApiKey(key) {
        this.apiKey = (key || '').trim();
        if (this.apiKey) {
            localStorage.setItem('gemini_api_key', this.apiKey);
        } else {
            localStorage.removeItem('gemini_api_key');
        }
    }

    hasApiKey() {
        return !!this.apiKey;
    }

    /**
     * Executes prompt against Gemini API (or returns realistic AI simulation if no key set)
     */
    async callGemini(prompt) {
        if (!this.apiKey) {
            // High-fidelity instant simulation fallback so user can test UI without an API key immediately
            await new Promise(r => setTimeout(r, 600));
            return this.generateSimulatedResponse(prompt);
        }

        const url = `${this.endpoint}?key=${encodeURIComponent(this.apiKey)}`;
        const body = {
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024
            }
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `Gemini API Error: HTTP ${res.status}`);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    /**
     * Tool 1: Generate High-CTR YouTube SEO (Titles, Description, Tags)
     */
    async generateYouTubeSEO(topic, niche = 'General') {
        const prompt = `You are an elite YouTube algorithm strategist and SEO specialist.
Topic: "${topic}"
Niche: "${niche}"

Provide a JSON response strictly formatted like this:
{
  "titles": [
    "5 High-CTR, click-worthy titles formatted to maximize browse & search impressions (include numbers, curiosity, and contrarian angles)"
  ],
  "description": "A 250-word keyword-optimized YouTube description containing hook, key takeaways, chapter placeholder, and engagement CTA.",
  "tags": [
    "20 high-volume search tags comma-separated"
  ]
}
Return ONLY valid JSON.`;

        try {
            const raw = await this.callGemini(prompt);
            const jsonStr = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            return this.getFallbackSEO(topic);
        }
    }

    /**
     * Tool 2: Rewrite Boring Opening into 5 Viral Psychological Hooks
     */
    async rewriteViralHook(draftLine, niche = 'Creator') {
        const prompt = `You are a viral retention editor for YouTube Shorts and long-form video.
Draft opening line: "${draftLine}"
Niche: "${niche}"

Rewrite this into 5 distinct viral hooks formatted as JSON:
[
  { "style": "The Curiosity Gap", "hook": "...", "explanation": "Why this keeps viewers watching" },
  { "style": "The Contrarian / Mythbuster", "hook": "...", "explanation": "..." },
  { "style": "The Negative Warning", "hook": "...", "explanation": "..." },
  { "style": "The High-Stakes Challenge", "hook": "...", "explanation": "..." },
  { "style": "The Shocking Statistic", "hook": "...", "explanation": "..." }
]
Return ONLY valid JSON.`;

        try {
            const raw = await this.callGemini(prompt);
            const jsonStr = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            return this.getFallbackHooks(draftLine);
        }
    }

    /**
     * Tool 3: Automated Transcript to Timestamped Chapters
     */
    async transcriptToChapters(rawTranscript) {
        const prompt = `You are a video editor. Analyze this rough transcript or outline and generate official YouTube chapters.
Rules:
1. Must start at 00:00.
2. Must have at least 4 chapters.
3. Each chapter must have an engaging, click-worthy title.
4. Output strictly in "MM:SS - Chapter Name" format, one per line.

Transcript:
"""
${rawTranscript.slice(0, 3000)}
"""`;

        const text = await this.callGemini(prompt);
        return text.replace(/```[a-z]*/g, '').trim();
    }

    // --- High-Quality Simulation Fallbacks (Zero-Config Test Mode) ---
    generateSimulatedResponse(prompt) {
        if (prompt.includes('YouTube algorithm strategist')) {
            return JSON.stringify(this.getFallbackSEO("Video Optimization"));
        }
        if (prompt.includes('viral retention editor')) {
            return JSON.stringify(this.getFallbackHooks("How to grow online"));
        }
        return "00:00 - Introduction & Hook\n01:15 - The Core Problem Revealed\n03:45 - Live Walkthrough & Secret Hack\n06:20 - Real-World Results & Case Study\n08:50 - Next Steps & Implementation";
    }

    getFallbackSEO(topic) {
        return {
            titles: [
                `I Tested ${topic} For 30 Days (Here Is What Happened)`,
                `Why 90% Of Creators Do ${topic} Completely Wrong in 2026`,
                `The 5-Minute ${topic} Framework Nobody Is Talking About`,
                `Stop Doing ${topic} Until You Watch This Video`,
                `How To Master ${topic} In 3 Simple Steps (Beginner to Pro)`
            ],
            description: `In this comprehensive guide, we break down everything you need to know about ${topic} to maximize your results in 2026.\n\nWhether you are just getting started or looking to optimize your existing workflow, these step-by-step frameworks will save you hours of trial and error.\n\n⏱️ TIMESTAMPS:\n00:00 - Introduction\n01:30 - The Hidden Trap\n04:15 - The 3-Step Strategy\n08:00 - Live Demonstration\n10:30 - Key Takeaways\n\n📌 Don't forget to like and subscribe for more in-depth tutorials!`,
            tags: [
                topic.toLowerCase(),
                `${topic.toLowerCase()} tutorial`,
                `${topic.toLowerCase()} 2026`,
                `how to master ${topic.toLowerCase()}`,
                `${topic.toLowerCase()} tips`,
                `best ${topic.toLowerCase()} tools`,
                `${topic.toLowerCase()} workflow`,
                'video marketing',
                'youtube growth'
            ]
        };
    }

    getFallbackHooks(draftLine) {
        return [
            {
                style: "The Curiosity Gap",
                hook: `Almost nobody realizes this, but ${draftLine.toLowerCase().replace(/^(in this video|today|i will show you)\s*/i, '')} has a hidden secret.`,
                explanation: "Opens a mental loop that can only be closed by watching the video."
            },
            {
                style: "The Contrarian / Mythbuster",
                hook: `Everything gurus told you about ${draftLine.toLowerCase().slice(0, 40)} is backwards. Here is what actually works.`,
                explanation: "Challenges common wisdom, creating immediate cognitive dissonance."
            },
            {
                style: "The Negative Warning",
                hook: `If you are still doing this, you are silently sabotaging your growth before you even start.`,
                explanation: "Loss aversion is 2x more psychologically compelling than gain motivation."
            },
            {
                style: "The High-Stakes Challenge",
                hook: `I gave myself 48 hours to solve this problem with $0. Here is what happened.`,
                explanation: "Introduces narrative tension, time constraint, and high stakes."
            },
            {
                style: "The Shocking Statistic",
                hook: `Over 85% of people fail at this for one single reason. And it is not what you think.`,
                explanation: "Uses data authority paired with a surprise twist."
            }
        ];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAIEngine;
}
if (typeof window !== 'undefined') {
    window.GeminiAIEngine = GeminiAIEngine;
}
