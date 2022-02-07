import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
  <style>
  .green-txt{
    color: chartreuse;
  }  
  </style>
    <mat-toolbar color="primary" >
      <span>
        <button mat-button routerLink="matches" >
            Matches
        </button>
      </span>
      <span>
        <button mat-button routerLink="venues" >
            Venues
        </button>
      </span>
      <span>
        <button mat-button routerLink="venues/add" >
            Add Venue
        </button>
      </span>
    </mat-toolbar>

    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
}
