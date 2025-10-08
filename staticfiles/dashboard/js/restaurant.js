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

// Restaurant Analytics
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
//         display: true, // Show legend so user knows which is Sales and Target
//         position: "top",
//       },
//     },
//   },
// });

// }


// Restaurant Create Functionality

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

// ---- Restaurant Create Button ----
const createRestaurantBtn = document.getElementById("createRestaurant");

const restaurantName = document.getElementById("restaurantName");
const restaurantManager = document.getElementById("restaurantManager");
const restaurantContactNo = document.getElementById("restaurantcontactNo");
const restaurantCategory = document.getElementById("restaurantCategory");

createRestaurantBtn &&
  createRestaurantBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const formData = {
      name: restaurantName.value.trim(),
      manager: restaurantManager.value.trim(),
      contactNo: restaurantContactNo.value.trim(),
      category: restaurantCategory.value,
    };

    try {
      const response = await fetchWithAuth("/dashboard/api/create-restaurant/", {
        method: "POST",
        headers:{
          "X-CSRFToken":csrftoken
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        const successModalElement = document.getElementById("restaurantsuccessModal");
        const successmodal = new bootstrap.Modal(successModalElement);
        successmodal.show();
        document.getElementById("restaurantsuccess").textContent =data.message;
            setTimeout(() => {
          successmodal.hide();
          window.location.reload();
        }, 500);
      } else {
        const erromodal = new bootstrap.Modal(
          document.getElementById("restauranterrorModal")
        );
        erromodal.show();
        document.getElementById("restauranterror").textContent = data.message;
      }
    } catch (error) {
      console.error("Error:", error);
      const erromodal = new bootstrap.Modal(
        document.getElementById("restauranterrorModal")
      );
      erromodal.show();
      document.getElementById("restauranterror").textContent = "Something went wrong! Please try again later.";
    }
  });


// Restaurant Edit Functionality
// const restaurantSaveBtn = document.getElementById("restaurant-save-btn");

// restaurantSaveBtn && restaurantSaveBtn.addEventListener("click", (e) => {
//   e.preventDefault();

//   // ---- Extract restaurant ID from URL ----
//   const pathSegments = window.location.pathname.split('/').filter(Boolean); 
//   const restaurantId = pathSegments[pathSegments.length - 1]; // last segment

//   const formData = {
//     name: document.getElementById("restaurantName").value.trim(),
//     contactNo: document.getElementById("restaurantcontactNo").value.trim(),
//   };

//   fetchWithAuth(`/dashboard/api/edit-restaurant/${restaurantId}/`, {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",

//     },
//     body: JSON.stringify(formData),
//   })
//     .then(response => response.json())
//     .then(data => {
//       if (data.success) {
//         const successModalElement = document.getElementById("restaurantsuccessModal");
//         const successmodal = new bootstrap.Modal(successModalElement);
//         successmodal.show();
//         document.getElementById("restaurantsuccess").textContent =data.message;
//             setTimeout(() => {
//           successmodal.hide();
//           window.location.reload();
//         }, 500);
//       } else {
//        const erromodal = new bootstrap.Modal(
//           document.getElementById("restauranterrorModal")
//         );
//         erromodal.show();
//         document.getElementById("restauranterror").textContent = data.message;
//       }
//     })
//     .catch(error => {
//      console.error("Error:", error);
//       const erromodal = new bootstrap.Modal(
//         document.getElementById("restauranterrorModal")
//       );
//       erromodal.show();
//       document.getElementById("restauranterror").textContent = "Something went wrong! Please try again later.";
//     });
// });


const deleteRestaurantBtn = document.getElementById("deleteRestaurantBtn");

deleteRestaurantBtn && deleteRestaurantBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const restaurantId = deleteRestaurantBtn.getAttribute("data-id");

  Swal.fire({
    title: "Are you sure?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel"
  }).then((result) => {
    if (result.isConfirmed) {
      fetchWithAuth(`/dashboard/api/delete-restaurant/${restaurantId}/`, {
        method: "DELETE",
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
                 const successModalElement = document.getElementById("restaurantsuccessModal");
        const successmodal = new bootstrap.Modal(successModalElement);
        successmodal.show();
        document.getElementById("restaurantsuccess").textContent =data.message;
            setTimeout(() => {
          successmodal.hide();
          window.location.reload();
        }, 500);
        } else {
                  const erromodal = new bootstrap.Modal(
          document.getElementById("restauranterrorModal")
        );
        erromodal.show();
        document.getElementById("restauranterror").textContent = data.message;
        }
      })
      .catch(error => {
       console.error("Error:", error);
      const erromodal = new bootstrap.Modal(
        document.getElementById("restauranterrorModal")
      );
      erromodal.show();
      document.getElementById("restauranterror").textContent = "Something went wrong! Please try again later.";
        console.error("Error:", error);
      });
    }
  });
});


// Filted RSM and GM based on Bottler selection
document.addEventListener("DOMContentLoaded", function() {
    const bottlerSelect = document.getElementById("restaurantBottler");
    const rsmSelect = document.getElementById("restaurantRSM");
    const gmSelect = document.getElementById("restaurantGM");

    if (bottlerSelect) {
        bottlerSelect.addEventListener("change", function() {
            const bottlerId = this.value;

            fetch(`/dashboard/api/get-rsms-gms/${bottlerId}/`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update RSM dropdown
                        rsmSelect.innerHTML = "";
                        if (data.rsms.length > 0) {
                            data.rsms.forEach(rsm => {
                                let opt = document.createElement("option");
                                opt.value = rsm.id;
                                opt.textContent = rsm.rsm_name;
                                rsmSelect.appendChild(opt);
                            });
                        } else {
                            rsmSelect.innerHTML = `<option>No RSM available</option>`;
                        }

                        // Update GM dropdown
                        gmSelect.innerHTML = "";
                        if (data.gms.length > 0) {
                            data.gms.forEach(gm => {
                                let opt = document.createElement("option");
                                opt.value = gm.id;
                                opt.textContent = gm.gm_name;
                                gmSelect.appendChild(opt);
                            });
                        } else {
                            gmSelect.innerHTML = `<option>No GM available</option>`;
                        }
                    }
                })
                .catch(err => console.error("Error fetching RSM/GM:", err));
        });
    }
});


const restauranTargetBtn = document.getElementById("restaurant-target-btn")

restauranTargetBtn && restauranTargetBtn.addEventListener("click", async (e) => { 
    e.preventDefault();
    const targetType = document.getElementById("targettype");
    const targetMonth = document.getElementById("month");
    const targetValue = document.getElementById("targetvalue");
    const targetstatus = document.getElementById("targetstatus");
    const restaurant_id = targetstatus.getAttribute("data-id");


   const formData = {
        restaurant_id :restaurant_id,
        target_type: targetType.value,
        month: targetMonth.value,
        target_value: targetValue.value,
   }
   try {
      const response = await fetchWithAuth("/dashboard/api/create-restaurant-target/", {
        method: "POST",
          headers:{
            "X-CSRFToken":csrftoken
          },
        body: JSON.stringify(formData),
      });

      console.log(formData)
      const data = await response.json();

      if (data.success) {
        const successModalElement = document.getElementById("restaurantsuccessModal");
        const successmodal = new bootstrap.Modal(successModalElement);
        successmodal.show();
        document.getElementById("restaurantsuccess").textContent =data.message;
            setTimeout(() => {
          successmodal.hide();
          window.location.reload();
        }, 500);
      } else {
        const erromodal = new bootstrap.Modal(
          document.getElementById("restauranterrorModal")
        );
        erromodal.show();
        document.getElementById("restauranterror").textContent = data.message;
      }
    } catch (error) {
      console.error("Error:", error);
      const erromodal = new bootstrap.Modal(
        document.getElementById("restauranterrorModal")
      );
      erromodal.show();
      document.getElementById("restauranterror").textContent = "Something went wrong! Please try again later.";
    }

})

// Restaurant edit Target Functioanlity

document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".edittargetBtn");

  editButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const targetId = button.getAttribute("data-id");

      try {
        const response = await fetchWithAuth(`/dashboard/api/get-restaurant-target/${targetId}/`,{
          method: "GET",
          headers:{
            "X-CSRFToken":csrftoken
          }
        });
        const data = await response.json();

        console.log("API response:", data); // 🔍 check values

        if (data.success) {
          const target = data.target;

          document.getElementById("edittargettype").value = target.target_type;
          document.getElementById("editmonth").value = target.target_month;
          document.getElementById("edittargetvalue").value = target.target_value;
          document.getElementById("edittargetstatus").value = target.target_status;

          document.getElementById("saveTargetBtn").setAttribute("data-id", targetId);
        } else {
          alert("Target not found: " + data.message);
        }
      } catch (error) {
        console.error("Error loading target:", error);
      }
    });
  });


// Edit bottle crate 

//   const editcrateButtons = document.querySelectorAll(".editcrateBtn");

//   editcrateButtons.forEach(button => {
//     button.addEventListener("click", async () => {
//       const crateId = button.getAttribute("data-id");

//       try {
//         const response = await fetchWithAuth(`/dashboard/api/get-crate-target/${crateId}/`,{
//           method: "GET",
//           headers:{
//           "X-CSRFToken": csrftoken
//           }
//         });
//         const data = await response.json();

//         console.log("API response:", data); 

//         if (data.success) {
//           const crate = data.crate;
//           document.getElementById("requestedate").value = crate.requested_at;
//           document.getElementById("editcratestatus").value = crate.is_approved;
//           document.getElementById("saveCrateBtn").setAttribute("data-id", crateId);
//         } else {
//           alert("Target not found: " + data.message);
//         }
//       } catch (error) {
//         console.error("Error loading target:", error);
//       }
//     });
//   });


// });



// edit manual review

const editcoolerButtons = document.querySelectorAll(".manualeditBtn");

editcoolerButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const coolerId = button.getAttribute("data-id");

    try {
      const response = await fetchWithAuth(`/dashboard/api/get-cooler/${coolerId}/`, {
        method: "GET",
        headers: {
          "X-CSRFToken": csrftoken
        }
      });
      const data = await response.json();

      console.log("API response:", data);

      if (data.success) {
        const cooler = data.cooler;

        // raw_data split
        let numerator = "";
        let denominator = "";
        if (cooler.raw_data && cooler.raw_data.includes("/")) {
          [numerator, denominator] = cooler.raw_data.split("/");
        }

        // Fill inputs
        document.getElementById("requestedate").value = cooler.requested_at || "";
        document.getElementById("bottledetected").value = numerator || "";
        document.getElementById("totalbottle").value = denominator || "";
        document.getElementById("saveCoolerBtn").setAttribute("data-id", coolerId);

      } else {
        alert("Cooler not found: " + data.message);
      }
    } catch (error) {
      console.error("Error loading cooler:", error);
    }
  });
});

const editposmButtons = document.querySelectorAll(".manualposmeditBtn");

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

        console.log(posm)

        // raw_data split
        let numerator = "";
        let denominator = "";
        if (posm.raw_data && posm.raw_data.includes("/")) {
          [numerator, denominator] = posm.raw_data.split("/");
        }

        // Fill inputs
        document.getElementById("requesteposmdate").value = posm.requested_at || "";
        document.getElementById("detected").value = numerator || "";
        document.getElementById("totalbrands").value = denominator || "";
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

// Save cooler manual review
 const saveCoolerBtn = document.getElementById("saveCoolerBtn");

  saveCoolerBtn && saveCoolerBtn.addEventListener("click", async () => {
    const coolerId = saveCoolerBtn.getAttribute("data-id"); 
    const bottleDetected = document.getElementById("bottledetected").value;
    const totalBottle = document.getElementById("totalbottle").value;

    if( bottleDetected > totalBottle) {
        alert("Bottle detected cannot be greater than Total bottle");
        return;
    }    

    const rawData = `${bottleDetected}/${totalBottle}`;
    const payload = {
      raw_data: rawData,
    };

    console.log(payload)
    console.log(coolerId)
    try {
      const response = await fetchWithAuth(`/dashboard/api/cooler-update/${coolerId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFtoken" : csrftoken
                },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Cooler updated successfully");
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


// Save posm manual review
 const savePosmBtn = document.getElementById("savePosmBtn");

  savePosmBtn && savePosmBtn.addEventListener("click", async () => {
    const posmId = savePosmBtn.getAttribute("data-id"); 
    const brand = document.getElementById("detected").value;
    const total = document.getElementById("totalbrands").value;

    if( brand > total) {
        alert("Detected Brand cannot be greater than Total brand");
        return;
    }    

    const rawData = `${brand}/${total}`;
    const payload = {
      raw_data: rawData,
    };

    console.log(payload)
    try {
      const response = await fetchWithAuth(`/dashboard/api/posm-update/${posmId}/`, {
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


document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveTargetBtn");

  saveBtn && saveBtn.addEventListener("click", async () => {
    const targetId = saveBtn.getAttribute("data-id"); 

    const payload = {
      target_type: document.getElementById("edittargettype").value,
      target_month: document.getElementById("editmonth").value,
      target_value: document.getElementById("edittargetvalue").value,
      target_status: document.getElementById("edittargetstatus").value,
    };

    console.log(payload)
    console.log(targetId)

    try {
      const response = await fetchWithAuth(`/dashboard/api/restaurant-targets/${targetId}/edit/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken":csrftoken
          
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Target updated successfully");
        location.reload(); // refresh table/list
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      console.log(err)
      alert("Error updating target");
    }
  });


    const savecrateBtn = document.getElementById("saveCrateBtn");

  savecrateBtn && savecrateBtn.addEventListener("click", async () => {
    const crateId = savecrateBtn.getAttribute("data-id"); 

    const payload = {
      is_approved: document.getElementById("editcratestatus").value,
    };

    console.log(payload)
    console.log(crateId)

    try {
      const response = await fetchWithAuth(`/dashboard/api/crate-targets/${crateId}/edit/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFtoken" : csrftoken
                },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Crate updated successfully");
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



const downloadtemplate = document.getElementById("downloadtemplate");

downloadtemplate && downloadtemplate.addEventListener("click", function() {
    fetch("/dashboard/api/download-template/") 
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");

            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "cases_sales_template.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error("Error downloading template:", error);
            alert("Failed to download template. Please try again.");
        });
});

const uploadCasesSalesBtn = document.getElementById("uploadCasesSalesBtn")
uploadCasesSalesBtn && uploadCasesSalesBtn.addEventListener("click", () => {
    const fileInput = document.getElementById("casesSalesFile");
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select an Excel file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    fetch("/dashboard/api/upload-crate-sales/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        },
        body: formData,
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Upload complete");
        const uploadModalEl = document.getElementById('uploadCasesSalesModal');
        const modal = bootstrap.Modal.getInstance(uploadModalEl);
        if (modal) {
            modal.hide();
        }
        fileInput.value = "";
        if (data.errors && data.errors.length) {
            console.warn("Errors:", data.errors);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Upload failed.");
    });
});
