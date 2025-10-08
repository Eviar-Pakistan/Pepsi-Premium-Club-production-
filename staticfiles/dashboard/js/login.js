function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('toggleIcon');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  }
}

// =======================================Login functionality==================================//
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
const csrftoken = getCookie('csrftoken');



const loginbtn = document.getElementById("loginbtn");
const error = document.getElementById("error")
const success = document.getElementById("success");

loginbtn.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    error.textContent = "Email or Password Required";
    return;
  }

  
  fetch("/dashboard/api/login/", {  
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,

    },
    body: JSON.stringify({ username, password }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        const successModalElement = document.getElementById("loginsuccessModal");
        const successmodal = new bootstrap.Modal(successModalElement);
        successmodal.show();
        document.getElementById("loginsuccess").textContent = data.message;

        setTimeout(() => {
          successmodal.hide();
          window.location.href = data.redirect_url;
        }, 500);
      } else {
        const erromodal = new bootstrap.Modal(document.getElementById("loginerrorModal"));
        erromodal.show();
        document.getElementById("loginerror").textContent = data.message || "Invalid credentials";
      }
    })
    .catch(error => {
      console.error("Error", error);
      const erromodal = new bootstrap.Modal(document.getElementById("loginerrorModal"));
      erromodal.show();
      document.getElementById("loginerror").textContent = "An error occurred. Please try again.";
    });
});


// =======================================Login functionality==================================//
