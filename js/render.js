/**
 * js/render.js - HTML generation
 * Cocktail cards, Modals, Lists. Pure functions where possible.
 */

import * as api from './api.js';
import * as store from './store.js';
import * as utils from './utils.js';

/**
 * Shows loading state (search only) - centered overlay with spinning glass
 */
let searchLoadingOverlay = null;
export function showLoading(resultsDiv) {
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

export function hideSearchLoading() {
    if (searchLoadingOverlay) {
        searchLoadingOverlay.remove();
        searchLoadingOverlay = null;
    }
}

/**
 * Shows error message
 */
export function showError(resultsDiv, message) {
    if (!resultsDiv) return;
    resultsDiv.innerHTML = `<div class="error">${utils.escapeHtml(message)}</div>`;
}

/**
 * Shows error in center of screen (for fetch failures)
 */
let searchErrorOverlay = null;
export function showCenteredError(message) {
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
export function showNoResults(resultsDiv) {
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<div class="no-results">No cocktails found. Try a different ingredient!</div>';
}

/**
 * Trap focus in modal for a11y
 */
export function trapFocusInModal(modalEl) {
    if (!modalEl) return;
    const focusables = modalEl.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const first = focusables[0];
    if (first) setTimeout(() => first.focus(), 50);
}

/**
 * Set map status message
 */
export function setMapStatus(mapStatusEl, msg, isError) {
    if (!mapStatusEl) return;
    mapStatusEl.textContent = msg;
    mapStatusEl.className = 'map-status' + (isError ? ' map-status-error' : '');
}

/**
 * Create Learn more link
 */
export function createLearnMoreLink(ingredient) {
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
export function updateLearnMoreLink(learnMoreContainer, ingredient) {
    if (!learnMoreContainer) return;
    learnMoreContainer.innerHTML = '';
    if (ingredient && utils.isAlcoholType(ingredient)) {
        learnMoreContainer.appendChild(createLearnMoreLink(ingredient));
    }
}

/**
 * Share toast
 */
export function showShareToast(msg) {
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
export function getCocktailShareText(cocktail) {
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
export function getMyCocktailShareText(cocktail) {
    return `${cocktail.name || 'My Cocktail'} 🍸\n\nIngredients:\n${cocktail.ingredients || ''}\n\nInstructions:\n${cocktail.instructions || ''}`;
}

/**
 * Open fallback share menu
 */
export function openShareMenu(text, title, triggerEl) {
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
export function shareCocktail(cocktail, triggerEl) {
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
export function shareMyCocktail(cocktail, triggerEl) {
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
export function renderPartyPlannerModal(partyCocktailsList, partyIngredientsList, partyPlannerEmpty, partyGuestsInput, partyPlannerModal, displayCocktailDetails, onPartyPlannerCalculate) {
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
export function renderFavoritesList(listEl, displayCocktailDetails, savedCustomModal) {
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
export function renderMyCocktailsList(listEl, displayCocktailDetails, savedCustomModal) {
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
export function renderMapBarCards(bars, msgEl, mapInstance, mapBarMarkers, escapeHtml) {
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
export function renderPartyCocktailCards(cocktails, msgEl, API_BASE_URL, toggleParty, onPartyPlannerCalculate) {
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
