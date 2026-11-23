import React, { useEffect, useState } from 'react';
import { Search, Camera, Link2, Unlink, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button, Input, Label } from '../ui';
import { useAlert } from '../../context/AlertContext';
import { clearAuthorCardCache, initials } from '../../lib/authors';
import useUserStore from '../../store/userStore';

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const normalizeOrcid = (v) => v.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i, '').toUpperCase();

function AuthorEditor({ author, onClose, onSaved }) {
    const { user } = useUserStore();
    const { success, error: showError } = useAlert();
    const [form, setForm] = useState({
        full_name: author.full_name || '',
        affiliation: author.affiliation || '',
        orcid: author.orcid || '',
        linkedin_url: author.linkedin_url || '',
        display_email: '',
        show_email: false,
    });
    const [profileId, setProfileId] = useState(author.profile_id);
    const [linkedName, setLinkedName] = useState(author.profiles?.full_name || null);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [accountQuery, setAccountQuery] = useState('');
    const [accountResults, setAccountResults] = useState({ q: '', items: [] });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        supabase.from('author_private').select('*').eq('author_id', author.id).maybeSingle().then(({ data }) => {
            if (cancelled || !data) return;
            setForm((f) => ({ ...f, display_email: data.display_email || '', show_email: !!data.show_email }));
        });
        return () => { cancelled = true; };
    }, [author.id]);

    const q = accountQuery.trim();
    useEffect(() => {
        if (q.length < 2) return undefined;
        let cancelled = false;
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name')
                .ilike('full_name', `%${q.replace(/[%_]/g, '')}%`)
                .limit(6);
            if (!cancelled) setAccountResults({ q, items: data || [] });
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [q]);

    useEffect(() => () => {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
    }, [photoPreview]);

    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        const orcid = form.orcid ? normalizeOrcid(form.orcid) : '';
        if (!form.full_name.trim()) return showError('Name is required.');
        if (orcid && !ORCID_PATTERN.test(orcid)) return showError('ORCID should look like 0000-0002-2265-764X.');

        setSaving(true);
        try {
            let avatarUrl = author.avatar_url || null;
            if (photo) {
                const ext = photo.name.split('.').pop();
                const path = `authors/${user.id}/${crypto.randomUUID()}.${ext}`;
                const { error: upErr } = await supabase.storage.from('covers').upload(path, photo);
                if (upErr) throw upErr;
                avatarUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
            }

            const { error: aErr } = await supabase
                .from('authors')
                .update({
                    full_name: form.full_name.trim(),
                    affiliation: form.affiliation.trim() || null,
                    orcid: orcid || null,
                    linkedin_url: form.linkedin_url.trim() || null,
                    avatar_url: avatarUrl,
                    profile_id: profileId || null,
                })
                .eq('id', author.id);
            if (aErr) {
                if (aErr.code === '23505') throw new Error('That account already has its own author card.');
                throw aErr;
            }

            const { error: pErr } = await supabase
                .from('author_private')
                .upsert({ author_id: author.id, display_email: form.display_email.trim() || null, show_email: form.show_email });
            if (pErr) throw pErr;

            clearAuthorCardCache();
            success('Author updated.');
            onSaved();
        } catch (err) {
            showError(err.message || 'Could not save this author.');
        } finally {
            setSaving(false);
        }
    };

    const avatar = photoPreview || author.avatar_url;
    const visibleAccounts = q.length >= 2 && accountResults.q === q ? accountResults.items : [];

    return (
        <form onSubmit={save} className="space-y-4 border-t border-navy-100 bg-navy-50/40 p-5">
            <div className="flex items-center justify-between">
                <p className="font-semibold text-ogene-900">Edit author</p>
                <button type="button" onClick={onClose} className="rounded p-1 text-ogene-400 hover:bg-ogene-100" aria-label="Close editor">
                    <X size={18} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {avatar ? (
                    <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-100 font-bold text-navy-700">{initials(form.full_name)}</span>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:border-navy-400">
                    <Camera size={16} /> {avatar ? 'Change photo' : 'Add photo'}
                    <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setPhoto(f);
                            setPhotoPreview(URL.createObjectURL(f));
                        }}
                    />
                </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor={`name-${author.id}`}>Name</Label>
                    <Input id={`name-${author.id}`} value={form.full_name} onChange={set('full_name')} />
                </div>
                <div>
                    <Label htmlFor={`orcid-${author.id}`}>ORCID iD</Label>
                    <Input id={`orcid-${author.id}`} value={form.orcid} onChange={set('orcid')} placeholder="0000-0002-2265-764X" />
                </div>
                <div className="sm:col-span-2">
                    <Label htmlFor={`aff-${author.id}`}>Affiliation</Label>
                    <Input id={`aff-${author.id}`} value={form.affiliation} onChange={set('affiliation')} placeholder="Department, institution, city, country" />
                </div>
                <div>
                    <Label htmlFor={`li-${author.id}`}>LinkedIn</Label>
                    <Input id={`li-${author.id}`} value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="linkedin.com/in/…" />
                </div>
                <div>
                    <Label htmlFor={`em-${author.id}`}>Display email</Label>
                    <Input id={`em-${author.id}`} type="email" value={form.display_email} onChange={set('display_email')} placeholder={profileId ? 'Defaults to their account email' : 'name@example.com'} />
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ogene-700">
                <input type="checkbox" checked={form.show_email} onChange={set('show_email')} />
                Show email on this author's card
            </label>

            <div className="rounded-lg border border-navy-100 bg-white p-3">
                <p className="text-sm font-medium text-ogene-800">Linked account</p>
                {profileId ? (
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                        <span className="text-ogene-700">{linkedName || 'Registered user'}</span>
                        <button type="button" onClick={() => { setProfileId(null); setLinkedName(null); }} className="inline-flex items-center gap-1.5 text-red-600 hover:underline">
                            <Unlink size={14} /> Unlink
                        </button>
                    </div>
                ) : (
                    <div className="relative mt-2">
                        <Input value={accountQuery} onChange={(e) => setAccountQuery(e.target.value)} placeholder="Search registered users to link…" />
                        {visibleAccounts.length > 0 && (
                            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-navy-100 bg-white shadow-lg">
                                {visibleAccounts.map((p) => (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => { setProfileId(p.id); setLinkedName(p.full_name); setAccountQuery(''); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-navy-50"
                                        >
                                            <Link2 size={14} className="text-navy-500" /> {p.full_name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="mt-1 text-xs text-ogene-500">Linking lets that person manage this card from their own profile.</p>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <Button type="submit" isLoading={saving}>Save author</Button>
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
        </form>
    );
}

export default function AuthorsManager() {
    const [authors, setAuthors] = useState([]);
    const [status, setStatus] = useState('loading');
    const [filter, setFilter] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        supabase
            .from('authors')
            .select('*, profiles!authors_profile_id_fkey(full_name), article_authors(count)')
            .order('full_name')
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error) {
                    console.error('Error loading authors:', error);
                    setStatus('unavailable');
                    return;
                }
                setAuthors(data || []);
                setStatus('ready');
            });
        return () => { cancelled = true; };
    }, [reloadKey]);

    if (status === 'loading') return <div className="p-8 text-center text-ogene-500">Loading authors…</div>;
    if (status === 'unavailable') {
        return (
            <div className="p-8 text-center text-ogene-500">
                Authors aren't available yet. Run <code className="rounded bg-ogene-100 px-1">supabase_migration_authors.sql</code> in Supabase first.
            </div>
        );
    }

    const term = filter.trim().toLowerCase();
    const shown = term ? authors.filter((a) => `${a.full_name} ${a.affiliation || ''}`.toLowerCase().includes(term)) : authors;

    return (
        <div>
            <div className="border-b border-ogene-100 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-ogene-900">Authors</h2>
                        <p className="text-sm text-ogene-500">Add photos and details for everyone credited on an article.</p>
                    </div>
                    <div className="relative sm:w-64">
                        <Search className="absolute left-3 top-2.5 text-ogene-400" size={16} />
                        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter authors…" className="pl-9" />
                    </div>
                </div>
            </div>
            {shown.length === 0 ? (
                <div className="p-8 text-center text-ogene-500">No authors found.</div>
            ) : (
                <ul className="divide-y divide-ogene-100">
                    {shown.map((a) => (
                        <li key={a.id}>
                            <div className="flex items-center gap-4 p-4">
                                {a.avatar_url ? (
                                    <img src={a.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">{initials(a.full_name)}</span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-ogene-900">{a.full_name}</p>
                                    <p className="truncate text-xs text-ogene-500">
                                        {a.profile_id ? `Account: ${a.profiles?.full_name || 'linked'}` : 'No account'}
                                        {' · '}
                                        {a.article_authors?.[0]?.count ?? 0} article(s)
                                        {a.affiliation ? ` · ${a.affiliation}` : ''}
                                    </p>
                                </div>
                                {!a.avatar_url && <span className="hidden rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-800 sm:inline">No photo</span>}
                                <Button variant="ghost" size="sm" onClick={() => setEditingId(editingId === a.id ? null : a.id)}>
                                    {editingId === a.id ? 'Close' : 'Edit'}
                                </Button>
                            </div>
                            {editingId === a.id && (
                                <AuthorEditor
                                    author={a}
                                    onClose={() => setEditingId(null)}
                                    onSaved={() => { setEditingId(null); setReloadKey((k) => k + 1); }}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
