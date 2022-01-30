import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchesComponent } from './matches/matches.component';

const routes: Routes = [
  { path: 'matches', redirectTo: 'matches/', pathMatch: 'full' },
  { path: 'matches/:id', component: MatchesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
