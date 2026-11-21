import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A URL under `/orchestrator/` that this app does not recognise.
 *
 * It renders a small page and stops there. It deliberately does **not** copy spa-home's behaviour of
 * handing the URL back to the gateway: that is the landing page's job, and it is correct only
 * because spa-home is mounted at the root, where an unknown first segment is another micro
 * frontend. Here the segment is already ours, so there is nobody to hand it to.
 *
 * `/orchestrator/api` and `/orchestrator/q` never reach this page — the service claims both ahead
 * of the SPA, through `quarkus.quinoa.ignored-path-prefixes`, so a mistyped machine path is a 404
 * from Quarkus rather than this component.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>No such page here</h1>
    <p>
      This is the orchestrator. The technical processes it runs against itself moved to the landing
      app (qits-2359) — this host now only hands the two addresses it still answers off to it.
    </p>
    <p><a routerLink="/">Back to the processes</a></p>
  `,
  styles: `
    h1 {
      font-size: 1.25rem;
      margin: 0 0 0.5rem;
    }
  `,
})
export class NotFound {}
