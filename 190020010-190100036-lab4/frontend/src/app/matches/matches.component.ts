import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { RequestsService } from '../requests.service';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styles: [
  ]
})
export class MatchesComponent implements OnInit {
  params: {limit: string|null, skip: string|null} = {limit:'10', skip:'0'}
  match_id: string|null = ''
  matches: any = []

  constructor(private route: ActivatedRoute, private req: RequestsService) { }

  // https://levelup.gitconnected.com/all-you-need-to-know-about-angular-parameters-309828b30826
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.params.limit = params.get('limit')
      this.params.skip = params.get('skip')
    })
    this.match_id = this.route.snapshot.paramMap.get('id')

    this.req.get(`/matches?limit=${this.params.limit}&skip=${this.params.skip}`)
    .subscribe((data) => {
      this.matches = data
    })
  }

}
