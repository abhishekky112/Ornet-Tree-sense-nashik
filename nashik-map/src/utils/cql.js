const escapeCql = (value) => String(value).replace(/'/g, "''");

export function equalFilter(field, value) {
  return `${field} = '${escapeCql(value)}'`;
}

export function inFilter(field, values) {
  const safe = values.map((value) => `'${escapeCql(value)}'`).join(', ');
  return safe ? `${field} IN (${safe})` : '';
}

export function andFilters(filters) {
  return filters.filter(Boolean).map((f) => `(${f})`).join(' AND ');
}
