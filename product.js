const ProductSys = {
    currentProduct: null,
    selectedIngredients: {},
    quantity: 1,

    openProduct(productStr) {
        const p = JSON.parse(decodeURIComponent(productStr));
        this.currentProduct = p;
        this.quantity = 1;
        this.selectedIngredients = {};
        
        document.getElementById('prod-qty').textContent = this.quantity;
        document.getElementById('prod-obs').value = '';
        document.getElementById('obs-count').textContent = '0';
        
        document.getElementById('prod-title').textContent = p.itemName;
        document.getElementById('prod-price').textContent = `R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}`;
        document.getElementById('prod-desc').textContent = p.desc || '';
        
        const imgContainer = document.getElementById('prod-img-container');
        imgContainer.innerHTML = '';
        if (p.img) {
            p.img.split(',').forEach(link => {
                if(link.trim()) imgContainer.innerHTML += `<img src="${link.trim()}" alt="${p.itemName}">`;
            });
        }
        
        this.renderIngredients(p.ingredients);
        window.App.navigate('product-view');
    },

    renderIngredients(ingrString) {
        const container = document.getElementById('prod-ingredients-container');
        container.innerHTML = '';
        if (!ingrString) return;

        // Extrai conteudos entre colchetes
        const matches = [...ingrString.matchAll(/\[(.*?)\]/g)].map(m => m[1]);
        if (matches.length === 0) return;

        // Seção baseada no config. No frontend simplificamos dividindo cada colchete numa seção numerada
        // A aba mystore define ingredientSection, title, limit, mas como pode haver múltiplas seções no array, usaremos lógica local.
        
        matches.forEach((sectionList, index) => {
            const items = sectionList.split(',').map(i => i.trim()).filter(i => i);
            if(items.length === 0) return;
            
            // Verifica se é "Adicionais" ou "Especiais" pelo conteudo ou configuração global
            // Vamos assumir que a última seção ou seções maiores possuam limite configurado globalmente ou padrão 1.
            let limit = window.GlobalIngrLimit || items.length; // fallback
            let title = `Seção ${index + 1}`;
            let isSpecial = false;

            // Busca regra na conf global
            if (window.StoreConfig && window.StoreConfig.ingredientSection) {
                const confSec = window.StoreConfig.ingredientSection.replace(/[\[\]]/g, '').split(',').map(i=>i.trim());
                // Se o primeiro item bater, assumimos que é a seção configurada
                if (confSec.length > 0 && items.includes(confSec[0])) {
                    title = window.StoreConfig.title || 'Ingredientes';
                    limit = parseInt(window.StoreConfig.limit) || items.length;
                }
            }
            
            // Heurística de especiais solicitada
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
                const priceTxt = isSpecial ? `<div class="ingr-price">+ R$ ${window.ESPECIAIS_PRICE.toFixed(2).replace('.',',')}</div>` : '';
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
            btn.classList.remove('selected');
        } else {
            if (sec.items.length >= sec.limit) {
                alert(`Você só pode escolher até ${sec.limit} itens nesta seção.`);
                return;
            }
            sec.items.push(itemName);
            btn.classList.add('selected');
        }
        document.getElementById(`limit-badge-${secIdx}`).textContent = `${sec.items.length}/${sec.limit}`;
    },

    changeQty(delta) {
        let newQ = this.quantity + delta;
        if (newQ < 1) newQ = 1;
        this.quantity = newQ;
        document.getElementById('prod-qty').textContent = this.quantity;
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
            ingrFullList.push(`[${sec.items.join(', ')}]`);
            if (sec.isSpecial) specialCount += sec.items.length;
        }

        return {
            id: Date.now() + Math.random(),
            product: this.currentProduct,
            qty: this.quantity,
            obs: document.getElementById('prod-obs').value.substring(0, 100),
            ingredientsFormat: ingrFullList.join(', '), 
            specialCount: specialCount
        };
    },

    addToCart() {
        if (!this.validateSelection()) return;
        const item = this.buildCartItem();
        CartSys.addItem(item);
        window.App.navigate('home-view');
    },

    buyNow() {
        if (!this.validateSelection()) return;
        const item = this.buildCartItem();
        CartSys.addItem(item);
        window.App.navigate('cart-view');
        CartSys.renderCart();
    }
};

document.getElementById('prod-obs').addEventListener('input', function() {
    let words = this.value.match(/\S+/g);
    let count = words ? words.length : 0;
    if (count > 100) {
        let trimmed = words.slice(0, 100).join(" ");
        this.value = trimmed;
        count = 100;
    }
    document.getElementById('obs-count').textContent = count;
});
