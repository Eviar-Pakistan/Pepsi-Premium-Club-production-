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

//   const GMbtn = document.getElementById("GM-tab-btn")
//       const RSMbtn = document.getElementById("RSM-tab-btn")

//       GMbtn && GMbtn.addEventListener("click" ,function() {
//     document.getElementById("GMtab").style.display = "block";
//     document.getElementById("RSMtab").style.display = "none";

//     document.getElementById("GM-tab-btn").classList.add("submenuactive");
//     document.getElementById("RSM-tab-btn").classList.remove("submenuactive");

//       })

// RSMbtn && RSMbtn.addEventListener("click", function() {
//     document.getElementById("RSMtab").style.display = "block";
//     document.getElementById("GMtab").style.display = "none";

//     document.getElementById("RSM-tab-btn").classList.add("submenuactive");
//     document.getElementById("GM-tab-btn").classList.remove("submenuactive");

// })



// const unitTab = document.getElementById('unittab');
//   const submenu = document.getElementById('submenu');
//   const arrowIcon = document.getElementById('arrowIcon');

//   unitTab.addEventListener('click', function (event) {
//     event.preventDefault(); 
//     submenu.classList.toggle('hidden');
//     arrowIcon.classList.toggle('rotate-arrow');
//   });



// GM Analytics



// const balance = document.getElementById("balance");

// if (balance){

  
//   new Chart(balance, {
//   type: "bar",
//   data: {
//     labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
//     datasets: [
//       {
//         label: "Target",
//         data: [150, 175, 160, 200, 195, 225, 165, 170, 148, 135, 180, 162],
//         backgroundColor: "#FF1400",
//         borderColor: "#FF1400",
//         borderWidth: 2,
        
//       },
//       {
//         label: "Sales",
//         data: [140, 180, 155, 210, 190, 230, 160, 165, 150, 130, 185, 170],
//         backgroundColor: "#004C97",
//         borderColor: "#004C97",
//         borderWidth: 2,
//       },
//     ],
//   },
//   options: {
//     responsive: true,
//     animation: true,
//     scales: {
//       x: {
//         display: true,
//         grid: {
//           display: false,
//         },
//       },
//       y: {
//         display: true,
//         grid: {
//           display: false,
//         },
//       },
//     },
//     plugins: {
//       datalabels: {
//         anchor: "end",
//         align: "top",
//         color: "black",
//         font: {
//           weight: "bold",
//         },
//         formatter: function (value) {
//           return value;
//         },
//       },
//       legend: {
//         display: true, 
//         position: "top",
//       },
//     },
//   },
// });
// }

// GM create Functionality

// const createGmBtn = document.getElementById("createGmBtn");

// const gmname = document.getElementById("GMname");
// const gmcontactno = document.getElementById("GMcontactno");
// const gmbottler = document.getElementById("bottler");
// const taggedrsm = document.getElementById("rsm");
// const taggedgmrestaurant = document.getElementById("restaurant");
// const gmtarget = document.getElementById("target");

// createGmBtn && createGmBtn.addEventListener("click", (e) => {
//   e.preventDefault();

//   const formData = {
//     name: gmname.value.trim(),
//     contactNo: gmcontactno.value.trim(),
//     bottler: gmbottler.value,
//     rsm: taggedrsm.value,
//     restaurant: taggedgmrestaurant.value,
//     target: gmtarget.value.trim()
//   };

//   console.log(formData);
// });


// RSM create Functionality

// const createRsmBtn = document.getElementById("createRsmBtn");

// const rsmname = document.getElementById("rsmname");
// const rsmcontactno = document.getElementById("rsmcontactno");
// const rsmbottler = document.getElementById("rsmbottler");
// const taggedgm = document.getElementById("taggedgm");
// const taggedrsmrestaurant = document.getElementById("taggedrsmrestaurant");
// const rsmtarget = document.getElementById("rsmtarget");

// createRsmBtn && createRsmBtn.addEventListener("click", (e) => {
//   e.preventDefault();

//   const formData = {
//     name: rsmname.value.trim(),
//     contactNo: rsmcontactno.value.trim(),
//     bottler: rsmbottler.value,
//     gm: taggedgm.value,
//     restaurant: taggedrsmrestaurant.value,
//     target: rsmtarget.value.trim()
//   };

//   console.log(formData);
// });


// GM edit Functionality 
// const gmEditBtn = document.getElementById("gm-edit-btn")
const gmSaveBtn = document.getElementById("gm-save-btn")

const gmeditname = document.getElementById("gmname");
const gmeditcontactno = document.getElementById("gmcontactno");
const gmeditbottlerInput = document.getElementById("bottler");   
const gmeditbottlerSelect = document.getElementById("rsmbottler");
const gmeditcrate_target = document.getElementById("crate_target");
const gmeditconsumer_target = document.getElementById("consumer_target");
const gmeditcompliance_target = document.getElementById("compliance_target");
var gm_id;
if (gmSaveBtn){
  gm_id = gmSaveBtn.getAttribute("data-id");
}

gmSaveBtn && gmSaveBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const payload = {
    name: gmeditname.value.trim(),
    contactNo: gmeditcontactno.value.trim(),
  };

  if (gmeditbottlerSelect) {
    const bottlerVal = gmeditbottlerSelect.value.trim();
    if (bottlerVal !== "") {
      payload.bottler = parseInt(bottlerVal, 10);
    }
  }

  const isEditable = (el) => el && !el.hasAttribute("readonly");

  const parseTarget = (el) => {
    if (!el || !isEditable(el)) return undefined;
    const v = el.value.trim();
    if (v === "") return undefined;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  const crateVal = parseTarget(gmeditcrate_target);
  if (crateVal !== undefined) payload.crate_target = crateVal;

  const consumerVal = parseTarget(gmeditconsumer_target);
  if (consumerVal !== undefined) payload.consumer_target = consumerVal;

  const complianceVal = parseTarget(gmeditcompliance_target);
  if (complianceVal !== undefined) payload.compliance_target = complianceVal;

  try {
    const response = await fetchWithAuth(`/dashboard/api/edit_gm_api/${gm_id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    if (response.ok && data.success) {
      const successModalElement = document.getElementById("gmsuccessModal");
      const successmodal = new bootstrap.Modal(successModalElement);
      successmodal.show();
      document.getElementById("gmsuccess").textContent = data.message;
      setTimeout(() => {
        successmodal.hide();
        window.location.reload();
      }, 500);
    } else {
      const erromodal = new bootstrap.Modal(
        document.getElementById("gmerrorModal")
      );
      erromodal.show();
      document.getElementById("gmerror").textContent =
        data.message || "Gm update failed";
    }
  } catch (error) {
    console.error("Error:", error);
    const erromodal = new bootstrap.Modal(
      document.getElementById("gmerrorModal")
    );
    erromodal.show();
    document.getElementById("gmerror").textContent =
      error.message || "Something went wrong! Please try again later.";
  }
});


// RSM edit Functionality 
const rsmSaveBtn = document.getElementById("rsm-save-btn");

const rsmeditname = document.getElementById("rsmname");
const rsmeditcontactno = document.getElementById("rsmcontactno");
const rsmeditbottlerInput = document.getElementById("bottler");   
const rsmeditbottlerSelect = document.getElementById("rsmbottler");
const rsmeditcrate_target = document.getElementById("crate_target");
const rsmeditconsumer_target = document.getElementById("consumer_target");
const rsmeditcompliance_target = document.getElementById("compliance_target");
var rsm_id;
if (rsmSaveBtn){
  rsm_id = rsmSaveBtn.getAttribute("data-id");
}

rsmSaveBtn && rsmSaveBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const payload = {
    name: rsmeditname.value.trim(),
    contactNo: rsmeditcontactno.value.trim(),
  };

  if (rsmeditbottlerSelect) {
    const bottlerVal = rsmeditbottlerSelect.value.trim();
    if (bottlerVal !== "") {
      payload.bottler = parseInt(bottlerVal, 10);
    }
  }

  const isEditable = (el) => el && !el.hasAttribute("readonly");

  const parseTarget = (el) => {
    if (!el || !isEditable(el)) return undefined;
    const v = el.value.trim();
    if (v === "") return undefined;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? undefined : n;
  };

  const crateVal = parseTarget(rsmeditcrate_target);
  if (crateVal !== undefined) payload.crate_target = crateVal;

  const consumerVal = parseTarget(rsmeditconsumer_target);
  if (consumerVal !== undefined) payload.consumer_target = consumerVal;

  const complianceVal = parseTarget(rsmeditcompliance_target);
  if (complianceVal !== undefined) payload.compliance_target = complianceVal;

  try {
    const response = await fetchWithAuth(`/dashboard/api/edit_rsm_api/${rsm_id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    if (response.ok && data.success) {
      const successModalElement = document.getElementById("rsmsuccessModal");
      const successmodal = new bootstrap.Modal(successModalElement);
      successmodal.show();
      document.getElementById("rsmsuccess").textContent = data.message;
      setTimeout(() => {
        successmodal.hide();
        window.location.reload();
      }, 500);
    } else {
      const erromodal = new bootstrap.Modal(
        document.getElementById("rsmerrorModal")
      );
      erromodal.show();
      document.getElementById("rsmerror").textContent =
        data.message || "Update failed";
    }
  } catch (error) {
    console.error("Error:", error);
    const erromodal = new bootstrap.Modal(
      document.getElementById("rsmerrorModal")
    );
    erromodal.show();
    document.getElementById("rsmerror").textContent =
      error.message || "Something went wrong! Please try again later.";
  }
});


// GM Delete Functionality

const gmDeleteBtn = document.getElementById("gm-delete-btn");

gmDeleteBtn && gmDeleteBtn.addEventListener("click", async () => {
  const gm_id = gmDeleteBtn.getAttribute("data-id");
  if (!confirm("Are you sure you want to delete this GM?")) return;

  try {
    const response = await fetchWithAuth(`/dashboard/api/delete_gm_api/${gm_id}/`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok && data.success) {
       const successModalElement = document.getElementById("gmsuccessModal");
      const successmodal = new bootstrap.Modal(successModalElement);
      successmodal.show();
      document.getElementById("gmsuccess").textContent = data.message;
      setTimeout(() => {
        successmodal.hide();
        window.location.href = "/dashboard/bottler/";
      }, 500);
    } else {
      alert(data.message || "Failed to delete GM");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong while deleting!");
  }
});



  // RSM Deleet Functionlaity 

const rsmDeleteBtn = document.getElementById("rsm-delete-btn");

rsmDeleteBtn && rsmDeleteBtn.addEventListener("click", async () => {
  const rsm_id = rsmDeleteBtn.getAttribute("data-id");
  if (!confirm("Are you sure you want to delete this RSM?")) return;

  try {
    const response = await fetchWithAuth(`/dashboard/api/delete_rsm_api/${rsm_id}/`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok && data.success) {
     const successModalElement = document.getElementById("rsmsuccessModal");
      const successmodal = new bootstrap.Modal(successModalElement);
      successmodal.show();
      document.getElementById("rsmsuccess").textContent = data.message;
      setTimeout(() => {
        successmodal.hide();
        window.location.href = "/dashboard/bottler/"; 
      }, 500);
    } else {
       const erromodal = new bootstrap.Modal(
        document.getElementById("rsmerrorModal")
      );
      erromodal.show();
      document.getElementById("rsmerror").textContent =
        data.message || "Delete failed";
    } 
     }
   catch (err) {
    console.error("Error:", err);
 const erromodal = new bootstrap.Modal(
        document.getElementById("rsmerrorModal")
      );
      erromodal.show();
      document.getElementById("rsmerror").textContent =
        data.message || "Update failed";
    }
});

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

