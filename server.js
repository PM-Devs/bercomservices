require('dotenv').config();

const cron = require('node-cron');

const app = require('./app');
const connectDB = require('./config/db');
const SiteSettings = require('./models/SiteSettings');
const { runResearch } = require('./services/ragAgent');

const PORT = process.env.PORT || 3000;

// Local/persistent-server-only entry point. Sets up the research cron
// (needs a long-running process — not used on serverless deployments,
// see api/index.js + vercel.json's cron config for that) and starts
// listening. The shared app + routes live in app.js.
async function start() {
    await connectDB();

    const settings = await SiteSettings.getSingleton();
    if (settings.research?.autoRunEnabled && settings.research?.cronSchedule) {
        cron.schedule(settings.research.cronSchedule, () => {
            console.log('[research-cron] starting scheduled research run...');
            runResearch({ trigger: 'cron' }).catch((err) => {
                console.error('[research-cron] run failed:', err.message);
            });
        });
        console.log(`[research-cron] scheduled: "${settings.research.cronSchedule}"`);
    }

    app.listen(PORT, () => {
        console.log(`BerCom CMS running at http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
