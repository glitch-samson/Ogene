import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowLeft } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF Worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export default function ReadArticle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [article, setArticle] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchArticleAndVerifyAccess();
    }, [id, user]);

    const fetchArticleAndVerifyAccess = async () => {
        try {
            setLoading(true);

            // 1. Fetch Article Metadata
            const { data: art, error: artError } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();

            if (artError) throw artError;
            setArticle(art);

            // 2. Verify Access (Auth Only for Reading)
            // if (!user) return; // Handled by useEffect

            // 3. Get Signed URL for the PDF
            if (art.file_path) {
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('articles')
                    .createSignedUrl(art.file_path, 3600); // 1 hour access

                if (signedError) throw signedError;
                setPdfUrl(signedData.signedUrl);
            }

        } catch (error) {
            console.error("Error loading article:", error);
            alert("Failed to load article.");
        } finally {
            setLoading(false);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-ogene-500">Loading Reader...</div>;
    if (!article || !pdfUrl) return <div className="h-screen flex items-center justify-center text-ogene-500">Document not found or invalid format.</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Reader Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-serif font-bold text-gray-900 truncate max-w-xs md:max-w-md">{article.title}</h1>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                        disabled={pageNumber <= 1}
                        className="p-1 hover:bg-white rounded disabled:opacity-50"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium w-16 text-center">
                        {pageNumber} / {numPages || '--'}
                    </span>
                    <button
                        onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                        disabled={pageNumber >= numPages}
                        className="p-1 hover:bg-white rounded disabled:opacity-50"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-sm font-medium w-12 text-center hidden md:block">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(s + 0.1, 2.0))} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                        <ZoomIn size={20} />
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="flex-1 overflow-auto flex justify-center p-8">
                <div className="shadow-lg">
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="p-10 text-center bg-white">Loading PDF...</div>}
                        error={<div className="p-10 text-center bg-white text-red-500">Failed to load PDF file.</div>}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className="bg-white"
                        />
                    </Document>
                </div>
            </div>
        </div>
    );
}
