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


document.addEventListener('DOMContentLoaded', function () {
    const bottlerSelect = document.getElementById('bottlerSelect');
    const bottlerFields = document.getElementById('bottlerFields');

    const gmsSelect = document.getElementById("gmsSelect");
    const rsmSelect = document.getElementById("rsmSelect");
    const restaurantSelect = document.getElementById("restaurantSelect");

    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    const kpiSelect = document.getElementById("kpiSelect");

    const generateBtn = document.getElementById("reportGenerateBtn");

    function hideAllDynamicFields() {
        bottlerFields.style.display = 'none';
    }
    hideAllDynamicFields();

    bottlerSelect.addEventListener('change', function () {
        hideAllDynamicFields();
        if (this.value) {
            bottlerFields.style.display = 'block';

            fetch(`/dashboard/api/gms/${this.value}/`)
                .then(res => res.json())
                .then(data => populateSelect(gmsSelect, data, "Select GM"));

            fetch(`/dashboard/api/rsms/${this.value}/`)
                .then(res => res.json())
                .then(data => populateSelect(rsmSelect, data, "Select RSM"));

            fetch(`/dashboard/api/restaurants/${this.value}/`)
                .then(res => res.json())
                .then(data => populateSelect(restaurantSelect, data, "Select Restaurant"));
        }
    });

    function populateSelect(select, data, placeholder) {
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        data.forEach(item => {
            select.innerHTML += `<option value="${item.id}">
                ${item.gm_name || item.rsm_name || item.restaurant_name}
            </option>`;
        });
    }

    gmsSelect && gmsSelect.addEventListener("change", function () {
        let gmIds = Array.from(this.selectedOptions).map(opt => opt.value);

        if (gmIds.length > 0) {
            fetch(`/dashboard/api/rsms/gm/${gmIds.join(",")}/`)
                .then(res => res.json())
                .then(data => populateSelect(rsmSelect, data, "Select RSM"));

            fetch(`/dashboard/api/restaurants/gm/${gmIds.join(",")}/`)
                .then(res => res.json())
                .then(data => populateSelect(restaurantSelect, data, "Select Restaurant"));
        }
    });

    rsmSelect && rsmSelect.addEventListener("change", function () {
        let rsmIds = Array.from(this.selectedOptions).map(opt => opt.value);

        if (rsmIds.length > 0) {
            fetch(`/dashboard/api/restaurants/rsm/${rsmIds.join(",")}/`)
                .then(res => res.json())
                .then(data => populateSelect(restaurantSelect, data, "Select Restaurant"));
        }
    });

    generateBtn && generateBtn.addEventListener("click", function () {
        const selectedStartDate = startDate.value;
        const selectedEndDate = endDate.value;
        const selectedKpi = kpiSelect.value;
        const selectedBottler = bottlerSelect.value;

        const selectedGms = gmsSelect ? Array.from(gmsSelect.selectedOptions).map(o => o.value) : [];
        const selectedRsms = rsmSelect ? Array.from(rsmSelect.selectedOptions).map(o => o.value) : [];
        const selectedRestaurants = restaurantSelect ? Array.from(restaurantSelect.selectedOptions).map(o => o.value) : [];

        const reportFilters = {
            startDate: selectedStartDate,
            endDate: selectedEndDate,
            kpi: selectedKpi,
            bottler: selectedBottler,
            gms: selectedGms,
            rsms: selectedRsms,
            restaurants: selectedRestaurants
        };

        if ((selectedStartDate && !selectedEndDate) || (!selectedStartDate && selectedEndDate)) {
            const erromodal = new bootstrap.Modal(
                document.getElementById("reporterrorModal")
            );
            erromodal.show();
            document.getElementById("reporterror").textContent =
                "Start Date and End Date are required together!";
            return;
            }

        if (!selectedKpi) {
            const erromodal = new bootstrap.Modal(
                document.getElementById("reporterrorModal")
            );
            erromodal.show();
            document.getElementById("reporterror").textContent =
                "Please select a KPI!";
            return;
        }    

                if (!selectedBottler) {
            const erromodal = new bootstrap.Modal(
                document.getElementById("reporterrorModal")
            );
            erromodal.show();
            document.getElementById("reporterror").textContent =
                "Please select a Bottler!";
            return;
        }    

        console.log("Report Filters:", reportFilters);

        fetch("/dashboard/api/generate-report/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken") 
            },
            body: JSON.stringify(reportFilters)
        })
        .then(res => res.json())
        .then(data => {
            console.log("Report Data:", data);
            fetch("/dashboard/api/export-report-excel/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken") 
                },
                body: JSON.stringify(reportFilters)
            })  
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'report.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            )
            .catch(err => console.error("Error exporting report:", err));
                
        })
        .catch(err => console.error("Error generating report:", err));
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
