import type { AnkiModel } from './types';

/**
 * Render an Anki template with field values.
 * Handles standard notes and cloze deletions.
 */
export function renderTemplate(
  model: AnkiModel,
  fields: string[],
  templateOrd: number,
): { front: string; back: string } | null {
  const fieldMap = new Map<string, string>();
  for (const fld of model.flds) {
    fieldMap.set(fld.name, fields[fld.ord] ?? '');
  }

  if (model.type === 1) {
    return renderCloze(fieldMap, model, templateOrd);
  }

  return renderStandard(fieldMap, model, templateOrd);
}

function renderStandard(
  fieldMap: Map<string, string>,
  model: AnkiModel,
  templateOrd: number,
): { front: string; back: string } | null {
  const tmpl = model.tmpls.find((t) => t.ord === templateOrd);
  if (!tmpl) return null;

  const front = resolveFields(tmpl.qfmt, fieldMap);
  const back = resolveFields(
    tmpl.afmt.replace(/\{\{FrontSide\}\}/gi, front),
    fieldMap,
  );

  if (!front.trim()) return null;

  return { front, back };
}

function renderCloze(
  fieldMap: Map<string, string>,
  model: AnkiModel,
  clozeOrd: number,
): { front: string; back: string } | null {
  const clozeNum = clozeOrd + 1;
  const tmpl = model.tmpls[0];
  if (!tmpl) return null;

  // Build front and back by processing cloze markers in each field
  const frontFieldMap = new Map<string, string>();
  const backFieldMap = new Map<string, string>();

  for (const [name, value] of fieldMap) {
    frontFieldMap.set(name, replaceClozes(value, clozeNum, 'front'));
    backFieldMap.set(name, replaceClozes(value, clozeNum, 'back'));
  }

  const front = resolveFields(tmpl.qfmt, frontFieldMap);
  const back = resolveFields(
    tmpl.afmt.replace(/\{\{FrontSide\}\}/gi, resolveFields(tmpl.qfmt, frontFieldMap)),
    backFieldMap,
  );

  // Check if this cloze number actually exists in the content
  const hasActiveCloze = Array.from(fieldMap.values()).some((v) =>
    new RegExp(`\\{\\{c${clozeNum}::`).test(v),
  );
  if (!hasActiveCloze) return null;

  return { front, back };
}

function replaceClozes(text: string, activeClozeNum: number, side: 'front' | 'back'): string {
  // Match {{cN::text}} and {{cN::text::hint}}
  return text.replace(
    /\{\{c(\d+)::([^}]*?)(?:::([^}]*?))?\}\}/g,
    (_, numStr, content, hint) => {
      const num = parseInt(numStr, 10);
      if (num === activeClozeNum) {
        if (side === 'front') {
          return hint ? `[${hint}]` : '[...]';
        }
        return `<b>${content}</b>`;
      }
      // Non-active clozes show their text normally
      return content;
    },
  );
}

function resolveFields(template: string, fieldMap: Map<string, string>): string {
  let result = template;

  // Handle conditional sections {{#FieldName}}...{{/FieldName}}
  result = result.replace(
    /\{\{#(.+?)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, fieldName, content) => {
      const value = fieldMap.get(fieldName.trim()) ?? '';
      return value.trim() ? content : '';
    },
  );

  // Handle negative conditional sections {{^FieldName}}...{{/FieldName}}
  result = result.replace(
    /\{\{\^(.+?)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, fieldName, content) => {
      const value = fieldMap.get(fieldName.trim()) ?? '';
      return value.trim() ? '' : content;
    },
  );

  // Handle cloze-specific tags (just strip them)
  result = result.replace(/\{\{cloze:(.+?)\}\}/gi, (_, fieldName) => {
    return fieldMap.get(fieldName.trim()) ?? '';
  });

  // Replace simple field references {{FieldName}}
  result = result.replace(/\{\{(.+?)\}\}/g, (_, fieldName) => {
    const trimmed = fieldName.trim();
    // Skip special tags
    if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('^')) {
      return '';
    }
    return fieldMap.get(trimmed) ?? '';
  });

  return result;
}
