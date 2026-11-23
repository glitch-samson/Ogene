import React, { useEffect, useState } from 'react';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { Button, Input, Label } from '../components/ui';
import { User, Mail, Camera, Eye } from 'lucide-react';
import { AuthorCardPanel } from '../components/authors/AuthorHoverCard';
import { clearAuthorCardCache, initials } from '../lib/authors';

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeOrcid = (value) =>
    value.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i, '').toUpperCase();

async function uploadImage(file, folder, userId) {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('covers').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
}

function AccountSection({ user, profile }) {
    const refreshProfile = useUserStore((s) => s.refreshProfile);
    const { success, error: showAlertError } = useAlert();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [saving, setSaving] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id);
            if (error) throw error;
            await refreshProfile();
            success('Your profile has been updated successfully.');
        } catch (err) {
            showAlertError(err.message || 'Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-xl border border-ogene-100 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-6">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-navy-100" />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ogene-200 text-2xl font-bold text-ogene-600">
                        {initials(fullName || user?.email || '?')}
                    </div>
                )}
                <div>
                    <h2 className="text-xl font-bold text-ogene-900">{fullName || 'User'}</h2>
                    <p className="mt-1 flex items-center gap-2 text-ogene-500">
                        <Mail size={14} />
                        {user?.email}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-ogene-100 px-2 py-1 text-xs font-medium capitalize text-ogene-700">
                        {profile?.role || 'User'}
                    </span>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="max-w-md space-y-6">
                <div>
                    <Label htmlFor="fullname">Full Name</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-ogene-400" size={18} />
                        <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" placeholder="Your full name" />
                    </div>
                </div>

                <div>
                    <Label htmlFor="email">Account Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-ogene-400" size={18} />
                        <Input id="email" value={user?.email || ''} disabled className="cursor-not-allowed bg-ogene-50 pl-10" />
                    </div>
                    <p className="mt-1 text-xs text-ogene-400">Your login email can't be changed here.</p>
                </div>

                <Button type="submit" isLoading={saving}>Save Changes</Button>
            </form>
        </section>
    );
}

function AuthorCardSection({ user }) {
    const refreshProfile = useUserStore((s) => s.refreshProfile);
    const { success, error: showAlertError } = useAlert();
    const [state, setState] = useState('loading'); // loading | ready | unavailable
    const [authorId, setAuthorId] = useState(null);
    const [form, setForm] = useState({
        full_name: '',
        avatar_url: '',
        affiliation: '',
        orcid: '',
        linkedin_url: '',
        display_email: '',
        show_email: false,
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data: id, error } = await supabase.rpc('ensure_author_for_profile', { p_profile_id: user.id });
            if (cancelled) return;
            if (error || !id) {
                console.error('Author card unavailable:', error);
                setState('unavailable');
                return;
            }
            const [{ data: author }, { data: priv }] = await Promise.all([
                supabase.from('authors').select('*').eq('id', id).single(),
                supabase.from('author_private').select('*').eq('author_id', id).maybeSingle(),
            ]);
            if (cancelled) return;
            setAuthorId(id);
            setForm({
                full_name: author?.full_name || '',
                avatar_url: author?.avatar_url || '',
                affiliation: author?.affiliation || '',
                orcid: author?.orcid || '',
                linkedin_url: author?.linkedin_url || '',
                display_email: priv?.display_email || '',
                show_email: !!priv?.show_email,
            });
            setState('ready');
        })();
        return () => { cancelled = true; };
    }, [user.id]);

    useEffect(() => () => {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
    }, [photoPreview]);

    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const pickPhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const orcid = form.orcid ? normalizeOrcid(form.orcid) : '';
        const displayEmail = form.display_email.trim();

        if (!form.full_name.trim()) return showAlertError('Please enter the name to show on your articles.');
        if (orcid && !ORCID_PATTERN.test(orcid)) return showAlertError('ORCID should look like 0000-0002-2265-764X.');
        if (displayEmail && !EMAIL_PATTERN.test(displayEmail)) return showAlertError('Please enter a valid display email.');

        setSaving(true);
        try {
            let avatarUrl = form.avatar_url || null;
            if (photoFile) {
                avatarUrl = await uploadImage(photoFile, 'avatars', user.id);
                // Keep the account avatar (navbar, sidebar) in step with the card.
                await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
            }

            const { error: authorError } = await supabase
                .from('authors')
                .update({
                    full_name: form.full_name.trim(),
                    avatar_url: avatarUrl,
                    affiliation: form.affiliation.trim() || null,
                    orcid: orcid || null,
                    linkedin_url: form.linkedin_url.trim() || null,
                })
                .eq('id', authorId);
            if (authorError) throw authorError;

            const { error: privError } = await supabase
                .from('author_private')
                .upsert({ author_id: authorId, display_email: displayEmail || null, show_email: form.show_email });
            if (privError) throw privError;

            setForm((f) => ({ ...f, avatar_url: avatarUrl || '', orcid }));
            setPhotoFile(null);
            setPhotoPreview(null);
            clearAuthorCardCache();
            if (photoFile) await refreshProfile();
            success('Your author card has been updated.');
        } catch (err) {
            showAlertError(err.message || 'Could not save your author card.');
        } finally {
            setSaving(false);
        }
    };

    if (state === 'loading') {
        return <section className="rounded-xl border border-ogene-100 bg-white p-8 text-sm text-ogene-500 shadow-sm">Loading your author card…</section>;
    }

    if (state === 'unavailable') {
        return (
            <section className="rounded-xl border border-ogene-100 bg-white p-8 shadow-sm">
                <h2 className="font-serif text-xl font-bold text-ogene-900">Your author card</h2>
                <p className="mt-2 text-sm text-ogene-500">Author cards aren't available yet. Please check back soon.</p>
            </section>
        );
    }

    const previewCard = {
        full_name: form.full_name || 'Your name',
        avatar_url: photoPreview || form.avatar_url,
        affiliation: form.affiliation,
        orcid: form.orcid ? normalizeOrcid(form.orcid) : null,
        linkedin_url: form.linkedin_url,
        email: form.show_email ? (form.display_email.trim() || user.email) : null,
        is_corresponding: true,
        contributions: [],
        other_articles: [],
    };

    return (
        <section className="rounded-xl border border-ogene-100 bg-white p-8 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-ogene-900">Your author card</h2>
            <p className="mt-1 text-sm text-ogene-500">
                Readers see this card when they hover over your name on an article you've published.
            </p>

            <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
                <form onSubmit={handleSave} className="space-y-5">
                    <div className="flex items-center gap-4">
                        {previewCard.avatar_url ? (
                            <img src={previewCard.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-navy-100" />
                        ) : (
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 text-lg font-bold text-navy-700">
                                {initials(form.full_name)}
                            </span>
                        )}
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 hover:border-navy-400">
                            <Camera size={16} />
                            {previewCard.avatar_url ? 'Change photo' : 'Add a photo'}
                            <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
                        </label>
                    </div>

                    <div>
                        <Label htmlFor="card_name">Name on your articles</Label>
                        <Input id="card_name" value={form.full_name} onChange={set('full_name')} placeholder="e.g. Marthán N Bester" />
                    </div>

                    <div>
                        <Label htmlFor="affiliation">Affiliation</Label>
                        <textarea
                            id="affiliation"
                            value={form.affiliation}
                            onChange={set('affiliation')}
                            rows={3}
                            placeholder="Department, institution, city, country"
                            className="flex w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400"
                        />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="orcid">ORCID iD</Label>
                            <Input id="orcid" value={form.orcid} onChange={set('orcid')} placeholder="0000-0002-2265-764X" />
                        </div>
                        <div>
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input id="linkedin" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="linkedin.com/in/your-name" />
                        </div>
                    </div>

                    <fieldset className="rounded-lg border border-ogene-100 bg-ogene-50/60 p-4">
                        <legend className="px-1 text-sm font-semibold text-ogene-800">Email on your card</legend>
                        <label className="flex items-start gap-3">
                            <input type="checkbox" checked={form.show_email} onChange={set('show_email')} className="mt-1" />
                            <span className="text-sm text-ogene-700">
                                Show my email on my author card
                                <span className="block text-xs text-ogene-500">Off by default. Readers can then contact you about your work.</span>
                            </span>
                        </label>
                        <div className={`mt-4 ${form.show_email ? '' : 'opacity-50'}`}>
                            <Label htmlFor="display_email">Display email (optional)</Label>
                            <Input
                                id="display_email"
                                type="email"
                                value={form.display_email}
                                onChange={set('display_email')}
                                disabled={!form.show_email}
                                placeholder={user.email}
                            />
                            <p className="mt-1 text-xs text-ogene-500">
                                Leave empty to show your account email ({user.email}), or enter a different one just for your card.
                            </p>
                        </div>
                    </fieldset>

                    <Button type="submit" isLoading={saving}>Save author card</Button>
                </form>

                <div className="lg:w-88">
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ogene-500">
                        <Eye size={14} /> Preview
                    </p>
                    <AuthorCardPanel card={previewCard} />
                </div>
            </div>
        </section>
    );
}

export default function Profile() {
    const { user, profile } = useUserStore();

    return (
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
            <h1 className="font-serif text-3xl font-bold text-ogene-900">My Profile</h1>
            <AccountSection user={user} profile={profile} />
            <AuthorCardSection user={user} />
        </div>
    );
}
