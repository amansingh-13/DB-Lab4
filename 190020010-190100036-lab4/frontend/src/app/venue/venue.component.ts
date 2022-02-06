import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RequestsService } from '../requests.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-venue',
  templateUrl: './venue.component.html',
  styles: [
  ]
})
export class VenueComponent implements OnInit, AfterViewInit {
  venue_id: string|null = ''
  venue_data: any

  constructor(private route: ActivatedRoute, private req: RequestsService) { }

  ngOnInit(): void {
    this.venue_id = this.route.snapshot.paramMap.get('venue_id')

    if(this.venue_id){
      this.req.get(`/venue/${this.venue_id}`).subscribe((data) => {
        this.venue_data = data
      })
    }
    else{
      this.req.get(`/venues`).subscribe((data) => {
        this.venue_data = data
      })
    }
  }

  ngAfterViewInit(): void {
    if(this.venue_id){
      let ctx:any = document.getElementById('win_dist')
      new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Team batting 1st won', 'Team batting 2nd won', 'Draw'],
            datasets: [{
              data: [this.venue_data.win.first, this.venue_data.win.second, 0],
              backgroundColor: ['blue', 'red', 'orange']
            }]
        }
      })
      let ctx2:any = document.getElementById('avg_graph')
      new Chart(ctx2.getContext('2d'), {
        type: 'line',
        data: {
          labels: this.venue_data.avg.map((x:any) => x.season_year),
          datasets: [{
            data: this.venue_data.avg.map((x:any) => x.avg),
            fill: false,
            label: 'Average first innings score',
            borderColor: 'blue'
          }],
        },
        options: {
          scales: {
            y: {
              title: {
                display: true,
                text: 'Runs'
              },
              beginAtZero: true
            },
            x: {
              title: {
                display: true,
                text: 'Year'
              },
              grid: {
                display: false
              },
              offset: true
            }
          }
        }
      })
    }
  }
}
