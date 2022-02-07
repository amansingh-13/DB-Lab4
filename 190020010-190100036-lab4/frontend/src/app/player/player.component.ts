import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';
import Chart from 'chart.js/auto';


@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styles: [
  ]
})
export class PlayerComponent implements OnInit, AfterViewInit {

  player_id: string | null = ''
  player_data: any
  info: any
  bat: any
  batGraph: any
  bowl: any
  bowlGraph: any
  labels: Array<string>
  data1: any
  data2: any
  bowlChartData: any

  batStatX: any
  batStatY: any
  batStatZ: any

  constructor(private route: ActivatedRoute, private req: RequestsService, private router: Router) {
    this.labels = []
    this.data1 = []
    this.data2 = []
    this.batStatX = []
    this.batStatY = []
    this.batStatZ = []
  }

  ngOnInit(): void {
    this.player_id = this.route.snapshot.paramMap.get('player_id')

    if (this.player_id) {
      this.req.get(`/players/${this.player_id}`)
        .subscribe((data) => {
          this.player_data = data
          this.info = this.player_data.basic_info
          this.bat = this.player_data.batting_stats
          this.batGraph = this.player_data.batting_stats.graph_info
          this.drawbatGraph()
          this.bowl = this.player_data.bowling_stats
          this.bowlGraph = this.player_data.bowling_stats.graph_info
          this.drawbowlGraph()
        })
    }
  }

  drawbatGraph(): void {
    for (var i = 0; i < this.batGraph.length; i++) {
      this.batStatX.push(String(this.batGraph[i].match_id))
      this.batStatY.push(this.batGraph[i].sum)
      if (this.batGraph[i].sum < 30) {
        this.batStatZ.push('rgba(255, 159, 64, 0.8)')
      }
      else if (this.batGraph[i].sum <= 50) {
        this.batStatZ.push('rgba(255, 99, 132, 0.8)')
      }
      else {
        this.batStatZ.push('rgba(153, 102, 255, 0.2)')
      }
    }
    console.log(this.batStatX)
    console.log(this.batStatY)
    console.log(this.batStatZ)
  }

  drawbowlGraph(): void {
    this.labels = []
    for (var i = 0; i < this.bowlGraph.length; i++) {
      this.labels.push(String(this.bowlGraph[i].match_id))
      this.data1.push(this.bowlGraph[i].runs)
      this.data2.push(this.bowlGraph[i].wkts)
    }

    this.bowlChartData = {
      labels: this.labels,
      datasets: [
        {
          type: 'line',
          label: "Wickets Taken",
          data: this.data2,
          fill: false,
          borderColor: '#EC932F',
          backgroundColor: '#EC932F',
          pointBorderColor: '#EC932F',
          pointBackgroundColor: '#EC932F',
          pointHoverBackgroundColor: '#EC932F',
          pointHoverBorderColor: '#EC932F',
          yAxisID: 'y-axis-1'
        },
        {
          type: 'bar',
          label: "Runs concealed",
          data: this.data1,
          fill: false,
          backgroundColor: '#71B37C',
          borderColor: '#71B37C',
          hoverBackgroundColor: '#71B37C',
          hoverBorderColor: '#71B37C',
          yAxisID: 'y-axis-1'
        }
      ]
    };



  }

  ngAfterViewInit(): void {
    let ctx: any = document.getElementById('canvas')
    new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: this.bowlChartData.datasets
      }
    })

    let ctx2: any = document.getElementById('batting')
    new Chart(ctx2.getContext('2d'), {
      type: 'bar',
      data: {
        labels: this.batStatX,
        datasets: [{
          label: "less than 30 runs",
          data: this.batStatY,
          backgroundColor: this.batStatZ
        }],
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        }
      }

    })

  }

}
