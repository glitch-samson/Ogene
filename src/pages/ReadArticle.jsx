import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadArticlePdf } from '../lib/articlePdf';
import PdfViewer from '../components/reader/PdfViewer';

// Full-screen, open-access reader. View-only: see loadArticlePdf().
export default function ReadArticle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let cancelled = false;
        let objectUrl = null;

        (async () => {
            try {
                const { data: art, error } = await supabase
                    .from('articles')
                    .select('id, title, file_path')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                if (cancelled) return;
                setArticle(art);
                if (!art.file_path) {
                    setStatus('missing');
                    return;
                }
                objectUrl = await loadArticlePdf(art.file_path);
                if (cancelled) {
                    URL.revokeObjectURL(objectUrl);
                    return;
                }
                setPdfUrl(objectUrl);
                setStatus('ready');
            } catch (err) {
                console.error('Error loading article:', err);
                if (!cancelled) setStatus('error');
            }
        })();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return (
        <div className="flex min-h-screen flex-col bg-ogene-100">
            <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-ogene-200 bg-white px-4 py-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="rounded-full p-2 text-ogene-600 hover:bg-ogene-100" aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="truncate font-serif font-bold text-ogene-900">{article?.title || 'Loading…'}</h1>
                {article && (
                    <Link to={`/article/${article.id}`} className="ml-auto shrink-0 text-sm font-medium text-navy-700 hover:underline">
                        Article details
                    </Link>
                )}
            </div>

            <div className="flex-1 p-3 md:p-6">
                {status === 'loading' && <p className="p-10 text-center text-ogene-500">Loading reader…</p>}
                {status === 'missing' && <p className="p-10 text-center text-ogene-500">This article has no PDF attached.</p>}
                {status === 'error' && <p className="p-10 text-center text-ogene-500">This article couldn't be loaded.</p>}
                {status === 'ready' && (
                    <PdfViewer
                        fileUrl={pdfUrl}
                        articleId={article.id}
                        showFullScreenLink={false}
                        heightClass="h-[calc(100vh-8rem)]"
                        className="mx-auto max-w-5xl"
                    />
                )}
            </div>
        </div>
    );
}
