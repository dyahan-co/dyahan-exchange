import { Navigate, useRoutes, type RouteObject } from 'react-router-dom';

type FeatureRoutes = { routes: RouteObject[] };

// Each feature branch contributes one route module. This keeps market, auth,
// and guess pages independently reviewable while sharing this route host.
const featureModules = import.meta.glob<FeatureRoutes>('./routes/*.tsx', {
  eager: true,
});

const featureRoutes = Object.values(featureModules).flatMap(({ routes }) => routes);

export function App() {
  return useRoutes([...featureRoutes, { path: '*', element: <Navigate to="/" replace /> }]);
}
