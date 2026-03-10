/**
 * js/main.js - Entry point
 * Initialize event listeners and coordinate logic.
 */

import * as api from './api.js';
import * as store from './store.js';
import * as render from './render.js';
import * as utils from './utils.js';

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
