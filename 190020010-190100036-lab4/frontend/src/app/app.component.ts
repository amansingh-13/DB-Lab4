import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div style="padding-bottom: 1em">
      [app.component] we may put links to different components in a header here
    </div>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
}
