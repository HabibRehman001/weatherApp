import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CachedCity,
  CitySuggestion,
  WeatherSearchResponse,
} from '../models/weather.models';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/weather';

  search(city: string): Observable<WeatherSearchResponse> {
    return this.http.get<WeatherSearchResponse>(`${this.base}/search`, {
      params: { city },
    });
  }

  suggestions(q: string): Observable<CitySuggestion[]> {
    return this.http.get<CitySuggestion[]>(`${this.base}/suggestions`, {
      params: new HttpParams().set('q', q),
    });
  }

  cached(): Observable<CachedCity[]> {
    return this.http.get<CachedCity[]>(`${this.base}/cached`);
  }
}







