/**
 * Bundled app - works without server (file://)
 * Source: js/utils.js, store.js, api.js, render.js, main.js
 */
(function() {
'use strict';
const utils = {};
const store = {};
const api = {};
const render = {};

/**
 * js/utils.js - Helper functions
 * Debounce, Unit conversion, Translation, etc.
 */

const OZ_TO_ML = 29.5735;
const CONVERT_THRESHOLD_OZ = 32;
const CONVERT_THRESHOLD_ML = 1000;

// Alcohol types for Learn more link
const alcoholTypes = [
    'gin', 'vodka', 'rum', 'whiskey', 'whisky', 'tequila', 'beer', 'wine',
    'champagne', 'cognac', 'brandy', 'liqueur', 'amaretto', 'kahlua',
    'triple sec', 'grenadine', 'angostura', 'bitters', 'sake', 'absinthe',
    'bourbon', 'scotch', 'rye', 'mezcal', 'pisco', 'cachaca', 'schnapps'
];

// Hebrew to English ingredient translation
const ingredientTranslation = {
    'מלפפון': 'cucumber', 'ג\'ין': 'gin', 'גין': 'gin', 'וודקה': 'vodka', 'רום': 'rum',
    'ויסקי': 'whiskey', 'טקילה': 'tequila', 'לימון': 'lemon', 'ליים': 'lime', 'תפוז': 'orange',
    'תפוח': 'apple', 'אננס': 'pineapple', 'קוקוס': 'coconut', 'נענע': 'mint', 'בזיליקום': 'basil',
    'קינמון': 'cinnamon', 'שוקולד': 'chocolate', 'קפה': 'coffee', 'חלב': 'milk', 'קרם': 'cream',
    'סוכר': 'sugar', 'דבש': 'honey', 'ביצה': 'egg', 'ביצים': 'egg', 'ענבים': 'grape', 'תות': 'strawberry',
    'תותים': 'strawberry', 'אפרסק': 'peach', 'קיווי': 'kiwi', 'בננה': 'banana', 'אבוקדו': 'avocado',
    'ג\'ינג\'ר': 'ginger', 'גינגר': 'ginger', 'שום': 'garlic', 'בצל': 'onion', 'עגבניה': 'tomato',
    'עגבניות': 'tomato', 'זיתים': 'olive', 'זית': 'olive', 'פפריקה': 'paprika', 'פלפל': 'pepper',
    'מלח': 'salt', 'קולה': 'cola', 'סודה': 'soda', 'טוניק': 'tonic', 'בירה': 'beer', 'יין': 'wine',
    'שמפניה': 'champagne', 'קוניאק': 'cognac', 'ברנדי': 'brandy', 'ליקר': 'liqueur', 'אמרטו': 'amaretto',
    'קאלווה': 'kahlua', 'טריפל סק': 'triple sec', 'גרנדין': 'grenadine', 'אנגוסטורה': 'angostura',
    'ביטרס': 'bitters', 'דובדבן': 'cherry', 'דובדבנים': 'cherry', 'cherry': 'cherry', 'cherries': 'cherry'
};

/**
 * Debounce - delays execution until after wait ms of no calls
 */
function debounce(fn, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

/**
 * Parse measure string (e.g. "2 oz", "50ml") into value and unit
 */
function parseMeasure(measureStr) {
    if (!measureStr || !measureStr.trim()) return null;
    const s = measureStr.trim();
    const match = s.match(/^([\d./]+)\s*(oz|ml|cl|dash|pinch|splash|part|parts)?/i);
    if (!match) return null;
    let num = match[1];
    const unit = (match[2] || '').toLowerCase();
    if (num.includes('/')) {
        const [a, b] = num.split('/').map(Number);
        num = a / (b || 1);
    } else {
        num = parseFloat(num) || 0;
    }
    return { value: num, unit: unit || 'unit' };
}

/**
 * Format scaled quantity for display
 */
function formatScaledQuantity(value, unit, guests) {
    const total = value * guests;
    if (unit === 'oz' && total >= CONVERT_THRESHOLD_OZ) {
        const liters = (total * OZ_TO_ML) / 1000;
        return `~${liters.toFixed(1)} L`;
    }
    const mlTotal = unit === 'cl' ? total * 10 : unit === 'oz' ? total * OZ_TO_ML : total;
    if ((unit === 'ml' || unit === 'cl') && mlTotal >= CONVERT_THRESHOLD_ML) {
        return `~${(mlTotal / 1000).toFixed(1)} L`;
    }
    if (total === Math.floor(total)) return `${total} ${unit}`;
    return `${total.toFixed(1)} ${unit}`;
}

/**
 * Convert to ml
 */
function toMl(value, unit) {
    if (unit === 'oz') return value * OZ_TO_ML;
    if (unit === 'cl') return value * 10;
    return value;
}

/**
 * Format ml for display
 */
function formatMlForDisplay(ml) {
    if (ml >= 1000) return `~${(ml / 1000).toFixed(1)} L`;
    if (ml === Math.floor(ml)) return `${ml} ml`;
    return `${ml.toFixed(1)} ml`;
}

/**
 * Translate Hebrew ingredient to English
 */
function translateIngredient(ingredient) {
    const trimmed = ingredient.trim().toLowerCase();
    if (/^[a-zA-Z\s]+$/.test(trimmed)) return trimmed;
    const translated = ingredientTranslation[trimmed];
    if (translated) return translated;
    for (const [hebrew, english] of Object.entries(ingredientTranslation)) {
        if (trimmed.includes(hebrew) || hebrew.includes(trimmed)) return english;
    }
    return trimmed;
}

/**
 * Get ingredient list from cocktail (strIngredient1..15)
 */
function getCocktailIngredientsList(cocktail) {
    const out = [];
    for (let i = 1; i <= 15; i++) {
        const v = cocktail[`strIngredient${i}`];
        if (v && v.trim()) out.push(v.trim().toLowerCase());
    }
    return out;
}

/**
 * Check if cocktail contains ingredient
 */
function cocktailContainsIngredient(cocktail, ingredient) {
    const search = ingredient.toLowerCase().trim();
    for (let i = 1; i <= 15; i++) {
        const val = cocktail[`strIngredient${i}`];
        if (val && val.toLowerCase().trim().includes(search)) return true;
    }
    return false;
}

/**
 * Flexible match: user "vodka" matches "Absolut Vodka", "Vodka", "Russian Vodka"
 */
function inventoryMatchesIngredient(userIng, cocktailIng) {
    const u = userIng.toLowerCase().trim();
    const c = cocktailIng.toLowerCase().trim();
    return c === u || c.includes(u) || u.includes(c);
}

/**
 * Calculate which ingredients the user is missing for a cocktail.
 * @param {Object} cocktail - Full cocktail object (strIngredient1..15)
 * @param {string[]} userInventory - User's inventory (lowercase)
 * @returns {string[]} Array of missing ingredient display names
 */
function calculateMissingIngredients(cocktail, userInventory) {
    const missing = [];
    for (let i = 1; i <= 15; i++) {
        const ing = cocktail[`strIngredient${i}`];
        if (!ing || !ing.trim()) continue;
        const name = ing.trim();
        const hasIt = userInventory.some(inv => inventoryMatchesIngredient(inv, name));
        if (!hasIt) missing.push(name);
    }
    return missing;
}

/**
 * Aggregate ingredients from party cocktails
 */
function aggregateIngredients(cocktails, guests) {
    const mlMap = {};
    const otherMap = {};
    for (const cocktail of cocktails) {
        for (let i = 1; i <= 15; i++) {
            const measure = cocktail[`strMeasure${i}`];
            const ingredient = cocktail[`strIngredient${i}`];
            if (!ingredient?.trim()) continue;
            const key = ingredient.trim().toLowerCase();
            const parsed = parseMeasure(measure ? measure.trim() : '');
            if (parsed && (parsed.unit === 'oz' || parsed.unit === 'ml' || parsed.unit === 'cl')) {
                const ml = toMl(parsed.value, parsed.unit) * guests;
                mlMap[key] = (mlMap[key] || 0) + ml;
            } else if (parsed) {
                const qty = parsed.value * guests;
                if (otherMap[key]) otherMap[key].value += qty;
                else otherMap[key] = { value: qty, unit: parsed.unit };
            } else {
                if (!mlMap[key] && !otherMap[key]) otherMap[key] = { value: 0, unit: '' };
            }
        }
    }
    const result = [];
    for (const [key, val] of Object.entries(mlMap)) {
        const name = key.replace(/^\w/, c => c.toUpperCase());
        result.push({ name, display: formatMlForDisplay(val) + ' ' + name });
    }
    for (const [key, obj] of Object.entries(otherMap)) {
        if (mlMap[key]) continue;
        const name = key.replace(/^\w/, c => c.toUpperCase());
        if (obj.unit) {
            const v = obj.value === Math.floor(obj.value) ? obj.value : obj.value.toFixed(1);
            result.push({ name, display: v + ' ' + obj.unit + ' ' + name });
        } else {
            result.push({ name, display: name });
        }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get scaled ingredients for single cocktail
 */
function getScaledIngredientsForCocktail(cocktail, guests) {
    const items = [];
    for (let i = 1; i <= 15; i++) {
        const measure = cocktail[`strMeasure${i}`];
        const ingredient = cocktail[`strIngredient${i}`];
        if (!ingredient?.trim()) continue;
        const parsed = parseMeasure(measure ? measure.trim() : '');
        if (parsed && (parsed.unit === 'oz' || parsed.unit === 'ml' || parsed.unit === 'cl')) {
            items.push(formatScaledQuantity(parsed.value, parsed.unit, guests) + ' ' + ingredient.trim());
        } else if (parsed) {
            items.push(`${parsed.value * guests} ${parsed.unit} ${ingredient.trim()}`);
        } else {
            items.push(ingredient.trim());
        }
    }
    return items;
}

/**
 * Check if ingredient is alcohol type
 */
function isAlcoholType(ingredient) {
    return alcoholTypes.includes(ingredient.toLowerCase().trim());
}

/**
 * Format AI reply text to HTML
 */
function formatAIReply(text) {
    if (!text || !text.trim()) return '';
    return escapeHtml(text)
        .replace(/^## (.+)$/gm, '<div class="ai-msg-header">$1</div>')
        .replace(/^### (.+)$/gm, '<div class="ai-msg-subheader">$1</div>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-]\s+(.+)$/gm, '<div class="ai-msg-li">$1</div>')
        .replace(/^\d+\.\s+(.+)$/gm, '<div class="ai-msg-li">$1</div>')
        .replace(/\n\n+/g, '<div class="ai-msg-spacer"></div>')
        .replace(/\n/g, '<br>');
}


Object.assign(utils, {
  OZ_TO_ML, CONVERT_THRESHOLD_OZ, CONVERT_THRESHOLD_ML,
  alcoholTypes, ingredientTranslation, debounce, escapeHtml, parseMeasure,
  formatScaledQuantity, toMl, formatMlForDisplay, translateIngredient,
  getCocktailIngredientsList, cocktailContainsIngredient, calculateMissingIngredients, aggregateIngredients,
  getScaledIngredientsForCocktail, isAlcoholType, formatAIReply
});

/**
 * js/store.js - All localStorage operations
 * Favorites, Party List, Custom Recipes, Inventory
 */

const FAVORITES_KEY = 'cocktailFavorites';
const PARTY_COCKTAILS_KEY = 'partyCocktails';
const CUSTOM_COCKTAILS_KEY = 'customCocktails';
const MY_COCKTAILS_KEY = 'myCocktails';
const INVENTORY_KEY = 'cocktailInventory';
const SHOPPING_LIST_KEY = 'cocktailShoppingList';

// ========== Favorites ==========

function getFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(id) {
    return getFavorites().some(c => c.idDrink === String(id));
}

function addFavorite(cocktail) {
    const list = getFavorites();
    if (list.some(c => c.idDrink === cocktail.idDrink)) return;
    const entry = {
        idDrink: cocktail.idDrink,
        strDrink: cocktail.strDrink,
        strDrinkThumb: cocktail.strDrinkThumb || '',
        strVideo: cocktail.strVideo || '',
        strInstructions: cocktail.strInstructions || '',
        strIngredient1: cocktail.strIngredient1,
        strIngredient2: cocktail.strIngredient2,
        strIngredient3: cocktail.strIngredient3,
        strIngredient4: cocktail.strIngredient4,
        strIngredient5: cocktail.strIngredient5,
        strMeasure1: cocktail.strMeasure1,
        strMeasure2: cocktail.strMeasure2,
        strMeasure3: cocktail.strMeasure3,
        strMeasure4: cocktail.strMeasure4,
        strMeasure5: cocktail.strMeasure5
    };
    for (let i = 6; i <= 15; i++) {
        if (cocktail[`strIngredient${i}`]) entry[`strIngredient${i}`] = cocktail[`strIngredient${i}`];
        if (cocktail[`strMeasure${i}`]) entry[`strMeasure${i}`] = cocktail[`strMeasure${i}`];
    }
    list.push(entry);
    saveFavorites(list);
}

function removeFavorite(id) {
    const list = getFavorites().filter(c => c.idDrink !== String(id));
    saveFavorites(list);
}

function toggleFavorite(cocktail) {
    if (isFavorite(cocktail.idDrink)) {
        removeFavorite(cocktail.idDrink);
        return false;
    }
    addFavorite(cocktail);
    return true;
}

// ========== Party List ==========

function getPartyCocktails() {
    try {
        const raw = localStorage.getItem(PARTY_COCKTAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function savePartyCocktails(list) {
    localStorage.setItem(PARTY_COCKTAILS_KEY, JSON.stringify(list));
}

function addToParty(cocktail) {
    if (!cocktail || cocktail.id?.toString().startsWith('my-')) return false;
    const list = getPartyCocktails();
    if (list.some(c => c.idDrink === cocktail.idDrink)) return false;
    const copy = { idDrink: cocktail.idDrink, strDrink: cocktail.strDrink, strDrinkThumb: cocktail.strDrinkThumb };
    for (let i = 1; i <= 15; i++) {
        if (cocktail[`strIngredient${i}`]) copy[`strIngredient${i}`] = cocktail[`strIngredient${i}`];
        if (cocktail[`strMeasure${i}`]) copy[`strMeasure${i}`] = cocktail[`strMeasure${i}`];
    }
    list.push(copy);
    savePartyCocktails(list);
    return true;
}

function removeFromParty(idDrink) {
    const list = getPartyCocktails().filter(c => c.idDrink !== idDrink);
    savePartyCocktails(list);
}

function toggleParty(cocktail) {
    if (!cocktail || cocktail.id?.toString().startsWith('my-')) return false;
    const list = getPartyCocktails();
    const idx = list.findIndex(c => c.idDrink === cocktail.idDrink);
    if (idx >= 0) {
        removeFromParty(cocktail.idDrink);
        return false;
    }
    addToParty(cocktail);
    return true;
}

// ========== Custom Recipes ==========

function getCustomCocktails() {
    try {
        const raw = localStorage.getItem(CUSTOM_COCKTAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveCustomCocktails(list) {
    localStorage.setItem(CUSTOM_COCKTAILS_KEY, JSON.stringify(list));
}

function addCustomCocktail(cocktail) {
    const list = getCustomCocktails();
    const id = 'custom-' + Date.now();
    list.push({ ...cocktail, idDrink: id, id });
    saveCustomCocktails(list);
}

function deleteCustomCocktail(id) {
    const list = getCustomCocktails().filter(c => c.idDrink !== id && c.id !== id);
    saveCustomCocktails(list);
}

function customCocktailsMatchingIngredient(ingredient) {
    const q = ingredient.toLowerCase().trim();
    if (!q) return [];
    return getCustomCocktails().filter(c => {
        let ings = '';
        for (let i = 1; i <= 15; i++) ings += (c[`strIngredient${i}`] || '') + ' ';
        ings += (c.ingredients || '');
        return ings.toLowerCase().includes(q);
    });
}

function customToDisplayFormat(c) {
    const out = {
        idDrink: c.idDrink || c.id,
        id: c.id || c.idDrink,
        name: c.name || c.strDrink,
        strDrink: c.strDrink || c.name,
        strDrinkThumb: c.strDrinkThumb || c.strImage || c.imageUrl || '',
        strInstructions: c.strInstructions || c.instructions,
        ingredients: c.ingredients,
        instructions: c.instructions,
        _isCustom: true
    };
    for (let i = 1; i <= 15; i++) {
        if (c[`strIngredient${i}`]) out[`strIngredient${i}`] = c[`strIngredient${i}`];
    }
    return out;
}

// ========== My Cocktails (Invent) ==========

function getMyCocktails() {
    try {
        const raw = localStorage.getItem(MY_COCKTAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveMyCocktails(list) {
    localStorage.setItem(MY_COCKTAILS_KEY, JSON.stringify(list));
}

function addMyCocktail(cocktail) {
    const list = getMyCocktails();
    const entry = {
        id: 'my-' + Date.now(),
        name: cocktail.name || 'My Cocktail',
        ingredients: cocktail.ingredients || '',
        instructions: cocktail.instructions || ''
    };
    list.push(entry);
    saveMyCocktails(list);
}

function removeMyCocktail(id) {
    const list = getMyCocktails().filter(c => c.id !== id);
    saveMyCocktails(list);
}

// ========== Smart Inventory ==========

function getInventory() {
    try {
        const raw = localStorage.getItem(INVENTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveInventory(list) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(list));
}

function addToInventory(ingredient) {
    const name = String(ingredient).trim().toLowerCase();
    if (!name) return;
    const list = getInventory();
    if (list.some(i => i.toLowerCase() === name)) return;
    list.push(name);
    saveInventory(list);
}

function removeFromInventory(ingredient) {
    const name = String(ingredient).trim().toLowerCase();
    const list = getInventory().filter(i => i.toLowerCase() !== name);
    saveInventory(list);
}

// ========== Shopping List ==========

function getShoppingList() {
    try {
        const raw = localStorage.getItem(SHOPPING_LIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveShoppingList(list) {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
}

function addToShoppingList(itemsArray) {
    const list = getShoppingList();
    const seen = new Set(list.map(i => i.toLowerCase().trim()));
    for (const item of itemsArray) {
        const name = String(item).trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            list.push(name);
        }
    }
    saveShoppingList(list);
}

function removeFromShoppingList(item) {
    const name = String(item).trim().toLowerCase();
    const list = getShoppingList().filter(i => i.toLowerCase().trim() !== name);
    saveShoppingList(list);
}


Object.assign(store, {
  FAVORITES_KEY, PARTY_COCKTAILS_KEY, CUSTOM_COCKTAILS_KEY, MY_COCKTAILS_KEY, INVENTORY_KEY, SHOPPING_LIST_KEY,
  getFavorites, saveFavorites, isFavorite, addFavorite, removeFavorite, toggleFavorite,
  getPartyCocktails, savePartyCocktails, addToParty, removeFromParty, toggleParty,
  getCustomCocktails, saveCustomCocktails, addCustomCocktail, deleteCustomCocktail,
  customCocktailsMatchingIngredient, customToDisplayFormat,
  getMyCocktails, saveMyCocktails, addMyCocktail, removeMyCocktail,
  getInventory, saveInventory, addToInventory, removeFromInventory,
  getShoppingList, saveShoppingList, addToShoppingList, removeFromShoppingList
});

/**
 * js/api.js - All external API requests
 * TheCocktailDB, OpenWeather, Gemini, OSM (Overpass)
 * API keys encapsulated here.
 */

// ========== API Configuration ==========
const API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

// Google AI Studio (Gemini) - disabled for security (no API key)
const GEMINI_API_KEY = '';
const GEMINI_MODELS = [];
const GEMINI_BASE = '';

// OpenWeather - leave empty for mock
const OPENWEATHER_API_KEY = '';

// OSM Overpass for bars
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MAP_RADIUS_M = 5000;

// Ingredient index storage
const INGREDIENT_INDEX_KEY = 'cocktail_ingredient_index';
const INGREDIENT_INDEX_VERSION = 1;

let _ingredientListCache = null;
let _ingredientIndex = null;
let _ingredientIndexBuilding = false;
let aiCocktailCatalog = null;

// ========== TheCocktailDB ==========

/**
 * Fetches cocktails by filter (ingredient, category, etc.)
 */
async function fetchFilterByIngredient(ingredient) {
    const res = await fetch(`${API_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
    return res.json();
}

/**
 * Fetches cocktail by ID
 */
async function fetchCocktailById(id) {
    const res = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
    const data = await res.json();
    return data?.drinks?.[0] || null;
}

/**
 * Fetches cocktails by name search
 */
async function fetchSearchByName(query) {
    const res = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    return res.json();
}

/**
 * Fetches cocktails by first letter
 */
async function fetchSearchByLetter(letter) {
    const res = await fetch(`${API_BASE_URL}/search.php?f=${letter.toUpperCase()}`);
    return res.json();
}

/**
 * Fetches random cocktail
 */
async function fetchRandomCocktail() {
    const res = await fetch(`${API_BASE_URL}/random.php`);
    const data = await res.json();
    return data?.drinks?.[0] || null;
}

/**
 * Fetches ingredient info (for official name)
 */
async function fetchIngredientSearch(ingredient) {
    const res = await fetch(`${API_BASE_URL}/search.php?i=${encodeURIComponent(ingredient)}`);
    return res.json();
}

/**
 * Fetches full ingredient list
 */
async function fetchIngredientList() {
    const res = await fetch(`${API_BASE_URL}/list.php?i=list`);
    return res.json();
}

/**
 * Fetches all ingredients as a flat, alphabetically sorted array of names
 */
async function fetchAllIngredientsList() {
    const data = await fetchIngredientList();
    if (!data?.drinks?.length) return [];
    const names = data.drinks.map(d => (d.strIngredient1 || '').trim()).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Fetches full details for multiple cocktails
 */
async function fetchFullDetailsForCocktails(cocktails) {
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
async function buildIngredientIndex() {
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
async function ensureIngredientIndex() {
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
async function getAllKnownIngredients() {
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
function searchByIngredientIndex(ingredient) {
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
async function getOfficialIngredientName(ingredient) {
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
async function getExactIngredientFromList(ingredient) {
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
 */
async function askGemini(contextPrompt, userMessage) {
    console.warn('askGemini called but AI is disabled.');
    return 'AI assistant is currently disabled.';
}

/**
 * Fetches cocktail catalog for AI suggestions
 */
async function getAICocktailCatalog() {
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
async function fetchWeatherAndRecommend() {
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
async function searchAllCocktailsByIngredient(ingredient, cocktailContainsIngredient, maxResults = 25, maxLetters = 12) {
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
async function searchByIngredientFallback(ingredient, cocktailContainsIngredient, maxAttempts = 40) {
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
async function fetchBarsNear(lat, lon) {
    const r = MAP_RADIUS_M;
    const query = `[out:json][timeout:25];(node["amenity"="bar"](around:${r},${lat},${lon});node["amenity"="pub"](around:${r},${lat},${lon});node["amenity"="nightclub"](around:${r},${lat},${lon});way["amenity"="bar"](around:${r},${lat},${lon});way["amenity"="pub"](around:${r},${lat},${lon});way["amenity"="nightclub"](around:${r},${lat},${lon}););out center;`;
    const res = await fetch(OVERPASS_URL, { method: 'POST', body: query });
    return res.json();
}


Object.assign(api, {
  API_BASE_URL, GEMINI_API_KEY, OPENWEATHER_API_KEY, OVERPASS_URL, MAP_RADIUS_M,
  INGREDIENT_INDEX_KEY, INGREDIENT_INDEX_VERSION,
  fetchFilterByIngredient, fetchCocktailById, fetchSearchByName, fetchSearchByLetter,
  fetchRandomCocktail, fetchIngredientSearch, fetchIngredientList, fetchAllIngredientsList,
  fetchFullDetailsForCocktails, buildIngredientIndex, ensureIngredientIndex, getAllKnownIngredients,
  searchByIngredientIndex, getOfficialIngredientName, getExactIngredientFromList,
  askGemini, getAICocktailCatalog, fetchWeatherAndRecommend,
  searchAllCocktailsByIngredient, searchByIngredientFallback, fetchBarsNear
});

/**
 * js/render.js - HTML generation
 * Cocktail cards, Modals, Lists. Pure functions where possible.
 */

/**
 * Shows loading state (search only) - centered overlay with spinning glass
 */
let searchLoadingOverlay = null;
function showLoading(resultsDiv) {
    if (!resultsDiv) return;
    if (searchLoadingOverlay) searchLoadingOverlay.remove();
    searchLoadingOverlay = document.createElement('div');
    searchLoadingOverlay.className = 'search-loading-overlay';
    searchLoadingOverlay.innerHTML = `
        <div class="search-loading-content">
            <div class="search-loading-spinner">🍸</div>
            <p class="search-loading-text">Mixing cocktails... Please wait</p>
        </div>
    `;
    document.body.appendChild(searchLoadingOverlay);
}

function hideSearchLoading() {
    if (searchLoadingOverlay) {
        searchLoadingOverlay.remove();
        searchLoadingOverlay = null;
    }
}

/**
 * Shows error message
 */
function showError(resultsDiv, message) {
    if (!resultsDiv) return;
    resultsDiv.innerHTML = `<div class="error">${utils.escapeHtml(message)}</div>`;
}

/**
 * Shows error in center of screen (for fetch failures)
 */
let searchErrorOverlay = null;
function showCenteredError(message) {
    if (searchErrorOverlay) searchErrorOverlay.remove();
    searchErrorOverlay = document.createElement('div');
    searchErrorOverlay.className = 'search-error-overlay';
    searchErrorOverlay.innerHTML = `
        <div class="search-error-content">
            <p class="search-error-text">${utils.escapeHtml(message)}</p>
            <button type="button" class="btn btn-primary search-error-dismiss">OK</button>
        </div>
    `;
    const dismiss = () => {
        if (searchErrorOverlay) {
            searchErrorOverlay.remove();
            searchErrorOverlay = null;
        }
    };
    searchErrorOverlay.querySelector('.search-error-dismiss').addEventListener('click', dismiss);
    searchErrorOverlay.addEventListener('click', (e) => { if (e.target === searchErrorOverlay) dismiss(); });
    document.body.appendChild(searchErrorOverlay);
}

/**
 * Shows no results
 */
function showNoResults(resultsDiv) {
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<div class="no-results">No cocktails found. Try a different ingredient!</div>';
}

/**
 * Trap focus in modal for a11y
 */
function trapFocusInModal(modalEl) {
    if (!modalEl) return;
    const focusables = modalEl.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const first = focusables[0];
    if (first) setTimeout(() => first.focus(), 50);
}

/**
 * Set map status message
 */
function setMapStatus(mapStatusEl, msg, isError) {
    if (!mapStatusEl) return;
    mapStatusEl.textContent = msg;
    mapStatusEl.className = 'map-status' + (isError ? ' map-status-error' : '');
}

/**
 * Create Learn more link
 */
function createLearnMoreLink(ingredient) {
    const linkContainer = document.createElement('div');
    linkContainer.className = 'learn-more-link';
    const link = document.createElement('a');
    const ingredientCapitalized = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
    link.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(ingredientCapitalized)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Learn more about ${ingredientCapitalized}`;
    linkContainer.appendChild(link);
    return linkContainer;
}

/**
 * Update Learn more link container
 */
function updateLearnMoreLink(learnMoreContainer, ingredient) {
    if (!learnMoreContainer) return;
    learnMoreContainer.innerHTML = '';
    if (ingredient && utils.isAlcoholType(ingredient)) {
        learnMoreContainer.appendChild(createLearnMoreLink(ingredient));
    }
}

/**
 * Share toast
 */
function showShareToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'share-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * Get cocktail share text
 */
function getCocktailShareText(cocktail) {
    const parts = [];
    for (let i = 1; i <= 15; i++) {
        const m = cocktail[`strMeasure${i}`];
        const ing = cocktail[`strIngredient${i}`];
        if (ing?.trim()) parts.push((m ? m.trim() + ' ' : '') + ing.trim());
    }
    return `${cocktail.strDrink} 🍸\n\nIngredients:\n${parts.join(', ')}\n\nInstructions:\n${cocktail.strInstructions || ''}`;
}

/**
 * Get My Cocktail share text
 */
function getMyCocktailShareText(cocktail) {
    return `${cocktail.name || 'My Cocktail'} 🍸\n\nIngredients:\n${cocktail.ingredients || ''}\n\nInstructions:\n${cocktail.instructions || ''}`;
}

/**
 * Open fallback share menu
 */
function openShareMenu(text, title, triggerEl) {
    const menu = document.createElement('div');
    menu.className = 'share-menu';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
    menu.innerHTML = `
        <a href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener" class="share-option" aria-label="Share on WhatsApp">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}" target="_blank" rel="noopener" class="share-option" aria-label="Share on Facebook">Facebook</a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title + '\n\n' + text)}" target="_blank" rel="noopener" class="share-option" aria-label="Share on X">X (Twitter)</a>
        <a href="${gmailUrl}" target="_blank" rel="noopener" class="share-option" aria-label="Share via Gmail">Gmail</a>
        <button type="button" class="share-option share-copy" aria-label="Copy recipe">Copy recipe</button>
    `;
    const removeMenu = () => {
        menu.remove();
        document.removeEventListener('click', close);
    };
    menu.querySelector('.share-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            showShareToast('Copied!');
            removeMenu();
        });
    });
    menu.querySelectorAll('a.share-option').forEach(a => {
        a.addEventListener('click', () => setTimeout(removeMenu, 100));
    });
    document.body.appendChild(menu);
    const rect = triggerEl.getBoundingClientRect();
    const menuHeight = 260;
    const openAbove = rect.bottom + menuHeight > window.innerHeight - 20;
    menu.style.position = 'fixed';
    menu.style.top = openAbove ? `${Math.max(8, rect.top - menuHeight - 8)}px` : `${rect.bottom + 8}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 200))}px`;
    const close = (e) => {
        if (!menu.contains(e?.target) && e?.target !== triggerEl) removeMenu();
    };
    setTimeout(() => document.addEventListener('click', close), 0);
}

/**
 * Share cocktail
 */
function shareCocktail(cocktail, triggerEl) {
    const text = getCocktailShareText(cocktail);
    const title = `${cocktail.strDrink} - Cocktail Recipe`;
    if (navigator.share) {
        navigator.share({ title, text })
            .then(() => showShareToast('Shared!'))
            .catch((err) => { if (err.name !== 'AbortError') openShareMenu(text, title, triggerEl); });
        return;
    }
    openShareMenu(text, title, triggerEl);
}

/**
 * Share My Cocktail
 */
function shareMyCocktail(cocktail, triggerEl) {
    const text = getMyCocktailShareText(cocktail);
    const title = `${cocktail.name || 'My Cocktail'} - Cocktail Recipe`;
    if (navigator.share) {
        navigator.share({ title, text })
            .then(() => showShareToast('Shared!'))
            .catch((err) => { if (err.name !== 'AbortError') openShareMenu(text, title, triggerEl); });
        return;
    }
    openShareMenu(text, title, triggerEl);
}

/**
 * Render Party Planner modal
 */
function renderPartyPlannerModal(partyCocktailsList, partyIngredientsList, partyPlannerEmpty, partyGuestsInput, partyPlannerModal, displayCocktailDetails, onPartyPlannerCalculate) {
    if (!partyCocktailsList || !partyIngredientsList) return;
    const list = store.getPartyCocktails();
    if (partyPlannerEmpty) partyPlannerEmpty.style.display = list.length === 0 ? 'block' : 'none';
    const guests = Math.max(1, parseInt(partyGuestsInput?.value, 10) || 1);
    partyCocktailsList.innerHTML = list.map(c => `
        <div class="party-cocktail-item" data-id="${c.idDrink}">
            <img src="${c.strDrinkThumb || ''}" alt="${c.strDrink}" class="party-cocktail-img">
            <span class="party-cocktail-name">${utils.escapeHtml(c.strDrink)}</span>
            <button type="button" class="party-cocktail-remove" aria-label="Remove ${utils.escapeHtml(c.strDrink)} from party">✕</button>
        </div>
    `).join('');
    partyCocktailsList.querySelectorAll('.party-cocktail-item').forEach(el => {
        const id = el.getAttribute('data-id');
        const cocktail = list.find(c => c.idDrink === id);
        el.querySelector('.party-cocktail-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            store.removeFromParty(id);
            renderPartyPlannerModal(partyCocktailsList, partyIngredientsList, partyPlannerEmpty, partyGuestsInput, partyPlannerModal, displayCocktailDetails, onPartyPlannerCalculate);
        });
        el.addEventListener('click', (e) => {
            if (e.target.closest('.party-cocktail-remove')) return;
            if (cocktail) {
                if (partyPlannerModal) partyPlannerModal.style.display = 'none';
                displayCocktailDetails(cocktail, { partyGuests: guests });
            }
        });
    });
    const aggregated = utils.aggregateIngredients(list, guests);
    partyIngredientsList.innerHTML = aggregated.length ? aggregated.map(i => `<li>${utils.escapeHtml(i.display)}</li>`).join('') : '';
}

/**
 * Render favorites list
 */
function renderFavoritesList(listEl, displayCocktailDetails, savedCustomModal) {
    if (!listEl) return;
    const list = store.getFavorites();
    if (list.length === 0) {
        listEl.innerHTML = '<p class="no-favorites-msg">No favorite drinks yet. Click ♥ on any cocktail to add it here.</p>';
        return;
    }
    listEl.innerHTML = list.map(c => `
        <div class="favorite-item" data-id="${c.idDrink}">
            <img src="${c.strDrinkThumb || ''}" alt="${utils.escapeHtml(c.strDrink || 'Cocktail')}" class="favorite-item-img">
            <span class="favorite-item-name">${utils.escapeHtml(c.strDrink)}</span>
            <button type="button" class="favorite-item-remove" title="Remove from favorites" aria-label="Remove ${utils.escapeHtml(c.strDrink || 'cocktail')} from favorites">✕</button>
        </div>
    `).join('');
    listEl.querySelectorAll('.favorite-item').forEach(el => {
        const id = el.getAttribute('data-id');
        const cocktail = list.find(c => c.idDrink === id);
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-item-remove')) {
                e.stopPropagation();
                store.removeFavorite(id);
                renderFavoritesList(listEl, displayCocktailDetails, savedCustomModal);
            } else if (cocktail) {
                displayCocktailDetails(cocktail);
                if (savedCustomModal) savedCustomModal.style.display = 'none';
            }
        });
    });
}

/**
 * Render My Cocktails list
 */
function renderMyCocktailsList(listEl, displayCocktailDetails, savedCustomModal) {
    if (!listEl) return;
    const inventList = store.getMyCocktails();
    const customList = store.getCustomCocktails();
    const all = [
        ...inventList.map(c => ({ ...c, _source: 'invent', _displayName: c.name || 'My Cocktail' })),
        ...customList.map(c => ({ ...c, _source: 'custom', _displayName: c.strDrink || c.name || 'Custom' }))
    ];
    if (all.length === 0) {
        listEl.innerHTML = '<p class="no-favorites-msg">No custom recipes yet. Click "Create New Recipe" to add one.</p>';
        return;
    }
    listEl.innerHTML = all.map(c => {
        const id = c.id || c.idDrink;
        return `<div class="favorite-item my-cocktail-item" data-id="${utils.escapeHtml(id)}" data-source="${c._source}">
            <span class="favorite-item-name">${utils.escapeHtml(c._displayName)}</span>
            <button type="button" class="favorite-item-remove" title="Remove" aria-label="Remove">✕</button>
        </div>`;
    }).join('');
    listEl.querySelectorAll('.my-cocktail-item').forEach(el => {
        const id = el.getAttribute('data-id');
        const source = el.getAttribute('data-source');
        const cocktail = source === 'invent' ? inventList.find(c => c.id === id) : customList.find(c => (c.id || c.idDrink) === id);
        el.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-item-remove')) {
                e.stopPropagation();
                if (source === 'invent') store.removeMyCocktail(id);
                else store.deleteCustomCocktail(id);
                renderMyCocktailsList(listEl, displayCocktailDetails, savedCustomModal);
            } else if (cocktail) {
                displayCocktailDetails(source === 'custom' ? store.customToDisplayFormat(cocktail) : cocktail);
                if (savedCustomModal) savedCustomModal.style.display = 'none';
            }
        });
    });
}

/**
 * Render map bar cards (for AI chat)
 */
function renderMapBarCards(bars, msgEl, mapInstance, mapBarMarkers, escapeHtml) {
    if (!bars.length || !msgEl) return;
    const row = document.createElement('div');
    row.className = 'ai-chat-bar-suggestions';
    bars.forEach(b => {
        const card = document.createElement('div');
        card.className = 'ai-chat-bar-card';
        card.innerHTML = `
            <strong>${escapeHtml(b.name)}</strong>
            ${b.addr ? `<p class="ai-chat-bar-addr">${escapeHtml(b.addr)}</p>` : ''}
            <a href="${b.googleSearchUrl}" target="_blank" rel="noopener" class="btn-ai-bar-link btn-google-search">🔍 Search</a>
            <a href="${b.googleMapsUrl}" target="_blank" rel="noopener" class="btn-ai-bar-link btn-google-maps">📍 Maps</a>
            <button type="button" class="btn-ai-show-map" data-lat="${b.lat}" data-lon="${b.lon}">Show on map</button>
        `;
        card.querySelector('.btn-ai-show-map')?.addEventListener('click', () => {
            const key = `${Number(b.lat).toFixed(5)},${Number(b.lon).toFixed(5)}`;
            const marker = mapBarMarkers.get(key);
            if (mapInstance && marker) {
                mapInstance.setView([b.lat, b.lon], 17);
                marker.openPopup();
            }
        });
        row.appendChild(card);
    });
    msgEl.appendChild(row);
}

/**
 * Render party cocktail cards (for AI chat)
 */
function renderPartyCocktailCards(cocktails, msgEl, API_BASE_URL, toggleParty, onPartyPlannerCalculate) {
    if (!cocktails.length || !msgEl) return;
    const row = document.createElement('div');
    row.className = 'ai-chat-suggestions';
    cocktails.forEach(c => {
        const card = document.createElement('div');
        card.className = 'ai-chat-cocktail-card';
        card.innerHTML = `
            <img src="${c.strDrinkThumb || ''}" alt="${utils.escapeHtml(c.strDrink)}" class="ai-chat-cocktail-img">
            <span class="ai-chat-cocktail-name">${utils.escapeHtml(c.strDrink)}</span>
            <button type="button" class="ai-chat-add-party" data-id="${c.idDrink}" aria-label="Add ${utils.escapeHtml(c.strDrink)} to party">+</button>
        `;
        const inParty = store.getPartyCocktails().some(p => p.idDrink === c.idDrink);
        const btn = card.querySelector('.ai-chat-add-party');
        btn.textContent = inParty ? '✓' : '+';
        btn.classList.toggle('in-party', inParty);
        btn.setAttribute('aria-label', inParty ? `Remove ${utils.escapeHtml(c.strDrink)} from party` : `Add ${utils.escapeHtml(c.strDrink)} to party`);
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
                const res = await fetch(`${API_BASE_URL}/lookup.php?i=${c.idDrink}`);
                const data = await res.json();
                const full = data?.drinks?.[0];
                if (full) {
                    const nowInParty = store.toggleParty(full);
                    btn.textContent = nowInParty ? '✓' : '+';
                    btn.classList.toggle('in-party', nowInParty);
                    btn.setAttribute('aria-label', nowInParty ? `Remove ${utils.escapeHtml(c.strDrink)} from party` : `Add ${utils.escapeHtml(c.strDrink)} to party`);
                    onPartyPlannerCalculate();
                }
            } catch (_) {}
            btn.disabled = false;
        });
        row.appendChild(card);
    });
    msgEl.appendChild(row);
}


Object.assign(render, {
  showLoading, hideSearchLoading, showError, showCenteredError, showNoResults, trapFocusInModal, setMapStatus,
  createLearnMoreLink, updateLearnMoreLink, showShareToast, getCocktailShareText,
  getMyCocktailShareText, openShareMenu, shareCocktail, shareMyCocktail,
  renderPartyPlannerModal, renderFavoritesList, renderMyCocktailsList,
  renderMapBarCards, renderPartyCocktailCards
});

/**
 * ingredient-image.js - Click ingredient to show image popup
 * Standalone module, minimal coupling.
 */
const INGREDIENT_IMG_BASE = 'https://www.thecocktaildb.com/images/ingredients/';

function getIngredientImageUrl(name) {
    if (!name || !name.trim()) return null;
    const encoded = encodeURIComponent(name.trim());
    return `${INGREDIENT_IMG_BASE}${encoded}-Small.png`;
}

function initIngredientImage() {
    let modal = document.getElementById('ingredientImageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ingredientImageModal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="modal-content modal-content-ingredient">
                <button type="button" class="close" aria-label="Close">&times;</button>
                <img id="ingredientImageImg" class="ingredient-popup-img" alt="">
                <p id="ingredientImageName" class="ingredient-popup-name"></p>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close').addEventListener('click', () => { modal.style.display = 'none'; });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') modal.style.display = 'none';
        });
    }

    document.addEventListener('click', (e) => {
        const li = e.target.closest('.ingredient-clickable');
        if (!li) return;
        const name = li.getAttribute('data-ingredient');
        if (!name) return;
        const url = getIngredientImageUrl(name);
        if (!url) return;
        const img = modal.querySelector('#ingredientImageImg');
        const nameEl = modal.querySelector('#ingredientImageName');
        img.src = url;
        img.alt = name;
        img.onerror = () => { img.style.display = 'none'; };
        img.style.display = '';
        nameEl.textContent = name;
        modal.style.display = 'block';
    });
}


/**
 * js/main.js - Entry point
 * Initialize event listeners and coordinate logic.
 */

// ========== DOM Elements ==========
const ingredientInput = document.getElementById('ingredientInput');
const searchBtn = document.getElementById('searchBtn');
const surpriseBtn = document.getElementById('surpriseBtn');
const personalDetailsBtn = document.getElementById('personalDetailsBtn');
const resultsDiv = document.getElementById('results');
const cocktailModal = document.getElementById('cocktailModal');
const personalModal = document.getElementById('personalModal');
const modalBody = document.getElementById('modalBody');
const learnMoreContainer = document.getElementById('learnMoreContainer');
const savedCustomModal = document.getElementById('savedCustomModal');
const academyModal = document.getElementById('academyModal');
const mapModal = document.getElementById('mapModal');
const mapContainer = document.getElementById('mapContainer');
const mapStatus = document.getElementById('mapStatus');
const mapShowLocationBtn = document.getElementById('mapShowLocationBtn');
const partyPlannerModal = document.getElementById('partyPlannerModal');
const partyCocktailsList = document.getElementById('partyCocktailsList');
const partyGuestsInput = document.getElementById('partyGuestsInput');
const partyCalculateBtn = document.getElementById('partyCalculateBtn');
const partyIngredientsList = document.getElementById('partyIngredientsList');
const partyPlannerEmpty = document.getElementById('partyPlannerEmpty');
const cocktailModalAddToParty = document.getElementById('cocktailModalAddToParty');
const bacModal = document.getElementById('bacModal');
const bacDrinksList = document.getElementById('bacDrinksList');
const bacResult = document.getElementById('bacResult');
const inventoryModal = document.getElementById('inventoryModal');
const invSearchEl = document.getElementById('invSearch');
const invIngredientsGridEl = document.getElementById('invIngredientsGrid');
const invMatchResultsEl = document.getElementById('invMatchResults');
const invShoppingListEl = document.getElementById('invShoppingList');
const closeButtons = document.querySelectorAll('.close');

let mapInstance = null;
let statsPolarChart = null;
let lastDisplayedCocktailForAI = null;
let mapBarsCache = [];
let mapBarMarkers = new Map();

// ========== Display Cocktails ==========

function displayCocktails(cocktails, searchedIngredient) {
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';

    cocktails.forEach(cocktail => {
        const card = document.createElement('div');
        card.className = 'cocktail-card';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.cocktail-video-badge') || e.target.closest('.cocktail-favorite-btn') || e.target.closest('.cocktail-party-btn')) return;
            const isCustom = cocktail._isCustom || (cocktail.idDrink && String(cocktail.idDrink).startsWith('custom-'));
            if (isCustom) {
                const full = store.getCustomCocktails().find(c => (c.idDrink || c.id) === cocktail.idDrink);
                displayCocktailDetails(full || cocktail);
            } else if (cocktail.strIngredient1 !== undefined) {
                displayCocktailDetails(cocktail);
            } else if (cocktail.idDrink && !String(cocktail.idDrink).startsWith('custom-')) {
                getCocktailDetails(cocktail.idDrink, cocktail);
            }
        });

        const imageWrap = document.createElement('div');
        imageWrap.className = 'cocktail-image-wrap';
        const image = document.createElement('img');
        image.src = cocktail.strDrinkThumb || 'https://via.placeholder.com/300x300?text=No+Image';
        image.alt = cocktail.strDrink ? `${cocktail.strDrink} cocktail` : 'Cocktail image';
        image.className = 'cocktail-image';
        image.onerror = function() { this.src = 'https://via.placeholder.com/300x300?text=No+Image'; };
        imageWrap.appendChild(image);

        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'cocktail-favorite-btn' + (store.isFavorite(cocktail.idDrink) ? ' is-favorite' : '');
        favoriteBtn.type = 'button';
        favoriteBtn.title = store.isFavorite(cocktail.idDrink) ? 'Remove from favorites' : 'Add to favorites';
        favoriteBtn.setAttribute('aria-label', store.isFavorite(cocktail.idDrink) ? 'Remove from favorites' : 'Add to favorites');
        favoriteBtn.innerHTML = '♡';
        favoriteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            let c = cocktail.strIngredient1 !== undefined ? cocktail : null;
            if (!c) {
                try { c = await api.fetchCocktailById(cocktail.idDrink); } catch (_) { c = cocktail; }
            }
            const added = store.toggleFavorite(c || cocktail);
            favoriteBtn.classList.toggle('is-favorite', added);
            favoriteBtn.innerHTML = added ? '♥' : '♡';
            favoriteBtn.title = added ? 'Remove from favorites' : 'Add to favorites';
            favoriteBtn.setAttribute('aria-label', added ? 'Remove from favorites' : 'Add to favorites');
        });
        if (store.isFavorite(cocktail.idDrink)) favoriteBtn.innerHTML = '♥';
        imageWrap.appendChild(favoriteBtn);

        const inParty = store.getPartyCocktails().some(c => c.idDrink === cocktail.idDrink);
        const partyBtn = document.createElement('button');
        partyBtn.className = 'cocktail-party-btn' + (inParty ? ' in-party' : '');
        partyBtn.type = 'button';
        partyBtn.title = inParty ? 'Remove from party' : 'Add to party';
        partyBtn.setAttribute('aria-label', inParty ? 'Remove from party' : 'Add to party');
        partyBtn.innerHTML = '🥂';
        partyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            let c = cocktail.strIngredient1 !== undefined ? cocktail : null;
            if (!c) {
                try {
                    c = await api.fetchCocktailById(cocktail.idDrink);
                } catch (err) { return; }
            }
            if (c) {
                const nowInParty = store.toggleParty(c);
                partyBtn.classList.toggle('in-party', nowInParty);
                partyBtn.title = nowInParty ? 'Remove from party' : 'Add to party';
                partyBtn.setAttribute('aria-label', nowInParty ? 'Remove from party' : 'Add to party');
                onPartyPlannerCalculate();
            }
        });
        imageWrap.appendChild(partyBtn);

        if (cocktail.strVideo && cocktail.strVideo.trim()) {
            const videoBadge = document.createElement('a');
            videoBadge.className = 'cocktail-video-badge';
            videoBadge.href = cocktail.strVideo;
            videoBadge.target = '_blank';
            videoBadge.rel = 'noopener noreferrer';
            videoBadge.title = 'Watch preparation video on YouTube';
            videoBadge.innerHTML = '▶';
            videoBadge.setAttribute('aria-label', `Watch ${cocktail.strDrink} preparation video`);
            videoBadge.addEventListener('click', (e) => e.stopPropagation());
            imageWrap.appendChild(videoBadge);
        }

        const name = document.createElement('div');
        name.className = 'cocktail-name';
        name.textContent = cocktail.strDrink;

        card.appendChild(imageWrap);
        card.appendChild(name);
        resultsDiv.appendChild(card);
    });
}

function displayCocktailDetails(cocktail, options = {}) {
    if (!modalBody) return;
    const modalContent = modalBody.parentElement;
    modalContent?.querySelector('.back-to-list-btn')?.remove();
    if (options.fromInventory && modalContent) {
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'back-to-list-btn';
        backBtn.textContent = 'Back';
        backBtn.setAttribute('aria-label', 'Back to list');
        backBtn.addEventListener('click', () => {
            cocktailModal.style.display = 'none';
            if (inventoryModal) {
                inventoryModal.style.display = 'block';
                switchInvTab('what-to-make');
                render.trapFocusInModal(inventoryModal);
            }
        });
        modalContent.insertBefore(backBtn, modalContent.firstChild);
    }
    modalBody.innerHTML = '';
    if (cocktail && !cocktail.id?.toString().startsWith('my-')) {
        lastDisplayedCocktailForAI = cocktail;
    }

    const isMyCocktail = (cocktail.id && (String(cocktail.id).startsWith('my-') || String(cocktail.id).startsWith('custom-'))) || (typeof cocktail.ingredients === 'string' && typeof cocktail.instructions === 'string');

    if (isMyCocktail) {
        const nameEl = document.createElement('h2');
        nameEl.className = 'cocktail-detail-name';
        nameEl.textContent = cocktail.name || 'My Cocktail';
        modalBody.appendChild(nameEl);

        const ingredientsSection = document.createElement('div');
        ingredientsSection.className = 'detail-section';
        const ingredientsTitle = document.createElement('h3');
        ingredientsTitle.textContent = 'Ingredients';
        ingredientsSection.appendChild(ingredientsTitle);
        const ingredientsList = document.createElement('ul');
        ingredientsList.className = 'ingredients-list';
        (cocktail.ingredients || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean).forEach(ing => {
            const li = document.createElement('li');
            li.className = 'ingredient-clickable';
            li.setAttribute('data-ingredient', ing);
            li.textContent = ing;
            ingredientsList.appendChild(li);
        });
        ingredientsSection.appendChild(ingredientsList);
        modalBody.appendChild(ingredientsSection);

        if (cocktail.instructions) {
            const instructionsSection = document.createElement('div');
            instructionsSection.className = 'detail-section';
            const instructionsTitle = document.createElement('h3');
            instructionsTitle.textContent = 'Instructions';
            instructionsSection.appendChild(instructionsTitle);
            const instructions = document.createElement('p');
            instructions.className = 'instructions';
            instructions.textContent = cocktail.instructions;
            instructionsSection.appendChild(instructions);
            modalBody.appendChild(instructionsSection);
        }
        const myShareSection = document.createElement('div');
        myShareSection.className = 'detail-section share-section';
        const myShareBtn = document.createElement('button');
        myShareBtn.type = 'button';
        myShareBtn.className = 'btn btn-secondary share-btn';
        myShareBtn.innerHTML = '📤 Share';
        myShareBtn.addEventListener('click', () => render.shareMyCocktail(cocktail, myShareBtn));
        myShareSection.appendChild(myShareBtn);
        modalBody.appendChild(myShareSection);
        cocktailModal.style.display = 'block';
        if (cocktailModalAddToParty) cocktailModalAddToParty.innerHTML = '';
        render.trapFocusInModal(cocktailModal);
        return;
    }

    const name = document.createElement('h2');
    name.className = 'cocktail-detail-name';
    name.textContent = cocktail.strDrink;
    modalBody.appendChild(name);

    if (cocktail.strDrinkThumb) {
        const image = document.createElement('img');
        image.src = cocktail.strDrinkThumb;
        image.alt = `${cocktail.strDrink} cocktail image`;
        image.className = 'cocktail-detail-image';
        image.onerror = function() { this.style.display = 'none'; };
        modalBody.appendChild(image);
    }

    const ingredientsSection = document.createElement('div');
    ingredientsSection.className = 'detail-section';
    const ingredientsTitle = document.createElement('h3');
    ingredientsTitle.textContent = 'Ingredients';
    ingredientsSection.appendChild(ingredientsTitle);
    const ingredientsList = document.createElement('ul');
    ingredientsList.className = 'ingredients-list';
    for (let i = 1; i <= 15; i++) {
        const ingredient = cocktail[`strIngredient${i}`];
        const measure = cocktail[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
            const li = document.createElement('li');
            li.className = 'ingredient-clickable';
            li.setAttribute('data-ingredient', ingredient.trim());
            li.textContent = measure ? `${measure.trim()} ${ingredient}` : ingredient;
            ingredientsList.appendChild(li);
        }
    }
    ingredientsSection.appendChild(ingredientsList);
    modalBody.appendChild(ingredientsSection);

    const partyModeSection = document.createElement('div');
    partyModeSection.className = 'detail-section party-mode-section';
    partyModeSection.innerHTML = `
        <h3>Party Mode (Party Calculator)</h3>
        <label for="cocktailPartyGuests" class="party-mode-label">Number of Guests</label>
        <input type="number" id="cocktailPartyGuests" class="party-mode-input" min="1" max="999" value="1" aria-label="Number of guests for party">
        <div class="party-mode-scaled" id="partyModeScaled"></div>
    `;
    const partyGuestsInputEl = partyModeSection.querySelector('#cocktailPartyGuests');
    const partyModeScaled = partyModeSection.querySelector('#partyModeScaled');
    const updatePartyMode = () => {
        const g = Math.max(1, parseInt(partyGuestsInputEl?.value, 10) || 1);
        if (g <= 1) { partyModeScaled.innerHTML = ''; return; }
        const items = utils.getScaledIngredientsForCocktail(cocktail, g);
        partyModeScaled.innerHTML = `<p class="party-mode-title">For ${g} guests</p><ul class="ingredients-list party-scaled-list">` + items.map(t => `<li>${utils.escapeHtml(t)}</li>`).join('') + '</ul>';
    };
    partyGuestsInputEl?.addEventListener('input', updatePartyMode);
    partyGuestsInputEl?.addEventListener('change', updatePartyMode);
    modalBody.appendChild(partyModeSection);

    const partyGuests = options.partyGuests;
    if (partyGuests && partyGuests > 1 && partyGuestsInputEl) {
        partyGuestsInputEl.value = partyGuests;
        updatePartyMode();
    }

    if (cocktail.strInstructions) {
        const instructionsSection = document.createElement('div');
        instructionsSection.className = 'detail-section';
        const instructionsTitle = document.createElement('h3');
        instructionsTitle.textContent = 'Instructions';
        instructionsSection.appendChild(instructionsTitle);
        const instructions = document.createElement('p');
        instructions.className = 'instructions';
        instructions.textContent = cocktail.strInstructions;
        instructionsSection.appendChild(instructions);
        modalBody.appendChild(instructionsSection);
    }

    if (cocktail.strVideo) {
        const videoSection = document.createElement('div');
        videoSection.className = 'detail-section';
        const videoLink = document.createElement('a');
        videoLink.href = cocktail.strVideo;
        videoLink.target = '_blank';
        videoLink.rel = 'noopener noreferrer';
        videoLink.className = 'video-link';
        videoLink.textContent = '📺 Watch on YouTube';
        videoSection.appendChild(videoLink);
        modalBody.appendChild(videoSection);
    }

    if (cocktailModalAddToParty) {
        cocktailModalAddToParty.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'modal-action-buttons';

        const favBtn = document.createElement('button');
        favBtn.type = 'button';
        favBtn.className = 'btn btn-secondary favorite-modal-btn modal-action-btn' + (store.isFavorite(cocktail.idDrink) ? ' is-favorite' : '');
        favBtn.innerHTML = (store.isFavorite(cocktail.idDrink) ? '♥' : '♡') + ' Favorites';
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const added = store.toggleFavorite(cocktail);
            favBtn.classList.toggle('is-favorite', added);
            favBtn.innerHTML = (added ? '♥' : '♡') + ' Favorites';
        });
        wrap.appendChild(favBtn);

        const inParty = store.getPartyCocktails().some(c => c.idDrink === cocktail.idDrink);
        const partyBtn = document.createElement('button');
        partyBtn.type = 'button';
        partyBtn.className = 'btn btn-secondary add-to-party-btn modal-action-btn';
        partyBtn.innerHTML = (inParty ? '✓' : '🥂') + ' Party';
        partyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const nowInParty = store.toggleParty(cocktail);
            partyBtn.classList.toggle('in-party', nowInParty);
            partyBtn.innerHTML = (nowInParty ? '✓' : '🥂') + ' Party';
            onPartyPlannerCalculate();
        });
        wrap.appendChild(partyBtn);

        const shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.className = 'btn btn-secondary share-btn modal-action-btn';
        shareBtn.innerHTML = '📤 Share';
        shareBtn.addEventListener('click', () => render.shareCocktail(cocktail, shareBtn));
        wrap.appendChild(shareBtn);

        if (cocktail._isCustom || (cocktail.idDrink && String(cocktail.idDrink).startsWith('custom-'))) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn btn-secondary delete-recipe-btn modal-action-btn';
            delBtn.textContent = '🗑️ Delete';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this recipe?')) {
                    store.deleteCustomCocktail(cocktail.idDrink || cocktail.id);
                    cocktailModal.style.display = 'none';
                    render.showShareToast('Recipe deleted.');
                }
            });
            wrap.appendChild(delBtn);
        }

        cocktailModalAddToParty.appendChild(wrap);
    }

    cocktailModal.style.display = 'block';
    render.trapFocusInModal(cocktailModal);
}

// ========== Search ==========

async function searchByIngredient(ingredient) {
    if (!ingredient.trim()) {
        render.showError(resultsDiv, 'Please enter an ingredient');
        if (learnMoreContainer) learnMoreContainer.innerHTML = '';
        return;
    }

    try {
        render.showLoading(resultsDiv);
        const translatedIngredient = utils.translateIngredient(ingredient);
        render.updateLearnMoreLink(learnMoreContainer, translatedIngredient);

        const officialName = await api.getOfficialIngredientName(translatedIngredient);
        const listName = await api.getExactIngredientFromList(translatedIngredient);
        const filterIngredient = officialName || listName || translatedIngredient;

        const fromIndex = api.searchByIngredientIndex(filterIngredient);
        if (fromIndex && fromIndex.length > 0) {
            const fullCocktails = await api.fetchFullDetailsForCocktails(fromIndex);
            const custom = store.customCocktailsMatchingIngredient(filterIngredient).map(store.customToDisplayFormat);
            render.hideSearchLoading();
            displayCocktails([...custom, ...fullCocktails], filterIngredient);
            return;
        }

        const data = await api.fetchFilterByIngredient(filterIngredient);
        let allFound = [];
        if (data.drinks && data.drinks.length > 0) {
            const fullFromFilter = await api.fetchFullDetailsForCocktails(data.drinks);
            allFound = fullFromFilter.filter(c => utils.cocktailContainsIngredient(c, filterIngredient))
                .map(c => ({ idDrink: c.idDrink, strDrink: c.strDrink, strDrinkThumb: c.strDrinkThumb }));
        }

        const fromFullScan = allFound.length < 15
            ? await api.searchAllCocktailsByIngredient(filterIngredient, utils.cocktailContainsIngredient, 25, 12)
            : [];
        const mergedIds = new Set(allFound.map(c => c.idDrink));
        for (const c of fromFullScan) {
            if (!mergedIds.has(c.idDrink)) { mergedIds.add(c.idDrink); allFound.push(c); }
        }

        if (allFound.length > 0) {
            const fullCocktails = await api.fetchFullDetailsForCocktails(allFound);
            const custom = store.customCocktailsMatchingIngredient(filterIngredient).map(store.customToDisplayFormat);
            const customIds = new Set(custom.map(c => c.idDrink));
            const apiFiltered = fullCocktails.filter(c => !customIds.has(c.idDrink));
            render.hideSearchLoading();
            displayCocktails([...custom, ...apiFiltered], filterIngredient);
            return;
        }

        const nameData = await api.fetchSearchByName(filterIngredient);
        if (nameData?.drinks?.length > 0) {
            const fullCocktails = await api.fetchFullDetailsForCocktails(nameData.drinks);
            const withIngredient = fullCocktails.filter(c => utils.cocktailContainsIngredient(c, filterIngredient));
            const custom = store.customCocktailsMatchingIngredient(filterIngredient).map(store.customToDisplayFormat);
            const combined = [...custom, ...withIngredient];
            if (combined.length > 0) {
                render.hideSearchLoading();
                displayCocktails(combined, filterIngredient);
                return;
            }
        }

        const filtered = await api.searchByIngredientFallback(filterIngredient, utils.cocktailContainsIngredient, 80);
        const custom = store.customCocktailsMatchingIngredient(filterIngredient).map(store.customToDisplayFormat);
        if (filtered.length > 0 || custom.length > 0) {
            const fullCocktails = filtered.length > 0 ? await api.fetchFullDetailsForCocktails(filtered) : [];
            render.hideSearchLoading();
            displayCocktails([...custom, ...fullCocktails], filterIngredient);
        } else {
            render.hideSearchLoading();
            render.showCenteredError('No cocktails found. Try a different ingredient!');
        }
    } catch (error) {
        render.hideSearchLoading();
        render.showCenteredError('Failed to fetch cocktails. Please try again.');
        console.error('Error:', error);
    }
}

async function getRandomCocktail() {
    try {
        if (learnMoreContainer) learnMoreContainer.innerHTML = '';
        const cocktail = await api.fetchRandomCocktail();
        if (cocktail) {
            displayCocktailDetails(cocktail);
        } else {
            render.showError(resultsDiv, 'Failed to fetch random cocktail. Please try again.');
        }
    } catch (error) {
        render.showError(resultsDiv, 'Failed to fetch random cocktail. Please try again.');
    }
}

async function getCocktailDetails(cocktailId, fallbackCocktail = null) {
    try {
        const cocktail = await api.fetchCocktailById(cocktailId);
        if (cocktail) {
            displayCocktailDetails(cocktail);
        } else if (fallbackCocktail && fallbackCocktail.strDrink) {
            displayCocktailDetails({ ...fallbackCocktail, strIngredient1: null });
        } else {
            render.showCenteredError('Failed to fetch cocktail details. Please try again.');
        }
    } catch (error) {
        if (fallbackCocktail && fallbackCocktail.strDrink) {
            displayCocktailDetails({ ...fallbackCocktail, strIngredient1: null });
        } else {
            render.showCenteredError('Failed to fetch cocktail details. Please try again.');
        }
    }
}

// ========== Party Planner ==========

function onPartyPlannerCalculate() {
    render.renderPartyPlannerModal(partyCocktailsList, partyIngredientsList, partyPlannerEmpty, partyGuestsInput, partyPlannerModal, displayCocktailDetails, onPartyPlannerCalculate);
}

// ========== AI Chat ==========

function buildAIContext(contextType, catalog) {
    const base = 'You are Oriel & Elkana\'s Assistant, a professional bartender AI in the Cocktail Pro app. Answer in a friendly, concise way. Always format clearly: use ## for main headers, ### for subheaders, • for bullet points, and **bold** for emphasis. Keep paragraphs short. ';
    switch (contextType) {
        case 'academy':
            return base + 'The user is in MIXOLOGY ACADEMY - learning about glass types and techniques. Answer questions about bartending.';
        case 'map': {
            const bars = catalog || [];
            const barList = bars.slice(0, 80).map(b => b.name).join(', ');
            const formatRule = barList ? `\n\nCRITICAL: When recommending bars, you MUST choose ONLY from this exact list: ${barList}. For EACH bar you recommend, write [BAR:ExactName] on its own line.` : '';
            return base + 'The user is viewing HAPPY HOUR MAP - finding bars/pubs nearby. Help with bar recommendations.' + formatRule;
        }
        case 'saved-custom': {
            const favs = store.getFavorites().map(c => c.strDrink).join(', ') || 'none';
            const customs = [...store.getMyCocktails().map(c => c.name), ...store.getCustomCocktails().map(c => c.strDrink || c.name)].filter(Boolean).join(', ') || 'none';
            return base + `The user is in SAVED & CUSTOM - Favorites: ${favs}. Custom recipes: ${customs}. Help with suggestions or recipe ideas.`;
        }
        case 'party-planner': {
            const catalogList = (catalog || []).slice(0, 200).map(c => c.strDrink).join(', ');
            const formatRule = catalogList ? `\n\nIMPORTANT: When suggesting cocktails, choose ONLY from: ${catalogList}. For each suggested cocktail, write [COCKTAIL:Name] on its own line.` : '';
            return base + `The user is in PARTY PLANNER. Party cocktails: ${store.getPartyCocktails().map(c => c.strDrink).join(', ') || 'none'}. Guests: ${partyGuestsInput?.value || 1}.${formatRule}`;
        }
        case 'cocktail-detail': {
            const c = lastDisplayedCocktailForAI;
            if (!c) return base + 'The user is viewing a cocktail. Ask them to open a cocktail first.';
            const ing = [];
            for (let i = 1; i <= 15; i++) {
                const m = c[`strMeasure${i}`], ing0 = c[`strIngredient${i}`];
                if (ing0) ing.push((m ? m.trim() + ' ' : '') + ing0.trim());
            }
            return base + `Current cocktail: ${c.strDrink}. Ingredients: ${ing.join(', ')}. Instructions: ${c.strInstructions || 'N/A'}. Help with variations, substitutions, or questions about this drink.`;
        }
        default:
            return base + 'Answer general cocktail questions.';
    }
}

function parseAIBarSuggestions(reply, barsList) {
    const re = /\[BAR:([^\]]+)\]/gi;
    const matches = [...reply.matchAll(re)];
    const bars = [];
    const seen = new Set();
    for (const m of matches) {
        const name = m[1].trim();
        if (!name || seen.has(name.toLowerCase())) continue;
        let found = barsList.find(b => b.name.toLowerCase() === name.toLowerCase());
        if (!found) found = barsList.find(b => b.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(b.name.toLowerCase()));
        if (found) { seen.add(name.toLowerCase()); bars.push(found); }
    }
    const text = reply.replace(re, '').replace(/\n{3,}/g, '\n\n').trim();
    return { text, bars };
}

function parseAICocktailSuggestions(reply, catalog) {
    const re = /\[COCKTAIL:([^\]]+)\]/gi;
    const matches = [...reply.matchAll(re)];
    const cocktails = [];
    const seen = new Set();
    for (const m of matches) {
        const name = m[1].trim();
        if (!name || seen.has(name.toLowerCase())) continue;
        const found = catalog.find(c => c.strDrink.toLowerCase() === name.toLowerCase());
        if (found) { seen.add(name.toLowerCase()); cocktails.push(found); }
    }
    const text = reply.replace(re, '').replace(/\n{3,}/g, '\n\n').trim();
    return { text, cocktails };
}

function injectAIChat(modalEl, contextType) {
    if (!modalEl || modalEl.querySelector('.ai-chat-container')) return;
    const tpl = document.getElementById('aiChatTemplate');
    if (!tpl) return;
    const clone = tpl.content.cloneNode(true);
    const container = clone.querySelector('.ai-chat-container');
    const toggle = clone.querySelector('.ai-chat-toggle');
    const panel = clone.querySelector('.ai-chat-panel');
    const input = clone.querySelector('.ai-chat-input');
    const sendBtn = clone.querySelector('.ai-chat-send');
    const messages = clone.querySelector('.ai-chat-messages');

    toggle.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) input.focus();
    });

    const addMessage = (text, isUser) => {
        const div = document.createElement('div');
        div.className = 'ai-chat-msg' + (isUser ? ' ai-chat-user' : '');
        div.textContent = text;
        messages.appendChild(div);
        div.scrollIntoView({ block: 'start', behavior: 'instant' });
    };

    sendBtn.addEventListener('click', async () => {
        const msg = input.value.trim();
        if (!msg) return;
        addMessage(msg, true);
        input.value = '';
        sendBtn.disabled = true;
        addMessage('...', false);
        const lastMsg = messages.lastChild;
        let catalog = null;
        if (contextType === 'party-planner') catalog = await api.getAICocktailCatalog();
        if (contextType === 'map') catalog = await ensureMapWithBars();
        const ctx = buildAIContext(contextType, catalog);
        const reply = await api.askGemini(ctx, msg);
        let displayText = reply;
        if (contextType === 'party-planner' && catalog) {
            const { text, cocktails } = parseAICocktailSuggestions(reply, catalog);
            displayText = text || (cocktails.length ? 'Click + to add to party' : '');
            render.renderPartyCocktailCards(cocktails, lastMsg, api.API_BASE_URL, store.toggleParty, onPartyPlannerCalculate);
        }
        if (contextType === 'map' && catalog && catalog.length) {
            const { text, bars } = parseAIBarSuggestions(reply, catalog);
            displayText = text || (bars.length ? 'Recommendations:' : '');
        }
        lastMsg.innerHTML = utils.formatAIReply(displayText);
        lastMsg.classList.add('ai-msg-formatted');
        if (contextType === 'map' && catalog && catalog.length) {
            const { bars } = parseAIBarSuggestions(reply, catalog);
            render.renderMapBarCards(bars, lastMsg, mapInstance, mapBarMarkers, utils.escapeHtml);
        }
        lastMsg.scrollIntoView({ block: 'start', behavior: 'instant' });
        sendBtn.disabled = false;
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
    });

    const content = modalEl.querySelector('.modal-content');
    if (content) content.appendChild(container);

    if (contextType === 'party-planner') addMessage('Ask me for example: summer party cocktails, vodka drinks, classics... I\'ll pick from the site catalog. Click + to add to the list.', false);
    if (contextType === 'map') addMessage('Ask me for example: recommend bars in the area, where to meet friends... I\'ll pick from the bars on the map. Click "Show on map" to locate.', false);
}

function setupAIChatInModals() {
    injectAIChat(savedCustomModal, 'saved-custom');
    injectAIChat(academyModal, 'academy');
    injectAIChat(mapModal, 'map');
    injectAIChat(partyPlannerModal, 'party-planner');
    injectAIChat(cocktailModal, 'cocktail-detail');
}

function setupAIAssistant() {
    const bubble = document.getElementById('bot-greeting');
    const chat = document.getElementById('chat-window');
    const miniBtn = document.getElementById('aiAssistantMini');
    const yesBtn = document.getElementById('aiAssistantYes');
    const laterBtn = document.getElementById('aiAssistantLater');
    const closeBtn = document.getElementById('close-chat-btn');
    const input = document.getElementById('aiAssistantInput');
    const sendBtn = document.getElementById('aiAssistantSend');
    const messages = document.getElementById('aiAssistantMessages');

    if (!bubble || !chat) return;

    const closeChat = () => { bubble.classList.add('hidden'); chat.classList.remove('is-open'); };
    const openChat = () => { bubble.classList.add('hidden'); chat.classList.add('is-open'); input?.focus(); };
    const isChatOpen = () => chat.classList.contains('is-open');

    bubble.classList.remove('hidden');
    chat.classList.remove('is-open');

    yesBtn?.addEventListener('click', () => {
        openChat();
        const div = document.createElement('div');
        div.className = 'ai-assistant-msg';
        div.innerHTML = utils.formatAIReply('Great! Thanks 😊 Ask me any question about drinks, cocktails, bars...');
        div.classList.add('ai-msg-formatted');
        messages.appendChild(div);
    });

    laterBtn?.addEventListener('click', () => closeChat());
    miniBtn?.addEventListener('click', () => { if (isChatOpen()) closeChat(); else openChat(); });
    closeBtn?.addEventListener('click', (e) => { e.preventDefault(); closeChat(); });

    async function sendMessage() {
        const msg = input?.value?.trim();
        if (!msg) return;
        const div = document.createElement('div');
        div.className = 'ai-assistant-msg ai-assistant-user';
        div.innerHTML = utils.formatAIReply(msg);
        messages.appendChild(div);
        input.value = '';
        sendBtn.disabled = true;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-assistant-msg';
        loadingDiv.textContent = '...';
        messages.appendChild(loadingDiv);
        loadingDiv.scrollIntoView({ block: 'start', behavior: 'instant' });

        const ctx = buildAIContext('', null) + ' The user is on the main page. You are Oriel & Elkana\'s Assistant. Help with general cocktail questions, recommendations, or guide them to explore the app.';
        const reply = await api.askGemini(ctx, msg);
        loadingDiv.innerHTML = utils.formatAIReply(reply);
        loadingDiv.classList.add('ai-msg-formatted');
        loadingDiv.scrollIntoView({ block: 'start', behavior: 'instant' });
        sendBtn.disabled = false;
    }

    sendBtn?.addEventListener('click', sendMessage);
    input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
}

// ========== Map ==========

function ensureMapWithBars() {
    if (mapBarsCache.length) return Promise.resolve(mapBarsCache);
    if (!mapContainer || !window.L || !navigator.geolocation) return Promise.resolve([]);
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                if (!mapInstance && mapContainer) {
                    mapContainer.innerHTML = '';
                    const map = window.L.map('mapContainer').setView([lat, lon], 15);
                    mapInstance = map;
                    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
                    window.L.marker([lat, lon]).addTo(map).bindPopup('You are here');
                }
                api.fetchBarsNear(lat, lon).then(data => {
                    const elements = (data.elements || []).filter(e => (e.lat || e.center?.lat) && (e.lon || e.center?.lon));
                    const seen = new Set();
                    const unique = elements.filter(e => {
                        const k = `${(e.lat || e.center.lat).toFixed(5)},${(e.lon || e.center.lon).toFixed(5)}`;
                        if (seen.has(k)) return false;
                        seen.add(k);
                        return true;
                    });
                    mapBarMarkers.forEach(m => { try { m.remove(); } catch (_) {} });
                    mapBarsCache = [];
                    mapBarMarkers.clear();
                    unique.forEach(el => {
                        const plat = el.lat || el.center?.lat;
                        const plon = el.lon || el.center?.lon;
                        const name = el.tags && (el.tags.name || el.tags['name:en']) || 'Bar';
                        const addrParts = el.tags ? [el.tags.addr_housenumber, el.tags.addr_street || el.tags['addr:street'], el.tags.addr_city].filter(Boolean) : [];
                        const addr = addrParts.join(' ');
                        const searchQuery = [name, addr].filter(Boolean).join(' ');
                        const barData = { name, addr, lat: plat, lon: plon, googleSearchUrl: 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery), googleMapsUrl: 'https://www.google.com/maps?q=' + encodeURIComponent(plat + ',' + plon) };
                        mapBarsCache.push(barData);
                        const popup = `<div class="map-bar-popup"><strong>${utils.escapeHtml(name)}</strong>${addr ? `<p class="map-bar-addr">${utils.escapeHtml(addr)}</p>` : ''}<div class="map-bar-links"><a href="${barData.googleSearchUrl}" target="_blank" rel="noopener" class="btn-map-google btn-google-search">🔍 Search</a><a href="${barData.googleMapsUrl}" target="_blank" rel="noopener" class="btn-map-google btn-google-maps">📍 Maps</a></div></div>`;
                        const marker = window.L.marker([plat, plon]).addTo(mapInstance).bindPopup(popup);
                        mapBarMarkers.set(`${plat.toFixed(5)},${plon.toFixed(5)}`, marker);
                    });
                    render.setMapStatus(mapStatus, mapBarsCache.length ? `Found ${mapBarsCache.length} bar(s) nearby` : 'No bars found.');
                    resolve(mapBarsCache);
                }).catch(() => { render.setMapStatus(mapStatus, 'Could not load bars.', true); resolve([]); });
            },
            () => resolve([])
        );
    });
}

function showBarsNearMe() {
    if (!mapContainer || !window.L) return;
    render.setMapStatus(mapStatus, 'Getting your location…');
    mapShowLocationBtn.disabled = true;

    function onPosition(pos) {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        render.setMapStatus(mapStatus, 'Loading map…');

        if (mapInstance) { mapInstance.remove(); mapInstance = null; }
        mapContainer.innerHTML = '';
        const map = window.L.map('mapContainer').setView([lat, lon], 15);
        mapInstance = map;
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
        window.L.marker([lat, lon]).addTo(map).bindPopup('You are here').openPopup();

        api.fetchBarsNear(lat, lon)
            .then(data => {
                const elements = (data.elements || []).filter(e => { const lat = e.lat || e.center?.lat; const lon = e.lon || e.center?.lon; return lat && lon; });
                const seen = new Set();
                const unique = elements.filter(e => {
                    const lat = e.lat || e.center?.lat;
                    const lon = e.lon || e.center?.lon;
                    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                mapBarsCache = [];
                mapBarMarkers.clear();
                render.setMapStatus(mapStatus, unique.length ? `Found ${unique.length} bar(s) nearby` : 'No bars found in this area.');
                unique.forEach(el => {
                    const plat = el.lat || el.center?.lat;
                    const plon = el.lon || el.center?.lon;
                    const name = el.tags && (el.tags.name || el.tags['name:en']) || 'Bar';
                    const addrParts = el.tags ? [el.tags.addr_housenumber, el.tags.addr_street || el.tags['addr:street'], el.tags.addr_city].filter(Boolean) : [];
                    const addr = addrParts.join(' ');
                    const searchQuery = [name, addr].filter(Boolean).join(' ');
                    const googleSearchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery);
                    const googleMapsUrl = 'https://www.google.com/maps?q=' + encodeURIComponent(plat + ',' + plon);
                    const barData = { name, addr, lat: plat, lon: plon, googleSearchUrl, googleMapsUrl };
                    mapBarsCache.push(barData);
                    const popup = `<div class="map-bar-popup"><strong>${utils.escapeHtml(name)}</strong>${addr ? `<p class="map-bar-addr">${utils.escapeHtml(addr)}</p>` : ''}<div class="map-bar-links"><a href="${googleSearchUrl}" target="_blank" rel="noopener" class="btn-map-google btn-google-search">🔍 Search</a><a href="${googleMapsUrl}" target="_blank" rel="noopener" class="btn-map-google btn-google-maps">📍 Maps</a></div></div>`;
                    const marker = window.L.marker([plat, plon]).addTo(map).bindPopup(popup);
                    mapBarMarkers.set(`${plat.toFixed(5)},${plon.toFixed(5)}`, marker);
                });
            })
            .catch(() => render.setMapStatus(mapStatus, 'Could not load bars. Try again.', true))
            .finally(() => { mapShowLocationBtn.disabled = false; });
    }

    function onError() {
        render.setMapStatus(mapStatus, 'Location denied or unavailable. Enable location and try again.', true);
        mapShowLocationBtn.disabled = false;
    }

    if (!navigator.geolocation) {
        render.setMapStatus(mapStatus, 'Geolocation is not supported by your browser.', true);
        mapShowLocationBtn.disabled = false;
        return;
    }
    navigator.geolocation.getCurrentPosition(onPosition, onError, { enableHighAccuracy: true, timeout: 10000 });
}

// ========== BAC Calculator ==========

const BAC_ALCOHOL_DENSITY = 0.789;
const BAC_R_MALE = 0.68;
const BAC_R_FEMALE = 0.55;
const BAC_METABOLISM = 0.015;
const BAC_LIMIT_ISRAEL = 0.05;
const BAC_DRINK_TYPES = { beer: { label: '🍺 Beer', volumeMl: 330, abv: 0.05 }, wine: { label: '🍷 Wine', volumeMl: 140, abv: 0.12 }, shot: { label: '🥃 Shot', volumeMl: 60, abv: 0.40 } };

function calculateBAC(alcoholGrams, weightKg, gender, hours) {
    if (!weightKg || weightKg <= 0) return 0;
    const r = gender === 'female' ? BAC_R_FEMALE : BAC_R_MALE;
    const weightGrams = weightKg * 1000;
    const bac = (alcoholGrams / (weightGrams * r)) * 100 - BAC_METABOLISM * hours;
    return Math.max(0, bac);
}

function drinkToAlcoholGrams(volumeMl, abv) {
    return volumeMl * abv * BAC_ALCOHOL_DENSITY;
}

function setupBACCalculator() {
    const genderSelect = document.getElementById('bacGender');
    const weightInput = document.getElementById('bacWeight');
    const timeInput = document.getElementById('bacTime');
    const clearBtn = document.getElementById('bacClearDrinks');
    let drinks = [];

    function updateUI() {
        if (!bacDrinksList) return;
        bacDrinksList.innerHTML = '';
        drinks.forEach((d, i) => {
            const li = document.createElement('li');
            const info = BAC_DRINK_TYPES[d.type];
            li.innerHTML = `<span>${info.label}</span><button type="button" class="bac-remove-drink" data-index="${i}" aria-label="Remove this drink">✕</button>`;
            bacDrinksList.appendChild(li);
        });
        bacDrinksList.querySelectorAll('.bac-remove-drink').forEach(btn => {
            btn.addEventListener('click', () => {
                drinks.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
                updateUI();
                renderBACResult();
            });
        });
        renderBACResult();
    }

    function renderBACResult() {
        if (!bacResult) return;
        const weight = parseFloat(weightInput?.value, 10) || 70;
        const gender = genderSelect?.value || 'male';
        const hours = parseFloat(timeInput?.value, 10) || 0;
        let totalGrams = 0;
        drinks.forEach(d => {
            const info = BAC_DRINK_TYPES[d.type];
            totalGrams += drinkToAlcoholGrams(info.volumeMl, info.abv);
        });
        const bac = calculateBAC(totalGrams, weight, gender, hours);
        bacResult.className = 'bac-result';
        if (bac < BAC_LIMIT_ISRAEL) {
            bacResult.classList.add('bac-ok');
            bacResult.textContent = `Estimated BAC: ${bac.toFixed(3)}% — Likely OK to Drive (Israel Limit: 0.05%*)`;
        } else {
            bacResult.classList.add('bac-danger');
            bacResult.textContent = `Estimated BAC: ${bac.toFixed(3)}% — DO NOT DRIVE ⛔`;
        }
    }

    document.querySelectorAll('.bac-drink-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            if (BAC_DRINK_TYPES[type]) { drinks.push({ type }); updateUI(); }
        });
    });
    if (clearBtn) clearBtn.addEventListener('click', () => { drinks = []; updateUI(); });
    [genderSelect, weightInput, timeInput].forEach(el => {
        el?.addEventListener('change', renderBACResult);
        el?.addEventListener('input', renderBACResult);
    });
    updateUI();
}

// ========== Stats ==========

const ALCOHOL_BASES = ['vodka', 'gin', 'rum', 'tequila', 'whiskey', 'whisky', 'bourbon', 'brandy', 'champagne', 'wine', 'other'];

function getAlcoholBase(cocktail) {
    for (let i = 1; i <= 15; i++) {
        const ing = (cocktail[`strIngredient${i}`] || '').toLowerCase();
        if (!ing) continue;
        for (const base of ALCOHOL_BASES) {
            if (base !== 'other' && ing.includes(base)) return base.charAt(0).toUpperCase() + base.slice(1);
        }
    }
    return 'Other';
}

function isAlcoholic(cocktail) {
    const alcoholWords = /vodka|gin|rum|tequila|whiskey|whisky|bourbon|brandy|champagne|wine|liqueur|vermouth|bitters/;
    for (let i = 1; i <= 15; i++) {
        const ing = (cocktail[`strIngredient${i}`] || '').toLowerCase();
        if (alcoholWords.test(ing)) return true;
    }
    return false;
}

/**
 * Reads favorites from store, extracts ALL ingredients (strIngredient1-15),
 * counts frequency, sorts and returns Top 8 most used ingredients.
 * Returns { labels: string[], data: number[] }
 */
function calculateFavoriteIngredients() {
    const favorites = store.getFavorites();
    const counts = {};
    favorites.forEach(cocktail => {
        for (let i = 1; i <= 15; i++) {
            const ing = cocktail[`strIngredient${i}`];
            if (!ing || !ing.trim()) continue;
            const name = ing.trim();
            const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    return {
        labels: sorted.map(([k]) => k),
        data: sorted.map(([, v]) => v)
    };
}

/**
 * Premium high-contrast palette for Polar Area chart.
 * Distinct colors for dark theme.
 */
function generatePremiumPolarColors(count) {
    const palette = [
        'rgba(212, 175, 55, 0.7)',   // Gold/Whisky
        'rgba(192, 57, 43, 0.7)',    // Wine Red
        'rgba(41, 128, 185, 0.7)',   // Ice Blue
        'rgba(39, 174, 96, 0.7)',    // Mint/Lime
        'rgba(142, 68, 173, 0.7)',   // Deep Purple
        'rgba(211, 84, 0, 0.7)',     // Orange/Amber
        'rgba(189, 195, 199, 0.7)',  // Silver/Grey
        'rgba(22, 160, 133, 0.7)'    // Teal
    ];
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(palette[i % palette.length]);
    }
    return colors;
}

function setupStatsCharts() {
    const favorites = store.getFavorites();
    const polarCtx = document.getElementById('statsPolarChart');
    const polarEmpty = document.getElementById('statsPolarEmpty');
    if (statsPolarChart) { statsPolarChart.destroy(); statsPolarChart = null; }
    if (!favorites.length) {
        if (polarEmpty) {
            polarEmpty.textContent = 'You need to favorite some cocktails first to see your taste profile!';
            polarEmpty.style.display = 'block';
        }
        if (polarCtx?.parentElement) polarCtx.parentElement.style.display = 'none';
        return;
    }
    if (polarEmpty) polarEmpty.style.display = 'none';
    if (polarCtx?.parentElement) polarCtx.parentElement.style.display = 'block';
    const { labels, data } = calculateFavoriteIngredients();
    const colors = generatePremiumPolarColors(labels.length);
    const displayLabels = labels.map((l, i) => `${l} (${data[i]})`);
    if (polarCtx && typeof Chart !== 'undefined' && labels.length > 0) {
        statsPolarChart = new Chart(polarCtx, {
            type: 'polarArea',
            data: {
                labels: displayLabels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderColor: '#1a1a1a',
                    borderWidth: 2,
                    hoverBackgroundColor: colors.map(c => c.replace('0.7)', '0.95)')),
                    hoverBorderColor: 'rgba(212, 175, 55, 0.8)',
                    hoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                layout: { padding: 0 },
                elements: {
                    arc: {
                        borderRadius: 0
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { display: false },
                        grid: {
                            color: 'rgba(212, 175, 55, 0.15)',
                            circular: true
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        pointLabels: {
                            display: true,
                            centerPointLabels: true,
                            color: '#e8e8e8',
                            font: { size: 12, weight: '600' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#e8e8e8',
                            font: { size: 11 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleColor: '#d4af37',
                        bodyColor: '#e8e8e8',
                        callbacks: {
                            label: (ctx) => ` ${ctx.raw} cocktails`
                        }
                    }
                }
            }
        });
    }
}

// ========== Smart Bar Inventory (3-Tab) ==========

function invInventoryMatches(userIng, cocktailIng) {
    const u = userIng.toLowerCase().trim();
    const c = cocktailIng.toLowerCase().trim();
    return c === u || c.includes(u) || u.includes(c);
}

let _invIngredientsCache = [];

function switchInvTab(tabId) {
    document.querySelectorAll('.inv-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-inv-tab') === tabId);
        t.setAttribute('aria-selected', t.getAttribute('data-inv-tab') === tabId ? 'true' : 'false');
    });
    const myBar = document.getElementById('invTabMyBar');
    const whatToMake = document.getElementById('invTabWhatToMake');
    const shoppingList = document.getElementById('invTabShoppingList');
    if (myBar) myBar.hidden = tabId !== 'my-bar';
    if (whatToMake) whatToMake.hidden = tabId !== 'what-to-make';
    if (shoppingList) shoppingList.hidden = tabId !== 'shopping-list';
    if (tabId === 'what-to-make') renderInvMatchResults();
    else if (tabId === 'shopping-list') renderInvShoppingList();
}

function renderInvIngredientsGrid(filterQuery = '') {
    if (!invIngredientsGridEl) return;
    const q = (filterQuery || '').toLowerCase().trim();
    const filtered = q ? _invIngredientsCache.filter(ing => ing.toLowerCase().includes(q)) : _invIngredientsCache;
    const invSet = new Set(store.getInventory().map(i => i.toLowerCase().trim()));

    invIngredientsGridEl.innerHTML = '';
    filtered.forEach(ing => {
        const card = document.createElement('div');
        const selected = invSet.has(ing.toLowerCase().trim());
        card.className = 'inv-ingredient-card' + (selected ? ' selected' : '');
        card.setAttribute('data-ingredient', ing);
        const imgUrl = `https://www.thecocktaildb.com/images/ingredients/${encodeURIComponent(ing)}-Small.png`;
        card.innerHTML = (selected ? '<span class="inv-check">✅</span>' : '') + `<img src="${imgUrl}" alt="${utils.escapeHtml(ing)}" onerror="this.src='https://via.placeholder.com/48?text=?'"><span>${utils.escapeHtml(ing)}</span>`;
        card.addEventListener('click', () => {
            if (invSet.has(ing.toLowerCase().trim())) {
                store.removeFromInventory(ing);
            } else {
                store.addToInventory(ing);
            }
            renderInvIngredientsGrid(invSearchEl ? invSearchEl.value : '');
        });
        invIngredientsGridEl.appendChild(card);
    });
}

async function renderInvMatchResults() {
    if (!invMatchResultsEl) return;
    const inventory = store.getInventory().map(i => i.toLowerCase().trim());
    invMatchResultsEl.innerHTML = '<div class="inv-match-loading">🍸 Finding cocktails...</div>';

    if (inventory.length === 0) {
        invMatchResultsEl.innerHTML = '<p class="inv-match-empty">Add ingredients to My Bar first, then come back here.</p>';
        return;
    }

    const seenIds = new Set();
    let cocktailRefs = [];

    const index = await api.ensureIngredientIndex();
    if (index) {
        for (const invIng of inventory) {
            const fromIndex = api.searchByIngredientIndex(invIng);
            if (fromIndex) {
                for (const c of fromIndex) {
                    if (!seenIds.has(c.idDrink)) {
                        seenIds.add(c.idDrink);
                        cocktailRefs.push(c);
                    }
                }
            }
        }
    }

    if (cocktailRefs.length === 0) {
        const top3 = inventory.slice(0, 3);
        function getApiName(lower) {
            const m = _invIngredientsCache.find(api => api.toLowerCase().trim() === lower || invInventoryMatches(lower, api));
            return m || lower.charAt(0).toUpperCase() + lower.slice(1);
        }
        for (let i = 0; i < top3.length; i++) {
            try {
                const apiName = getApiName(top3[i]);
                const res = await fetch(`${api.API_BASE_URL}/filter.php?i=${encodeURIComponent(apiName)}`);
                const data = await res.json();
                if (data?.drinks?.length) {
                    for (const d of data.drinks) {
                        if (!seenIds.has(d.idDrink)) {
                            seenIds.add(d.idDrink);
                            cocktailRefs.push({ idDrink: d.idDrink, strDrink: d.strDrink, strDrinkThumb: d.strDrinkThumb });
                        }
                    }
                }
                if (i < top3.length - 1) await new Promise(r => setTimeout(r, 150));
            } catch (e) { /* skip */ }
        }
    }

    if (cocktailRefs.length === 0) {
        invMatchResultsEl.innerHTML = '<p class="inv-match-empty">No cocktails found. The ingredient index may still be loading—try again in a moment.</p>';
        return;
    }

    const fullCocktails = await api.fetchFullDetailsForCocktails(cocktailRefs);
    const ready = [];
    const almost = [];

    for (const full of fullCocktails) {
        if (!full) continue;
        const missingList = utils.calculateMissingIngredients(full, inventory);
        if (missingList.length === 0) ready.push({ cocktail: full, missingList: [] });
        else if (missingList.length <= 3) almost.push({ cocktail: full, missingList });
    }

    const results = [...ready, ...almost];
    if (results.length === 0) {
        invMatchResultsEl.innerHTML = '<p class="inv-match-empty">No cocktails with 0–3 missing ingredients. Add more to My Bar!</p>';
        return;
    }

    invMatchResultsEl.innerHTML = '<div class="inv-match-grid"></div>';
    const grid = invMatchResultsEl.querySelector('.inv-match-grid');
    results.forEach(({ cocktail, missingList }) => {
        const card = document.createElement('div');
        card.className = 'inv-match-card';
        const missing = missingList.length;
        const badgeClass = missing === 0 ? 'ready' : 'almost';
        const badgeText = missing === 0 ? 'Ready to Mix' : 'Almost There';
        let bodyHtml = '';
        if (missing > 0) {
            bodyHtml = `<div class="inv-match-missing">Missing: ${missingList.map(m => utils.escapeHtml(m)).join(', ')}</div>`;
            bodyHtml += `<button type="button" class="add-to-cart-btn" data-missing="${utils.escapeHtml(missingList.join(','))}">🛒 Add Missing to Cart</button>`;
        }
        card.innerHTML = `
            <div class="inv-match-img-wrap">
                <img src="${cocktail.strDrinkThumb || 'https://via.placeholder.com/300x300?text=No+Image'}" alt="${utils.escapeHtml(cocktail.strDrink)}">
                <span class="inv-match-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="inv-match-body">
                <div class="inv-match-name">${utils.escapeHtml(cocktail.strDrink)}</div>
                ${bodyHtml}
            </div>
        `;
        card.addEventListener('click', async (e) => {
            if (e.target.closest('.add-to-cart-btn')) return;
            if (inventoryModal) inventoryModal.style.display = 'none';
            let c = cocktail;
            if (!cocktail.strIngredient1) {
                try {
                    const full = await api.fetchCocktailById(cocktail.idDrink);
                    if (full) c = full;
                } catch (_) {}
            }
            displayCocktailDetails(c, { fromInventory: true });
        });
        const addBtn = card.querySelector('.add-to-cart-btn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const items = addBtn.getAttribute('data-missing').split(',').map(s => s.trim()).filter(Boolean);
                store.addToShoppingList(items);
                render.showShareToast('Added to cart!');
            });
        }
        grid.appendChild(card);
    });
}

function renderInvShoppingList() {
    if (!invShoppingListEl) return;
    const list = store.getShoppingList();
    invShoppingListEl.innerHTML = '';

    if (list.length === 0) {
        invShoppingListEl.innerHTML = '<p class="inv-shopping-empty">Your shopping list is empty. Add missing ingredients from "What Can I Make?"</p>';
        return;
    }

    list.forEach(item => {
        const el = document.createElement('div');
        el.className = 'inv-shopping-item';
        el.innerHTML = `<span>${utils.escapeHtml(item)}</span>`;
        el.addEventListener('click', () => {
            store.removeFromShoppingList(item);
            store.addToInventory(item);
            renderInvShoppingList();
            render.showShareToast('Moved to Inventory!');
        });
        invShoppingListEl.appendChild(el);
    });
}

async function initInventoryModal() {
    if (!invIngredientsGridEl) return;
    invIngredientsGridEl.innerHTML = '<div class="inv-match-loading">Loading ingredients...</div>';
    try {
        _invIngredientsCache = await api.getAllKnownIngredients();
        renderInvIngredientsGrid(invSearchEl ? invSearchEl.value : '');
    } catch (e) {
        invIngredientsGridEl.innerHTML = '<p class="inv-match-empty">Failed to load ingredients.</p>';
    }

    document.querySelectorAll('.inv-tab').forEach(tab => {
        tab.addEventListener('click', () => switchInvTab(tab.getAttribute('data-inv-tab')));
    });

    if (invSearchEl) {
        invSearchEl.addEventListener('input', utils.debounce(() => renderInvIngredientsGrid(invSearchEl.value), 150));
    }
}

// ========== Menu Actions ==========

function openSavedCustomModal() {
    render.renderFavoritesList(document.getElementById('favoritesList'), displayCocktailDetails, savedCustomModal);
    render.renderMyCocktailsList(document.getElementById('myCocktailsList'), displayCocktailDetails, savedCustomModal);
    switchSavedTab('favorites');
    if (savedCustomModal) {
        savedCustomModal.style.display = 'block';
        render.trapFocusInModal(savedCustomModal);
    }
}

function switchSavedTab(tabId) {
    document.querySelectorAll('.saved-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
        t.setAttribute('aria-selected', t.getAttribute('data-tab') === tabId ? 'true' : 'false');
    });
    const favPanel = document.getElementById('savedTabFavorites');
    const customPanel = document.getElementById('savedTabCustom');
    if (favPanel) favPanel.hidden = tabId !== 'favorites';
    if (customPanel) customPanel.hidden = tabId !== 'custom';
}

function handleMenuAction(action) {
    switch (action) {
        case 'party-planner':
            if (partyPlannerModal) {
                partyPlannerModal.style.display = 'block';
                onPartyPlannerCalculate();
                render.trapFocusInModal(partyPlannerModal);
            }
            break;
        case 'saved-custom':
            openSavedCustomModal();
            break;
        case 'inventory':
            if (inventoryModal) {
                initInventoryModal();
                inventoryModal.style.display = 'block';
                render.trapFocusInModal(inventoryModal);
            }
            break;
        case 'academy':
            if (academyModal) { academyModal.style.display = 'block'; render.trapFocusInModal(academyModal); }
            break;
        case 'map':
            if (mapModal) {
                mapModal.style.display = 'block';
                render.trapFocusInModal(mapModal);
                if (mapStatus) mapStatus.textContent = '';
                if (mapInstance) { mapInstance.remove(); mapInstance = null; }
                mapContainer.innerHTML = '';
                mapShowLocationBtn.disabled = false;
            }
            break;
        case 'safe-drive':
            if (bacModal) { bacModal.style.display = 'block'; render.trapFocusInModal(bacModal); }
            break;
        case 'stats':
            if (document.getElementById('statsModal')) {
                document.getElementById('statsModal').style.display = 'block';
                setupStatsCharts();
                render.trapFocusInModal(document.getElementById('statsModal'));
            }
            break;
    }
}

// ========== DOMContentLoaded ==========

document.addEventListener('DOMContentLoaded', () => {
    setupAIChatInModals();
    setupAIAssistant();
    setupBACCalculator();

    api.ensureIngredientIndex().then(() => {
        if (api.searchByIngredientIndex('vodka')) console.log('Cocktail ingredient index ready');
    });

    document.querySelectorAll('.nav-icon-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = link.getAttribute('data-action');
            if (action) handleMenuAction(action);
        });
    });

    if (partyGuestsInput) partyGuestsInput.addEventListener('input', onPartyPlannerCalculate);
    if (partyGuestsInput) partyGuestsInput.addEventListener('change', onPartyPlannerCalculate);
    if (partyCalculateBtn) partyCalculateBtn.addEventListener('click', onPartyPlannerCalculate);

    if (searchBtn) searchBtn.addEventListener('click', () => searchByIngredient(ingredientInput.value));
    if (ingredientInput) ingredientInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchByIngredient(ingredientInput.value); });

    if (surpriseBtn) surpriseBtn.addEventListener('click', () => getRandomCocktail());

    if (personalDetailsBtn) personalDetailsBtn.addEventListener('click', () => {
        personalModal.style.display = 'block';
        render.trapFocusInModal(personalModal);
    });

    document.querySelectorAll('.saved-tab').forEach(tab => {
        tab.addEventListener('click', () => switchSavedTab(tab.getAttribute('data-tab')));
    });

    const createRecipeBtn = document.getElementById('createRecipeBtn');
    const createRecipeFormWrap = document.getElementById('createRecipeFormWrap');
    const createRecipeCancelBtn = document.getElementById('createRecipeCancelBtn');
    if (createRecipeBtn) createRecipeBtn.addEventListener('click', () => { if (createRecipeFormWrap) createRecipeFormWrap.hidden = false; });
    if (createRecipeCancelBtn) createRecipeCancelBtn.addEventListener('click', () => { if (createRecipeFormWrap) createRecipeFormWrap.hidden = true; });

    if (mapShowLocationBtn) mapShowLocationBtn.addEventListener('click', showBarsNearMe);

    const createRecipeForm = document.getElementById('createRecipeForm');
    if (createRecipeForm) {
        createRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('createRecipeName')?.value?.trim();
            const imageUrl = document.getElementById('createRecipeImage')?.value?.trim();
            const ingredientsText = document.getElementById('createRecipeIngredients')?.value?.trim();
            const instructions = document.getElementById('createRecipeInstructions')?.value?.trim();
            if (!name || !ingredientsText || !instructions) return;
            const ings = ingredientsText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
            const cocktail = { strDrink: name, strDrinkThumb: imageUrl || '', strInstructions: instructions, ingredients: ingredientsText };
            for (let i = 0; i < Math.min(ings.length, 15); i++) cocktail[`strIngredient${i + 1}`] = ings[i];
            store.addCustomCocktail(cocktail);
            createRecipeForm.reset();
            if (createRecipeFormWrap) createRecipeFormWrap.hidden = true;
            render.renderMyCocktailsList(document.getElementById('myCocktailsList'), displayCocktailDetails, savedCustomModal);
            render.showShareToast('Recipe saved! Search by ingredient to find it.');
        });
    }

    api.fetchWeatherAndRecommend();

    initIngredientImage();
    const ingredientImageModal = document.getElementById('ingredientImageModal');
    const modalsToClose = [cocktailModal, personalModal, savedCustomModal, academyModal, mapModal, partyPlannerModal, bacModal, inventoryModal];
    if (ingredientImageModal) modalsToClose.push(ingredientImageModal);
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modalsToClose.forEach(m => { if (m) m.style.display = 'none'; });
            if (document.getElementById('statsModal')) document.getElementById('statsModal').style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        modalsToClose.forEach(m => { if (m && e.target === m) m.style.display = 'none'; });
        if (document.getElementById('statsModal') && e.target === document.getElementById('statsModal')) document.getElementById('statsModal').style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            modalsToClose.forEach(m => { if (m) m.style.display = 'none'; });
            if (document.getElementById('statsModal')) document.getElementById('statsModal').style.display = 'none';
        }
    });
});


})();
