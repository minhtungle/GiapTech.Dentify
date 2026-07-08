interface NamedEntity {
  id: string
}

// Resolves an imported CSV reference to an entity ID: prefers the hidden ID
// column (round-trip from our own export) and falls back to an exact,
// case-insensitive name match against the already-loaded entity list (for
// hand-authored CSV files that only have the display name).
export function resolveEntityId<T extends NamedEntity>(
  entities: T[],
  idValue: string | undefined,
  nameValue: string | undefined,
  getName: (entity: T) => string,
): { id: string | null; error: string | null } {
  const id = idValue?.trim()
  if (id && entities.some((e) => e.id === id)) {
    return { id, error: null }
  }

  const name = nameValue?.trim()
  if (!name) {
    return { id: null, error: null }
  }

  const matches = entities.filter((e) => getName(e).toLowerCase() === name.toLowerCase())
  if (matches.length === 0) {
    return { id: null, error: `không tìm thấy "${name}"` }
  }
  if (matches.length > 1) {
    return { id: null, error: `"${name}" khớp nhiều bản ghi, hãy dùng cột ID` }
  }
  return { id: matches[0].id, error: null }
}
