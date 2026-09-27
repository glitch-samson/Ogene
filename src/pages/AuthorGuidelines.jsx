import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { FileCheck, ShieldCheck, Clock, BookOpen } from 'lucide-react';

const SECTIONS = [
    {
        icon: FileCheck,
        title: 'Manuscript Preparation',
        points: [
            'Submit as a PDF or DOCX file, in English, with a clear title, abstract, and keywords.',
            'Remove all identifying information from the manuscript file itself (author names, affiliations, acknowledgements) — Oghene Journal uses double-blind peer review, so reviewers must not be able to identify authors from the document.',
            'Include a cover letter briefly describing the significance of the work and confirming it is original and not under review elsewhere.',
        ],
    },
    {
        icon: ShieldCheck,
        title: 'Peer Review Process',
        points: [
            'Every submission is first screened by the editorial team, who may desk-reject work outside the journal\'s scope or below basic quality thresholds.',
            'Manuscripts that pass screening go to double-blind peer review by two independent reviewers.',
            'Based on reviewer recommendations, the editorial team will request revisions, accept, or reject the manuscript. You can track this status at any time from your dashboard.',
        ],
    },
    {
        icon: Clock,
        title: 'Revisions',
        points: [
            'If revisions are requested, you\'ll see reviewer feedback (attributed anonymously, e.g. "Reviewer 1") directly on your manuscript\'s status page.',
            'Upload your revised manuscript from the same page — this starts a new round of review.',
        ],
    },
    {
        icon: BookOpen,
        title: 'Publication',
        points: [
            'Accepted manuscripts move through production editing (copyediting, formatting) before a final editorial sign-off.',
            'Published articles are open access — free for anyone to read — and appear in the journal\'s public archive immediately upon publication.',
        ],
    },
];

export default function AuthorGuidelines() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-4">Author Guidelines</h1>
                <p className="text-lg text-ogene-600">
                    What to know before submitting your manuscript to Oghene Journal.
                </p>
            </div>

            <div className="space-y-10">
                {SECTIONS.map((section) => (
                    <div key={section.title} className="bg-white rounded-2xl border border-ogene-100 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-navy-50 text-navy-800 rounded-xl">
                                <section.icon size={22} />
                            </div>
                            <h2 className="text-xl font-bold text-ogene-900">{section.title}</h2>
                        </div>
                        <ul className="space-y-3">
                            {section.points.map((point, i) => (
                                <li key={i} className="flex gap-3 text-ogene-600 leading-relaxed">
                                    <span className="text-gold-500 font-bold mt-0.5">&bull;</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="text-center mt-16">
                <Link to="/submit">
                    <Button size="lg" className="px-10 py-6 text-lg rounded-full bg-navy-800 hover:bg-navy-900 text-white shadow-xl">
                        Submit Your Manuscript
                    </Button>
                </Link>
            </div>
        </div>
    );
}
