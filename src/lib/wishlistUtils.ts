const GUEST_WISHLIST_KEY = "krisha-wishlist-guest";

export function getGuestWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
  } catch { return []; }
}

export function isInGuestWishlist(productId: string): boolean {
  return getGuestWishlist().includes(productId);
}

export function toggleGuestWishlist(productId: string): boolean {
  const list = getGuestWishlist();
  const idx = list.indexOf(productId);
  if (idx === -1) {
    list.push(productId);
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(list));
    return true;  // now in wishlist
  } else {
    list.splice(idx, 1);
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(list));
    return false; // removed
  }
}
