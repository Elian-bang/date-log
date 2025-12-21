/**
 * Common Components Barrel Export
 */

export { ErrorBoundary } from './ErrorBoundary';
export { Header } from './Header';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorMessage } from './ErrorMessage';

// New Phase 3 components (5-state model support)
export { LoadingState, getLoadingVariant } from './LoadingState';
export { ErrorState, NetworkErrorState } from './ErrorState';
export {
  EmptyState,
  NoDateSelected,
  NoPlaces,
  NoRegions,
  NoSearchResults,
  NoDates
} from './EmptyState';
