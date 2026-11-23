import React from 'react';
import AuthorHoverCard from './AuthorHoverCard';
import { getAuthors } from '../../lib/authors';

/**
 * An article's authors.
 *   variant="full"  → "A, B & C" (article page header)
 *   variant="short" → "A" · "A & B" · "A et al." (cards, carousel)
 * With `withCards`, each shown name opens that author's hover card.
 */
export default function AuthorNames({
    article,
    variant = 'full',
    withCards = true,
    className = '',
    nameClassName = '',
    fallback = 'Unknown Author',
}) {
    const authors = getAuthors(article);
    if (!authors.length) return <span className={className}>{fallback}</span>;

    const etAl = variant === 'short' && authors.length > 2;
    const shown = etAl ? authors.slice(0, 1) : authors;

    return (
        <span className={className}>
            {shown.map((author, i) => (
                <React.Fragment key={author.id || author.full_name}>
                    {i > 0 && (i === shown.length - 1 ? ' & ' : ', ')}
                    {withCards ? (
                        <AuthorHoverCard author={author} articleId={article.id} className={nameClassName} />
                    ) : (
                        <span className={nameClassName}>{author.full_name}</span>
                    )}
                </React.Fragment>
            ))}
            {etAl && ' et al.'}
        </span>
    );
}
