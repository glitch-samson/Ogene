import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/ui';
import { ArrowLeft, Clock, UserPlus, Send, ArrowRightLeft, Stamp, Download, FileText } from 'lucide-react';
import { StatusBadge } from './MyManuscripts';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const EVENT_LABELS = {
    submitted: 'Manuscript submitted',
    desk_rejected: 'Desk rejected',
    under_review: 'Sent to review',
    revisions_requested: 'Revisions requested',
    resubmitted: 'Revised manuscript resubmitted',
    accepted: 'Accepted',
    in_production: 'Entered production editing',
    ready_for_final_approval: 'Production complete — awaiting chief editor',
    rejected: 'Rejected',
    published: 'Published',
    reviewer_assigned: 'Reviewer assigned',
    review_submitted: 'Reviewer submitted feedback',
    production_task_assigned: 'Production task assigned',
    production_task_redirected: 'Production task redirected for input',
    production_task_returned: 'Production task returned with notes',
};

const ASSIGNMENT_STATUS_LABELS = {
    invited: 'Invited',
    accepted: 'Accepted',
    declined: 'Declined',
    completed: 'Completed',
};

export default function ManuscriptEditorView() {
    const { id } = useParams();
    const { user, profile } = useUserStore();
    const { success, error: showError, confirm } = useAlert();

    const isChief = profile?.role === 'chief_editor' || profile?.role === 'admin';

    const [manuscript, setManuscript] = useState(null);
    const [events, setEvents] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [reviewerPool, setReviewerPool] = useState([]);
    const [editorPool, setEditorPool] = useState([]);
    const [productionTasks, setProductionTasks] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [downloadingFileId, setDownloadingFileId] = useState(null);

    // Send-to-review form (chief editor)
    const [reviewer1, setReviewer1] = useState('');
    const [reviewer2, setReviewer2] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Accept-to-production form (chief editor)
    const [firstEditor, setFirstEditor] = useState('');

    // Production task action form (whoever holds the open task)
    const [prodComments, setProdComments] = useState('');
    const [prodTarget, setProdTarget] = useState('');

    useEffect(() => {
        fetchAll();
    }, [id]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [
                { data: m, error: mErr },
                { data: ev, error: evErr },
                { data: rv, error: rvErr },
                { data: reviewerRows, error: reviewerPoolErr },
                { data: editorRows, error: editorPoolErr },
                { data: tasks, error: tasksErr },
                { data: fileRows, error: filesErr },
            ] = await Promise.all([
                supabase.from('manuscripts').select('*, author:profiles(full_name)').eq('id', id).single(),
                supabase.from('manuscript_events').select('*').eq('manuscript_id', id).order('created_at', { ascending: true }),
                supabase.from('manuscript_reviewers').select('*, reviewer:profiles!reviewer_id(full_name)').eq('manuscript_id', id).order('assigned_at', { ascending: true }),
                supabase.from('profiles').select('id, full_name').eq('role', 'reviewer'),
                supabase.from('profiles').select('id, full_name').eq('role', 'editor'),
                supabase.from('manuscript_production_tasks').select('*, holder:profiles!assigned_to(full_name), assigner:profiles!assigned_by(full_name)').eq('manuscript_id', id).order('created_at', { ascending: true }),
                supabase.from('manuscript_files').select('*').eq('manuscript_id', id).order('round', { ascending: false }).order('created_at', { ascending: false }),
            ]);

            if (mErr) throw mErr;
            setManuscript(m);
            if (!evErr) setEvents(ev || []);
            if (!rvErr) setReviewers(rv || []);
            if (!reviewerPoolErr) setReviewerPool(reviewerRows || []);
            if (!editorPoolErr) setEditorPool(editorRows || []);
            if (!tasksErr) setProductionTasks(tasks || []);
            if (!filesErr) setFiles(fileRows || []);
        } catch (err) {
            console.error('Error loading manuscript:', err);
            setManuscript(null);
        } finally {
            setLoading(false);
        }
    };

    const runAction = async (fn, successMessage) => {
        setBusy(true);
        try {
            await fn();
            if (successMessage) success(successMessage);
            fetchAll();
        } catch (err) {
            console.error('Editor action failed:', err);
            showError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleDeskReject = () => {
        confirm('Desk reject this manuscript without sending it to review?', () => {
            runAction(async () => {
                const { error } = await supabase
                    .from('manuscripts')
                    .update({ status: 'desk_rejected' })
                    .eq('id', manuscript.id);
                if (error) throw error;
            }, 'Manuscript desk rejected.');
        }, 'Desk Reject');
    };

    const handleSendToReview = (e) => {
        e.preventDefault();
        if (!reviewer1 || !reviewer2) return;

        runAction(async () => {
            const isResubmission = manuscript.status === 'resubmitted';
            const nextRound = isResubmission ? manuscript.current_round + 1 : manuscript.current_round;

            const { error: statusError } = await supabase
                .from('manuscripts')
                .update(isResubmission
                    ? { status: 'under_review', current_round: nextRound }
                    : { status: 'under_review' })
                .eq('id', manuscript.id);
            if (statusError) throw statusError;

            const { error: reviewersError } = await supabase
                .from('manuscript_reviewers')
                .insert([
                    { manuscript_id: manuscript.id, reviewer_id: reviewer1, round: nextRound, sequence: 1, assigned_by: user.id, due_date: dueDate || null },
                    { manuscript_id: manuscript.id, reviewer_id: reviewer2, round: nextRound, sequence: 2, assigned_by: user.id, due_date: dueDate || null },
                ]);
            if (reviewersError) throw reviewersError;
        }, 'Manuscript sent to review.');
        setReviewer1('');
        setReviewer2('');
        setDueDate('');
    };

    const assignReplacement = (sequence, reviewerId) => {
        if (!reviewerId) return;
        runAction(async () => {
            const { error } = await supabase
                .from('manuscript_reviewers')
                .insert([{
                    manuscript_id: manuscript.id,
                    reviewer_id: reviewerId,
                    round: manuscript.current_round,
                    sequence,
                    assigned_by: user.id,
                }]);
            if (error) throw error;
        }, 'Replacement reviewer assigned.');
    };

    const handleReviewDecision = (newStatus, label) => {
        confirm(`Mark this manuscript as "${label}"?`, () => {
            runAction(async () => {
                const { error } = await supabase
                    .from('manuscripts')
                    .update({ status: newStatus })
                    .eq('id', manuscript.id);
                if (error) throw error;
            }, `Manuscript marked as ${label.toLowerCase()}.`);
        }, 'Record Decision');
    };

    const handleAcceptToProduction = (e) => {
        e.preventDefault();
        if (!firstEditor) return;

        runAction(async () => {
            const { error: statusError } = await supabase
                .from('manuscripts')
                .update({ status: 'in_production' })
                .eq('id', manuscript.id);
            if (statusError) throw statusError;

            const { error: taskError } = await supabase
                .from('manuscript_production_tasks')
                .insert([{
                    manuscript_id: manuscript.id,
                    assigned_to: firstEditor,
                    assigned_by: user.id,
                }]);
            if (taskError) throw taskError;
        }, 'Manuscript accepted and entered production.');
        setFirstEditor('');
    };

    const handleProductionForward = (task) => {
        if (!prodTarget) return;
        runAction(async () => {
            const { error: closeError } = await supabase
                .from('manuscript_production_tasks')
                .update({ status: 'completed', comments: prodComments, completed_at: new Date().toISOString() })
                .eq('id', task.id);
            if (closeError) throw closeError;

            const { error: newTaskError } = await supabase
                .from('manuscript_production_tasks')
                .insert([{ manuscript_id: manuscript.id, assigned_to: prodTarget, assigned_by: user.id }]);
            if (newTaskError) throw newTaskError;
        }, 'Forwarded to next editor.');
        setProdComments('');
        setProdTarget('');
    };

    const handleProductionRedirect = (task) => {
        if (!prodTarget) return;
        runAction(async () => {
            const { error: pauseError } = await supabase
                .from('manuscript_production_tasks')
                .update({ status: 'redirected' })
                .eq('id', task.id);
            if (pauseError) throw pauseError;

            const { error: childError } = await supabase
                .from('manuscript_production_tasks')
                .insert([{ manuscript_id: manuscript.id, assigned_to: prodTarget, assigned_by: user.id, parent_task_id: task.id }]);
            if (childError) throw childError;
        }, 'Redirected for input — it will return to you once they finish.');
        setProdTarget('');
    };

    const handleProductionFinal = (task) => {
        confirm('Send this manuscript to the chief editor for final approval?', () => {
            runAction(async () => {
                const { error: closeError } = await supabase
                    .from('manuscript_production_tasks')
                    .update({ status: 'completed', comments: prodComments, completed_at: new Date().toISOString() })
                    .eq('id', task.id);
                if (closeError) throw closeError;

                const { error: statusError } = await supabase
                    .from('manuscripts')
                    .update({ status: 'ready_for_final_approval' })
                    .eq('id', manuscript.id);
                if (statusError) throw statusError;
            }, 'Sent to chief editor for final approval.');
            setProdComments('');
        }, 'Send for Final Approval');
    };

    const handleViewFile = async (file) => {
        setDownloadingFileId(file.id);
        try {
            const { data: blob, error } = await supabase.storage
                .from('manuscripts')
                .download(file.file_path);
            if (error) throw error;
            window.open(URL.createObjectURL(blob), '_blank');
        } catch (err) {
            showError('Failed to open file: ' + err.message);
        } finally {
            setDownloadingFileId(null);
        }
    };

    const handlePublish = () => {
        confirm('Publish this manuscript as a watermarked, view-only open-access article?', () => {
            runAction(async () => {
                const { data: latestFile, error: fileErr } = await supabase
                    .from('manuscript_files')
                    .select('*')
                    .eq('manuscript_id', manuscript.id)
                    .eq('round', manuscript.current_round)
                    .eq('file_type', 'manuscript')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (fileErr) throw fileErr;

                const ext = latestFile.file_path.split('.').pop().toLowerCase();
                if (ext !== 'pdf') {
                    throw new Error('The final file must be a PDF to publish — watermarking only supports PDF. Ask production to upload a PDF version.');
                }

                const { data: blob, error: downloadError } = await supabase.storage
                    .from('manuscripts')
                    .download(latestFile.file_path);
                if (downloadError) throw downloadError;

                const bytes = await blob.arrayBuffer();
                const pdfDoc = await PDFDocument.load(bytes);
                const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                const watermarkText = 'OGENE JOURNAL — PUBLISHED';

                for (const page of pdfDoc.getPages()) {
                    const { width, height } = page.getSize();
                    page.drawText(watermarkText, {
                        x: width / 2 - 220,
                        y: height / 2,
                        size: 28,
                        font,
                        color: rgb(0.55, 0.55, 0.55),
                        opacity: 0.35,
                        rotate: degrees(45),
                    });
                }

                const watermarkedBytes = await pdfDoc.save();
                const watermarkedBlob = new Blob([watermarkedBytes], { type: 'application/pdf' });

                const newPath = `${Math.random()}.pdf`;
                const { error: uploadError } = await supabase.storage
                    .from('articles')
                    .upload(newPath, watermarkedBlob);
                if (uploadError) throw uploadError;

                const { data: article, error: articleError } = await supabase
                    .from('articles')
                    .insert([{
                        title: manuscript.title,
                        description: manuscript.abstract,
                        author_id: manuscript.submitting_author_id,
                        author_name: manuscript.author?.full_name || 'Unknown',
                        category: manuscript.category,
                        file_path: newPath,
                        cover_image: manuscript.cover_image || null,
                        is_public: true,
                        manuscript_id: manuscript.id,
                    }])
                    .select()
                    .single();
                if (articleError) throw articleError;

                const { error: updateError } = await supabase
                    .from('manuscripts')
                    .update({ status: 'published', published_article_id: article.id })
                    .eq('id', manuscript.id);
                if (updateError) throw updateError;

                // TODO (Phase 8): send the author a publish notification email
                // via Resend once that's wired up — not yet configured.
            }, 'Manuscript published.');
        }, 'Publish Manuscript');
    };

    if (loading) return <div className="p-20 text-center text-ogene-500">Loading...</div>;
    if (!manuscript) return <div className="p-20 text-center text-ogene-500">Manuscript not found.</div>;

    const currentRoundReviewers = reviewers.filter(r => r.round === manuscript.current_round);
    const reviewersBySequence = [1, 2].map(seq => {
        const rows = currentRoundReviewers.filter(r => r.sequence === seq);
        return rows[rows.length - 1] || null; // latest attempt for that slot
    });

    const myOpenTask = productionTasks.find(t => t.assigned_to === user.id && t.status === 'open');
    const availableEditorTargets = (targetTask) => editorPool.filter(e => e.id !== targetTask?.assigned_to);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link to="/editor" className="inline-flex items-center gap-2 text-sm text-ogene-500 hover:text-ogene-900 mb-6">
                <ArrowLeft size={16} /> Back to Editorial Queue
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-serif font-bold text-ogene-900">{manuscript.title}</h1>
                    <StatusBadge status={manuscript.status} />
                </div>
                <p className="text-sm text-ogene-500 mb-4">
                    By {manuscript.author?.full_name || 'Unknown'} · {manuscript.category} · Round {manuscript.current_round}
                </p>
                <p className="text-ogene-700 leading-relaxed whitespace-pre-line mb-4">{manuscript.abstract}</p>
                {manuscript.cover_letter && (
                    <div className="mt-4 pt-4 border-t border-ogene-100">
                        <p className="text-xs font-semibold text-ogene-400 uppercase mb-1">Cover Letter</p>
                        <p className="text-sm text-ogene-600 whitespace-pre-line">{manuscript.cover_letter}</p>
                    </div>
                )}
            </div>

            {/* Manuscript file(s) — every editorial decision below should be made
                having actually read the document, not just its metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                <h2 className="text-lg font-bold text-ogene-900 mb-4 flex items-center gap-2">
                    <FileText size={20} /> Manuscript File
                </h2>
                {files.length === 0 ? (
                    <p className="text-sm text-ogene-500">No file has been uploaded yet.</p>
                ) : (
                    <div className="space-y-2">
                        {files.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 bg-ogene-50 rounded-lg border border-ogene-100">
                                <div className="text-sm">
                                    <span className="font-semibold text-ogene-900">Round {f.round}</span>
                                    <span className="text-ogene-400"> · {f.file_type === 'response_to_reviewers' ? 'Response to Reviewers' : 'Manuscript'} · {new Date(f.created_at).toLocaleDateString()}</span>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => handleViewFile(f)} isLoading={downloadingFileId === f.id}>
                                    <Download size={14} className="mr-2" /> View
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chief-editor-only gates */}
            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                <h2 className="text-lg font-bold text-ogene-900 mb-4">Editorial Actions</h2>

                {!isChief && ['submitted', 'resubmitted', 'under_review', 'ready_for_final_approval'].includes(manuscript.status) && (
                    <p className="text-sm text-ogene-500">This stage requires the chief editor.</p>
                )}

                {isChief && (manuscript.status === 'submitted' || manuscript.status === 'resubmitted') && (
                    <form onSubmit={handleSendToReview} className="space-y-3">
                        <p className="text-sm text-ogene-600 mb-2">Assign a two-reviewer chain — reviewer 2 only sees the manuscript once reviewer 1 finishes.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select value={reviewer1} onChange={e => setReviewer1(e.target.value)} required className="h-10 rounded-md border border-ogene-300 bg-white px-3 text-sm">
                                <option value="">Reviewer 1...</option>
                                {reviewerPool.map(r => <option key={r.id} value={r.id}>{r.full_name || r.id}</option>)}
                            </select>
                            <select value={reviewer2} onChange={e => setReviewer2(e.target.value)} required className="h-10 rounded-md border border-ogene-300 bg-white px-3 text-sm">
                                <option value="">Reviewer 2...</option>
                                {reviewerPool.map(r => <option key={r.id} value={r.id}>{r.full_name || r.id}</option>)}
                            </select>
                        </div>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-10 rounded-md border border-ogene-300 bg-white px-3 text-sm" />
                        <div className="flex gap-3">
                            <Button type="submit" isLoading={busy} disabled={!reviewer1 || !reviewer2}>
                                <Send size={16} className="mr-2" /> Send to Review
                            </Button>
                            {manuscript.status === 'submitted' && (
                                <Button type="button" variant="secondary" onClick={handleDeskReject} isLoading={busy}>Desk Reject</Button>
                            )}
                        </div>
                    </form>
                )}

                {isChief && manuscript.status === 'under_review' && (
                    <div className="flex flex-wrap gap-3">
                        <form onSubmit={handleAcceptToProduction} className="flex flex-wrap items-center gap-3">
                            <select value={firstEditor} onChange={e => setFirstEditor(e.target.value)} className="h-10 rounded-md border border-ogene-300 bg-white px-3 text-sm">
                                <option value="">First production editor...</option>
                                {editorPool.map(e => <option key={e.id} value={e.id}>{e.full_name || e.id}</option>)}
                            </select>
                            <Button type="submit" isLoading={busy} disabled={!firstEditor}>Accept &amp; Start Production</Button>
                        </form>
                        <Button variant="secondary" onClick={() => handleReviewDecision('revisions_requested', 'Revisions Requested')} isLoading={busy}>Request Revisions</Button>
                        <Button variant="danger" onClick={() => handleReviewDecision('rejected', 'Rejected')} isLoading={busy}>Reject</Button>
                    </div>
                )}

                {isChief && manuscript.status === 'ready_for_final_approval' && (
                    <Button onClick={handlePublish} isLoading={busy}>
                        <Stamp size={16} className="mr-2" /> Give Final Stamp &amp; Publish
                    </Button>
                )}

                {manuscript.status === 'revisions_requested' && (
                    <p className="text-sm text-ogene-500">Waiting on the author to resubmit a revised manuscript.</p>
                )}

                {manuscript.status === 'in_production' && !myOpenTask && (
                    <p className="text-sm text-ogene-500">In production editing — currently with {productionTasks.find(t => t.status === 'open')?.holder?.full_name || 'another editor'}.</p>
                )}

                {['desk_rejected', 'rejected', 'published'].includes(manuscript.status) && (
                    <p className="text-sm text-ogene-500">This manuscript's editorial process is complete.</p>
                )}
            </div>

            {/* Reviewer chain for this round (chief editor only — RLS hides this table from regular editors entirely) */}
            {isChief && reviewersBySequence.some(Boolean) && (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                    <h2 className="text-lg font-bold text-ogene-900 mb-4">Reviewers — Round {manuscript.current_round}</h2>
                    <div className="space-y-4">
                        {reviewersBySequence.map((r, idx) => r && (
                            <div key={r.id} className="p-4 bg-ogene-50 rounded-lg border border-ogene-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-ogene-900">Reviewer {idx + 1}: {r.reviewer?.full_name || 'Reviewer'}</span>
                                    <span className="text-xs font-medium text-ogene-500 uppercase">{ASSIGNMENT_STATUS_LABELS[r.status]}</span>
                                </div>
                                {r.status === 'completed' && (
                                    <>
                                        <p className="text-xs font-semibold text-ogene-400 uppercase mt-2">Recommendation: {r.recommendation?.replace(/_/g, ' ')}</p>
                                        <p className="text-sm text-ogene-700 mt-1 whitespace-pre-line">{r.comments_to_author}</p>
                                        {r.comments_to_editor && (
                                            <p className="text-sm text-ogene-500 mt-2 italic whitespace-pre-line">Confidential note to editor: {r.comments_to_editor}</p>
                                        )}
                                    </>
                                )}
                                {r.status === 'declined' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <select
                                            className="h-9 rounded-md border border-ogene-300 bg-white px-2 text-sm"
                                            defaultValue=""
                                            onChange={e => assignReplacement(r.sequence, e.target.value)}
                                        >
                                            <option value="" disabled>Assign replacement...</option>
                                            {reviewerPool.filter(rp => rp.id !== r.reviewer_id).map(rp => (
                                                <option key={rp.id} value={rp.id}>{rp.full_name || rp.id}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Production task relay */}
            {productionTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 mb-8">
                    <h2 className="text-lg font-bold text-ogene-900 mb-4 flex items-center gap-2">
                        <ArrowRightLeft size={20} /> Production Relay
                    </h2>
                    <div className="space-y-3 mb-4">
                        {productionTasks.map(t => (
                            <div key={t.id} className="p-3 bg-ogene-50 rounded-lg border border-ogene-100 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-ogene-900">
                                        {t.parent_task_id && '↳ '}{t.holder?.full_name || 'Editor'}
                                        <span className="text-ogene-400 font-normal"> — assigned by {t.assigner?.full_name || 'Editor'}</span>
                                    </span>
                                    <span className="text-xs font-medium text-ogene-500 uppercase">{t.status}</span>
                                </div>
                                {t.comments && <p className="text-ogene-600 mt-1 whitespace-pre-line">{t.comments}</p>}
                            </div>
                        ))}
                    </div>

                    {myOpenTask && (
                        <div className="pt-4 border-t border-ogene-100 space-y-3">
                            <p className="text-sm font-semibold text-ogene-900">This is your task — what would you like to do?</p>
                            <textarea
                                value={prodComments}
                                onChange={e => setProdComments(e.target.value)}
                                placeholder="Notes to hand off with this manuscript..."
                                className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ogene-400"
                            />
                            <div className="flex flex-wrap items-center gap-3">
                                <select value={prodTarget} onChange={e => setProdTarget(e.target.value)} className="h-10 rounded-md border border-ogene-300 bg-white px-3 text-sm">
                                    <option value="">Select an editor...</option>
                                    {availableEditorTargets(myOpenTask).map(e => <option key={e.id} value={e.id}>{e.full_name || e.id}</option>)}
                                </select>
                                <Button variant="secondary" onClick={() => handleProductionForward(myOpenTask)} isLoading={busy} disabled={!prodTarget}>
                                    Forward
                                </Button>
                                <Button variant="secondary" onClick={() => handleProductionRedirect(myOpenTask)} isLoading={busy} disabled={!prodTarget}>
                                    Redirect (returns to me)
                                </Button>
                                <Button onClick={() => handleProductionFinal(myOpenTask)} isLoading={busy}>
                                    Send for Final Approval
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline */}
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
