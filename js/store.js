/**
 * js/store.js - All localStorage operations
 * Favorites, Party List, Custom Recipes, Inventory
 */

export const FAVORITES_KEY = 'cocktailFavorites';
export const PARTY_COCKTAILS_KEY = 'partyCocktails';
export const CUSTOM_COCKTAILS_KEY = 'customCocktails';
export const MY_COCKTAILS_KEY = 'myCocktails';
export const INVENTORY_KEY = 'cocktailInventory';
export const SHOPPING_LIST_KEY = 'cocktailShoppingList';

// ========== Favorites ==========

export function getFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export function isFavorite(id) {
    return getFavorites().some(c => c.idDrink === String(id));
}

export function addFavorite(cocktail) {
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

export function removeFavorite(id) {
    const list = getFavorites().filter(c => c.idDrink !== String(id));
    saveFavorites(list);
}

export function toggleFavorite(cocktail) {
    if (isFavorite(cocktail.idDrink)) {
        removeFavorite(cocktail.idDrink);
        return false;
    }
    addFavorite(cocktail);
    return true;
}

// ========== Party List ==========

export function getPartyCocktails() {
    try {
        const raw = localStorage.getItem(PARTY_COCKTAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function savePartyCocktails(list) {
    localStorage.setItem(PARTY_COCKTAILS_KEY, JSON.stringify(list));
}

export function addToParty(cocktail) {
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

export function removeFromParty(idDrink) {
    const list = getPartyCocktails().filter(c => c.idDrink !== idDrink);
    savePartyCocktails(list);
}

export function toggleParty(cocktail) {
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

export function getCustomCocktails() {
    try {
        const raw = localStorage.getItem(CUSTOM_COCKTAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function saveCustomCocktails(list) {
    localStorage.setItem(CUSTOM_COCKTAILS_KEY, JSON.stringify(list));
}

export function addCustomCocktail(cocktail) {
    const list = getCustomCocktails();
    const id = 'custom-' + Date.now();
    list.push({ ...cocktail, idDrink: id, id });
    saveCustomCocktails(list);
}

export function deleteCustomCocktail(id) {
    const list = getCustomCocktails().filter(c => c.idDrink !== id && c.id !== id);
    saveCustomCocktails(list);
}

export function customCocktailsMatchingIngredient(ingredient) {
    const q = ingredient.toLowerCase().trim();
    if (!q) return [];
    return getCustomCocktails().filter(c => {
        let ings = '';
        for (let i = 1; i <= 15; i++) ings += (c[`strIngredient${i}`] || '') + ' ';
        ings += (c.ingredients || '');
        return ings.toLowerCase().includes(q);
    });
}

export function customToDisplayFormat(c) {
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

export function getMyCocktails() {
    try {
        const raw = localStorage.getItem(MY_COCKTAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function saveMyCocktails(list) {
    localStorage.setItem(MY_COCKTAILS_KEY, JSON.stringify(list));
}

export function addMyCocktail(cocktail) {
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

export function removeMyCocktail(id) {
    const list = getMyCocktails().filter(c => c.id !== id);
    saveMyCocktails(list);
}

// ========== Smart Inventory ==========

export function getInventory() {
    try {
        const raw = localStorage.getItem(INVENTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function saveInventory(list) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(list));
}

export function addToInventory(ingredient) {
    const name = String(ingredient).trim().toLowerCase();
    if (!name) return;
    const list = getInventory();
    if (list.some(i => i.toLowerCase() === name)) return;
    list.push(name);
    saveInventory(list);
}

export function removeFromInventory(ingredient) {
    const name = String(ingredient).trim().toLowerCase();
    const list = getInventory().filter(i => i.toLowerCase() !== name);
    saveInventory(list);
}

// ========== Shopping List ==========

export function getShoppingList() {
    try {
        const raw = localStorage.getItem(SHOPPING_LIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function saveShoppingList(list) {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
}

export function addToShoppingList(itemsArray) {
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

export function removeFromShoppingList(item) {
    const name = String(item).trim().toLowerCase();
    const list = getShoppingList().filter(i => i.toLowerCase().trim() !== name);
    saveShoppingList(list);
}
