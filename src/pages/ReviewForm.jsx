import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';
import { Button, Label } from '../components/ui';
import { ArrowLeft, Download } from 'lucide-react';

const RECOMMENDATIONS = [
    { value: 'accept', label: 'Accept' },
    { value: 'minor_revisions', label: 'Minor Revisions' },
    { value: 'major_revisions', label: 'Major Revisions' },
    { value: 'reject', label: 'Reject' },
];

export default function ReviewForm() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useAlert();

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [recommendation, setRecommendation] = useState('');
    const [commentsToAuthor, setCommentsToAuthor] = useState('');
    const [commentsToEditor, setCommentsToEditor] = useState('');

    useEffect(() => {
        fetchAssignment();
    }, [assignmentId]);

    const fetchAssignment = async () => {
        try {
            // Same blinded view as the dashboard — the manuscript's author is
            // never selected into this row, so there is nothing here to leak.
            const { data, error } = await supabase
                .from('manuscript_review_queue')
                .select('*')
                .eq('assignment_id', assignmentId)
                .single();

            if (error) throw error;
            setAssignment(data);
            setRecommendation(data.recommendation || '');
            setCommentsToAuthor(data.comments_to_author || '');
            setCommentsToEditor(data.comments_to_editor || '');
        } catch (err) {
            console.error('Error loading assignment:', err);
            setAssignment(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!assignment?.file_path) return;
        setDownloading(true);
        try {
            const { data: blob, error } = await supabase.storage
                .from('manuscripts')
                .download(assignment.file_path);
            if (error) throw error;

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            showError('Failed to download manuscript: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!recommendation) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('manuscript_reviewers')
                .update({
                    status: 'completed',
                    recommendation,
                    comments_to_author: commentsToAuthor,
                    comments_to_editor: commentsToEditor,
                    submitted_at: new Date().toISOString(),
                })
                .eq('id', assignmentId);
            if (error) throw error;

            success('Review submitted. Thank you.');
            navigate('/reviewer');
        } catch (err) {
            showError('Failed to submit review: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-ogene-500">Loading...</div>;
    if (!assignment) return <div className="p-20 text-center text-ogene-500">Assignment not found.</div>;

    const isCompleted = assignment.assignment_status === 'completed';
    const canDownload = ['accepted', 'completed'].includes(assignment.assignment_status);

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link to="/reviewer" className="inline-flex items-center gap-2 text-sm text-ogene-500 hover:text-ogene-900 mb-6">
                <ArrowLeft size={16} /> Back to Assignments
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                <h1 className="text-2xl font-serif font-bold text-ogene-900 mb-2">{assignment.title}</h1>
                <p className="text-sm text-ogene-500 mb-4">{assignment.category} · Round {assignment.round}</p>
                <p className="text-ogene-700 leading-relaxed whitespace-pre-line mb-4">{assignment.abstract}</p>

                {canDownload ? (
                    <Button variant="secondary" onClick={handleDownload} isLoading={downloading}>
                        <Download size={16} className="mr-2" /> Download Manuscript
                    </Button>
                ) : (
                    <p className="text-sm text-ogene-400">Accept this assignment to download the manuscript.</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 space-y-5">
                <h2 className="text-lg font-bold text-ogene-900">{isCompleted ? 'Your Review' : 'Submit Your Review'}</h2>

                <div>
                    <Label htmlFor="recommendation">Recommendation</Label>
                    <select
                        id="recommendation"
                        value={recommendation}
                        onChange={e => setRecommendation(e.target.value)}
                        disabled={isCompleted}
                        required
                        className="flex h-10 w-full rounded-md border border-ogene-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ogene-400 disabled:opacity-60"
                    >
                        <option value="" disabled>Select a recommendation...</option>
                        {RECOMMENDATIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>

                <div>
                    <Label htmlFor="comments_to_author">Comments to Author</Label>
                    <textarea
                        id="comments_to_author"
                        value={commentsToAuthor}
                        onChange={e => setCommentsToAuthor(e.target.value)}
                        disabled={isCompleted}
                        required
                        className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400 min-h-[160px] disabled:opacity-60"
                        placeholder="Feedback the author will see, attributed only as your reviewer number..."
                    />
                </div>

                <div>
                    <Label htmlFor="comments_to_editor">Confidential Comments to Editor (optional)</Label>
                    <textarea
                        id="comments_to_editor"
                        value={commentsToEditor}
                        onChange={e => setCommentsToEditor(e.target.value)}
                        disabled={isCompleted}
                        className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400 min-h-[100px] disabled:opacity-60"
                        placeholder="Never shown to the author..."
                    />
                </div>

                {!isCompleted && (
                    <Button type="submit" className="w-full" isLoading={submitting} disabled={!recommendation || !commentsToAuthor}>
                        Submit Review
                    </Button>
                )}
            </form>
        </div>
    );
}
