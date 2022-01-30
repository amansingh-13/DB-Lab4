import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  private BASE:string = 'http://localhost:5000'

  public get(url:string){
    return this.http.get<JSON>(this.BASE+url)
  }

  constructor(private http: HttpClient) { }
}
