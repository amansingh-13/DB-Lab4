import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RequestsService } from '../requests.service';

@Component({
  selector: 'app-pointstable',
  templateUrl: './pointstable.component.html',
  styles: [
  ]
})
export class PointstableComponent implements OnInit {

  year: string|null = ''
  table: any
  parseFloat: any = parseFloat

  constructor(private req: RequestsService, private route: ActivatedRoute ) { }

  ngOnInit(): void {
    this.year = this.route.snapshot.paramMap.get('year')
    this.req.get(`/pointstable/${this.year}`)
    .subscribe((data) => {
      this.table = data
    })
  }

}
