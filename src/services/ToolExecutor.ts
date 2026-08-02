import { ToolCallItem } from '../types';
import { locationService } from './LocationService';

export class ToolExecutor {
  private onAppActionHandler?: (appName: string, actionData?: any) => void;

  public setOnAppAction(handler: (appName: string, actionData?: any) => void) {
    this.onAppActionHandler = handler;
  }

  public async executeToolCalls(functionCalls: any[]): Promise<{
    executedItems: ToolCallItem[];
    functionResponses: any[];
  }> {
    const executedItems: ToolCallItem[] = [];
    const functionResponses: any[] = [];

    for (const call of functionCalls) {
      const callId = call.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const name = call.name;
      const args = call.args || {};

      let responsePayload: any = { success: true };

      try {
        switch (name) {
          case 'getCurrentTime': {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateString = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            responsePayload = {
              currentTime: timeString,
              currentDate: dateString,
              timeZone,
              formatted: `${timeString} on ${dateString} (${timeZone})`
            };
            break;
          }

          case 'getWeather': {
            const locState = locationService.getState();
            let weather = locState.weather;
            if (!weather && locState.location) {
              weather = await locationService.fetchWeather();
            }
            if (weather) {
              responsePayload = {
                city: weather.city || 'User Location',
                temperatureC: weather.temperature,
                temperatureF: weather.temperatureF,
                condition: weather.condition,
                windSpeedKmH: weather.windSpeed,
                humidity: weather.humidity,
                isDay: weather.isDay,
                formatted: `Current weather in ${weather.city || 'your area'}: ${weather.temperature}°C (${weather.temperatureF}°F), ${weather.condition}`,
              };
            } else {
              responsePayload = {
                status: 'Live location permission is required to fetch local weather.',
                enabled: locState.enabled,
              };
            }
            break;
          }

          case 'openWebsite': {
            let url = args.url || 'https://google.com';
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = `https://${url}`;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
            responsePayload = {
              openedUrl: url,
              status: 'Website opened successfully in a new tab'
            };
            break;
          }

          case 'searchWeb': {
            const query = args.query || '';
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.open(searchUrl, '_blank', 'noopener,noreferrer');
            responsePayload = {
              searchQuery: query,
              searchUrl,
              status: 'Search executed in new tab'
            };
            break;
          }

          case 'openApplication': {
            const appName = args.appName || 'notes';
            const actionData = args.actionData;

            if (this.onAppActionHandler) {
              this.onAppActionHandler(appName, actionData);
            }

            responsePayload = {
              appName,
              actionData,
              status: `Opened application feature: ${appName}`
            };
            break;
          }

          case 'saveUserMemory': {
            const { category, topic, value, confidence, notes } = args;
            const res = await fetch('/api/memories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category, topic, value, confidence, notes }),
            });
            const data = await res.json();
            responsePayload = {
              success: true,
              message: `Memory saved in Sanaya's Brain: [${category}] ${topic} = ${value}`,
              memory: data.memory,
            };
            window.dispatchEvent(new CustomEvent('sanaya_memory_updated'));
            break;
          }

          case 'getStoredMemories': {
            const { category, query } = args;
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (query) params.append('query', query);

            const res = await fetch(`/api/memories?${params.toString()}`);
            const data = await res.json();
            responsePayload = {
              memories: data.memories || [],
              totalCount: data.totalCount || 0,
              status: `Retrieved ${data.totalCount || 0} memories from Sanaya's Brain`,
            };
            break;
          }

          case 'deleteUserMemory': {
            const { topic, clearAll } = args;
            let res;
            if (clearAll || topic === 'all') {
              res = await fetch('/api/memories/clear', { method: 'DELETE' });
            } else {
              res = await fetch(`/api/memories/topic/${encodeURIComponent(topic || '')}`, { method: 'DELETE' });
            }
            const data = await res.json();
            responsePayload = {
              success: data.success,
              message: clearAll ? "All memories erased from Sanaya's Brain" : `Memory '${topic}' erased`,
            };
            window.dispatchEvent(new CustomEvent('sanaya_memory_updated'));
            break;
          }

          default: {
            responsePayload = {
              status: `Executed custom browser function ${name}`,
              args
            };
            break;
          }
        }

        executedItems.push({
          id: callId,
          name,
          args,
          timestamp: Date.now(),
          status: 'completed',
          result: responsePayload
        });

        functionResponses.push({
          id: callId,
          name,
          response: { output: responsePayload }
        });

      } catch (err: any) {
        console.error(`[ToolExecutor] Error executing tool ${name}:`, err);
        const errorResult = { error: err.message || 'Execution failed' };

        executedItems.push({
          id: callId,
          name,
          args,
          timestamp: Date.now(),
          status: 'failed',
          result: errorResult
        });

        functionResponses.push({
          id: callId,
          name,
          response: { error: errorResult }
        });
      }
    }

    return { executedItems, functionResponses };
  }
}
