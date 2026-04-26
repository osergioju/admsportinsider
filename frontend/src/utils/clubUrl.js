export function clubUrl(id, slug) {
  if (!slug) return `/dashboard/clubs/${id}`;
  const idx = slug.indexOf("_");
  const urlSlug = idx >= 0 ? slug.slice(idx + 1) : slug;
  return `/dashboard/clubs/${id}/${urlSlug}`;
}
