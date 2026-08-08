const sanitizeHtml = require('sanitize-html');

const SiteSettings = require('../models/SiteSettings');
const Service = require('../models/Service');
const ResearchRun = require('../models/ResearchRun');
const Prospect = require('../models/Prospect');
const Draft = require('../models/Draft');
const { searchMany } = require('./newsSearch');
const { groqChat } = require('./groqClient');

const DEFAULT_QUERIES = [
    'Equatorial Guinea oil gas',
    'Malabo offshore project',
    'Equatorial Guinea LNG',
    'Punta Europa refinery',
    'Equatorial Guinea drilling contract',
    'Equatorial Guinea energy investment',
    'Bioko oil gas'
];

function cleanText(str) {
    return sanitizeHtml(str || '', { allowedTags: [], allowedAttributes: {} }).trim();
}

async function buildServiceContext() {
    const services = await Service.find({ active: true }).sort('order').lean();
    return services.map((s) => `- [${s.slug}] ${s.title}: ${s.shortDescription}`).join('\n');
}

async function identifyProspects(articles, serviceContext) {
    if (!articles.length) return [];

    const articleList = articles
        .map((a, i) => `${i}. "${a.title}" (source: ${a.source || 'unknown'}, link: ${a.link})`)
        .join('\n');

    const systemPrompt = `You are a business-development research analyst for BerCom Services, ` +
        `an indigenous oil & gas support company based in Malabo, Equatorial Guinea. BerCom's ` +
        `services are:\n${serviceContext}\n\n` +
        `Given a list of recent Google News headlines, identify which mentioned companies or ` +
        `projects (operating in or related to Equatorial Guinea's oil & gas / energy sector) look ` +
        `like plausible customers for one or more of BerCom's services. Be conservative — most ` +
        `headlines will NOT be relevant, and it's fine to return an empty list. Only include a ` +
        `company if there's a real, specific reason from the headline (a new project, contract, ` +
        `platform, investment, or operational need in the region).\n\n` +
        `Respond with strict JSON: {"prospects": [{"companyName": string, "summary": string, ` +
        `"matchedServices": [service-slug,...], "confidenceScore": number (0-1), "reasoning": ` +
        `string, "articleIndexes": [number,...] (at most the 5 MOST relevant headline indexes ` +
        `that directly support this prospect, not every tangentially related one)}]}`;

    const raw = await groqChat(
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Headlines:\n${articleList}` }
        ],
        { jsonMode: true, temperature: 0.3 }
    );

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.prospects) ? parsed.prospects : [];
    } catch (err) {
        console.error('[ragAgent] failed to parse prospect JSON:', err.message);
        return [];
    }
}

async function draftProposal(prospect, serviceContext, settings) {
    const systemPrompt = `You are a business-development assistant for BerCom Services (Malabo, ` +
        `Equatorial Guinea). BerCom's services:\n${serviceContext}\n\n` +
        `Draft a short, specific, professional outreach email (120-180 words) to the company ` +
        `below, referencing the news context and the BerCom service(s) that fit. Sign off as ` +
        `"The BerCom Services Team" with contact email ${settings.email} and phone ${settings.phone}. ` +
        `This is a DRAFT for internal review only — never claim it has already been sent.\n\n` +
        `Respond with strict JSON: {"subject": string, "body": string}`;

    const userPrompt = `Company: ${prospect.companyName}\nWhy they're a fit: ${prospect.summary}\n` +
        `Matched services: ${(prospect.matchedServices || []).join(', ')}`;

    const raw = await groqChat(
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        { jsonMode: true, temperature: 0.5 }
    );

    try {
        const parsed = JSON.parse(raw);
        return {
            subject: cleanText(parsed.subject) || `Partnering with BerCom Services — ${prospect.companyName}`,
            body: cleanText(parsed.body)
        };
    } catch (err) {
        console.error('[ragAgent] failed to parse draft JSON:', err.message);
        return {
            subject: `Partnering with BerCom Services — ${prospect.companyName}`,
            body: ''
        };
    }
}

/**
 * Runs one full research pass: Google News search -> Groq prospect identification ->
 * Groq proposal drafting -> saves Prospect + Draft docs with status "pending_review".
 * Never sends anything — output only ever lands in the admin review queue.
 */
async function runResearch({ trigger = 'manual' } = {}) {
    const settings = await SiteSettings.getSingleton();
    const queries = (settings.research?.queries?.length ? settings.research.queries : DEFAULT_QUERIES);
    const threshold = settings.research?.confidenceThreshold ?? 0.55;

    const run = await ResearchRun.create({ queries, trigger, status: 'running' });

    try {
        const articles = await searchMany(queries);
        const serviceContext = await buildServiceContext();
        const candidates = await identifyProspects(articles, serviceContext);

        let created = 0;
        for (const candidate of candidates) {
            if (!candidate.companyName) continue;

            const sourceArticles = (candidate.articleIndexes || [])
                .slice(0, 5)
                .map((i) => articles[i])
                .filter(Boolean)
                .map((a) => ({ title: a.title, link: a.link, source: a.source, publishedAt: a.publishedAt }));

            const prospect = await Prospect.create({
                companyName: cleanText(candidate.companyName),
                summary: cleanText(candidate.summary),
                reasoning: cleanText(candidate.reasoning),
                matchedServices: candidate.matchedServices || [],
                confidenceScore: Math.max(0, Math.min(1, candidate.confidenceScore || 0)),
                sourceArticles,
                researchRunId: run._id
            });
            created += 1;

            if (prospect.confidenceScore >= threshold) {
                const draft = await draftProposal(prospect, serviceContext, settings);
                await Draft.create({
                    prospectId: prospect._id,
                    type: 'email',
                    subject: draft.subject,
                    body: draft.body
                });
            }
        }

        run.articlesFound = articles.length;
        run.prospectsCreated = created;
        run.status = 'completed';
        await run.save();

        return run;
    } catch (err) {
        run.status = 'failed';
        run.error = err.message;
        await run.save();
        throw err;
    }
}

module.exports = { runResearch, DEFAULT_QUERIES };
