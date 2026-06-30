window.API_URL = "https://script.google.com/macros/s/AKfycbxdLTSxh4e4gdXp_6M9-qVbMPZqsiSpX8gHP1mGYR_a2IOX81Y2uAh_gAPRYIhMPTso/exec";

const AuthSystem = {
  init() {
    this.checkLoginCache();
    this.setupAvatarListener();
  },

  getCurrentUser() {
    const cached = localStorage.getItem("menu_user_session");
    return cached ? JSON.parse(cached) : null;
  },

  checkLoginCache() {
    const user = this.getCurrentUser();
    const avatarEl = document.getElementById("user-avatar");
    if (!avatarEl) return;

    if (user && user.user) {
      avatarEl.textContent = user.user.trim().charAt(0).toUpperCase();
    } else {
      avatarEl.textContent = "?";
    }
  },

  // Vincula o evento de clique no ícone do avatar
  setupAvatarListener() {
    const avatarEl = document.getElementById("user-avatar");
    if (!avatarEl) return;

    avatarEl.addEventListener("click", () => {
      const user = this.getCurrentUser();
      
      if (user) {
        // Se já estiver logado, exibe opção para sair
        const sair = confirm(`Você está logado como ${user.user}.\nDeseja sair da conta?`);
        if (sair) {
          this.logout();
          alert("Você saiu da conta com sucesso.");
        }
      } else {
        // Se não estiver logado, abre a tela de login (que agora contém o botão de registrar)
        // Passamos 'null' para que o sistema saiba que não estamos num fluxo de checkout
        this.showLoginForm(null);
      }
    });
  },

  async getIPAddress() {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch (e) {
      return "IP_" + Math.floor(Math.random() * 1000000);
    }
  },

  validatePassword(password, confirmPassword) {
    if (password !== confirmPassword) return "As senhas não coincidem.";
    if (password.startsWith("0")) return "A senha não pode começar com 0.";
    if (password.length < 6) return "A senha precisa ter no mínimo 6 caracteres.";
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "A senha precisa conter letras e números.";
    if (/\s/.test(password)) return "A senha não pode conter espaços.";
    if (/[\uD800-\uDFFF]/g.test(password)) return "A senha não pode conter emojis.";
    return null;
  },

  formatAddress(rua, numero, bairro, cidade, uf) {
    return `[${rua}], [${numero}], [${bairro}], [${cidade}], [${uf}]`;
  },

  getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve("");
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(`[${position.coords.latitude}], [${position.coords.longitude}]`);
          },
          () => {
            resolve("");
          }
        );
      }
    });
  },

  async handleCheckoutFlow(onProceedWithCheckout) {
    const user = this.getCurrentUser();
    if (user) {
      onProceedWithCheckout(user.user, user.address, false);
      return;
    }
    this.showAuthModal(onProceedWithCheckout);
  },

  showAuthModal(onProceedWithCheckout) {
    const modal = document.createElement("div");
    modal.id = "auth-flow-modal";
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;";

    const container = document.createElement("div");
    container.style = "background:#fff;padding:25px;border-radius:8px;max-width:400px;width:90%;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);";

    const title = document.createElement("h3");
    title.textContent = "Identificação necessária";
    title.style = "margin-top:0;margin-bottom:20px;font-family:sans-serif;color:#333;";
    container.appendChild(title);

    const btnLogin = document.createElement("button");
    btnLogin.textContent = "Entrar ou Registrar-se";
    btnLogin.style = "width:100%;padding:12px;margin-bottom:10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;";

    const btnGuest = document.createElement("button");
    btnGuest.textContent = "Continuar sem login";
    btnGuest.style = "width:100%;padding:12px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;";

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancelar Pedido";
    btnCancel.style = "width:100%;padding:12px;margin-top:10px;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;font-weight:bold;";

    container.appendChild(btnLogin);
    container.appendChild(btnGuest);
    container.appendChild(btnCancel);
    modal.appendChild(container);
    document.body.appendChild(modal);

    btnLogin.onclick = () => {
      document.body.removeChild(modal);
      this.showLoginForm(onProceedWithCheckout);
    };

    btnGuest.onclick = async () => {
      document.body.removeChild(modal);
      const ip = await this.getIPAddress();
      onProceedWithCheckout(ip, "", true);
    };

    btnCancel.onclick = () => {
      document.body.removeChild(modal);
    };
  },

  showLoginForm(onProceedWithCheckout) {
    const modal = document.createElement("div");
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;";

    const container = document.createElement("div");
    container.style = "background:#fff;padding:25px;border-radius:8px;max-width:360px;width:90%;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:sans-serif;";

    // Definimos os botões baseados em estarmos no fluxo de checkout ou não
    const btnCancelText = onProceedWithCheckout ? "Voltar ao Carrinho" : "Fechar";

    container.innerHTML = `
      <h3 style="margin-top:0;text-align:center;">Entrar na Conta</h3>
      <div style="margin-bottom:12px;">
        <label style="display:block;margin-bottom:4px;font-size:14px;">Usuário</label>
        <input type="text" id="login-user" style="width:100%;padding:8px;box-sizing:border-box;">
      </div>
      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:4px;font-size:14px;">Senha</label>
        <input type="password" id="login-psswd" style="width:100%;padding:8px;box-sizing:border-box;">
      </div>
      <div id="login-err" style="color:red;font-size:13px;margin-bottom:10px;display:none;"></div>
      
      <button id="btn-do-login" style="width:100%;padding:10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:15px;">Entrar</button>
      
      <div style="border-top: 1px solid #ddd; margin: 15px 0; position: relative;">
        <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; padding: 0 10px; font-size: 13px; color: #666;">Novo por aqui?</span>
      </div>
      
      <button id="btn-go-register" style="width:100%;padding:10px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Criar Conta</button>
      
      <button id="btn-cancel-login" style="width:100%;padding:10px;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;margin-top:15px;">${btnCancelText}</button>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    document.getElementById("btn-cancel-login").onclick = () => {
      document.body.removeChild(modal);
      // Se veio do checkout, volta para o modal inicial de Guest/Login
      if (onProceedWithCheckout) {
        this.showAuthModal(onProceedWithCheckout);
      }
    };

    // Botão para registrar conta (Chama o formulário de registro)
    document.getElementById("btn-go-register").onclick = () => {
      document.body.removeChild(modal);
      this.showRegisterForm(onProceedWithCheckout);
    };

    document.getElementById("btn-do-login").onclick = async () => {
      const userVal = document.getElementById("login-user").value;
      const psswdVal = document.getElementById("login-psswd").value;
      const errEl = document.getElementById("login-err");

      if (!userVal || !psswdVal) {
        errEl.textContent = "Preencha todos os campos.";
        errEl.style.display = "block";
        return;
      }

      // UX: Desativa botão e mostra carregamento
      const btn = document.getElementById("btn-do-login");
      btn.textContent = "Aguarde...";
      btn.disabled = true;

      try {
        const response = await fetch(window.API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "login", user: userVal, psswd: psswdVal })
        });
        const result = await response.json();

        if (result.success) {
          localStorage.setItem("menu_user_session", JSON.stringify(result.user));
          this.checkLoginCache();
          document.body.removeChild(modal);
          
          if (onProceedWithCheckout) {
            onProceedWithCheckout(result.user.user, result.user.address, false);
          } else {
            alert("Login realizado com sucesso!");
          }
        } else {
          errEl.textContent = result.message || "Erro ao fazer login.";
          errEl.style.display = "block";
          btn.textContent = "Entrar";
          btn.disabled = false;
        }
      } catch (e) {
        errEl.textContent = "Erro de conexão.";
        errEl.style.display = "block";
        btn.textContent = "Entrar";
        btn.disabled = false;
      }
    };
  },

  showRegisterForm(onProceedWithCheckout) {
    const modal = document.createElement("div");
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;overflow-y:auto;";

    const container = document.createElement("div");
    container.style = "background:#fff;padding:25px;border-radius:8px;max-width:450px;width:90%;margin:20px auto;max-height:90vh;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:sans-serif;";

    container.innerHTML = `
      <h3 style="margin-top:0;text-align:center;">Criar Conta</h3>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">Nome de Usuário</label><input type="text" id="reg-user" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">WhatsApp</label><input type="text" id="reg-whatsapp" style="width:100%;padding:6px;box-sizing:border-box;" placeholder="(11) 90000-0000"></div>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">E-mail</label><input type="email" id="reg-email" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      
      <h4 style="margin:10px 0 5px 0;font-size:14px;border-bottom:1px solid #eee;padding-bottom:3px;">Endereço</h4>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Rua</label><input type="text" id="reg-rua" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Número</label><input type="text" id="reg-numero" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Bairro</label><input type="text" id="reg-bairro" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Cidade</label><input type="text" id="reg-cidade" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:10px;"><label style="font-size:12px;display:block;">UF</label><input type="text" id="reg-uf" style="width:100%;padding:6px;box-sizing:border-box;" maxlength="2" placeholder="Ex: SP"></div>
      
      <h4 style="margin:10px 0 5px 0;font-size:14px;border-bottom:1px solid #eee;padding-bottom:3px;">Segurança</h4>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">Senha</label><input type="password" id="reg-psswd" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:12px;"><label style="font-size:13px;display:block;">Confirmar Senha</label><input type="password" id="reg-psswd-conf" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      
      <div id="reg-err" style="color:red;font-size:13px;margin-bottom:10px;display:none;"></div>
      
      <button id="btn-do-register" style="width:100%;padding:10px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Confirmar Cadastro</button>
      <button id="btn-cancel-reg" style="width:100%;padding:10px;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;margin-top:8px;">Voltar ao Login</button>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    document.getElementById("btn-cancel-reg").onclick = () => {
      document.body.removeChild(modal);
      // Sempre volta para a tela de Login independentemente se é fluxo aberto ou fechado
      this.showLoginForm(onProceedWithCheckout);
    };

    document.getElementById("btn-do-register").onclick = async () => {
      const errEl = document.getElementById("reg-err");
      const user = document.getElementById("reg-user").value.trim();
      const whatsapp = document.getElementById("reg-whatsapp").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      
      const rua = document.getElementById("reg-rua").value.trim();
      const numero = document.getElementById("reg-numero").value.trim();
      const bairro = document.getElementById("reg-bairro").value.trim();
      const cidade = document.getElementById("reg-cidade").value.trim();
      const uf = document.getElementById("reg-uf").value.trim();
      
      const psswd = document.getElementById("reg-psswd").value;
      const psswdConf = document.getElementById("reg-psswd-conf").value;

      if (!user || !whatsapp || !email || !rua || !numero || !bairro || !cidade || !uf || !psswd) {
        errEl.textContent = "Todos os campos obrigatórios devem ser preenchidos.";
        errEl.style.display = "block";
        return;
      }

      const psswdError = this.validatePassword(psswd, psswdConf);
      if (psswdError) {
        errEl.textContent = psswdError;
        errEl.style.display = "block";
        return;
      }

      // UX: Desativa botão e mostra carregamento
      const btn = document.getElementById("btn-do-register");
      btn.textContent = "Criando conta...";
      btn.disabled = true;

      errEl.style.display = "none";
      const fullAddress = this.formatAddress(rua, numero, bairro, cidade, uf);
      const localString = await this.getLocation();
      const ipAddress = await this.getIPAddress();

      const payload = {
        action: "register",
        user,
        ipAddress,
        whatsapp,
        email,
        address: fullAddress,
        local: localString,
        psswd
      };

      try {
        const response = await fetch(window.API_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
          const sessionUser = { user, ipAddress, whatsapp, email, address: fullAddress, local: localString, score: 0 };
          localStorage.setItem("menu_user_session", JSON.stringify(sessionUser));
          this.checkLoginCache();
          document.body.removeChild(modal);
          
          if (onProceedWithCheckout) {
            onProceedWithCheckout(user, fullAddress, false);
          } else {
            alert("Conta criada e login realizado com sucesso!");
          }
        } else {
          errEl.textContent = result.message || "Erro no registro.";
          errEl.style.display = "block";
          btn.textContent = "Confirmar Cadastro";
          btn.disabled = false;
        }
      } catch (e) {
        errEl.textContent = "Erro de conexão com o servidor.";
        errEl.style.display = "block";
        btn.textContent = "Confirmar Cadastro";
        btn.disabled = false;
      }
    };
  },

  logout() {
    localStorage.removeItem("menu_user_session");
    this.checkLoginCache();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AuthSystem.init();
});
