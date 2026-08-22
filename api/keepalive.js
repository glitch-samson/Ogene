import { createClient } from '@supabase/supabase-js'

/**
 * Supabase keep-alive.
 *
 * Free-tier Supabase projects pause after ~7 days with no database activity,
 * and a paused project takes manual intervention to restore. Vercel Cron hits
 * this daily (see `crons` in vercel.json) to keep the clock reset.
 *
 * This runs a real query rather than just returning 200. Supabase counts
 * *database* activity, so pinging an HTTP endpoint that never touches Postgres
 * would keep the function warm and let the database pause anyway.
 *
 * Uses the service-role key so the query result never depends on RLS — an
 * empty table or a tightened policy would otherwise make the ping look
 * successful while proving nothing.
 */
export default async function handler(req, res) {
    // Vercel attaches `Authorization: Bearer $CRON_SECRET` to cron invocations
    // when CRON_SECRET is set. If it isn't set, the endpoint stays open — which
    // is harmless but means anyone can trigger the query.
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        return res.status(500).json({
            ok: false,
            error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (no VITE_ prefix).',
        })
    }

    const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })

    const startedAt = Date.now()

    try {
        // `head: true` fetches no rows — the round trip to Postgres is the point.
        const { error } = await supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })

        if (error) throw error

        return res.status(200).json({
            ok: true,
            pingedAt: new Date().toISOString(),
            durationMs: Date.now() - startedAt,
        })
    } catch (error) {
        // Return 500 so a failing ping shows up in the Vercel cron log as a
        // failure rather than silently "succeeding" while the project drifts
        // toward pausing.
        console.error('Supabase keep-alive failed:', error)
        return res.status(500).json({
            ok: false,
            error: error.message ?? String(error),
            pingedAt: new Date().toISOString(),
        })
    }
}
