const BACKEND_URL = "https://zsti2.onrender.com";

// LOGOWANIE
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  console.log("login submit clicked");

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      location.href = 'dashboard.html';
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Nie udało się połączyć z serwerem.");
  }
});

// REJESTRACJA
document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  console.log("register submit clicked");

  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;

  if (password !== confirm) {
    alert("Hasła nie pasują");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Użytkownik utworzony, zaloguj się.");
      location.href = 'index.html';
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Nie udało się połączyć z serwerem.");
  }
});
