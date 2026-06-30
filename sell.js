const CheckoutSys = {
    currentOrderTotal: 0,
    currentFreight: 0,
    pollInterval: null,
    orderCode: null,
    orderPayloadData: null,

    init() {
        const selected = CartSys.getSelectedItemsForOrder();
        if (selected.length === 0) {
            alert("Selecione itens no carrinho para finalizar.");
            if (window.App) window.App.navigate('cart-view');
            return;
        }

        const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = (val || 0).toFixed(2).replace('.',','); };
        setVal('.f1-val', window.FRETE_1);
        setVal('.f2-val', window.FRETE_2);
        setVal('.f3-val', window.FRETE_3);
        setVal('.f4-val', window.FRETE_4);

        document.getElementById('checkout-form').style.display = 'block';
        document.getElementById('checkout-status').style.display = 'none';

        if (window.AuthSystem) {
            const u = AuthSystem.getCurrentUser();
            if (u && u.address) {
                let parts = u.address.match(/\[(.*?)\]/g);
                if (parts && parts.length >= 5) {
                    document.getElementById('chk-rua').value = parts[0].replace(/[\[\]]/g, '');
                    document.getElementById('chk-numero').value = parts[1].replace(/[\[\]]/g, '');
                    document.getElementById('chk-bairro').value = parts[2].replace(/[\[\]]/g, '');
                    document.getElementById('chk-cidade').value = parts[3].replace(/[\[\]]/g, '');
                    document.getElementById('chk-uf').value = parts[4].replace(/[\[\]]/g, '');
                }
            }
        }

        this.calcFreight();
        this.handlePaymentChange();
    },

    getLocation() {
        if (!navigator.geolocation) return alert("Geolocalização não suportada.");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('chk-rua').value = `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`;
                document.getElementById('chk-numero').value = "0";
                document.getElementById('chk-bairro').value = "Localização Atual";
                document.getElementById('chk-cidade').value = "-";
                document.getElementById('chk-uf').value = "-";
            },
            () => alert("Permissão de localização negada.")
        );
    },

    calcFreight() {
        const shipEl = document.getElementById('chk-shipping');
        if (!shipEl) return;
        
        const shipMethod = shipEl.value;
        const freteContainer = document.getElementById('freight-selector-container');
        
        if (shipMethod === 'retirada') {
            if (freteContainer) freteContainer.style.display = 'none';
            this.currentFreight = 0;
        } else {
            if (freteContainer) freteContainer.style.display = 'block';
            const fValEl = document.getElementById('chk-freight');
            const fVal = fValEl ? fValEl.value : '';
            if (fVal === 'frete1') this.currentFreight = window.FRETE_1 || 0;
            else if (fVal === 'frete2') this.currentFreight = window.FRETE_2 || 0;
            else if (fVal === 'frete3') this.currentFreight = window.FRETE_3 || 0;
            else if (fVal === 'frete4') this.currentFreight = window.FRETE_4 || 0;
            else this.currentFreight = 0;
        }
        this.updateTotals();
    },

    handlePaymentChange() {
        const pEl = document.getElementById('chk-payment');
        const method = pEl ? pEl.value : '';
        const trocoContainer = document.getElementById('troco-container');
        if (trocoContainer) {
            trocoContainer.style.display = method === 'dinheiro' ? 'block' : 'none';
        }
    },

    updateTotals() {
        const calc = CartSys.calcTotal();
        this.currentOrderTotal = calc.totalProducts + this.currentFreight;
        
        const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `R$ ${val.toFixed(2).replace('.',',')}`; };
        
        setTxt('chk-subtotal', calc.totalProducts);
        setTxt('chk-freight-val', this.currentFreight);
        setTxt('chk-final-total', this.currentOrderTotal);
    },

    async submitOrder() {
        const items = CartSys.getSelectedItemsForOrder();
        if (items.length === 0) return;

        const getVal = id => document.getElementById(id) ? document.getElementById(id).value : '';
        const rua = getVal('chk-rua');
        const num = getVal('chk-numero');
        const bairro = getVal('chk-bairro');
        const cidade = getVal('chk-cidade');
        const uf = getVal('chk-uf');
        const ship = getVal('chk-shipping');
        
        if (ship === 'delivery' && (!rua || !num || !bairro)) {
            alert("Preencha o endereço completo para entrega.");
            return;
        }

        const addressStr = ship === 'delivery' ? `[${rua}], [${num}], [${bairro}], [${cidade}], [${uf}]` : "[Retirada no Local]";
        const method = getVal('chk-payment');
        const troco = method === 'dinheiro' ? getVal('chk-troco') : "";

        let itemsList = [];
        let ingredientsList = [];
        let obsList = [];
        let infinitePayItems = [];
        let specPrice = window.ESPECIAIS_PRICE || 0;

        items.forEach(i => {
            itemsList.push(`[${i.product.itemName}]`);
            let formatIng = i.ingredientsFormat ? i.ingredientsFormat.replace(/[\[\]]/g, '') : '';
            ingredientsList.push(`[${formatIng}]`); 
            if (i.obs) obsList.push(`[${i.obs}]`);
            
            let unitPrice = parseFloat(i.product.price || 0) + (i.specialCount * specPrice);
            infinitePayItems.push({
                name: i.product.itemName,
                price: Math.round(unitPrice * 100),
                quantity: 1
            });
        });

        if (this.currentFreight > 0) {
            infinitePayItems.push({
                name: "Frete",
                price: Math.round(this.currentFreight * 100),
                quantity: 1
            });
        }

        this.orderCode = "PED-" + Math.floor(1000 + Math.random() * 9000);
        
        if (!window.AuthSystem) {
            alert("Sistema de autenticação não encontrado.");
            return;
        }
        
        window.AuthSystem.handleCheckoutFlow(async (userIdentifier, _, isGuest) => {
            const loader = document.getElementById('global-loader');
            if (loader) loader.style.display = 'flex';
            
            this.orderPayloadData = {
                action: "checkout",
                user: userIdentifier || "Cliente",
                isGuest: isGuest,
                ipAddress: isGuest ? userIdentifier : "",
                itemsList: itemsList.join(', '),
                ingredientsList: ingredientsList.join(', '),
                obs: obsList.join(', '),
                address: addressStr,
                total: this.currentOrderTotal.toFixed(2),
                payMTD: method,
                troco: troco
            };

            try {
                const res = await fetch(window.API_URL, {
                    method: 'POST',
                    body: JSON.stringify(this.orderPayloadData)
                });
                const result = await res.json();
                if (loader) loader.style.display = 'none';
                
                if (result.success) {
                    CartSys.items = CartSys.items.filter(i => !i.selected);
                    CartSys.updateBadge();
                    
                    if (method === 'pix' || method === 'cartao_online') {
                        let itemsJson = JSON.stringify(infinitePayItems);
                        // ENCODE dos URLs adicionado aqui para previnir que o checkout quebre com caracteres especiais
                        let url = `https://checkout.infinitepay.io/${window.INFINITE_TAG || ''}?items=${encodeURIComponent(itemsJson)}&redirect_url=${encodeURIComponent(window.SITE_URL || '')}`;
                        window.open(url, '_blank');
                    }
                    
                    this.showStatusScreen();
                } else {
                    alert("Erro ao enviar pedido: " + result.message);
                }
            } catch (e) {
                if (loader) loader.style.display = 'none';
                alert("Erro de conexão.");
            }
        });
    },

    showStatusScreen() {
        document.getElementById('checkout-form').style.display = 'none';
        document.getElementById('checkout-status').style.display = 'block';
        
        const disp = document.getElementById('order-code-display');
        if (disp) disp.textContent = this.orderCode;
        
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => this.checkStatus(), 120000); // 2 min
    },

    async checkStatus() {
        if (!this.orderPayloadData || !this.orderPayloadData.user) return;
        try {
            const res = await fetch(`${window.API_URL}?action=getUserOrders&user=${encodeURIComponent(this.orderPayloadData.user)}`);
            const result = await res.json();
            if (result.success && result.data) {
                const matches = result.data.filter(o => o.itemsList === this.orderPayloadData.itemsList && parseFloat(o.total) == parseFloat(this.orderPayloadData.total));
                if (matches.length > 0) {
                    const latest = matches[matches.length - 1];
                    const badge = document.getElementById('order-status-badge');
                    
                    if (badge) {
                        badge.textContent = latest.status.toUpperCase();
                        
                        if (latest.status.toLowerCase() === 'enviado') {
                            const btn = document.getElementById('btn-confirm-delivery');
                            if (btn) btn.style.display = 'inline-block';
                        }
                        if (latest.status.toLowerCase() === 'entregue') {
                            clearInterval(this.pollInterval);
                            badge.style.background = '#28a745'; 
                            badge.style.color = '#fff';
                            const btn = document.getElementById('btn-confirm-delivery');
                            if (btn) btn.style.display = 'none';
                        }
                    }
                }
            }
        } catch (e) { console.error(e); }
    },

    async confirmDelivery() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.style.display = 'flex';
        try {
            const res = await fetch(window.API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: "confirmDelivery", user: this.orderPayloadData.user, itemsList: this.orderPayloadData.itemsList })
            });
            await res.json();
            if (loader) loader.style.display = 'none';
            this.checkStatus();
        } catch (e) {
            if (loader) loader.style.display = 'none';
        }
    },

    sendWhatsApp() {
        if (!this.orderPayloadData) return;
        
        let pText = "";
        const items = (this.orderPayloadData.itemsList || '').split('], [').map(x => x.replace(/[\[\]]/g, ''));
        const ingrs = (this.orderPayloadData.ingredientsList || '').split('], [').map(x => x.replace(/[\[\]]/g, ''));
        
        items.forEach((item, idx) => {
            let ing = ingrs[idx] || 'S/ Adicionais';
            // Formatação melhorada para a listagem visual do WhatsApp
            pText += `• ${item}: ${ing};\n`;
        });
        
        const isRet = this.orderPayloadData.address === "[Retirada no Local]";
        const addrText = isRet ? (window.STORE_LOCAL || 'Local da Loja') : (this.orderPayloadData.address || '').replace(/[\[\]]/g, ' ');
        const userName = this.orderPayloadData.user || 'Cliente';
        
        const msg = `Olá, eu sou ${userName} e acabei de fazer o pedido *${this.orderCode}* pelo site.\n\n*Meu pedido inclui:*\n${pText}\n*Pagamento:* ${this.orderPayloadData.payMTD}\n*Entrega:* ${isRet ? 'Retirada' : 'Entrega'}\n*Endereço:* ${addrText}`;
        
        const url = `https://wa.me/${window.WHATSAPP}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }
};
