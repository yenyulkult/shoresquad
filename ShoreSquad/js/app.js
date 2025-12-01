// App JS for ShoreSquad

async function renderMockWeather(){
    const tempEl = document.getElementById('temp-value');
    const condEl = document.querySelector('.conditions');
    const detailsEl = document.querySelector('.details');

    // Loading state
    if(tempEl) tempEl.textContent = '—';
    if(condEl) condEl.textContent = 'Loading weather…';
    if(detailsEl) detailsEl.textContent = '';

    const url = 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast';

    try{
        const resp = await fetch(url);
        if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        // Try several paths to locate region-specific forecast for 'east'
        let forecastText = null;
        let tempLow = null;
        let tempHigh = null;

        if(data && Array.isArray(data.items) && data.items.length){
            const item = data.items[0];

            // 1) If periods with regions exist (common in some responses)
            if(Array.isArray(item.periods)){
                for(const p of item.periods){
                    if(p && p.regions && p.regions.east){
                        forecastText = p.regions.east;
                        break;
                    }
                }
            }

            // 2) General forecast text fallback
            if(!forecastText && item.general && item.general.forecast){
                forecastText = item.general.forecast;
            }

            // 3) Temperature range may be present under item.general.temperature
            if(item.general && item.general.temperature){
                if(typeof item.general.temperature.low !== 'undefined') tempLow = item.general.temperature.low;
                if(typeof item.general.temperature.high !== 'undefined') tempHigh = item.general.temperature.high;
            }

            // 4) Some responses may include a 'temperature' object at top-level of item
            if((tempLow === null || tempHigh === null) && item.temperature){
                if(typeof item.temperature.low !== 'undefined') tempLow = item.temperature.low;
                if(typeof item.temperature.high !== 'undefined') tempHigh = item.temperature.high;
            }
        }

        // Emoji mapping for quick visual
        function emojiForForecast(text){
            if(!text) return '🌤️';
            const t = text.toLowerCase();
            if(t.includes('thunder') || t.includes('thundery') ) return '⛈️';
            if(t.includes('shower') || t.includes('rain')) return '🌧️';
            if(t.includes('cloud')) return '☁️';
            if(t.includes('sun') || t.includes('fair')) return '☀️';
            if(t.includes('wind')) return '🌬️';
            return '🌤️';
        }

        // Compose temperature display
        let tempDisplay = '—';
        if(tempLow !== null && tempHigh !== null){
            tempDisplay = `${tempLow}–${tempHigh}`; // °C will be shown by existing markup
        } else if(tempHigh !== null){
            tempDisplay = String(tempHigh);
        }

        // If we still don't have a forecastText, try to find any text under items
        if(!forecastText && data && data.api_info && data.api_info.status){
            forecastText = data.api_info.status;
        }

        // Update DOM
        if(tempEl) tempEl.textContent = tempDisplay;

        const emoji = emojiForForecast(forecastText);
        if(condEl) condEl.textContent = (forecastText ? `${emoji} ${forecastText}` : 'Forecast unavailable');

        // details: if we have any temperature info or update timestamp
        let details = '';
        if(tempLow !== null || tempHigh !== null){
            details += `Temperature: ${tempLow !== null ? tempLow : '?'}°C — ${tempHigh !== null ? tempHigh : '?'}°C`;
        }
        if(data && Array.isArray(data.items) && data.items.length && data.items[0].update_timestamp){
            if(details) details += ' • ';
            details += `Updated: ${new Date(data.items[0].update_timestamp).toLocaleString()}`;
        }
        if(detailsEl) detailsEl.textContent = details;

    }catch(err){
        console.error('Weather fetch error', err);
        if(tempEl) tempEl.textContent = '—';
        if(condEl) condEl.textContent = 'Weather unavailable';
        if(detailsEl) detailsEl.textContent = 'Could not load forecast. Please try again later.';
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', function(){
    try{ renderMockWeather(); }catch(e){ console.error('renderMockWeather error', e); }
});

// expose for debugging if needed
window.renderMockWeather = renderMockWeather;