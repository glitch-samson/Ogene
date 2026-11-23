import { supabase } from './supabase';

/**
 * Loads an article PDF as an in-memory blob URL.
 *
 * Articles are open access but view-only: a signed URL is a shareable link
 * someone could copy from the network tab, whereas a blob URL is opaque,
 * per-tab and never leaves the page. This discourages downloading; it cannot
 * fully prevent a determined reader from saving what their browser displays.
 *
 * The caller owns the URL and must URL.revokeObjectURL() it when done.
 */
export async function loadArticlePdf(filePath) {
    const { data, error } = await supabase.storage.from('articles').download(filePath);
    if (error) throw error;
    return URL.createObjectURL(data);
}
