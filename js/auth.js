// LOGOWANIE
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch('http://localhost:3000/api/login', {
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
});

// REJESTRACJA
document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;

  if (password !== confirm) {
    alert("Hasła nie pasują");
    return;
  }

  const res = await fetch('http://localhost:3000/api/register', {
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
});
