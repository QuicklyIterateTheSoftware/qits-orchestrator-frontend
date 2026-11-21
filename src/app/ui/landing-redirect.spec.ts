import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideQitsNavigation, provideQitsNavigationTree } from '@qits/ui-components';
import { routes } from '../app.routes';
import { NAVIGATE_AWAY } from './navigate-away';
import {
  LANDING_ORIGIN_WAIT_MS,
  LandingRedirect,
  type LandingRedirectData,
} from './landing-redirect';

/** Where the fixture navigation says `qits-landing` answers — its own host, not this one. */
const LANDING_ORIGIN = 'https://landing.qits.example';

/**
 * The hand-off both of this application's addresses now mount: the listing at `''` and a
 * process's own runs at `processes/:kind` (qits-2359) — the point of this group is that the
 * hand-off actually happens through real routing, rather than a stubbed `ActivatedRoute` —
 * `app.spec.ts` never instantiates this page either, so this is the only place reaching one of
 * these addresses through the real route table would show a wrong destination.
 */
describe('LandingRedirect', () => {
  describe('reached through routing', () => {
    let harness: RouterTestingHarness;
    let navigateAway: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      navigateAway = vi.fn();
      TestBed.configureTestingModule({
        providers: [
          provideRouter(routes),
          provideLocationMocks(),
          provideHttpClient(),
          provideHttpClientTesting(),
          provideQitsNavigationTree({
            applications: { 'qits-landing': { origin: LANDING_ORIGIN } },
          }),
          { provide: NAVIGATE_AWAY, useValue: navigateAway },
        ],
      });
      harness = await RouterTestingHarness.create();
    });

    it('hands the process listing off to the landing app', async () => {
      await harness.navigateByUrl('/');
      await vi.waitFor(() => expect(navigateAway).toHaveBeenCalled());
      expect(navigateAway).toHaveBeenCalledWith(`${LANDING_ORIGIN}/orchestrator`);
    });

    it('hands one process off to the landing app', async () => {
      await harness.navigateByUrl('/processes/gc');
      await vi.waitFor(() => expect(navigateAway).toHaveBeenCalled());
      expect(navigateAway).toHaveBeenCalledWith(`${LANDING_ORIGIN}/orchestrator/processes/gc`);
    });

    /** The kind rides through `:kind` in `landingPath`, percent-encoded — not copied from the URL
     * as-is. */
    it('hands a process off to the landing app, with its kind encoded', async () => {
      await harness.navigateByUrl('/processes/dev%20gc');
      await vi.waitFor(() => expect(navigateAway).toHaveBeenCalled());
      expect(navigateAway).toHaveBeenCalledWith(
        `${LANDING_ORIGIN}/orchestrator/processes/dev%20gc`,
      );
    });
  });

  /**
   * The origin-resolution fallback chain, and the route `data` this component reads, in isolation
   * from the route table that decides which page gets reached at all — the group above covers that.
   */
  describe('when the landing origin never answers', () => {
    const DATA: LandingRedirectData = {
      landingPath: '/orchestrator',
      moved: 'The technical processes moved to the landing app.',
    };

    function configure(...providers: unknown[]): { navigateAway: ReturnType<typeof vi.fn> } {
      const navigateAway = vi.fn();
      TestBed.configureTestingModule({
        providers: [
          { provide: NAVIGATE_AWAY, useValue: navigateAway },
          { provide: ActivatedRoute, useValue: { snapshot: { data: DATA } } },
          ...providers,
        ],
      });
      return { navigateAway };
    }

    /**
     * A navigation that never answers must not strand the reader on this page forever —
     * {@link LANDING_ORIGIN_WAIT_MS} is the backstop. Before that bound passes, and with no origin
     * known yet, the page says so rather than showing a link to nowhere; `provideQitsNavigation()`
     * makes the one real request this component waits on, and leaving it unflushed models a
     * navigation that is slow, or dead, rather than one that answered with nothing.
     */
    it('shows the fallback message while no origin is known, then falls back to a relative path', async () => {
      vi.useFakeTimers();
      try {
        const { navigateAway } = configure(
          provideHttpClient(),
          provideHttpClientTesting(),
          provideQitsNavigation(),
        );
        const fixture = TestBed.createComponent(LandingRedirect);
        fixture.detectChanges();
        const http = TestBed.inject(HttpTestingController);
        http.expectOne('/main-navigation');
        expect(navigateAway).not.toHaveBeenCalled();

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('The technical processes moved to the landing app');
        expect(fixture.nativeElement.querySelector('a')).toBeNull();

        await vi.advanceTimersByTimeAsync(LANDING_ORIGIN_WAIT_MS);
        fixture.detectChanges();

        // Neither qits-landing's own origin nor the environment's is known without an answer, so
        // the last fallback — same-origin, a bare path — is what the reader gets rather than a hang.
        expect(navigateAway).toHaveBeenCalledWith('/orchestrator');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
