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
