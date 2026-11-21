import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideQitsNavigationLinks } from '@qits/ui-components';
import { App } from './app';
import { routes } from './app.routes';
import { NAVIGATE_AWAY } from './ui/navigate-away';

/**
 * A fixture navigation, not the platform's. `provideQitsNavigationLinks` answers the layout's
 * `QITS_NAVIGATION` from a literal, so the chrome makes no `/main-navigation` request — which is
 * what keeps `http.verify()` honest instead of failing on a call this file never asked for.
 */
const NAV = [
  { label: 'Deployments', href: '/platform-deployments/' },
  { label: 'Orchestrator', href: '/orchestrator/' },
] as const;

/**
 * The shell owns one thing — the outlet — so that is what is asserted here, plus the route table
 * putting every door inside the chrome (qits-2359). It used to also offer a process picker as a
 * sub-menu; both of this app's addresses now hand off to the landing app, so there is nothing
 * left to pick between, and `LandingRedirect`'s own spec is where the hand-off itself is proven.
 */
describe('App', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideQitsNavigationLinks(NAV),
        // Both doors fire this the moment they mount; nothing here tests where it goes —
        // `landing-redirect.spec.ts` does — so this keeps it from ever reaching jsdom's
        // unimplemented real navigation.
        { provide: NAVIGATE_AWAY, useValue: () => undefined },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('is an outlet and nothing else', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const shell = fixture.nativeElement as HTMLElement;
    expect(shell.querySelector('router-outlet')).not.toBeNull();
    expect(shell.querySelector('qits-main-layout')).toBeNull();
    http.verify();
  });

  it('routes the base path to the shared layout, inside the chrome', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();

    const layout = harness.routeNativeElement as HTMLElement;
    expect(layout.tagName.toLowerCase()).toBe('qits-main-layout');
    expect(layout.querySelectorAll('nav a')).toHaveLength(NAV.length);
    expect(layout.querySelector('main app-landing-redirect')).not.toBeNull();
    http.verify();
  });

  it('routes a process kind to the hand-off page, still inside the chrome', async () => {
    const harness = await RouterTestingHarness.create('/processes/gc');
    await harness.fixture.whenStable();

    const layout = harness.routeNativeElement as HTMLElement;
    expect(layout.tagName.toLowerCase()).toBe('qits-main-layout');
    expect(layout.querySelector('main app-landing-redirect')).not.toBeNull();
    http.verify();
  });

  it('draws an unknown URL under /orchestrator/ as a page, still inside the chrome', async () => {
    const harness = await RouterTestingHarness.create('/nothing-here');

    const layout = harness.routeNativeElement as HTMLElement;
    expect(layout.tagName.toLowerCase()).toBe('qits-main-layout');
    expect(layout.querySelector('main app-not-found')).not.toBeNull();
    http.verify();
  });
});
