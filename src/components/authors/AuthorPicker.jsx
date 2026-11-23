import React, { useEffect, useId, useState } from 'react';
import { ArrowUp, ArrowDown, X, Search, UserPlus, ListChecks } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CREDIT_ROLES } from '../../lib/credit';
import { initials } from '../../lib/authors';
import useUserStore from '../../store/userStore';

/**
 * Ordered author list editor.
 *
 * value: [{ author_id, full_name, avatar_url, has_account, is_corresponding, contributions }]
 * lockedAuthorIds: authors that can't be removed (e.g. the submitting author).
 */
export default function AuthorPicker({ value, onChange, lockedAuthorIds = [] }) {
    const radioName = useId();
    const { user } = useUserStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ q: '', items: [] });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(() => new Set());
    const [newPerson, setNewPerson] = useState(null); // { full_name, affiliation } while the form is open

    const trimmed = query.trim();

    // Debounced search across author cards and registered users.
    useEffect(() => {
        if (trimmed.length < 2) return undefined;
        let cancelled = false;
        const timer = setTimeout(async () => {
            const pattern = `%${trimmed.replace(/[%_]/g, '')}%`;
            const [authorsRes, profilesRes] = await Promise.all([
                supabase.from('authors').select('id, full_name, avatar_url, affiliation, profile_id').ilike('full_name', pattern).limit(8),
                supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', pattern).limit(8),
            ]);
            if (cancelled) return;
            const authors = authorsRes.data || [];
            const linkedProfiles = new Set(authors.map((a) => a.profile_id).filter(Boolean));
            const items = [
                ...authors.map((a) => ({
                    key: a.id,
                    author_id: a.id,
                    full_name: a.full_name,
                    avatar_url: a.avatar_url,
                    affiliation: a.affiliation,
                    has_account: !!a.profile_id,
                })),
                ...(profilesRes.data || [])
                    .filter((p) => p.full_name && !linkedProfiles.has(p.id))
                    .map((p) => ({
                        key: `profile:${p.id}`,
                        profile_id: p.id,
                        full_name: p.full_name,
                        avatar_url: p.avatar_url,
                        has_account: true,
                    })),
            ];
            setResults({ q: trimmed, items: items.slice(0, 8) });
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [trimmed]);

    const chosen = new Set(value.map((a) => a.author_id));
    const visibleResults =
        trimmed.length >= 2 && results.q === trimmed ? results.items.filter((r) => !chosen.has(r.author_id)) : [];

    const append = (entry) => {
        onChange([
            ...value,
            { ...entry, is_corresponding: value.length === 0, contributions: [] },
        ]);
        setQuery('');
    };

    const addResult = async (result) => {
        setError('');
        setBusy(true);
        try {
            let authorId = result.author_id;
            if (!authorId) {
                const { data, error: rpcError } = await supabase.rpc('ensure_author_for_profile', { p_profile_id: result.profile_id });
                if (rpcError) throw rpcError;
                authorId = data;
            }
            if (chosen.has(authorId)) return;
            append({ author_id: authorId, full_name: result.full_name, avatar_url: result.avatar_url, has_account: result.has_account });
        } catch (err) {
            setError(err.message || 'Could not add that author.');
        } finally {
            setBusy(false);
        }
    };

    const createPerson = async () => {
        const name = newPerson?.full_name.trim();
        if (!name) return;
        setError('');
        setBusy(true);
        try {
            const { data, error: insertError } = await supabase
                .from('authors')
                .insert([{ full_name: name, affiliation: newPerson.affiliation.trim() || null, created_by: user.id }])
                .select('id, full_name, avatar_url')
                .single();
            if (insertError) throw insertError;
            append({ author_id: data.id, full_name: data.full_name, avatar_url: data.avatar_url, has_account: false });
            setNewPerson(null);
        } catch (err) {
            setError(err.message || 'Could not add that person.');
        } finally {
            setBusy(false);
        }
    };

    const update = (index, patch) => onChange(value.map((a, i) => (i === index ? { ...a, ...patch } : a)));

    const move = (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    const remove = (index) => {
        const next = value.filter((_, i) => i !== index);
        if (value[index].is_corresponding && next.length) next[0] = { ...next[0], is_corresponding: true };
        onChange(next);
    };

    const setCorresponding = (index) =>
        onChange(value.map((a, i) => ({ ...a, is_corresponding: i === index })));

    const toggleRole = (index, role) => {
        const roles = value[index].contributions || [];
        update(index, { contributions: roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role] });
    };

    const toggleExpanded = (id) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const iconButton = 'rounded p-1.5 text-ogene-400 hover:bg-ogene-100 hover:text-ogene-700 disabled:opacity-30 disabled:hover:bg-transparent';

    // The picker usually lives inside a larger <form>; Enter here must not submit it.
    const swallowEnter = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    return (
        <div className="space-y-3">
            {value.length > 0 && (
                <ol className="space-y-2">
                    {value.map((a, i) => {
                        const locked = lockedAuthorIds.includes(a.author_id);
                        const isOpen = expanded.has(a.author_id);
                        return (
                            <li key={a.author_id} className="rounded-lg border border-navy-100 bg-white p-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="w-5 text-sm tabular-nums text-ogene-400">{i + 1}.</span>
                                    {a.avatar_url ? (
                                        <img src={a.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                                    ) : (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                                            {initials(a.full_name)}
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-ogene-900">{a.full_name}</p>
                                        <p className="text-xs text-ogene-500">
                                            {a.has_account ? 'Registered user' : 'No account'}
                                            {a.contributions?.length ? ` · ${a.contributions.length} contribution role${a.contributions.length > 1 ? 's' : ''}` : ''}
                                        </p>
                                    </div>
                                    <label className="flex items-center gap-1.5 text-xs text-ogene-600">
                                        <input
                                            type="radio"
                                            name={radioName}
                                            checked={!!a.is_corresponding}
                                            onChange={() => setCorresponding(i)}
                                        />
                                        Corresponding
                                    </label>
                                    <div className="flex items-center">
                                        <button type="button" onClick={() => toggleExpanded(a.author_id)} className={iconButton} title="Contribution roles" aria-expanded={isOpen}>
                                            <ListChecks size={16} />
                                        </button>
                                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={iconButton} aria-label="Move up">
                                            <ArrowUp size={16} />
                                        </button>
                                        <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className={iconButton} aria-label="Move down">
                                            <ArrowDown size={16} />
                                        </button>
                                        <button type="button" onClick={() => remove(i)} disabled={locked} className={iconButton} aria-label="Remove author" title={locked ? 'The submitting author stays on the list' : 'Remove'}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                                {isOpen && (
                                    <fieldset className="mt-3 border-t border-navy-50 pt-3">
                                        <legend className="sr-only">Contribution roles for {a.full_name}</legend>
                                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                            {CREDIT_ROLES.map((role) => (
                                                <label key={role} className="flex items-center gap-2 text-xs text-ogene-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={(a.contributions || []).includes(role)}
                                                        onChange={() => toggleRole(i, role)}
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-ogene-400" size={16} />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={swallowEnter}
                    placeholder="Add a co-author: search by name…"
                    className="flex h-10 w-full rounded-md border border-ogene-300 bg-white pl-9 pr-3 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400"
                    aria-label="Search for a co-author"
                />
                {visibleResults.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-navy-100 bg-white shadow-lg">
                        {visibleResults.map((r) => (
                            <li key={r.key}>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => addResult(r)}
                                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-navy-50"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-100 text-[10px] font-bold text-navy-700">
                                        {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(r.full_name)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-ogene-900">{r.full_name}</span>
                                        <span className="block truncate text-xs text-ogene-500">
                                            {r.has_account ? 'Registered user' : 'No account'}{r.affiliation ? ` · ${r.affiliation}` : ''}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {trimmed.length >= 2 && results.q === trimmed && visibleResults.length === 0 && (
                    <p className="mt-1 text-xs text-ogene-500">No one found with that name. You can add them below.</p>
                )}
            </div>

            {newPerson ? (
                <div className="space-y-2 rounded-lg border border-dashed border-navy-200 bg-navy-50/40 p-3">
                    <p className="text-sm font-medium text-ogene-800">Add someone without an account</p>
                    <input
                        value={newPerson.full_name}
                        onChange={(e) => setNewPerson((p) => ({ ...p, full_name: e.target.value }))}
                        onKeyDown={(e) => {
                            swallowEnter(e);
                            if (e.key === 'Enter') createPerson();
                        }}
                        placeholder="Full name"
                        className="flex h-9 w-full rounded-md border border-ogene-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ogene-400"
                    />
                    <input
                        value={newPerson.affiliation}
                        onChange={(e) => setNewPerson((p) => ({ ...p, affiliation: e.target.value }))}
                        onKeyDown={swallowEnter}
                        placeholder="Affiliation (optional)"
                        className="flex h-9 w-full rounded-md border border-ogene-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ogene-400"
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={createPerson} disabled={busy || !newPerson.full_name.trim()} className="rounded-md bg-navy-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
                            Add author
                        </button>
                        <button type="button" onClick={() => setNewPerson(null)} className="rounded-md px-3 py-1.5 text-sm text-ogene-600 hover:bg-ogene-100">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setNewPerson({ full_name: trimmed, affiliation: '' })}
                    className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:underline"
                >
                    <UserPlus size={16} /> Add someone without an account
                </button>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
