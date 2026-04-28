

# Landing Page Enhancements: Parallax Hero, Education Posts & Pagination

## Overview

Enhance the landing page with parallax scrolling effects in the hero section, a new "Latest Posts" section that fetches published education content from the backend API, and pagination for browsing posts.

## 1. Hero Parallax & Smooth Scroll Animations

**File: `src/pages/Index.tsx`**

- Use framer-motion's `useScroll` and `useTransform` hooks to create parallax layers in the hero:
  - Background blobs move at a slower rate (0.3x scroll speed)
  - Grid pattern shifts slightly
  - Hero text content moves up faster than background (1.2x), creating depth
  - Stats bar fades out and translates down as user scrolls past
- Add a floating animated element (e.g., subtle pulse on the badge, gentle Y-oscillation on decorative elements)
- Smooth scroll behavior added to the root `<div>` via `scroll-smooth` class

## 2. Latest Posts Section (Education Content from Backend)

**File: `src/pages/Index.tsx`**

- Add a new `AnimatedSection` between Services and About sections titled "Latest Posts"
- Fetch published education content from the backend using a public-friendly endpoint: `GET /education?page=1&per_page=6`
- Display posts in a responsive 3-column card grid:
  - Each card shows: thumbnail placeholder (category icon), title, description (truncated), category badge, author, published date, read time
  - Hover effects consistent with the service cards (border glow, gradient overlay)
- If the API call fails or returns empty, show a graceful empty state ("No posts yet")

## 3. Pagination for Posts

**File: `src/pages/Index.tsx`**

- Use the existing `Pagination` component from `src/components/ui/pagination.tsx`
- Track `currentPage` state; fetch new data when page changes
- Show pagination controls below the posts grid (Previous / page numbers / Next)
- Display total count from API response metadata

## 4. Navigation Update

- Add "Posts" to the navbar `navLinks` array pointing to `#posts`
- Add `scroll-mt-24` to the posts section for proper scroll offset

## Technical Details

- **Data fetching**: Use `useState` + `useEffect` with `educationService.getAll({ page, per_page: 6 })` -- no auth required for published content (the backend's `getForRole` returns published content)
- **Parallax implementation**: `useScroll()` gives `scrollY`, then `useTransform(scrollY, [0, 500], [0, -150])` for the text layer, `[0, 500], [0, -50]` for blobs
- **No new dependencies** -- framer-motion already installed, pagination component exists
- **Responsive**: 1 column on mobile, 2 on sm, 3 on lg

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add parallax hooks to hero, new Posts section with pagination, update nav |

