import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatchesComponent } from './matches/matches.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table'
import { MatCardModule } from '@angular/material/card'
import { MatButtonToggleModule } from '@angular/material/button-toggle'; 
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { PointstableComponent } from './pointstable/pointstable.component';
import { VenueComponent } from './venue/venue.component'; 

@NgModule({
  declarations: [
    AppComponent,
    MatchesComponent,
    PointstableComponent,
    VenueComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatCardModule,
    MatButtonToggleModule,
    FormsModule,
    MatButtonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
