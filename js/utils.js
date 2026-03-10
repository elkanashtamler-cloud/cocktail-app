/**
 * js/utils.js - Helper functions
 * Debounce, Unit conversion, Translation, etc.
 */

export const OZ_TO_ML = 29.5735;
export const CONVERT_THRESHOLD_OZ = 32;
export const CONVERT_THRESHOLD_ML = 1000;

// Alcohol types for Learn more link
export const alcoholTypes = [
    'gin', 'vodka', 'rum', 'whiskey', 'whisky', 'tequila', 'beer', 'wine',
    'champagne', 'cognac', 'brandy', 'liqueur', 'amaretto', 'kahlua',
    'triple sec', 'grenadine', 'angostura', 'bitters', 'sake', 'absinthe',
    'bourbon', 'scotch', 'rye', 'mezcal', 'pisco', 'cachaca', 'schnapps'
];

// Hebrew to English ingredient translation
export const ingredientTranslation = {
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
export function debounce(fn, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

/**
 * Parse measure string (e.g. "2 oz", "50ml") into value and unit
 */
export function parseMeasure(measureStr) {
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
export function formatScaledQuantity(value, unit, guests) {
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
export function toMl(value, unit) {
    if (unit === 'oz') return value * OZ_TO_ML;
    if (unit === 'cl') return value * 10;
    return value;
}

/**
 * Format ml for display
 */
export function formatMlForDisplay(ml) {
    if (ml >= 1000) return `~${(ml / 1000).toFixed(1)} L`;
    if (ml === Math.floor(ml)) return `${ml} ml`;
    return `${ml.toFixed(1)} ml`;
}

/**
 * Translate Hebrew ingredient to English
 */
export function translateIngredient(ingredient) {
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
export function getCocktailIngredientsList(cocktail) {
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
export function cocktailContainsIngredient(cocktail, ingredient) {
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
export function calculateMissingIngredients(cocktail, userInventory) {
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
export function aggregateIngredients(cocktails, guests) {
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
export function getScaledIngredientsForCocktail(cocktail, guests) {
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
export function isAlcoholType(ingredient) {
    return alcoholTypes.includes(ingredient.toLowerCase().trim());
}

/**
 * Format AI reply text to HTML
 */
export function formatAIReply(text) {
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
