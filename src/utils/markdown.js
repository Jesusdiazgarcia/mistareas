import { escapeHtml } from './helpers';

const emojiMap = {
    ':)': '\u{1F642}', ':(': '\u{1F641}', ':D': '\u{1F600}', ';)': '\u{1F609}',
    ':P': '\u{1F61B}', ':o': '\u{1F632}', '<3': '\u{2764}\u{FE0F}', ':fire:': '\u{1F525}',
    ':star:': '\u{2B50}', ':check:': '\u{2705}', ':x:': '\u{274C}', ':warning:': '\u{26A0}\u{FE0F}',
    ':rocket:': '\u{1F680}', ':bulb:': '\u{1F4A1}', ':heart:': '\u{2764}\u{FE0F}',
    ':thumbsup:': '\u{1F44D}', ':clap:': '\u{1F44F}', ':tada:': '\u{1F389}',
    ':sparkles:': '\u{2728}', ':memo:': '\u{1F4DD}', ':calendar:': '\u{1F4C5}',
    ':clock:': '\u{23F0}', ':bell:': '\u{1F514}', ':trophy:': '\u{1F3C6}',
    ':gem:': '\u{1F48E}', ':coffee:': '\u{2615}', ':pizza:': '\u{1F355}'
};

function parseEmoji(text) {
    let result = text;
    for (const [name, emoji] of Object.entries(emojiMap)) {
        result = result.split(name).join(emoji);
    }
    return result;
}

export function parseMarkdown(text) {
    let escaped = escapeHtml(text);
    escaped = parseEmoji(escaped);

    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.+?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/`(.+?)`/g, '<code>$1</code>');
    escaped = escaped.replace(/~~(.+?)~~/g, '<del>$1</del>');
    escaped = escaped.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    escaped = escaped.replace(/(#[\w-]+)/g, '<span class="tag">$1</span>');
    escaped = escaped.replace(/(@[\w-]+)/g, '<span class="mention">$1</span>');

    return escaped;
}
