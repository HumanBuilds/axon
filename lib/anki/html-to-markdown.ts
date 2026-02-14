/**
 * Lightweight HTML to Markdown converter for Anki card content.
 * Strips media references and converts common HTML to Markdown.
 */
export function htmlToMarkdown(html: string): string {
  let text = html;

  // Strip media references
  text = text.replace(/<img[^>]*>/gi, '');
  text = text.replace(/\[sound:[^\]]*\]/g, '');

  // Convert line breaks and block elements to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');

  // Convert headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n');

  // Convert bold and italic
  text = text.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, '**$1**');
  text = text.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, '*$1*');

  // Convert underline (no standard markdown, use bold)
  text = text.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '**$1**');

  // Convert code
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```');

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Convert unordered lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/?[ou]l[^>]*>/gi, '\n');

  // Convert horizontal rules
  text = text.replace(/<hr\s*\/?>/gi, '---\n');

  // Convert tables (basic)
  text = text.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, content) => {
    const rows: string[] = [];
    const rowMatches = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of rowMatches) {
      const cells: string[] = [];
      const cellMatches = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      for (const cell of cellMatches) {
        const cellContent = cell.replace(/<\/?t[dh][^>]*>/gi, '').trim();
        cells.push(cellContent);
      }
      rows.push('| ' + cells.join(' | ') + ' |');
    }
    if (rows.length > 0) {
      // Add header separator after first row
      const cols = (rows[0].match(/\|/g) || []).length - 1;
      const separator = '| ' + Array(cols).fill('---').join(' | ') + ' |';
      rows.splice(1, 0, separator);
    }
    return rows.join('\n') + '\n';
  });

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeEntities(text);

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+$/gm, '');
  text = text.trim();

  return text;
}

function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '\u2013',
    '&mdash;': '\u2014',
    '&laquo;': '\u00AB',
    '&raquo;': '\u00BB',
    '&hellip;': '\u2026',
    '&copy;': '\u00A9',
    '&reg;': '\u00AE',
    '&trade;': '\u2122',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replaceAll(entity, char);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10)),
  );
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16)),
  );

  return result;
}
