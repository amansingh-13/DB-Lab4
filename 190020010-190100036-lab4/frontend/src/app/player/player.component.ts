import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';
import Chart from 'chart.js/auto';
import { AnyObject } from 'chart.js/types/basic';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styles: [
  ]
})
export class PlayerComponent implements OnInit, AfterViewInit  {

  player_id : string|null=''
  player_data : any
  info : any
  bat : any 
  batGraph : any
  bowl: any
  bowlGraph: any

  constructor(private route: ActivatedRoute, private req: RequestsService, private router : Router) { }

  ngOnInit(): void {
    this.player_id = this.route.snapshot.paramMap.get('player_id')
    
    console.log(this.player_id)

    if(this.player_id){
      this.req.get(`/players/${this.player_id}`)
      .subscribe((data) => {
        this.player_data = data
        this.info = this.player_data.basic_info
        this.bat = this.player_data.batting_stats
        this.batGraph = this.player_data.batting_stats.graph_info
        this.bowl = this.player_data.bowling_stats
        this.batGraph = this.player_data.bowling_stats.graph_info
        console.log(this.bowl)
      })
    }
  }

  ngAfterViewInit(): void {
  }

}
