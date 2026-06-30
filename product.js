const ProductSys = {
    currentProduct: null,
    selectedIngredients: {},
    quantity: 1,

    openProduct(productStr) {
        const p = JSON.parse(decodeURIComponent(productStr));
        this.currentProduct = p;
        this.quantity = 1;
        this.selectedIngredients = {};
        
        const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        
        setTxt('prod-qty', this.quantity);
        setTxt('obs-count', '0');
        setTxt('prod-title', p.itemName);
        setTxt('prod-price', `R$ ${parseFloat(p.price || 0).toFixed(2).replace('.', ',')}`);
        setTxt('prod-desc', p.desc || '');
        
        const obsEl = document.getElementById('prod-obs');
        if (obsEl) obsEl.value = '';
        
        const imgContainer = document.getElementById('prod-img-container');
        if (imgContainer) {
            imgContainer.innerHTML = '';
            if (p.img) {
                p.img.split(',').forEach(link => {
                    if(link.trim()) imgContainer.innerHTML += `<img src="${link.trim()}" alt="${p.itemName}">`;
                });
            }
        }
        
        this.renderIngredients(p.ingredients);
        if (window.App) window.App.navigate('product-view');
    },

    renderIngredients(ingrString) {
        const container = document.getElementById('prod-ingredients-container');
        if (!container) return;
        container.innerHTML = '';
        if (!ingrString) return;

        const matches = [...ingrString.matchAll(/\[(.*?)\]/g)].map(m => m[1]);
        if (matches.length === 0) return;
        
        let specPrice = window.ESPECIAIS_PRICE || 0;

        matches.forEach((sectionList, index) => {
            const items = sectionList.split(',').map(i => i.trim()).filter(i => i);
            if(items.length === 0) return;
            
            let limit = window.GlobalIngrLimit || items.length; 
            let title = `Seção ${index + 1}`;
            let isSpecial = false;

            if (window.StoreConfig && window.StoreConfig.ingredientSection) {
                const confSec = window.StoreConfig.ingredientSection.replace(/[\[\]]/g, '').split(',').map(i=>i.trim());
                if (confSec.length > 0 && items.includes(confSec[0])) {
                    title = window.StoreConfig.title || 'Ingredientes';
                    limit = parseInt(window.StoreConfig.limit) || items.length;
                }
            }
            
            if (title.toLowerCase().includes('adicionais') || title.toLowerCase().includes('especiais') || items.some(i => i.toLowerCase().includes('adicional'))) {
                isSpecial = true;
                title = "Adicionais / Especiais";
                limit = items.length; 
            }

            this.selectedIngredients[index] = { items: [], limit: limit, isSpecial: isSpecial };

            let html = `
            <div class="prod-section" data-sec-idx="${index}">
                <h4>
                    ${index + 1}. ${title} 
                    <span class="limit" id="limit-badge-${index}">0/${limit}</span>
                </h4>
                <div class="ingr-grid">
            `;
            
            items.forEach((item, iIdx) => {
                const priceTxt = isSpecial ? `<div class="ingr-price">+ R$ ${specPrice.toFixed(2).replace('.',',')}</div>` : '';
                html += `
                    <div class="ingr-btn" id="ingr-btn-${index}-${iIdx}" onclick="ProductSys.toggleIngr(${index}, ${iIdx}, '${item}')">
                        ${item}
                        ${priceTxt}
                    </div>
                `;
            });
            
            html += `</div></div>`;
            container.innerHTML += html;
        });
    },

    toggleIngr(secIdx, itemIdx, itemName) {
        const sec = this.selectedIngredients[secIdx];
        const btn = document.getElementById(`ingr-btn-${secIdx}-${itemIdx}`);
        const idxInArray = sec.items.indexOf(itemName);

        if (idxInArray > -1) {
            sec.items.splice(idxInArray, 1);
            if (btn) btn.classList.remove('selected');
        } else {
            if (sec.items.length >= sec.limit) {
                alert(`Você só pode escolher até ${sec.limit} itens nesta seção.`);
                return;
            }
            sec.items.push(itemName);
            if (btn) btn.classList.add('selected');
        }
        
        const badge = document.getElementById(`limit-badge-${secIdx}`);
        if (badge) badge.textContent = `${sec.items.length}/${sec.limit}`;
    },

    changeQty(delta) {
        let newQ = this.quantity + delta;
        if (newQ < 1) newQ = 1;
        this.quantity = newQ;
        const el = document.getElementById('prod-qty');
        if (el) el.textContent = this.quantity;
    },

    validateSelection() {
        for (let key in this.selectedIngredients) {
            if (this.selectedIngredients[key].items.length === 0) {
                alert("Por favor, selecione os ingredientes que deseja incluir. Para finalizar o pedido é necessário escolher ao menos um ingrediente na lista (caso aplicável).");
                return false;
            }
        }
        return true;
    },

    buildCartItem() {
        let ingrFullList = [];
        let specialCount = 0;
        
        for (let key in this.selectedIngredients) {
            let sec = this.selectedIngredients[key];
            if (sec.items.length > 0) {
                ingrFullList.push(`[${sec.items.join(', ')}]`);
            }
            if (sec.isSpecial) specialCount += sec.items.length;
        }

        const obsEl = document.getElementById('prod-obs');

        return {
            id: Date.now() + Math.random(),
            product: this.currentProduct,
            qty: this.quantity,
            obs: obsEl ? obsEl.value.substring(0, 100) : '',
            ingredientsFormat: ingrFullList.join(', '), 
            specialCount: specialCount
        };
    },

    addToCart() {
        if (!this.validateSelection()) return;
        const item = this.buildCartItem();
        CartSys.addItem(item);
        if (window.App) window.App.navigate('home-view');
    },

    buyNow() {
        if (!this.validateSelection()) return;
        const item = this.buildCartItem();
        CartSys.addItem(item);
        if (window.App) window.App.navigate('cart-view');
        CartSys.renderCart();
    }
};

// Event Delegation para garantir o funcionamento caso a view seja carregada dinamicamente
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'prod-obs') {
        let words = e.target.value.match(/\S+/g);
        let count = words ? words.length : 0;
        if (count > 100) {
            let trimmed = words.slice(0, 100).join(" ");
            e.target.value = trimmed;
            count = 100;
        }
        const obsCount = document.getElementById('obs-count');
        if (obsCount) obsCount.textContent = count;
    }
});
