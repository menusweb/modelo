const ProfileSys = {
    openProfile() {
        const user = window.AuthSystem ? AuthSystem.getCurrentUser() : null;
        if (!user) {
            alert("Faça login no carrinho ou finalize um pedido para acessar o perfil.");
            return;
        }
        
        const modal = document.createElement("div");
        modal.id = "profile-modal";
        modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;overflow-y:auto;";

        const container = document.createElement("div");
        container.style = "background:#fff;padding:25px;border-radius:8px;max-width:400px;width:90%;margin:20px auto;box-shadow:0 4px 12px rgba(0,0,0,0.15);";

        let addressParts = ["", "", "", "", ""];
        if (user.address) {
            const m = user.address.match(/\[(.*?)\]/g);
            if (m && m.length === 5) addressParts = m.map(x => x.replace(/[\[\]]/g, ''));
        }

        container.innerHTML = `
            <h3 style="margin-top:0;text-align:center;">Meu Perfil</h3>
            <p><strong>Usuário:</strong> ${user.user}</p>
            <p><strong>Pontos:</strong> ${user.score}</p>
            <hr style="margin:10px 0;border:0;border-top:1px solid #eee;">
            <div style="margin-bottom:10px;"><label>WhatsApp</label><input type="text" id="prof-whatsapp" value="${user.whatsapp || ''}" style="width:100%;padding:6px;"></div>
            <div style="margin-bottom:10px;"><label>E-mail</label><input type="email" id="prof-email" value="${user.email || ''}" style="width:100%;padding:6px;"></div>
            <h4 style="margin:10px 0 5px;">Endereço</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
                <input type="text" id="prof-rua" placeholder="Rua" value="${addressParts[0]}">
                <input type="text" id="prof-numero" placeholder="Número" value="${addressParts[1]}">
                <input type="text" id="prof-bairro" placeholder="Bairro" value="${addressParts[2]}">
                <input type="text" id="prof-cidade" placeholder="Cidade" value="${addressParts[3]}">
                <input type="text" id="prof-uf" placeholder="UF" value="${addressParts[4]}" style="grid-column: span 2;">
            </div>
            <button id="btn-save-prof" style="width:100%;padding:10px;background:var(--mainColor);color:#fff;border:none;border-radius:4px;margin-bottom:10px;font-weight:bold;">Salvar</button>
            <button id="btn-logout" style="width:100%;padding:10px;background:#dc3545;color:#fff;border:none;border-radius:4px;margin-bottom:10px;font-weight:bold;">Sair (Logout)</button>
            <button id="btn-close-prof" style="width:100%;padding:10px;background:#ccc;color:#333;border:none;border-radius:4px;">Fechar</button>
        `;

        modal.appendChild(container);
        document.body.appendChild(modal);

        document.getElementById('btn-close-prof').onclick = () => document.body.removeChild(modal);
        
        document.getElementById('btn-logout').onclick = () => {
            AuthSystem.logout();
            document.body.removeChild(modal);
            window.location.reload();
        };

        document.getElementById('btn-save-prof').onclick = async () => {
            const wa = document.getElementById('prof-whatsapp').value;
            const em = document.getElementById('prof-email').value;
            const rua = document.getElementById('prof-rua').value;
            const num = document.getElementById('prof-numero').value;
            const bairro = document.getElementById('prof-bairro').value;
            const cidade = document.getElementById('prof-cidade').value;
            const uf = document.getElementById('prof-uf').value;
            
            const newAddr = `[${rua}], [${num}], [${bairro}], [${cidade}], [${uf}]`;
            
            document.getElementById('btn-save-prof').textContent = 'Salvando...';
            try {
                const res = await fetch(window.API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: "updateProfile", user: user.user, whatsapp: wa, email: em, address: newAddr })
                });
                const result = await res.json();
                if(result.success) {
                    user.whatsapp = wa; user.email = em; user.address = newAddr;
                    localStorage.setItem("menu_user_session", JSON.stringify(user));
                    alert("Perfil atualizado!");
                    document.body.removeChild(modal);
                } else {
                    alert("Erro: " + result.message);
                }
            } catch(e) {
                alert("Erro de conexão.");
            }
            document.getElementById('btn-save-prof').textContent = 'Salvar';
        };
    }
};
