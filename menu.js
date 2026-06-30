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
        if (!menu || !overlay) return;

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
        if (container) container.innerHTML = ''; 
        if (bar) bar.innerHTML = '';
        
        cats.forEach((cat, idx) => {
            const icon = this.getIcon(cat);
            if (container) {
                container.innerHTML += `
                    <div class="cat-item" onclick="HomeSys.filterCategory('${cat}'); MenuConfig.toggle();">
                        <i class="fas ${icon}" style="color: var(--categoriesicons);"></i> <span style="color: var(--menutext);">${cat}</span>
                    </div>`;
            }
            if (bar) {
                bar.innerHTML += `
                    <div class="cat-pill ${idx === 0 ? 'active' : ''}" data-cat="${cat}" onclick="HomeSys.filterCategory('${cat}')">
                        <i class="fas ${icon}"></i> <span>${cat}</span>
                    </div>`;
            }
        });
    },

    setStoreInfo() {
        const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt || ''; };
        const setInner = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt || ''; };

        setTxt('sidebar-storename', window.STORE_NAME);
        setTxt('home-storename', window.STORE_NAME);

        // Process Address
        let addr = window.ADDRESS || '';
        if (addr.includes(',')) {
            const p = addr.split(',').map(s => s.trim());
            if (p.length >= 5) addr = `${p[0]}, ${p[1]}, ${p[2]}, ${p[3]} - ${p[4]}`;
        }
        setTxt('info-local', addr);

        // Process Shipping
        let ship = window.SHIPPING || '';
        if (ship) {
            ship = ship.split(',').map(s => '- ' + s.trim()).join('\n');
        }
        setInner('info-shipping', ship);

        setTxt('info-time', window.WORKING_TIME);
        setTxt('info-insta', window.INSTAGRAM);
        setTxt('info-whats', window.WHATSAPP);
    },

    applyStyles(config) {
        const root = document.documentElement;
        if(config.mainColor) root.style.setProperty('--mainColor', config.mainColor);
        if(config.textColor) root.style.setProperty('--textColor', config.textColor);
        if(config.bgcolor) root.style.setProperty('--bgcolor', config.bgcolor);
        if(config.menubg) root.style.setProperty('--menubg', config.menubg);
        if(config.iconColors) root.style.setProperty('--iconColors', config.iconColors);
        
        const logoUrl = config.profilePic || 'https://via.placeholder.com/150';
        const elSidebarLogo = document.getElementById('sidebar-logo');
        const elHomeLogo = document.getElementById('home-logo');
        if (elSidebarLogo) elSidebarLogo.src = logoUrl;
        if (elHomeLogo) elHomeLogo.src = logoUrl;
        
        const slog = config.slogan || window.STORE_NAME || '';
        const elSidebarSlogan = document.getElementById('sidebar-slogan');
        const elHomeSlogan = document.getElementById('home-slogan');
        if (elSidebarSlogan) elSidebarSlogan.textContent = slog;
        if (elHomeSlogan) elHomeSlogan.textContent = slog;
    }
};
