/**
 * Build script: creates js/bundle.js from modules (works without server)
 * Run: node build-bundle.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const ingredientImage = fs.readFileSync(path.join(dir, 'ingredient-image.js'), 'utf8');
const utils = fs.readFileSync(path.join(dir, 'utils.js'), 'utf8')
  .replace(/\bexport\s+(const|function|var)\s+/g, '$1 ')
  .replace(/\bexport\s+{([^}]+)}/g, '');
const store = fs.readFileSync(path.join(dir, 'store.js'), 'utf8')
  .replace(/\bexport\s+(const|function|var)\s+/g, '$1 ');
const api = fs.readFileSync(path.join(dir, 'api.js'), 'utf8')
  .replace(/\bexport\s+(const|async function|function)\s+/g, '$1 ')
  .replace(/\bexport\s+{([^}]+)}/g, '');
const render = fs.readFileSync(path.join(dir, 'render.js'), 'utf8')
  .replace(/import \* as (api|store|utils) from '\.\/\w+\.js';\s*/g, '')
  .replace(/\bexport\s+function\s+/g, 'function ')
  .replace(/\butils\./g, 'utils.');
const main = fs.readFileSync(path.join(dir, 'main.js'), 'utf8')
  .replace(/import \* as (api|store|render|utils) from '\.\/\w+\.js';\s*/g, '')
  .replace(/\bapi\./g, 'api.')
  .replace(/\bstore\./g, 'store.')
  .replace(/\brender\./g, 'render.')
  .replace(/\butils\./g, 'utils.');

const bundle = `/**
 * Bundled app - works without server (file://)
 * Source: js/utils.js, store.js, api.js, render.js, main.js
 */
(function() {
'use strict';
const utils = {};
const store = {};
const api = {};
const render = {};

${utils}

Object.assign(utils, {
  OZ_TO_ML, CONVERT_THRESHOLD_OZ, CONVERT_THRESHOLD_ML,
  alcoholTypes, ingredientTranslation, debounce, escapeHtml, parseMeasure,
  formatScaledQuantity, toMl, formatMlForDisplay, translateIngredient,
  getCocktailIngredientsList, cocktailContainsIngredient, calculateMissingIngredients, aggregateIngredients,
  getScaledIngredientsForCocktail, isAlcoholType, formatAIReply
});

${store}

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

${api}

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

${render}

Object.assign(render, {
  showLoading, hideSearchLoading, showError, showCenteredError, showNoResults, trapFocusInModal, setMapStatus,
  createLearnMoreLink, updateLearnMoreLink, showShareToast, getCocktailShareText,
  getMyCocktailShareText, openShareMenu, shareCocktail, shareMyCocktail,
  renderPartyPlannerModal, renderFavoritesList, renderMyCocktailsList,
  renderMapBarCards, renderPartyCocktailCards
});

${ingredientImage}

${main}

})();
`;

fs.writeFileSync(path.join(dir, 'bundle.js'), bundle);
console.log('Created js/bundle.js');
console.log('Update index.html to use: <script src="js/bundle.js"></script>');
