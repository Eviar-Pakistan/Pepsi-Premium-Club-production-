function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const csrftoken = getCookie("csrftoken");

// logout Functionality
const logout = document.getElementById("logoutBtn")
logout && logout.addEventListener("click", function(e) {
    e.preventDefault(); 
    fetch("/dashboard/api/logout/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/dashboard/login/"; 
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error("Error:", error));
});
