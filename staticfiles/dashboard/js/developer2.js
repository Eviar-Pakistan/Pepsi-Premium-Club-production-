
function toggleSideNav() {
  const sideNav = document.querySelector(".sideNav");
  const button = document.querySelector(".open-btn");
  const buttonIcon = button.querySelector("i");

  if (sideNav.classList.contains("hidden")) {
    sideNav.classList.remove("hidden");
    button.classList.add("hidden"); // Hide the button
    buttonIcon.classList.remove("fa-angle-right");
    buttonIcon.classList.add("fa-angle-left");
  } else {
    sideNav.classList.add("hidden");
    button.classList.remove("hidden"); // Show the button
    buttonIcon.classList.remove("fa-angle-left");
    buttonIcon.classList.add("fa-angle-right");
  }
}

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


var token = localStorage.getItem("access_token");


// ---- Universal Fetch with Auto Token Refresh ----
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("access_token");

  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let response = await fetch(url, { ...options, headers });

  // If token expired → refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");

    if (refreshToken) {
      const refreshResponse = await fetch("/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem("access_token", refreshData.access);

        // Retry with new token
        const newHeaders = {
          ...options.headers,
          "Authorization": `Bearer ${refreshData.access}`,
          "Content-Type": "application/json",
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      } else {
        // Refresh also expired → logout
        alert("Session expired, please login again.");
        window.location.href = "/login/";
      }
    }
  }

  return response;
}



document.addEventListener("DOMContentLoaded", () => {


const editposmButtons = document.querySelectorAll(".manualeditBtn");

editposmButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const posmId = button.getAttribute("data-id");

    try {
      const response = await fetchWithAuth(`/dashboard/api/get-posm/${posmId}/`, {
        method: "GET",
        headers: {
          "X-CSRFToken": csrftoken
        }
      });
      const data = await response.json();

      console.log("API response:", data);

      if (data.success) {
        const posm = data.posm;

    
        // Fill inputs
        document.getElementById("requestedate").value = posm.requested_at || "";
      
        document.getElementById("savePosmBtn").setAttribute("data-id", posmId);

      } else {
        alert("Posm not found: " + data.message);
      }
    } catch (error) {
      console.error("Error loading posm:", error);
    }
  });
});

})


// Save posm manual review
 const savePosmBtn = document.getElementById("savePosmBtn");

  savePosmBtn && savePosmBtn.addEventListener("click", async () => {
    const posmId = savePosmBtn.getAttribute("data-id"); 
    const posm_status = document.getElementById("editposmtatus").value
  
    const payload = {
        posm_status:posm_status
        
    }

    try {
      const response = await fetchWithAuth(`/dashboard/api/developer-posm-update/${posmId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFtoken" : csrftoken
                },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Posm updated successfully");
        location.reload(); 
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      console.log(err)
      alert("Error updating target");
    }
  });


  const apiposmUrl = '/dashboard/api/posm/default/';
    const posmtoggle = document.getElementById('toggle');
    const posmstatusEl = document.getElementById('status');

    // show status
    function setposmStatus(text, loading=false) {
      posmstatusEl.textContent = text;
      if (loading) {
        posmstatusEl.classList.add('loading');
      } else {
        posmstatusEl.classList.remove('loading');
      }
    }

    // Load current value on page load
    async function loadPosmDefault() {
      try {
        setposmStatus('Loading…', true);
        const resp = await fetch(apiposmUrl, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!resp.ok) throw new Error('Network error: ' + resp.status);
        const data = await resp.json();
        posmtoggle.checked = !!data.default_is_checked;
        setposmStatus('Default is_checked = ' + posmtoggle.checked);
      } catch (err) {
        setposmStatus('Error loading: ' + err.message);
      }
    }

    // Update backend when toggled
    async function updateDefault(newValue) {
      try {
        setposmStatus('Updating…', true);
        const resp = await fetch(apiposmUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ default_is_checked: newValue })
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error('Server error: ' + resp.status + ' ' + txt);
        }
        const data = await resp.json();
        setposmStatus('Updated: default_is_checked = ' + data.default_is_checked);
      } catch (err) {
        setposmStatus('Error updating: ' + err.message);
        // revert toggle visually if update failed
        posmtoggle.checked = !newValue;
      }
    }

    // wire up event
    posmtoggle &&  posmtoggle.addEventListener('change', (e) => {
      const newValue = e.target.checked;
      // optimistic UI: show immediate state (but update will occur)
      setposmStatus('Sending update…');
      updateDefault(newValue);
    });

    // initial load
    loadPosmDefault();


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


