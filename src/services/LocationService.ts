export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
  city?: string;
  country?: string;
  formattedAddress?: string;
}

export interface WeatherData {
  temperature: number; // in °C
  temperatureF: number; // in °F
  feelsLike?: number;
  condition: string;
  weatherCode: number;
  windSpeed: number; // km/h
  humidity?: number;
  isDay: boolean;
  city?: string;
  country?: string;
  lastFetched: number;
}

export type LocationPermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported' | 'disabled';

export interface LocationState {
  enabled: boolean;
  permission: LocationPermissionState;
  location: LocationData | null;
  weather: WeatherData | null;
  isLocating: boolean;
  isFetchingWeather: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function getWeatherCondition(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? 'Clear & Sunny' : 'Clear Sky';
  if (code === 1) return isDay ? 'Mostly Sunny' : 'Mostly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy & Misty';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rainy';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Passing Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Clear';
}

const STORAGE_KEY = 'sanaya_live_location_enabled';

class LocationService {
  private static instance: LocationService;
  private state: LocationState = {
    enabled: false,
    permission: 'prompt',
    location: null,
    weather: null,
    isLocating: false,
    isFetchingWeather: false,
    error: null,
    lastUpdated: null,
  };

  private watchId: number | null = null;
  private subscribers: Array<(state: LocationState) => void> = [];

  private constructor() {
    this.checkInitialPermission();
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public subscribe(callback: (state: LocationState) => void): () => void {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notifySubscribers() {
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }

  public getState(): LocationState {
    return this.state;
  }

  private async checkInitialPermission() {
    if (!('geolocation' in navigator)) {
      this.state.permission = 'unsupported';
      this.state.error = 'Geolocation is not supported by your browser.';
      this.notifySubscribers();
      return;
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' as any });
        this.state.permission = result.state as LocationPermissionState;

        result.addEventListener('change', () => {
          this.state.permission = result.state as LocationPermissionState;
          if (result.state === 'denied') {
            this.stopWatching();
          } else if (result.state === 'granted' && this.state.enabled) {
            this.startWatching();
          }
          this.notifySubscribers();
        });
      }
    } catch (e) {
      // Ignore fallback if permissions API not fully available
    }

    const storedEnabled = localStorage.getItem(STORAGE_KEY);
    if (storedEnabled === 'true') {
      this.enableLiveLocation();
    } else {
      this.notifySubscribers();
    }
  }

  public async enableLiveLocation(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      this.state.error = 'Geolocation API not supported in this browser.';
      this.state.permission = 'unsupported';
      this.notifySubscribers();
      return false;
    }

    this.state.enabled = true;
    localStorage.setItem(STORAGE_KEY, 'true');
    this.state.isLocating = true;
    this.state.error = null;
    this.notifySubscribers();

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await this.handlePositionUpdate(position);
          this.startWatching();
          resolve(true);
        },
        (err) => {
          this.handlePositionError(err);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  public disableLiveLocation() {
    this.state.enabled = false;
    localStorage.setItem(STORAGE_KEY, 'false');
    this.stopWatching();
    this.state.location = null;
    this.state.isLocating = false;
    this.state.error = null;
    this.notifySubscribers();
  }

  private startWatching() {
    if (this.watchId !== null || !('geolocation' in navigator)) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }

  private stopWatching() {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private async handlePositionUpdate(position: GeolocationPosition) {
    const coords = position.coords;
    const now = Date.now();

    const locData: LocationData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Math.round(coords.accuracy),
      altitude: coords.altitude,
      speed: coords.speed,
      timestamp: position.timestamp || now,
      city: this.state.location?.city,
      country: this.state.location?.country,
      formattedAddress: this.state.location?.formattedAddress,
    };

    this.state.location = locData;
    this.state.permission = 'granted';
    this.state.isLocating = false;
    this.state.error = null;
    this.state.lastUpdated = now;
    this.notifySubscribers();

    // Perform reverse geocoding and weather fetch in background
    this.reverseGeocode(locData.latitude, locData.longitude);
    this.fetchWeather(locData.latitude, locData.longitude);
  }

  public async fetchWeather(lat?: number, lon?: number): Promise<WeatherData | null> {
    const latitude = lat ?? this.state.location?.latitude;
    const longitude = lon ?? this.state.location?.longitude;

    if (latitude === undefined || longitude === undefined) {
      return null;
    }

    this.state.isFetchingWeather = true;
    this.notifySubscribers();

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch weather data');
      const data = await res.json();

      if (data && data.current_weather) {
        const cw = data.current_weather;
        const tempC = Math.round(cw.temperature);
        const tempF = Math.round((tempC * 9 / 5) + 32);
        const isDay = cw.is_day !== 0;
        const code = cw.weathercode ?? 0;
        const condition = getWeatherCondition(code, isDay);

        let humidity = 60;
        if (data.hourly && data.hourly.relative_humidity_2m && data.hourly.relative_humidity_2m.length > 0) {
          humidity = Math.round(data.hourly.relative_humidity_2m[0]);
        }

        const weather: WeatherData = {
          temperature: tempC,
          temperatureF: tempF,
          feelsLike: tempC + (isDay ? 1 : -1),
          condition,
          weatherCode: code,
          windSpeed: Math.round(cw.windspeed || 0),
          humidity,
          isDay,
          city: this.state.location?.city,
          country: this.state.location?.country,
          lastFetched: Date.now(),
        };

        const prevWeather = this.state.weather;
        this.state.weather = weather;
        this.state.isFetchingWeather = false;
        this.notifySubscribers();

        const weatherChanged = !prevWeather || prevWeather.condition !== weather.condition || prevWeather.temperature !== weather.temperature;
        if (weatherChanged) {
          window.dispatchEvent(new CustomEvent('sanaya_weather_updated', { detail: { weather, city: weather.city } }));
        }

        return weather;
      }
    } catch (err: any) {
      console.warn('[LocationService] Weather fetch error:', err);
      this.state.isFetchingWeather = false;
      this.notifySubscribers();
    }
    return null;
  }

  private async reverseGeocode(lat: number, lon: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        { headers: { 'User-Agent': 'SanayaHologramAI/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state;
          const country = data.address.country;
          const formattedAddress = data.display_name;

          if (this.state.location) {
            this.state.location.city = city;
            this.state.location.country = country;
            this.state.location.formattedAddress = formattedAddress;
            if (this.state.weather) {
              this.state.weather.city = city;
              this.state.weather.country = country;
            }
            this.notifySubscribers();
          }
        }
      }
    } catch (e) {
      // Reverse geocoding optional fallback
    }
  }

  private handlePositionError(error: GeolocationPositionError) {
    this.state.isLocating = false;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.state.permission = 'denied';
        this.state.error = 'Live Location permission was denied by user/browser.';
        this.state.enabled = false;
        localStorage.setItem(STORAGE_KEY, 'false');
        break;
      case error.POSITION_UNAVAILABLE:
        this.state.error = 'Live Location position is unavailable.';
        break;
      case error.TIMEOUT:
        this.state.error = 'Live Location request timed out.';
        break;
      default:
        this.state.error = error.message || 'Unknown location error.';
        break;
    }
    this.notifySubscribers();
  }
}

export const locationService = LocationService.getInstance();
