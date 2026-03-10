/**
 * js/api.js - All external API requests
 * TheCocktailDB, OpenWeather, Gemini, OSM (Overpass)
 * API keys encapsulated here.
 */

// ========== API Configuration ==========
export const API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

// OpenWeather - leave empty for mock
export const OPENWEATHER_API_KEY = '';

// OSM Overpass for bars
export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const MAP_RADIUS_M = 5000;

// Ingredient index storage
export const INGREDIENT_INDEX_KEY = 'cocktail_ingredient_index';
export const INGREDIENT_INDEX_VERSION = 1;

let _ingredientListCache = null;
let _ingredientIndex = null;
let _ingredientIndexBuilding = false;
let aiCocktailCatalog = null;

// ========== TheCocktailDB ==========

/**
 * Fetches cocktails by filter (ingredient, category, etc.)
 */
export async function fetchFilterByIngredient(ingredient) {
    const res = await fetch(`${API_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
    return res.json();
}

/**
 * Fetches cocktail by ID
 */
export async function fetchCocktailById(id) {
    const res = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
    const data = await res.json();
    return data?.drinks?.[0] || null;
}

/**
 * Fetches cocktails by name search
 */
export async function fetchSearchByName(query) {
    const res = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    return res.json();
}

/**
 * Fetches cocktails by first letter
 */
export async function fetchSearchByLetter(letter) {
    const res = await fetch(`${API_BASE_URL}/search.php?f=${letter.toUpperCase()}`);
    return res.json();
}

/**
 * Fetches random cocktail
 */
export async function fetchRandomCocktail() {
    const res = await fetch(`${API_BASE_URL}/random.php`);
    const data = await res.json();
    return data?.drinks?.[0] || null;
}

/**
 * Fetches ingredient info (for official name)
 */
export async function fetchIngredientSearch(ingredient) {
    const res = await fetch(`${API_BASE_URL}/search.php?i=${encodeURIComponent(ingredient)}`);
    return res.json();
}

/**
 * Fetches full ingredient list
 */
export async function fetchIngredientList() {
    const res = await fetch(`${API_BASE_URL}/list.php?i=list`);
    return res.json();
}

/**
 * Fetches all ingredients as a flat, alphabetically sorted array of names
 */
export async function fetchAllIngredientsList() {
    const data = await fetchIngredientList();
    if (!data?.drinks?.length) return [];
    const names = data.drinks.map(d => (d.strIngredient1 || '').trim()).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Fetches full details for multiple cocktails
 */
export async function fetchFullDetailsForCocktails(cocktails) {
    const promises = cocktails.map(c =>
        fetch(`${API_BASE_URL}/lookup.php?i=${c.idDrink}`)
            .then(r => r.json())
            .then(data => (data.drinks && data.drinks[0]) ? data.drinks[0] : c)
            .catch(() => c)
    );
    return Promise.all(promises);
}

// ========== Ingredient Index ==========

/**
 * Builds ingredient→cocktails index
 */
export async function buildIngredientIndex() {
    const index = {};
    const seenIds = new Set();
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

    for (const letter of letters) {
        try {
            const data = await fetchSearchByLetter(letter);
            if (!data?.drinks?.length) continue;

            const toFetch = data.drinks.filter(d => !seenIds.has(d.idDrink));
            for (const d of toFetch) seenIds.add(d.idDrink);
            if (toFetch.length === 0) continue;

            const fullCocktails = await fetchFullDetailsForCocktails(toFetch);
            for (const c of fullCocktails) {
                if (!c) continue;
                const basic = { idDrink: c.idDrink, strDrink: c.strDrink, strDrinkThumb: c.strDrinkThumb };
                for (let i = 1; i <= 15; i++) {
                    const ing = c[`strIngredient${i}`];
                    if (!ing || !ing.trim()) continue;
                    const key = ing.trim().toLowerCase();
                    if (!index[key]) index[key] = [];
                    if (!index[key].some(x => x.idDrink === c.idDrink)) {
                        index[key].push(basic);
                    }
                }
            }
            await new Promise(r => setTimeout(r, 80));
        } catch (err) { /* continue */ }
    }
    return index;
}

/**
 * Loads or builds ingredient index
 */
export async function ensureIngredientIndex() {
    if (_ingredientIndex) return _ingredientIndex;
    if (_ingredientIndexBuilding) return null;

    try {
        const stored = localStorage.getItem(INGREDIENT_INDEX_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.version === INGREDIENT_INDEX_VERSION && parsed?.data) {
                _ingredientIndex = parsed.data;
                return _ingredientIndex;
            }
        }
    } catch (e) { /* ignore */ }

    _ingredientIndexBuilding = true;
    try {
        _ingredientIndex = await buildIngredientIndex();
        localStorage.setItem(INGREDIENT_INDEX_KEY, JSON.stringify({
            version: INGREDIENT_INDEX_VERSION,
            data: _ingredientIndex
        }));
    } catch (err) {
        _ingredientIndex = null;
    } finally {
        _ingredientIndexBuilding = false;
    }
    return _ingredientIndex;
}

/**
 * Get all known ingredients from the comprehensive index (keys = ingredient names)
 * Returns alphabetically sorted array. Ensures index exists first.
 */
export async function getAllKnownIngredients() {
    let index = _ingredientIndex;
    const stored = localStorage.getItem(INGREDIENT_INDEX_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed?.version === INGREDIENT_INDEX_VERSION && parsed?.data) {
                index = parsed.data;
            }
        } catch (e) { /* ignore */ }
    }
    if (!index) {
        index = await ensureIngredientIndex();
    }
    if (!index || typeof index !== 'object') return [];
    const keys = Object.keys(index).filter(k => k && k.trim());
    return [...new Set(keys)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Search ingredient index
 */
export function searchByIngredientIndex(ingredient) {
    if (!_ingredientIndex) return null;
    const q = ingredient.toLowerCase().trim();
    if (!q) return null;

    const found = [];
    const seenIds = new Set();
    for (const [key, cocktails] of Object.entries(_ingredientIndex)) {
        if (key === q || key.includes(q)) {
            for (const c of cocktails) {
                if (!seenIds.has(c.idDrink)) {
                    seenIds.add(c.idDrink);
                    found.push(c);
                }
            }
        }
    }
    return found.length > 0 ? found : null;
}

/**
 * Get official ingredient name from API
 */
export async function getOfficialIngredientName(ingredient) {
    try {
        const data = await fetchIngredientSearch(ingredient);
        if (data?.ingredients?.[0]?.strIngredient) {
            return data.ingredients[0].strIngredient.trim();
        }
    } catch (e) { /* ignore */ }
    return null;
}

/**
 * Get exact ingredient from list
 */
export async function getExactIngredientFromList(ingredient) {
    const q = ingredient.toLowerCase().trim();
    if (!q) return null;
    try {
        if (!_ingredientListCache) {
            const data = await fetchIngredientList();
            if (!data?.drinks) return null;
            _ingredientListCache = data.drinks.map(d => d.strIngredient1).filter(Boolean);
        }
        const exact = _ingredientListCache.find(n => n && n.toLowerCase() === q);
        if (exact) return exact;
        const partial = _ingredientListCache.find(n => n && n.toLowerCase().includes(q));
        return partial || null;
    } catch (e) {
        return null;
    }
}

// ========== Gemini AI (disabled) ==========

/**
 * Stubbed AI function – AI assistant is disabled for security reasons.
 * Kept only so existing calls in the UI won't break.
 */
export async function askGemini(contextPrompt, userMessage) {
    console.warn('askGemini was called but AI is disabled.');
    return 'AI assistant is currently disabled.';
}

/**
 * Fetches cocktail catalog for AI suggestions
 */
export async function getAICocktailCatalog() {
    if (aiCocktailCatalog) return aiCocktailCatalog;
    const cats = ['Cocktail', 'Ordinary Drink', 'Punch / Party Drink'];
    const seen = new Set();
    const list = [];
    for (const c of cats) {
        try {
            const res = await fetch(`${API_BASE_URL}/filter.php?c=${encodeURIComponent(c)}`);
            const data = await res.json();
            if (data?.drinks) {
                for (const d of data.drinks) {
                    if (!seen.has(d.idDrink)) {
                        seen.add(d.idDrink);
                        list.push({ idDrink: d.idDrink, strDrink: d.strDrink, strDrinkThumb: d.strDrinkThumb || '' });
                    }
                }
            }
        } catch (_) {}
    }
    aiCocktailCatalog = list;
    return list;
}

// ========== OpenWeather ==========

/**
 * Fetches weather and returns temp + recommendation
 * Uses Open-Meteo (free, no API key) with user's precise location
 */
export async function fetchWeatherAndRecommend() {
    const tempEl = document.getElementById('weatherTemp');
    const recEl = document.getElementById('weatherRec');
    const iconEl = document.getElementById('weatherIcon');
    if (!tempEl || !recEl) return;

    const setDisplay = (temp) => {
        tempEl.textContent = temp + '°C';
        if (temp > 25) {
            iconEl.textContent = '☀️';
            recEl.textContent = 'Frozen/Cold drinks (Margarita, Mojito)';
        } else if (temp < 15) {
            iconEl.textContent = '❄️';
            recEl.textContent = 'Warming drinks (Irish Coffee, Whisky)';
        } else {
            iconEl.textContent = '🌤️';
            recEl.textContent = 'Classic cocktails';
        }
    };

    const setError = () => {
        tempEl.textContent = '--°C';
        iconEl.textContent = '🌡️';
        recEl.textContent = 'Allow location for weather';
    };

    if (!navigator.geolocation) {
        setError();
        return;
    }

    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
        const { latitude, longitude } = pos.coords;

        // Try Open-Meteo first (free, no API key)
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;
            const res = await fetch(url);
            const data = await res.json();
            if (data?.current?.temperature_2m != null) {
                const temp = Math.round(data.current.temperature_2m);
                setDisplay(temp);
                return;
            }
        } catch (_) { /* fall through */ }

        // Fallback: OpenWeatherMap if API key is set
        if (OPENWEATHER_API_KEY) {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`);
            const data = await res.json();
            if (data?.main?.temp != null) {
                setDisplay(Math.round(data.main.temp));
                return;
            }
        }

        setError();
    } catch (e) {
        setError();
    }
}

// ========== OSM Overpass (Map) ==========

/**
 * Search all cocktails by ingredient (scans a-z)
 */
export async function searchAllCocktailsByIngredient(ingredient, cocktailContainsIngredient, maxResults = 25, maxLetters = 12) {
    const found = [];
    const seenIds = new Set();
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let lettersScanned = 0;

    for (const letter of letters) {
        if (found.length >= maxResults || lettersScanned >= maxLetters) break;
        lettersScanned++;
        try {
            const data = await fetchSearchByLetter(letter);
            if (!data?.drinks?.length) continue;

            const toFetch = data.drinks.filter(d => !seenIds.has(d.idDrink));
            for (const d of toFetch) seenIds.add(d.idDrink);
            if (toFetch.length === 0) continue;

            const fullCocktails = await fetchFullDetailsForCocktails(toFetch);
            for (const c of fullCocktails) {
                if (c && cocktailContainsIngredient(c, ingredient)) {
                    found.push({ idDrink: c.idDrink, strDrink: c.strDrink, strDrinkThumb: c.strDrinkThumb });
                    if (found.length >= maxResults) break;
                }
            }
            await new Promise(r => setTimeout(r, 50));
        } catch (err) { /* continue */ }
    }
    return found;
}

/**
 * Fallback: random cocktails filtered by ingredient
 */
export async function searchByIngredientFallback(ingredient, cocktailContainsIngredient, maxAttempts = 40) {
    const ingredientLower = ingredient.toLowerCase().trim();
    const found = [];
    const seenIds = new Set();

    for (let i = 0; i < maxAttempts && found.length < 15; i++) {
        try {
            const cocktail = await fetchRandomCocktail();
            if (!cocktail || seenIds.has(cocktail.idDrink)) continue;
            seenIds.add(cocktail.idDrink);
            if (cocktailContainsIngredient(cocktail, ingredient)) {
                found.push({ idDrink: cocktail.idDrink, strDrink: cocktail.strDrink, strDrinkThumb: cocktail.strDrinkThumb });
            }
        } catch (err) { /* continue */ }
        await new Promise(r => setTimeout(r, 80));
    }
    return found;
}

/**
 * Fetches bars near lat/lon via Overpass
 */
export async function fetchBarsNear(lat, lon) {
    const r = MAP_RADIUS_M;
    const query = `[out:json][timeout:25];(node["amenity"="bar"](around:${r},${lat},${lon});node["amenity"="pub"](around:${r},${lat},${lon});node["amenity"="nightclub"](around:${r},${lat},${lon});way["amenity"="bar"](around:${r},${lat},${lon});way["amenity"="pub"](around:${r},${lat},${lon});way["amenity"="nightclub"](around:${r},${lat},${lon}););out center;`;
    const res = await fetch(OVERPASS_URL, { method: 'POST', body: query });
    return res.json();
}
