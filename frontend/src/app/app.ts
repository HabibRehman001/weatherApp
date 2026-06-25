import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import gsap from 'gsap';
import {
  CachedCity,
  CitySuggestion,
  WeatherSearchResponse,
} from './models/weather.models';
import { WeatherService } from './services/weather.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  private readonly weather = inject(WeatherService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  readonly blobLayer = viewChild<ElementRef<HTMLDivElement>>('blobLayer');

  query = '';
  loading = signal(false);
  error = signal('');
  result = signal<WeatherSearchResponse | null>(null);
  suggestions = signal<CitySuggestion[]>([]);
  showSuggestions = signal(false);
  recent = signal<CachedCity[]>([]);
  activeSuggestion = signal(-1);

  ngOnInit(): void {
    this.loadRecent();
    this.searchInput$
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.length < 2) {
            this.suggestions.set([]);
            this.showSuggestions.set(false);
            return EMPTY;
          }
          return this.weather.suggestions(q);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (items) => {
          if (Array.isArray(items)) {
            this.suggestions.set(items);
            this.showSuggestions.set(items.length > 0);
            this.activeSuggestion.set(-1);
          }
        },
        error: () => {
          this.suggestions.set([]);
          this.showSuggestions.set(false);
        },
      });
  }

  ngAfterViewInit(): void {
    const layer = this.blobLayer()?.nativeElement;
    if (!layer) return;
    const blobs = layer.querySelectorAll('.blob');
    blobs.forEach((blob, i) => {
      gsap.to(blob, {
        x: `random(-80, 80)`,
        y: `random(-60, 60)`,
        scale: `random(0.85, 1.15)`,
        duration: `random(6, 10)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.8,
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(): void {
    this.searchInput$.next(this.query.trim());
  }

  onSearch(): void {
    const city = this.query.trim();
    if (!city) return;
    this.hideSuggestions();
    this.fetchWeather(city);
  }

  pickSuggestion(s: CitySuggestion): void {
    this.query = s.name;
    this.hideSuggestions();
    this.fetchWeather(s.name);
  }

  pickRecent(city: string): void {
    this.query = city;
    this.fetchWeather(city);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.suggestions();
    if (!this.showSuggestions() || !items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestion.update((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestion.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && this.activeSuggestion() >= 0) {
      event.preventDefault();
      this.pickSuggestion(items[this.activeSuggestion()]);
    } else if (event.key === 'Escape') {
      this.hideSuggestions();
    }
  }

  hideSuggestions(): void {
    this.showSuggestions.set(false);
    this.suggestions.set([]);
    this.activeSuggestion.set(-1);
  }

  onInputBlur(): void {
    setTimeout(() => this.hideSuggestions(), 150);
  }

  humidity(): number | null {
    const w = this.result()?.weather;
    if (!w?.hourly.relative_humidity_2m.length) return null;
    return w.hourly.relative_humidity_2m[0];
  }

  private fetchWeather(city: string): void {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);

    this.weather.search(city).subscribe({
      next: (data) => {
        this.result.set(data);
        this.loading.set(false);
        this.loadRecent();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Failed to fetch weather');
        this.loading.set(false);
      },
    });
  }

  private loadRecent(): void {
    this.weather.cached().subscribe({
      next: (cities) => this.recent.set(cities.slice(0, 8)),
      error: () => this.recent.set([]),
    });
  }
}
