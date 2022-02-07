import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchesComponent } from './matches/matches.component';
import { PointstableComponent } from './pointstable/pointstable.component';
import { VenueComponent } from './venue/venue.component';
import { PlayerComponent } from './player/player.component';
import { NewvenueComponent } from './newvenue/newvenue.component';

const routes: Routes = [
  { path: 'matches', redirectTo: 'matches/', pathMatch: 'full' },
  { path: 'matches/:id', component: MatchesComponent },
  { path: 'pointstable/:year', component: PointstableComponent },
  { path: 'venues', component: VenueComponent },
  { path: 'venue/:venue_id', component: VenueComponent },
  { path: 'players/:player_id', component: PlayerComponent },
  { path: 'venues/add', component: NewvenueComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
