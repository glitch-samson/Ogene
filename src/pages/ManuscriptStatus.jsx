import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/ui';
import { ArrowLeft, Clock, MessageSquare, UploadCloud, ExternalLink } from 'lucide-react';
import { StatusBadge } from './MyManuscripts';

const EVENT_LABELS = {
    submitted: 'Manuscript submitted',
    desk_rejected: 'Desk rejected',
    under_review: 'Sent to review',
    revisions_requested: 'Revisions requested',
    resubmitted: 'Revised manuscript resubmitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
    published: 'Published',
    reviewer_assigned: 'Reviewer assigned',
    review_submitted: 'Reviewer submitted feedback',
};

export default function ManuscriptStatus() {
    const { id } = useParams();
    const { user } = useUserStore();
    const { success, error: showError } = useAlert();

    const [manuscript, setManuscript] = useState(null);
    const [events, setEvents] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchAll();
    }, [id]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [
                { data: m, error: mErr },
                { data: ev, error: evErr },
                { data: fb, error: fbErr },
                { data: fl, error: flErr },
            ] = await Promise.all([
                supabase.from('manuscripts').select('*').eq('id', id).single(),
                supabase.from('manuscript_events').select('*').eq('manuscript_id', id).order('created_at', { ascending: true }),
                supabase.from('manuscript_review_feedback').select('*').eq('manuscript_id', id).order('reviewer_number', { ascending: true }),
                supabase.from('manuscript_files').select('*').eq('manuscript_id', id),
            ]);

            if (mErr) throw mErr;
            setManuscript(m);
            if (!evErr) setEvents(ev || []);
            if (!fbErr) setFeedback(fb || []);
            if (!flErr) setFiles(fl || []);
        } catch (err) {
            console.error('Error loading manuscript:', err);
            setManuscript(null);
        } finally {
            setLoading(false);
        }
    };

    // Two distinct reasons this form can appear: the normal revision cycle, or
    // recovering a submission whose file upload failed after the manuscript
    // row was already created (see SubmitManuscript's catch block).
    const needsRevision = manuscript?.status === 'revisions_requested';
    const needsInitialFile = manuscript?.status === 'submitted' && files.length === 0;
    const showUploadForm = needsRevision || needsInitialFile;

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !manuscript) return;

        setUploading(true);
        try {
            const round = needsInitialFile ? manuscript.current_round : manuscript.current_round + 1;
            const fileExt = file.name.split('.').pop();
            const filePath = `${manuscript.id}/round-${round}/manuscript.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('manuscripts')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { error: fileRowError } = await supabase
                .from('manuscript_files')
                .insert([{
                    manuscript_id: manuscript.id,
                    round,
                    file_type: 'manuscript',
                    file_path: filePath,
                    uploaded_by: user.id,
                }]);
            if (fileRowError) throw fileRowError;

            if (needsRevision) {
                const { error: statusError } = await supabase
                    .from('manuscripts')
                    .update({ status: 'resubmitted' })
                    .eq('id', manuscript.id);
                if (statusError) throw statusError;
            }

            success(needsRevision ? 'Revised manuscript submitted.' : 'Manuscript file attached.');
            setFile(null);
            fetchAll();
        } catch (err) {
            console.error('Upload failed:', err);
            showError('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-ogene-500">Loading...</div>;
    if (!manuscript) return <div className="p-20 text-center text-ogene-500">Manuscript not found.</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link to="/manuscripts" className="inline-flex items-center gap-2 text-sm text-ogene-500 hover:text-ogene-900 mb-6">
                <ArrowLeft size={16} /> Back to My Manuscripts
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-serif font-bold text-ogene-900">{manuscript.title}</h1>
                    <StatusBadge status={manuscript.status} />
                </div>
                <p className="text-sm text-ogene-500 mb-4">{manuscript.category} · Round {manuscript.current_round}</p>
                <p className="text-ogene-700 leading-relaxed whitespace-pre-line">{manuscript.abstract}</p>

                {manuscript.status === 'published' && manuscript.published_article_id && (
                    <Link
                        to={`/article/${manuscript.published_article_id}`}
                        className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-ogene-900 hover:underline"
                    >
                        <ExternalLink size={16} /> View Published Article
                    </Link>
                )}
            </div>

            {showUploadForm && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-bold text-orange-900 mb-2 flex items-center gap-2">
                        <UploadCloud size={20} />
                        {needsRevision ? 'Revisions Requested' : 'Manuscript File Missing'}
                    </h2>
                    <p className="text-sm text-orange-800 mb-4">
                        {needsRevision
                            ? 'Review the feedback below, then upload your revised manuscript.'
                            : 'Your submission was recorded but the file never attached. Upload it to complete your submission.'}
                    </p>
                    <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={e => setFile(e.target.files[0])}
                            required
                            className="flex-1 block w-full text-sm text-ogene-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-ogene-700"
                        />
                        <Button type="submit" isLoading={uploading} disabled={!file}>
                            {needsRevision ? 'Submit Revision' : 'Attach File'}
                        </Button>
                    </form>
                </div>
            )}

            {feedback.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                    <h2 className="text-lg font-bold text-ogene-900 mb-4 flex items-center gap-2">
                        <MessageSquare size={20} /> Reviewer Feedback
                    </h2>
                    <div className="space-y-4">
                        {feedback.map((f) => (
                            <div key={`${f.reviewer_number}-${f.round}`} className="p-4 bg-ogene-50 rounded-lg border border-ogene-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-ogene-900">Reviewer {f.reviewer_number} · Round {f.round}</span>
                                    <span className="text-xs font-medium text-ogene-500 uppercase">{f.recommendation?.replace(/_/g, ' ')}</span>
                                </div>
                                <p className="text-sm text-ogene-700 whitespace-pre-line">{f.comments_to_author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6">
                <h2 className="text-lg font-bold text-ogene-900 mb-4 flex items-center gap-2">
                    <Clock size={20} /> Timeline
                </h2>
                <ol className="space-y-4">
                    {events.map((ev) => (
                        <li key={ev.id} className="flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-ogene-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-ogene-900">{EVENT_LABELS[ev.event_type] || ev.event_type}</p>
                                <p className="text-xs text-ogene-400">{new Date(ev.created_at).toLocaleString()}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
