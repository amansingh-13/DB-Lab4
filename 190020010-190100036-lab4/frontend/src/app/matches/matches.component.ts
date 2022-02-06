import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styles: [
  ]
})
export class MatchesComponent implements OnInit, AfterViewInit {
  params: {limit: number, skip: number} = {limit:10, skip:0}
  match_id: string|null = ''
  match_data: any
  i1_team: string = ''
  i2_team: string = ''
  csv_team1_players: string = ''
  csv_team2_players: string = ''
  csv_umpires: string = ''
  option:string = ''

  constructor(private route: ActivatedRoute, private req: RequestsService, private router : Router) { }

  public navigate(delta: number):void {
    this.params.skip += delta
    this.router.navigateByUrl(`/matches/?limit=${this.params.limit}&skip=${this.params.skip}`)
  }

  // how do we know that match_data is defined (it always works though) 
  public draw(ctx:any, agg:any, name:string):void {
    new Chart(ctx.getContext('2d'), {
      type: 'pie',
      data: {
          labels: ['Sixes', 'Extras', 'Ones', 'Twos', 'Threes', 'Fours'],
          datasets: [{
            data: [agg.sixes, agg.extras, agg.ones, agg.twos, agg.threes, agg.fours],
            backgroundColor: ['green','pink','yellow','red','black','blue']
          }]
      },
      options: {
        plugins: {
          title: { display: true, text: name }
        }
      }
    })
  }

  // https://levelup.gitconnected.com/all-you-need-to-know-about-angular-parameters-309828b30826
  ngOnInit(): void {
    this.match_id = this.route.snapshot.paramMap.get('id')
    this.route.queryParamMap.subscribe((params) => {
      this.params.limit = parseInt(params.get('limit') || '10')
      this.params.skip = parseInt(params.get('skip') || '0')
      if(!this.match_id){
        this.req.get(`/matches?limit=${this.params.limit}&skip=${this.params.skip}`)
        .subscribe(data => {this.match_data = data})
      }
    })
    if(this.match_id){
      this.req.get(`/matches/${this.match_id}`)
      .subscribe((data) => {
        this.match_data = data
        let info = this.match_data.info
        if((info.toss_winner == info.team1 && info.toss_name == 'bat') ||
          (info.toss_winner != info.team1 && info.toss_name == 'field')){
            this.i1_team = info.team1
            this.i2_team = info.team2
        } else {
            this.i1_team = info.team2
            this.i2_team = info.team1
        }
        this.csv_team1_players = this.match_data.team1.map((x:any)=>x.player_name).join(', ')
        this.csv_team2_players = this.match_data.team2.map((x:any)=>x.player_name).join(', ')
        this.csv_umpires = this.match_data.umpires.map((x:any)=>x.umpire_name).join(', ')
      })
    }
  }

  ngAfterViewInit(): void {
    if(this.match_id){
      this.draw(document.getElementById('pie1'), this.match_data.agg1, this.i1_team)
      this.draw(document.getElementById('pie2'), this.match_data.agg2, this.i2_team)

      let ctx:any = document.getElementById('total')
      new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
          labels: [...Array(21).keys()],
          datasets: [{
            data: [0, ...this.match_data.total1.map((x:any) => x.total)],
            fill: false,
            label: this.i1_team,
            borderColor: 'red',
            pointRadius: [0, ...this.match_data.wicket1.map((x:any) => 5*x.out)]
          }, {
            data: [0, ...this.match_data.total2.map((x:any) => x.total)],
            fill: false,
            label: this.i2_team,
            borderColor: 'blue',
            pointRadius: [0, ...this.match_data.wicket2.map((x:any) => 5*x.out)]
          }]
        },
        options: {
          scales: {
            y: {
              title: {
                display: true,
                text: 'Runs'
              },
            },
            x: {
              title: {
                display: true,
                text: 'Over'
              },
            }
          }
        }
      })
    }
  }

}
