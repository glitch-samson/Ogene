import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, ClipboardCheck, ClipboardList, BookOpenCheck, ChevronRight, RefreshCw } from 'lucide-react';
import useUserStore from '../store/userStore';
import useNotificationStore, { isUnread, readLastSeen } from '../store/notificationStore';

const KIND_ICONS = {
    manuscript: FileText,
    published: BookOpenCheck,
    review: ClipboardCheck,
    editorial: ClipboardList,
};

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(value) {
    const seconds = Math.round((new Date(value) - Date.now()) / 1000);
    const units = [
        ['year', 31536000], ['month', 2592000], ['week', 604800],
        ['day', 86400], ['hour', 3600], ['minute', 60],
    ];
    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return 'just now';
}

function NotificationItem({ item, isNew }) {
    const Icon = KIND_ICONS[item.kind] || Bell;
    return (
        <li>
            <Link
                to={item.link}
                className={`group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-navy-50/60 ${isNew ? 'bg-gold-50/60' : ''}`}
            >
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isNew ? 'bg-gold-400 text-navy-900' : 'bg-navy-50 text-navy-700'}`}>
                    <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                        <span className="font-semibold text-ogene-900">{item.title}</span>
                        {isNew && <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-900">New</span>}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ogene-600">{item.body}</span>
                    <span className="mt-1 block text-xs text-ogene-400" title={new Date(item.date).toLocaleString()}>{timeAgo(item.date)}</span>
                </span>
                <ChevronRight size={18} className="mt-2 shrink-0 text-ogene-300 transition-transform group-hover:translate-x-0.5 group-hover:text-navy-600" />
            </Link>
        </li>
    );
}

export default function Notifications() {
    const { user, profile } = useUserStore();
    const { items, status, load, markAllRead } = useNotificationStore();
    // What counted as "new" when this page was opened; opening the page marks
    // everything read, but those items stay highlighted for this visit.
    const [seenBefore] = useState(() => readLastSeen(user.id));

    useEffect(() => {
        load(user, profile, { force: true }).then(markAllRead);
    }, [user, profile, load, markAllRead]);

    const fresh = items.filter((i) => isUnread(i, seenBefore));
    const earlier = items.filter((i) => !isUnread(i, seenBefore));

    return (
        <div className="mx-auto max-w-3xl px-4 py-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-ogene-900">Notifications</h1>
                    <p className="mt-1 text-sm text-ogene-500">Updates on your submissions, reviews and editorial work.</p>
                </div>
                <button
                    type="button"
                    onClick={() => load(user, profile, { force: true })}
                    disabled={status === 'loading'}
                    className="inline-flex items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:border-navy-400 disabled:opacity-50"
                >
                    <RefreshCw size={15} className={status === 'loading' ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="mt-8">
                {status === 'loading' && items.length === 0 ? (
                    <div className="space-y-3" aria-label="Loading notifications">
                        {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-navy-50" />)}
                    </div>
                ) : status === 'error' && items.length === 0 ? (
                    <p className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
                        Notifications couldn't be loaded. Please try Refresh.
                    </p>
                ) : items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-navy-200 bg-white px-6 py-14 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-600">
                            <Bell size={22} />
                        </span>
                        <p className="mt-4 font-serif text-xl font-bold text-navy-900">You're all caught up</p>
                        <p className="mt-1 text-sm text-ogene-500">Updates about your submissions and reviews will appear here.</p>
                        <Link to="/submit" className="mt-5 inline-block text-sm font-semibold text-navy-700 hover:underline">Submit a manuscript</Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {fresh.length > 0 && (
                            <section>
                                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ogene-500">New</h2>
                                <ul className="divide-y divide-navy-100 overflow-hidden rounded-xl border border-navy-100 bg-white">
                                    {fresh.map((n) => <NotificationItem key={n.id} item={n} isNew />)}
                                </ul>
                            </section>
                        )}
                        {earlier.length > 0 && (
                            <section>
                                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ogene-500">Earlier</h2>
                                <ul className="divide-y divide-navy-100 overflow-hidden rounded-xl border border-navy-100 bg-white">
                                    {earlier.map((n) => <NotificationItem key={n.id} item={n} isNew={false} />)}
                                </ul>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
