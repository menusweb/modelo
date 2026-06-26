const MenuConfig = {
    iconsMap: {
        'hamburguer': 'fa-hamburger', 'sanduiche': 'fa-hamburger', 'burger': 'fa-hamburger',
        'acai': 'fa-ice-cream', 'açaí': 'fa-ice-cream', 'sorvete': 'fa-ice-cream',
        'bebida': 'fa-glass-cheers', 'suco': 'fa-glass-cheers', 'refri': 'fa-glass-cheers',
        'sobremesa': 'fa-birthday-cake', 'doce': 'fa-birthday-cake',
        'combo': 'fa-box-open', 'porcao': 'fa-french-fries', 'porção': 'fa-french-fries', 'frita': 'fa-french-fries',
        'massa': 'fa-utensils', 'hotdog': 'fa-hotdog', 'cachorro': 'fa-hotdog',
        'pizza': 'fa-pizza-slice', 'novidade': 'fa-star', 'promo': 'fa-tag', 'mais pedido': 'fa-fire'
    },

    getIcon(categoryName) {
        let name = categoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        for (let key in this.iconsMap) {
            if (name.includes(key.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) {
                return this.iconsMap[key];
            }
        }
        return 'fa-utensils'; // default
    },

    toggle() {
        const menu = document.getElementById('sidebar-menu');
        const overlay = document.getElementById('sidebar-overlay');
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            menu.classList.remove('open');
            overlay.style.display = 'none';
        } else {
            menu.classList.add('open');
            overlay.style.display = 'block';
        }
    },

    renderCategories(categoriesString) {
        if (!categoriesString) return;
        const cats = categoriesString.split(',').map(c => c.trim()).filter(c => c);
        window.StoreCategories = cats;
        
        const container = document.getElementById('sidebar-categories');
        const bar = document.getElementById('home-category-bar');
        container.innerHTML = ''; bar.innerHTML = '';
        
        cats.forEach((cat, idx) => {
            const icon = this.getIcon(cat);
            // Sidebar item
            container.innerHTML += `
                <div class="cat-item" onclick="HomeSys.filterCategory('${cat}'); MenuConfig.toggle();">
                    <i class="fas ${icon}"></i> ${cat}
                </div>`;
            // Home pill
            bar.innerHTML += `
                <div class="cat-pill ${idx === 0 ? 'active' : ''}" data-cat="${cat}" onclick="HomeSys.filterCategory('${cat}')">
                    <i class="fas ${icon}"></i> <span>${cat}</span>
                </div>`;
        });
    },

    setStoreInfo() {
        document.getElementById('sidebar-storename').textContent = window.STORE_NAME;
        document.getElementById('home-storename').textContent = window.STORE_NAME;
        
        document.getElementById('info-local').textContent = window.STORE_LOCAL;
        document.getElementById('info-shipping').textContent = window.SHIPPING_TYPE;
        document.getElementById('info-time').textContent = window.WORKING_TIME;
        document.getElementById('info-insta').textContent = window.INSTAGRAM;
        document.getElementById('info-whats').textContent = window.WHATSAPP;
    },

    applyStyles(config) {
        const root = document.documentElement;
        if(config.mainColor) root.style.setProperty('--mainColor', config.mainColor);
        if(config.textColor) root.style.setProperty('--textColor', config.textColor);
        if(config.bgcolor) root.style.setProperty('--bgcolor', config.bgcolor);
        if(config.menubg) root.style.setProperty('--menubg', config.menubg);
        if(config.iconColors) root.style.setProperty('--iconColors', config.iconColors);
        
        const logoUrl = config.profilePic || 'https://via.placeholder.com/150';
        document.getElementById('sidebar-logo').src = logoUrl;
        document.getElementById('home-logo').src = logoUrl;
        
        const slog = config.slogan || window.STORE_NAME;
        document.getElementById('sidebar-slogan').textContent = slog;
        document.getElementById('home-slogan').textContent = slog;
    }
};
