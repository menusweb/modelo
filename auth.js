window.API_URL = "https://script.google.com/macros/s/EXEC_ID_DO_APPS_SCRIPT/exec";

const AuthSystem = {
  init() {
    this.checkLoginCache();
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
    btnLogin.textContent = "Entrar na conta existente";
    btnLogin.style = "width:100%;padding:12px;margin-bottom:10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;";
    
    const btnRegister = document.createElement("button");
    btnRegister.textContent = "Registrar-se";
    btnRegister.style = "width:100%;padding:12px;margin-bottom:10px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;";

    const btnGuest = document.createElement("button");
    btnGuest.textContent = "Continuar sem login";
    btnGuest.style = "width:100%;padding:12px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;";

    container.appendChild(btnLogin);
    container.appendChild(btnRegister);
    container.appendChild(btnGuest);
    modal.appendChild(container);
    document.body.appendChild(modal);

    btnLogin.onclick = () => {
      document.body.removeChild(modal);
      this.showLoginForm(onProceedWithCheckout);
    };

    btnRegister.onclick = () => {
      document.body.removeChild(modal);
      this.showRegisterForm(onProceedWithCheckout);
    };

    btnGuest.onclick = async () => {
      document.body.removeChild(modal);
      const ip = await this.getIPAddress();
      onProceedWithCheckout(ip, "", true);
    };
  },

  showLoginForm(onProceedWithCheckout) {
    const modal = document.createElement("div");
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;";

    const container = document.createElement("div");
    container.style = "background:#fff;padding:25px;border-radius:8px;max-width:360px;width:90%;box-shadow:0 4px 12px rgba(0,0,0,0.15);";

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
      <button id="btn-do-login" style="width:100%;padding:10px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Entrar</button>
      <button id="btn-cancel-login" style="width:100%;padding:10px;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;margin-top:8px;">Voltar</button>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    document.getElementById("btn-cancel-login").onclick = () => {
      document.body.removeChild(modal);
      this.showAuthModal(onProceedWithCheckout);
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
          onProceedWithCheckout(result.user.user, result.user.address, false);
        } else {
          errEl.textContent = result.message || "Erro ao fazer login.";
          errEl.style.display = "block";
        }
      } catch (e) {
        errEl.textContent = "Erro de conexão.";
        errEl.style.display = "block";
      }
    };
  },

  showRegisterForm(onProceedWithCheckout) {
    const modal = document.createElement("div");
    modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;overflow-y:auto;";

    const container = document.createElement("div");
    container.style = "background:#fff;padding:25px;border-radius:8px;max-width:450px;width:90%;margin:20px auto;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:sans-serif;";

    container.innerHTML = `
      <h3 style="margin-top:0;text-align:center;">Criar Conta</h3>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">Nome de Usuário</label><input type="text" id="reg-user" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">WhatsApp</label><input type="text" id="reg-whatsapp" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">E-mail</label><input type="email" id="reg-email" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      
      <h4 style="margin:10px 0 5px 0;font-size:14px;border-bottom:1px solid #eee;padding-bottom:3px;">Endereço</h4>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Rua</label><input type="text" id="reg-rua" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Número</label><input type="text" id="reg-numero" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Bairro</label><input type="text" id="reg-bairro" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;display:block;">Cidade</label><input type="text" id="reg-cidade" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:10px;"><label style="font-size:12px;display:block;">UF</label><input type="text" id="reg-uf" style="width:100%;padding:6px;box-sizing:border-box;" maxlength="2"></div>
      
      <h4 style="margin:10px 0 5px 0;font-size:14px;border-bottom:1px solid #eee;padding-bottom:3px;">Segurança</h4>
      <div style="margin-bottom:10px;"><label style="font-size:13px;display:block;">Senha</label><input type="password" id="reg-psswd" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      <div style="margin-bottom:12px;"><label style="font-size:13px;display:block;">Confirmar Senha</label><input type="password" id="reg-psswd-conf" style="width:100%;padding:6px;box-sizing:border-box;"></div>
      
      <div id="reg-err" style="color:red;font-size:13px;margin-bottom:10px;display:none;"></div>
      <button id="btn-do-register" style="width:100%;padding:10px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Registrar e Continuar</button>
      <button id="btn-cancel-reg" style="width:100%;padding:10px;background:#ccc;color:#333;border:none;border-radius:4px;cursor:pointer;margin-top:8px;">Voltar</button>
    `;

    modal.appendChild(container);
    document.body.appendChild(modal);

    document.getElementById("btn-cancel-reg").onclick = () => {
      document.body.removeChild(modal);
      this.showAuthModal(onProceedWithCheckout);
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
          onProceedWithCheckout(user, fullAddress, false);
        } else {
          errEl.textContent = result.message || "Erro no registro.";
          errEl.style.display = "block";
        }
      } catch (e) {
        errEl.textContent = "Erro de conexão com o servidor.";
        errEl.style.display = "block";
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
