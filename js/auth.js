function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function validatePassword(value) {
  return String(value || "").trim().length >= 6;
}

function validateName(value) {
  return String(value || "").trim().length >= 2;
}

function setFieldState(input, error, valid, message) {
  if (!input || !error) return;
  input.classList.toggle("valid", valid);
  input.classList.toggle("invalid", !valid);
  error.textContent = valid ? "" : message;
}

function setPasswordToggle(button, input) {
  if (!button || !input) return;
  button.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    const icon = button.querySelector("i");
    if (icon) {
      icon.className = isHidden ? "ti ti-eye-off" : "ti ti-eye";
    }
  });
}

function setActiveTab(loginVisible) {
  document
    .getElementById("show-login")
    ?.classList.toggle("active", loginVisible);
  document
    .getElementById("show-register")
    ?.classList.toggle("active", !loginVisible);
  document.getElementById("login-form").style.display = loginVisible
    ? "flex"
    : "none";
  document.getElementById("register-form").style.display = loginVisible
    ? "none"
    : "flex";
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  if (getCurrentUser()) {
    window.location.href = "index.html";
    return;
  }

  const loginTab = document.getElementById("show-login");
  const registerTab = document.getElementById("show-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const regName = document.getElementById("reg-name");
  const regEmail = document.getElementById("reg-email");
  const regPassword = document.getElementById("reg-password");
  const regConfirm = document.getElementById("reg-confirm");

  setActiveTab(true);
  setPasswordToggle(loginForm.querySelector(".toggle-password"), loginPassword);
  setPasswordToggle(
    registerForm.querySelector(".toggle-password"),
    regPassword,
  );

  loginTab?.addEventListener("click", () => setActiveTab(true));
  registerTab?.addEventListener("click", () => setActiveTab(false));

  loginEmail.addEventListener("input", () => {
    setFieldState(
      loginEmail,
      document.getElementById("login-email-error"),
      validateEmail(loginEmail.value),
      "Введите корректный email",
    );
  });
  loginPassword.addEventListener("input", () => {
    setFieldState(
      loginPassword,
      document.getElementById("login-password-error"),
      validatePassword(loginPassword.value),
      "Минимум 6 символов",
    );
  });

  regName.addEventListener("input", () => {
    setFieldState(
      regName,
      document.getElementById("reg-name-error"),
      validateName(regName.value),
      "Минимум 2 символа",
    );
  });
  regEmail.addEventListener("input", () => {
    setFieldState(
      regEmail,
      document.getElementById("reg-email-error"),
      validateEmail(regEmail.value),
      "Введите корректный email",
    );
  });
  const validateRegisterPassword = () => {
    const ok = validatePassword(regPassword.value);
    setFieldState(
      regPassword,
      document.getElementById("reg-password-error"),
      ok,
      "Минимум 6 символов",
    );
    return ok;
  };
  const validateRegisterConfirm = () => {
    const ok =
      regConfirm.value === regPassword.value &&
      validatePassword(regPassword.value);
    setFieldState(
      regConfirm,
      document.getElementById("reg-confirm-error"),
      ok,
      "Пароли не совпадают",
    );
    return ok;
  };
  regPassword.addEventListener("input", () => {
    validateRegisterPassword();
    validateRegisterConfirm();
  });
  regConfirm.addEventListener("input", validateRegisterConfirm);

  document.getElementById("login-submit").addEventListener("click", () => {
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);

    setFieldState(
      loginEmail,
      document.getElementById("login-email-error"),
      emailOk,
      "Введите корректный email",
    );
    setFieldState(
      loginPassword,
      document.getElementById("login-password-error"),
      passwordOk,
      "Минимум 6 символов",
    );

    if (!emailOk || !passwordOk) {
      showToast("Проверьте поля формы", "error");
      return;
    }

    const users = getUsers();
    const found = users.find(
      (user) => user.email === email && user.password === password,
    );
    if (!found) {
      showToast("Неверный email или пароль", "error");
      setFieldState(
        loginPassword,
        document.getElementById("login-password-error"),
        false,
        "Неверный email или пароль",
      );
      return;
    }

    setCurrentUser(found);
    showToast("Добро пожаловать!", "success");
    refreshHeaderAndTitle();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 600);
  });

  document.getElementById("reg-submit").addEventListener("click", () => {
    const name = regName.value.trim();
    const email = regEmail.value.trim().toLowerCase();
    const password = regPassword.value;
    const confirm = regConfirm.value;

    const nameOk = validateName(name);
    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);
    const confirmOk = confirm === password;

    setFieldState(
      regName,
      document.getElementById("reg-name-error"),
      nameOk,
      "Минимум 2 символа",
    );
    setFieldState(
      regEmail,
      document.getElementById("reg-email-error"),
      emailOk,
      "Введите корректный email",
    );
    setFieldState(
      regPassword,
      document.getElementById("reg-password-error"),
      passwordOk,
      "Минимум 6 символов",
    );
    setFieldState(
      regConfirm,
      document.getElementById("reg-confirm-error"),
      confirmOk,
      "Пароли не совпадают",
    );

    if (!nameOk || !emailOk || !passwordOk || !confirmOk) {
      showToast("Проверьте поля формы", "error");
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      setFieldState(
        regEmail,
        document.getElementById("reg-email-error"),
        false,
        "Пользователь уже существует",
      );
      showToast("Пользователь с таким email уже есть", "error");
      return;
    }

    const created = new User(name, email, password);
    users.push(created);
    saveUsers(users);
    setCurrentUser(created);
    showToast("Регистрация успешна!", "success");
    refreshHeaderAndTitle();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  });
});
