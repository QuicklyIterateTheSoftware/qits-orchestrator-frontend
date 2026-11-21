import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The shell, and deliberately nothing else (qits-2359). The chrome this app is seen through — the
 * sidebar, the top bar, the links out to the platform's other SPAs — is `QitsMainLayout` behind
 * the `''` route (see app.routes.ts), so it survives navigation rather than being rebuilt here.
 *
 * It used to also offer a process picker as a sub-menu, because picking a process *was* this
 * app's navigation. Both of this app's addresses now hand the reader straight to the landing app
 * instead, so there is nothing left for a sub-menu to pick between, and the outlet is the only
 * thing this component owns.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
