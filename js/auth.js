function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function validatePassword(value) {
  return String(value).trim().length >= 6;
}

function validateName(value) {
  return String(value).trim().length >= 2;
}

function setFieldState(form, name, valid, message) {
  const input = form.querySelector(`[name="${name}"]`);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (!input || !error) return;

  input.classList.remove("valid", "invalid");
  input.classList.add(valid ? "valid" : "invalid");
  error.textContent = valid ? "" : message;
}

function setupPasswordToggles(form) {
  form.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
      const input = form.querySelector(
        `input[name="${button.dataset.target}"]`,
      );
      if (!input) return;
      const nextType = input.type === "password" ? "text" : "password";
      input.type = nextType;
      button.textContent = nextType === "password" ? "👁" : "🙈";
    });
  });
}

function activateTab(activeType) {
  const loginTab = document.getElementById("show-login");
  const registerTab = document.getElementById("show-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  const isLogin = activeType === "login";
  loginTab.classList.toggle("is-active", isLogin);
  registerTab.classList.toggle("is-active", !isLogin);
  loginTab.setAttribute("aria-selected", String(isLogin));
  registerTab.setAttribute("aria-selected", String(!isLogin));

  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
}

document.addEventListener("DOMContentLoaded", () => {
  const loginTab = document.getElementById("show-login");
  const registerTab = document.getElementById("show-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (!loginForm || !registerForm) return;

  if (getCurrentUser()) {
    window.location.href = "index.html";
    return;
  }

  activateTab("login");
  setupPasswordToggles(loginForm);
  setupPasswordToggles(registerForm);

  loginTab?.addEventListener("click", () => activateTab("login"));
  registerTab?.addEventListener("click", () => activateTab("register"));

  loginForm.addEventListener("input", () => {
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    setFieldState(
      loginForm,
      "email",
      validateEmail(email),
      "Введите корректный email",
    );
    setFieldState(
      loginForm,
      "password",
      validatePassword(password),
      "Минимум 6 символов",
    );
  });

  registerForm.addEventListener("input", () => {
    const name = registerForm.name.value;
    const email = registerForm.email.value;
    const password = registerForm.password.value;

    setFieldState(
      registerForm,
      "name",
      validateName(name),
      "Минимум 2 символа",
    );
    setFieldState(
      registerForm,
      "email",
      validateEmail(email),
      "Введите корректный email",
    );
    setFieldState(
      registerForm,
      "password",
      validatePassword(password),
      "Минимум 6 символов",
    );
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = registerForm.name.value.trim();
    const email = registerForm.email.value.trim().toLowerCase();
    const password = registerForm.password.value;

    const nameOk = validateName(name);
    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);

    setFieldState(registerForm, "name", nameOk, "Минимум 2 символа");
    setFieldState(registerForm, "email", emailOk, "Введите корректный email");
    setFieldState(registerForm, "password", passwordOk, "Минимум 6 символов");

    if (!nameOk || !emailOk || !passwordOk) {
      showToast("Проверьте поля формы", "error");
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      setFieldState(
        registerForm,
        "email",
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
    showToast("Регистрация успешна", "success");
    refreshHeaderAndTitle();
    window.location.href = "index.html";
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;

    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);

    setFieldState(loginForm, "email", emailOk, "Введите корректный email");
    setFieldState(loginForm, "password", passwordOk, "Минимум 6 символов");

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
      setFieldState(loginForm, "password", false, "Неверный email или пароль");
      return;
    }

    setCurrentUser(found);
    showToast("Вы вошли", "success");
    refreshHeaderAndTitle();
    window.location.href = "index.html";
  });
});
