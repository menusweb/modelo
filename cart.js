const CartSys = {
    items: [],
    
    addItem(item) {
        // Separa quantidades em lanches separados conforme exigência
        for(let i=0; i < item.qty; i++) {
            let singleItem = JSON.parse(JSON.stringify(item));
            singleItem.qty = 1;
            singleItem.id = Date.now() + Math.random();
            singleItem.selected = true;
            this.items.push(singleItem);
        }
        this.updateBadge();
    },

    removeItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.renderCart();
        this.updateBadge();
    },

    toggleSelect(id) {
        let item = this.items.find(i => i.id === id);
        if(item) item.selected = !item.selected;
        this.calcTotal();
    },

    changeQty(id, delta) {
        // Para alterar qty no carrinho, como cada lanche é separado, + clona o item, - exclui
        let itemIdx = this.items.findIndex(i => i.id === id);
        if (itemIdx === -1) return;
        
        if (delta > 0) {
            let clone = JSON.parse(JSON.stringify(this.items[itemIdx]));
            clone.id = Date.now() + Math.random();
            this.items.push(clone);
        } else {
            this.items.splice(itemIdx, 1);
        }
        this.renderCart();
        this.updateBadge();
    },

    updateBadge() {
        document.getElementById('cart-badge').textContent = this.items.length;
    },

    renderCart() {
        const container = document.getElementById('cart-items-container');
        container.innerHTML = '';
        
        if (this.items.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 20px;">Carrinho vazio.</p>';
            this.calcTotal();
            return;
        }

        this.items.forEach(item => {
            const imgLink = item.product.img ? item.product.img.split(',')[0].trim() : 'https://via.placeholder.com/60';
            const price = parseFloat(item.product.price);
            
            container.innerHTML += `
                <div class="cart-item">
                    <input type="checkbox" class="cart-chk" ${item.selected ? 'checked' : ''} onchange="CartSys.toggleSelect(${item.id})">
                    <img src="${imgLink}" alt="${item.product.itemName}">
                    <div class="cart-info">
                        <h5>${item.product.itemName}</h5>
                        <p>R$ ${price.toFixed(2).replace('.',',')}</p>
                        <small>${item.ingredientsFormat.replace(/\[/g, '').replace(/\]/g, '')}</small>
                    </div>
                    <div class="cart-actions">
                        <button class="del-btn" onclick="CartSys.removeItem(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        
        this.calcTotal();
    },

    calcTotal() {
        let subtotal = 0;
        let extras = 0;
        
        this.items.forEach(item => {
            if (item.selected) {
                subtotal += parseFloat(item.product.price);
                extras += (item.specialCount * window.ESPECIAIS_PRICE);
            }
        });

        document.getElementById('cart-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.',',')}`;
        document.getElementById('cart-extras').textContent = `R$ ${extras.toFixed(2).replace('.',',')}`;
        document.getElementById('cart-total').textContent = `R$ ${(subtotal + extras).toFixed(2).replace('.',',')}`;
        
        return { subtotal, extras, totalProducts: subtotal + extras };
    },
    
    getSelectedItemsForOrder() {
        return this.items.filter(i => i.selected);
    }
};
