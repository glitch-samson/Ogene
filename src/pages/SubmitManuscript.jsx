import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { Button, Input, Label } from '../components/ui';
import { Upload } from 'lucide-react';

const CATEGORIES = [
    'Engineering & Applied Sciences',
    'Medicine & Health Sciences',
    'Social Sciences',
    'Humanities',
    'Natural Sciences',
    'Other',
];

export default function SubmitManuscript() {
    const { user } = useUserStore();
    const { success, error: showError } = useAlert();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [keywords, setKeywords] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [file, setFile] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [anonymized, setAnonymized] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = title && abstract && file && anonymized && !submitting;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        let manuscriptId = null;
        try {
            // Uploaded before the manuscript row so its public URL can go
            // straight into the insert — cover_image isn't in the column
            // grant for later client updates, so it has to be set here.
            let coverImageUrl = null;
            if (coverImage) {
                const coverExt = coverImage.name.split('.').pop();
                const coverPath = `${Math.random()}.${coverExt}`;
                const { error: coverUploadError } = await supabase.storage
                    .from('covers')
                    .upload(coverPath, coverImage);
                if (coverUploadError) throw coverUploadError;
                coverImageUrl = supabase.storage.from('covers').getPublicUrl(coverPath).data.publicUrl;
            }

            const { data: manuscript, error: insertError } = await supabase
                .from('manuscripts')
                .insert([{
                    submitting_author_id: user.id,
                    title,
                    abstract,
                    category,
                    keywords,
                    cover_letter: coverLetter,
                    cover_image: coverImageUrl,
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            manuscriptId = manuscript.id;

            const fileExt = file.name.split('.').pop();
            const filePath = `${manuscriptId}/round-1/manuscript.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('manuscripts')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { error: fileRowError } = await supabase
                .from('manuscript_files')
                .insert([{
                    manuscript_id: manuscriptId,
                    round: 1,
                    file_type: 'manuscript',
                    file_path: filePath,
                    uploaded_by: user.id,
                }]);
            if (fileRowError) throw fileRowError;

            success('Manuscript submitted. You can track its progress from My Manuscripts.');
            navigate(`/manuscripts/${manuscriptId}`);
        } catch (err) {
            console.error('Manuscript submission failed:', err);
            if (manuscriptId) {
                // The manuscript row exists but the file never attached — send the
                // author to the status page, which offers the same upload form for
                // exactly this case rather than leaving a silently broken record.
                showError(
                    `Your manuscript was recorded but the file failed to attach (${err.message}). ` +
                    `Try uploading it again from this page.`
                );
                navigate(`/manuscripts/${manuscriptId}`);
            } else {
                showError('Submission failed: ' + err.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-serif font-bold text-ogene-900 mb-2">Submit a Manuscript</h1>
            <p className="text-ogene-500 mb-8">
                Your submission goes through editorial screening and double-blind peer review before publication.
            </p>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6 space-y-5">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Manuscript title" />
                </div>

                <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                        id="category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-ogene-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ogene-400"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input id="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Comma-separated keywords" />
                </div>

                <div>
                    <Label htmlFor="abstract">Abstract</Label>
                    <textarea
                        id="abstract"
                        value={abstract}
                        onChange={e => setAbstract(e.target.value)}
                        required
                        className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400 min-h-[140px]"
                        placeholder="Summarize your manuscript..."
                    />
                </div>

                <div>
                    <Label htmlFor="cover_letter">Cover Letter (optional)</Label>
                    <textarea
                        id="cover_letter"
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400 min-h-[100px]"
                        placeholder="A note to the editor..."
                    />
                </div>

                <div>
                    <Label htmlFor="cover_image">Cover Image (optional)</Label>
                    <input
                        type="file"
                        id="cover_image"
                        accept="image/*"
                        onChange={e => setCoverImage(e.target.files[0])}
                        className="block w-full text-sm text-ogene-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ogene-50 file:text-ogene-700 hover:file:bg-ogene-100 mt-2"
                    />
                    <p className="text-xs text-ogene-400 mt-1">If you skip this, a decorative pattern will be used instead.</p>
                </div>

                <div>
                    <Label htmlFor="file">Manuscript File (PDF or DOCX)</Label>
                    <input
                        type="file"
                        id="file"
                        accept=".pdf,.docx"
                        onChange={e => setFile(e.target.files[0])}
                        required
                        className="block w-full text-sm text-ogene-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-ogene-50 file:text-ogene-700 hover:file:bg-ogene-100 mt-2"
                    />
                </div>

                <label className="flex items-start gap-3 p-4 bg-ogene-50 rounded-lg border border-ogene-100 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={anonymized}
                        onChange={e => setAnonymized(e.target.checked)}
                        className="mt-1"
                    />
                    <span className="text-sm text-ogene-700">
                        I confirm this file has had all identifying information (author names, affiliations,
                        acknowledgements) removed, to support double-blind review.
                    </span>
                </label>

                <Button type="submit" className="w-full" isLoading={submitting} disabled={!canSubmit}>
                    <Upload size={18} className="mr-2" />
                    Submit Manuscript
                </Button>
            </form>
        </div>
    );
}
