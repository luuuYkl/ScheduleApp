# Copilot Instructions for Schedule App

## Project Overview
This is a Vue 3 + TypeScript habit tracking and schedule management app built with Vite. The app features plan creation, task management, daily check-ins, and streak tracking with a responsive mobile-first design.

## Architecture Principles

### Mock-First Development Pattern
- **Configuration**: `src/config.ts` contains `APP_CONFIG.USE_MOCK_API` flag that toggles between mock and real backend
- **API Layer**: `src/services/api.ts` exports unified `API` interface that automatically switches between `mockAPI` and `backendAPI` implementations
- **Type Safety**: All API contracts defined in `src/services/api.types.ts` with strict `APIInterface` ensuring mock/backend parity
- **Pattern**: Always implement mock data first, then add real backend endpoints using identical signatures

### State Management with Pinia
- **Store Pattern**: Each store uses Vue 3 Composition API with `defineStore("storeName", () => {})`
- **Naming**: Store files in `src/store/` use plural names (e.g., `plans.ts` manages both plans and tasks)
- **Data Flow**: Stores directly call `API` methods and update local reactive state after successful backend calls
- **Example**: `usePlanStore` in `src/store/plans.ts` manages both plans and tasks in single store for related data

### Routing and Authentication
- **Guard Pattern**: `src/router/index.ts` uses `beforeEach` guard checking `meta.requiresAuth`
- **Token Management**: User store handles token persistence via localStorage with automatic restoration
- **Route Structure**: Uses nested structure `/plan/:id/tasks` with props passed to components
- **Debug Mode**: Router includes console logging for navigation debugging (controlled by guards)

### Component Organization
- **Page Components**: Located in `src/pages/` organized by feature (Auth/, Plan/, Task/, etc.)
- **Feature Components**: Located in `src/components/` with sub-folders by domain (auth/, calendar/, task/, etc.)
- **Common Components**: Reusable UI components in `src/components/common/` (Button.vue, Card.vue, Modal.vue)

## Key Development Patterns

### TypeScript Configuration
- Uses `@` alias for `src/` directory (configured in `vite.config.ts` and `tsconfig.json`)
- Strict type checking with separate configs: `tsconfig.app.json`, `tsconfig.node.json`
- Vue SFC TypeScript support with `<script setup lang="ts">`

### CSS and Styling
- **Global Styles**: Main styles in `src/assets/style.css` and `src/style.css`
- **Component Scoping**: Use `<style scoped>` for component-specific styles
- **Mobile-First**: Bottom navigation with responsive design, fixed footer on mobile
- **CSS Variables**: Uses CSS custom properties like `--footer-height`, `--color-muted`

### Testing Strategy
- **Framework**: Vitest with jsdom environment for Vue component testing
- **Location**: Tests in `__tests__/` folders within feature directories
- **Coverage**: Run `npm run coverage` for test coverage reports
- **Pattern**: Test business logic separately (e.g., `generate-log.spec.ts` tests utility functions)

## Critical Workflows

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production (runs vue-tsc first)
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run coverage     # Run tests with coverage
```

### Adding New Features
1. **API First**: Define types in `api.types.ts`, implement in `mockAPI`, add to `APIInterface`
2. **Store**: Create/update Pinia store with methods that call API and update local state
3. **Routes**: Add route with appropriate `meta.requiresAuth` in router
4. **Components**: Create page component in `src/pages/`, feature components in `src/components/`
5. **Testing**: Add tests in `__tests__/` folders for business logic

### State Updates Pattern
```typescript
// Always follow this pattern in stores:
async function updateItem(id: number, data: UpdatePayload) {
  const updated = await API.updateItem(id, data);  // Backend call first
  const index = items.value.findIndex(item => item.id === id);
  if (index !== -1) items.value[index] = updated;  // Update local state
  return updated;
}
```

### Authentication Flow
- Login/register calls `API.login()` which returns user with optional token
- User store automatically persists to localStorage
- Router guard checks token and calls `store.restore()` on navigation
- Failed auth redirects to `/login?redirect=<original-path>`

## File Artifacts Note
Ignore `.vue.js` files in `src/` - these are TypeScript compilation artifacts and should not be edited manually. Always edit the corresponding `.vue` files.

## Integration Points
- **API Switching**: Toggle `APP_CONFIG.USE_MOCK_API` to switch between mock/real backend
- **Persistence**: User authentication state persisted via localStorage
- **Navigation**: Bottom nav visibility controlled by route `meta.showBottomNav`
- **Avatar Service**: Uses DiceBear API for user avatars based on username