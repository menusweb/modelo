const HomeSys = {
    menuData: [],

    async init() {
        document.getElementById('global-loader').style.display = 'flex';
        
        try {
            // Fetch Config
            const confRes = await fetch(`${window.API_URL}?action=getStoreConfig`);
            const confJson = await confRes.json();
            if (confJson.success && confJson.data) {
                window.StoreConfig = confJson.data;
                
                // Mapeia e injeta as variáveis de cores no CSS baseadas na nova aba "colors"
                const colors = confJson.data.colors || confJson.data;
                if (colors) {
                    const root = document.documentElement;
                    if (colors.bg) root.style.setProperty('--bg', colors.bg);
                    if (colors.texttitle) root.style.setProperty('--texttitle', colors.texttitle);
                    if (colors.menubg) root.style.setProperty('--menubg', colors.menubg);
                    if (colors.menutext) root.style.setProperty('--menutext', colors.menutext);
                    if (colors.menutitle) root.style.setProperty('--menutitle', colors.menutitle);
                    if (colors.cardbg) root.style.setProperty('--cardbg', colors.cardbg);
                    if (colors.cardtext) root.style.setProperty('--cardtext', colors.cardtext);
                    if (colors.cardtitle) root.style.setProperty('--cardtitle', colors.cardtitle);
                    if (colors.icons) root.style.setProperty('--icons', colors.icons);
                    if (colors.categoriesicons) root.style.setProperty('--categoriesicons', colors.categoriesicons);
                    if (colors.categoriesselected) root.style.setProperty('--categoriesselected', colors.categoriesselected);
                    if (colors.cartbg) root.style.setProperty('--cartbg', colors.cartbg);
                    if (colors.carttext) root.style.setProperty('--carttext', colors.carttext);
                    if (colors.carttitle) root.style.setProperty('--carttitle', colors.carttitle);
                    if (colors.buttonsbg) root.style.setProperty('--buttonsbg', colors.buttonsbg);
                    if (colors.buttonstext) root.style.setProperty('--buttonstext', colors.buttonstext);
                }

                if (typeof MenuConfig !== 'undefined') {
                    MenuConfig.applyStyles(confJson.data);
                    
                    // Ajuste para garantir que categories será lido quer venha de confJson.data.categories ou confJson.data.mystore.categories
                    const categoriesData = confJson.data.categories || (confJson.data.mystore ? confJson.data.mystore.categories : []);
                    MenuConfig.renderCategories(categoriesData);
                }
            }
            if (typeof MenuConfig !== 'undefined') {
                MenuConfig.setStoreInfo();
            }

            // Fetch Menu
            const menuRes = await fetch(`${window.API_URL}?action=getMenu`);
            const menuJson = await menuRes.json();
            if (menuJson.success) {
                this.menuData = menuJson.data;
                this.renderProducts(this.menuData);
            }
        } catch (e) {
            console.error("Erro ao carregar dados", e);
        }
        
        document.getElementById('global-loader').style.display = 'none';
        
        if (window.AuthSystem) {
            const u = window.AuthSystem.getCurrentUser();
            if(u && u.user) {
                const initial = u.user.charAt(0).toUpperCase();
                document.getElementById('sidebar-username').textContent = u.user;
                document.getElementById('sidebar-avatar').textContent = initial;
                document.getElementById('user-avatar').textContent = initial;
            }
        }
    },

    filterCategory(catName) {
        document.querySelectorAll('.cat-pill').forEach(el => {
            el.classList.toggle('active', el.dataset.cat === catName);
        });
        
        const filtered = this.menuData.filter(p => p.category.toLowerCase() === catName.toLowerCase());
        this.renderProducts(filtered.length > 0 ? filtered : this.menuData);
    },

    renderProducts(list) {
        const grid = document.getElementById('home-product-grid');
        grid.innerHTML = '';
        
        if (list.length === 0) {
            grid.innerHTML = '<p style="text-align:center; padding: 20px; opacity:0.6;">Nenhum produto encontrado.</p>';
            return;
        }

        list.forEach(item => {
            const imgLink = item.img ? item.img.split(',')[0].trim() : 'https://via.placeholder.com/90';
            const price = parseFloat(item.price).toFixed(2).replace('.', ',');
            const itemString = encodeURIComponent(JSON.stringify(item));
            
            grid.innerHTML += `
                <div class="prod-card" onclick="ProductSys.openProduct('${itemString}')">
                    <img src="${imgLink}" alt="${item.itemName}">
                    <div class="prod-card-info">
                        <div class="prod-card-title">${item.itemName}</div>
                        <div class="prod-card-desc">${item.ingredients ? item.ingredients.replace(/[\[\]]/g, '') : ''}</div>
                        <div class="prod-card-price">R$ ${price}</div>
                    </div>
                    <button class="prod-card-add" onclick="event.stopPropagation(); ProductSys.openProduct('${itemString}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    HomeSys.init();
});
