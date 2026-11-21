import type { Routes } from '@angular/router';
import { QitsMainLayout } from '@qits/ui-components';
import { NotFound } from './not-found/not-found';
import type { LandingRedirectData } from './ui/landing-redirect';

/**
 * Two doors, both inside the platform chrome, and both now hand-offs (qits-2359).
 *
 * **`QitsMainLayout` is the root route component** — the platform's convention, stated in the
 * component's own docs. Mounted this way the bar and the navigation mount once and survive every
 * navigation beneath them; wrapping each page in a tag would rebuild the whole skeleton on every
 * hop. It is an eager import for that reason: it is not a page, it is the frame the pages arrive
 * in, and a frame that loaded in its own chunk would show a blank application while it did.
 *
 * **Neither address draws a page of its own content here any more.** The technical processes
 * moved to the landing app — `''` to `/orchestrator`, `processes/:kind` to
 * `/orchestrator/processes/:kind` with the kind filled in and percent-encoded — and each instead
 * hands the reader to the landing app's own address, through the shared `LandingRedirect`, which
 * reads whichever `data` its own mount carries, typed by {@link LandingRedirectData}.
 *
 * **Every address here starts at the root**, because this application is served at `/` on its own
 * host. It is a `system` app: its pages are about the platform's housekeeping rather than about one
 * project, so it has no `/<slug>/...` form and adds none — picking a project in the chrome leaves
 * for qits-projects instead. The API keeps its segment and is path-routed on every host, so the
 * calls the landing app makes are unchanged.
 */
export const routes: Routes = [
  {
    path: '',
    component: QitsMainLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./ui/landing-redirect').then((m) => m.LandingRedirect),
        data: {
          landingPath: '/orchestrator',
          moved: 'The technical processes moved to the landing app.',
        } satisfies LandingRedirectData,
      },
      {
        path: 'processes/:kind',
        loadComponent: () => import('./ui/landing-redirect').then((m) => m.LandingRedirect),
        data: {
          landingPath: '/orchestrator/processes/:kind',
          moved: 'The technical processes moved to the landing app.',
        } satisfies LandingRedirectData,
      },
      { path: '**', component: NotFound },
    ],
  },
];
