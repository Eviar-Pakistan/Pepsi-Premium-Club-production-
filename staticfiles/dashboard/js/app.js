// ============================== Navbar Toggle ============================================//

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
var startIndex

// ============================== Navbar Toggle ============================================//
// ============================== ChartJS ============================================//
// ===============Analytics Page ==================//

// Dropdown Cascading
function populateSelect(selectId, data, placeholder) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">${placeholder}</option>`;
    data.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item.gm_name || item.rsm_name || item.restaurant_name}</option>`;
    });
}

const bottler = document.getElementById("bottler");
const gm = document.getElementById("gm");
const rsm = document.getElementById("rsm");
const restaurant = document.getElementById("restaurant");

bottler && bottler.addEventListener("change", function () {
    let bottlerId = this.value;

    if (bottlerId) {
        if (gm) {
            fetch(`/dashboard/api/gms/${bottlerId}/`)
                .then(res => res.json())
                .then(data => populateSelect("gm", data, "Select GM"));
        }

        if (rsm) {
            fetch(`/dashboard/api/rsms/${bottlerId}/`)
                .then(res => res.json())
                .then(data => populateSelect("rsm", data, "Select RSM"));
        }

        if (restaurant) {
            fetch(`/dashboard/api/restaurants/${bottlerId}/`)
                .then(res => res.json())
                .then(data => populateSelect("restaurant", data, "Select Restaurant"));
        }
    }
});


gm && gm.addEventListener("change", function() {
    let gmId = this.value;
    if (gmId) {
        fetch(`/dashboard/api/rsms/gm/${gmId}/`)
            .then(res => res.json())
            .then(data => populateSelect("rsm", data, "Select RSM"));

        fetch(`/dashboard/api/restaurants/gm/${gmId}/`)
            .then(res => res.json())
            .then(data => populateSelect("restaurant", data, "Select Restaurant"));
    }
});

rsm && rsm.addEventListener("change", function() {
    let rsmId = this.value;
    if (rsmId) {
        fetch(`/dashboard/api/restaurants/rsm/${rsmId}/`)
            .then(res => res.json())
            .then(data => populateSelect("restaurant", data, "Select Restaurant"));
    }
});
document.addEventListener("DOMContentLoaded", function () {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const bottlerInput = document.getElementById("bottler");
  const restaurantInput = document.getElementById("restaurant");
  const gmInput = document.getElementById("gm");
  const rsmInput = document.getElementById("rsm");

  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has("startDate")) startDateInput.value = urlParams.get("startDate");
  if (urlParams.has("endDate")) endDateInput.value = urlParams.get("endDate");
  if (urlParams.has("bottler")) bottlerInput.value = urlParams.get("bottler");
  if (urlParams.has("restaurant")) restaurantInput.value = urlParams.get("restaurant");
  if (gmInput && urlParams.has("gm")) gmInput.value = urlParams.get("gm");
  if (rsmInput && urlParams.has("rsm")) rsmInput.value = urlParams.get("rsm");

  document.getElementById("filterBtn").addEventListener("click", function () {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if ((startDate && !endDate) || (!startDate && endDate)) {
      const erromodal = new bootstrap.Modal(
        document.getElementById("dashboarderrorModal")
      );
      erromodal.show();
      document.getElementById("dashboarderror").textContent =
        "Start Date and End Date are required together!";
      return;
    }

    const paramsObj = {
      startDate: startDate,
      endDate: endDate,
      restaurant: restaurantInput.value,
    };

    if (bottlerInput) paramsObj.bottler = bottlerInput.value;
    if (gmInput) paramsObj.gm = gmInput.value;
    if (rsmInput) paramsObj.rsm = rsmInput.value;

    const params = new URLSearchParams(paramsObj);

    window.location.href = "/dashboard/index/?" + params.toString();
  });

  const clearFilterBtn = document.getElementById("clearfilterBtn");
  clearFilterBtn && clearFilterBtn.addEventListener("click", function() {
      window.location.href = "/dashboard/index/";
  });
});


const sales = document.getElementById("sales");

function rotateArray(arr, startIndex) {
  return arr.slice(startIndex).concat(arr.slice(0, startIndex));
}

// Sales graph

let labels = JSON.parse(sales.dataset.labels);
let salesTarget = JSON.parse(sales.dataset.salesTarget);
let salesVolume = JSON.parse(sales.dataset.salesVolume);

if (labels.length === 12) {
   startIndex = labels.indexOf("Sep");
  if (startIndex !== -1) {
    labels = rotateArray(labels, startIndex);
    salesTarget = rotateArray(salesTarget, startIndex);
    salesVolume = rotateArray(salesVolume, startIndex);
  }
}
const salesChart = new Chart(sales, {
  type: "bar",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Sales Target",
        data: salesTarget,
        backgroundColor: "#FF1400",
        borderColor: "#FF1400",
        borderWidth: 2,
      },
      {
        label: "Sales Volume",
        data: salesVolume,
        backgroundColor: "#004C97",
        borderColor: "#004C97",
        borderWidth: 2,
      },
    ],
  },
  options: {
    responsive: true,
    animation: true,
    scales: {
      x: { display: true, grid: { display: false } },
      y: { display: true, grid: { display: false } },
    },
    plugins: {
      legend: { display: true, position: "top" },
      datalabels: {
        display: true,
        anchor: "end",
        align: "top",
        color: "black",
        font: { weight: "bold" },
        formatter: (value) => value,
      },
    },
  },
  plugins: [ChartDataLabels],
});

document.querySelector(".allSelect").addEventListener("change", function () {
  const month = this.value;

  if (month) {
    fetch(`/dashboard/sales-data/?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          salesChart.data.labels = data.labels;
          salesChart.data.datasets[0].data = data.sales_target;
          salesChart.data.datasets[1].data = data.sales_volume;
          salesChart.update();
        }
      });
  } else {
    location.reload();
  }
});



// Compliance Graph


document.querySelector(".complianceselect").addEventListener("change", function () {
  const month = this.value;

  if (month) {
    fetch(`/dashboard/compliance-data/?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          complianceChart.data.labels = data.labels;
          complianceChart.data.datasets[0].data = data.compliance_target;
          complianceChart.data.datasets[1].data = data.compliance_volume;
          complianceChart.update();
        }
      });
  } else {
    location.reload();
  }
});

const compliance = document.getElementById("compliance");

let compliancelabels = JSON.parse(compliance.dataset.labels);
let complianceTarget = JSON.parse(compliance.dataset.complianceTarget);
let complianceVolume = JSON.parse(compliance.dataset.complianceVolume);

// Rotate if 12 months data is present
if (compliancelabels.length === 12) {
  const startIndex = compliancelabels.indexOf("Sep");
  if (startIndex !== -1) {
    compliancelabels = rotateArray(compliancelabels, startIndex);
    complianceTarget = rotateArray(complianceTarget, startIndex);
    complianceVolume = rotateArray(complianceVolume, startIndex);
  }
}

const complianceChart = new Chart(compliance, {
  type: "line",
  data: {
    labels: compliancelabels,
    datasets: [
      {
        label: "Compliance Target (%)",
        data: complianceTarget,
        backgroundColor: "rgba(255, 20, 0, 0.2)",
        borderColor: "#FF1400",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
      },
      {
        label: "Compliance Achieved (%)",
        data: complianceVolume,
        backgroundColor: "rgba(0, 76, 151, 0.2)",
        borderColor: "#004C97",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
      },
    ],
  },
  options: {
    responsive: true,
    animation: true,
    scales: {
      x: { display: true, grid: { display: false } },
      y: {
        display: true,
        grid: { display: false },
        beginAtZero: true,
        max: 100,
      },
    },
    plugins: {
      datalabels: {
        display: true,
        anchor: "end",
        align: "top",
        color: "black",
        font: { weight: "bold" },
        formatter: (value) => `${value}%`,
      },
      legend: { display: true, position: "top" },
    },
  },
  plugins: [ChartDataLabels],
});





// Consumers Graph

document.querySelector(".consumerselect").addEventListener("change", function () {
  const month = this.value;

  if (month) {
    fetch(`/dashboard/consumer-data/?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          consumerChart.data.labels = data.labels;
          consumerChart.data.datasets[0].data = data.consumer_target;
          consumerChart.data.datasets[1].data = data.consumer_volume;
          consumerChart.update();
        }
      });
  } else {
    location.reload();
  }
});

const consumer = document.getElementById("consumer");

let consumerlabels = JSON.parse(consumer.dataset.labels);
let consumerTarget = JSON.parse(consumer.dataset.consumerTarget);
let consumerVolume = JSON.parse(consumer.dataset.consumerVolume);

if (consumerlabels.length === 12) {
  const startIndex = consumerlabels.indexOf("Sep");
  if (startIndex !== -1) {
    consumerlabels = rotateArray(consumerlabels, startIndex);
    consumerTarget = rotateArray(consumerTarget, startIndex);
    consumerVolume = rotateArray(consumerVolume, startIndex);
  }
}

const consumerChart = new Chart(consumer, {
  type: "bar",
  data: {
    labels: consumerlabels,
    datasets: [
      {
        label: "Consumer Actuals",
        data: consumerTarget,
        backgroundColor: "#FF1400",
        borderColor: "#FF1400",
        borderWidth: 2,
      },
      {
        label: "Consumer Target",
        data: consumerVolume,
        backgroundColor: "#004C97",
        borderColor: "#004C97",
        borderWidth: 2,
      },
    ],
  },
  options: {
    responsive: true,
    animation: true,
    scales: {
      x: { display: true, grid: { display: false } },
      y: { display: true, grid: { display: false } },
    },
    plugins: {
      legend: { display: true, position: "top" },
      datalabels: {
        display: true,
        anchor: "end",
        align: "top",
        color: "black",
        font: { weight: "bold" },
        formatter: (value) => value,
      },
    },
  },
  plugins: [ChartDataLabels],
});




// Logout Functionality 
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


// ===============Analytics Page ==================//

// ============================== ChartJS ============================================//
// =============== Hide Show Column Support Page ==================//
// function hideShowDiv() {
//   const columnElement = document.getElementById("ticketColumn");
//   const hiddenElement = document.getElementById("ticketForm");
//   const button = document.getElementById("ticketBtn");

//   // Get the current state of the button
//   const buttonState = button.getAttribute("data-state");

//   if (buttonState === "new") {
//     // When button is in 'new' state
//     if (columnElement) {
//       columnElement.classList.remove("col-lg-12");
//       columnElement.classList.add("col-lg-8");
//     }

//     if (hiddenElement) {
//       hiddenElement.classList.remove("d-none");
//     }

//     // Update button to 'cancel' state
//     button.innerHTML = "Cancel";
//     button.setAttribute("data-state", "cancel");
//   } else {
//     // When button is in 'cancel' state
//     if (columnElement) {
//       columnElement.classList.remove("col-lg-8");
//       columnElement.classList.add("col-lg-12");
//     }

//     if (hiddenElement) {
//       hiddenElement.classList.add("d-none");
//     }

//     // Update button to 'new' state
//     button.innerHTML = '<i class="fas fa-plus me-2"></i> New Ticket';
//     button.setAttribute("data-state", "new");
//   }
// }

// =============== Hide Show Column Support Page ==================//

// Select all submenu items

// CONSUMER CHART

