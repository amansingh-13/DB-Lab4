import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';

@Component({
  selector: 'app-newvenue',
  templateUrl: './newvenue.component.html',
  styles: [
  ]
})
export class NewvenueComponent implements OnInit {

  Form = new FormGroup(
    {
      name: new FormControl('', Validators.required),
      country: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      capacity: new FormControl('', Validators.required),
    }
  )

  constructor(private route: ActivatedRoute, private req: RequestsService, private router: Router) { }

  ngOnInit(): void {
  }

  onSubmit(){
    this.req.post(`/venues/add`, this.Form.value).subscribe(
      response => 
      { 
        alert("Form Submission Successful")
        this.Form.reset() 
      },
      error => 
      {
        console.log(error)
        alert("Form Submission Not Successful!\
        Check Again")
      }
    )
  }

}
