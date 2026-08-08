const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Minimal Groq chat-completions wrapper (OpenAI-compatible schema), no SDK dependency.
 * @param {Array<{role:string,content:string}>} messages
 * @param {{ jsonMode?: boolean, temperature?: number }} opts
 */
async function groqChat(messages, opts = {}) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in .env');
    }

    const body = {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: opts.temperature ?? 0.4
    };
    if (opts.jsonMode) {
        body.response_format = { type: 'json_object' };
    }

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Groq API error ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
}

module.exports = { groqChat };
