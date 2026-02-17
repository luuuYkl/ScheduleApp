# Migration Record: Mobile layout guidance documentation

- Date: 2026-02-17
- Type: Knowledge migration (documentation only)
- Scope: `docs/MOBILE_NAV_LAYOUT_GUIDANCE.md`

## Background
A new guidance document was added to define mobile-first layout and navigation recommendations for viewing the app at `http://192.168.0.100:5173/`.

## Why this migration is needed
Recent CI checks include migration documentation linting for documentation updates. This record ensures the guidance update remains auditable and compliant.

## Impact assessment
- Runtime impact: none
- API/Data impact: none
- Build impact: none
- User-facing behavior impact: none (guidance-only change)

## Rollback
If guidance content is not desired, revert:
- `docs/MOBILE_NAV_LAYOUT_GUIDANCE.md`
- `docs/migrations/2026-02-17-mobile-layout-guidance-migration.md`

## Verification checklist
- [x] Guidance file exists and is readable.
- [x] Migration record is created for doc-lint compliance.
- [x] No source code or runtime files changed.
