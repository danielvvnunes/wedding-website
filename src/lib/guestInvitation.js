const STORAGE_KEY = "guest-invitation-slug";

export function saveGuestInvitationSlug(slug) {
  if (slug) {
    sessionStorage.setItem(STORAGE_KEY, slug);
  }
}

export function getGuestInvitationPath(searchParams) {
  const fromQuery = searchParams?.get?.("convite");
  if (fromQuery) return `/${fromQuery}`;

  const slug = sessionStorage.getItem(STORAGE_KEY);
  return slug ? `/${slug}` : "/";
}

export function guestInvitationQuery(slug) {
  return slug ? `?convite=${encodeURIComponent(slug)}` : "";
}
