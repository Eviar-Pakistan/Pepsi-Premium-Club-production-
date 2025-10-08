
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

var myDonutChart;

var ctx = document.getElementById('myDonutChart').getContext('2d');
const over_all_target = parseFloat(document.getElementById('over_all_target').innerHTML) || 0;

var data = {
  labels: ['Achieved', 'Remaining'],
  datasets: [{
    data: [over_all_target, 100 - over_all_target],  
    backgroundColor: [
      "#C6A75F",   
      "#E5E7EB"    
    ],
    borderWidth: 0,
    cutout: "85%"   
  }]
};

var options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false
    }
  }
};

if (myDonutChart) {
  myDonutChart.destroy();
}
myDonutChart = new Chart(ctx, {
  type: 'doughnut',
  data: data,
  options: options
});


const currentScreen = localStorage.getItem("currentScreen") || 2;

document.addEventListener("DOMContentLoaded", function () { 
  goToScreen(currentScreen);
})

function goToScreen(screenNumber) {
  document.querySelectorAll("body > div").forEach(div => div.classList.add("hidden"));
  document.getElementById(`screen${screenNumber}`).classList.remove("hidden");
  localStorage.setItem("currentScreen", screenNumber);
  
}


// Customer dashboard screen2

document.getElementById("coolerBtn").addEventListener("click", function () {
  goToScreen(3)


})

document.getElementById("coolerBack").addEventListener("click", function () {


  goToScreen(2)

})


// Cooler Camera Start

async function startCamera(cooler_type) {
  const video = document.getElementById("cameraFeed");
  const text = document.getElementById("cameraText");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" } // force back camera
      }
    });

    video.srcObject = stream;
    await video.play();
    video.classList.remove("hidden");
    text.classList.add("hidden");
  } catch (error) {
    console.warn("Exact back camera not available, falling back...", error);

    // fallback to any available camera
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = fallbackStream;
      await video.play();
      video.classList.remove("hidden");
      text.classList.add("hidden");
    } catch (err) {
      showAlert("Camera access denied or not available.");
      
    }
  }
}



function takePicture(cooler_type) {
  const loader = document.getElementById("loaderScreen");
  loader.classList.remove("hidden");
  document.getElementById("screen4").classList.add("hidden");

  const video = document.getElementById("cameraFeed");
  const canvas = document.getElementById("snapshotCanvas");
  const context = canvas.getContext("2d");

  // Set canvas size to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw current frame from video
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to base64 image
  const imageData = canvas.toDataURL("image/png");

  // First: Upload image
fetch("/restaurants/api/upload-image/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken
  },
  body: JSON.stringify({ image: imageData })
})
  .then(async response => {
    const data = await response.json();

    if (!response.ok) {
      if (data.message) {
        showAlert(data.message);
      } else if (data.error) {
        showAlert(data.error);
        setTimeout(()=>{
          goToScreen(2)
        },3000)
      }
      throw new Error(data.message || data.error || "Request failed");
    }

    return data;
  })
  .then(data => {
    console.log(data);

    // Save data in localStorage
    localStorage.setItem("cooler_url", data.file_url);
    localStorage.setItem("cooler_compliance", data.bottles);
    localStorage.setItem("cooler_type", cooler_type);

    // showAlert(
    //   `Picture Taken Successfully\nTotal bottles: ${data.bottles[0]}\nTotal PepsiCo bottles: ${data.bottles[1]}`
    // );

    if (data.bottles[1] == 0) {
      showAlert("Invalid Image, please try again!");
      setTimeout(() => {
        goToScreen(3);
      }, 3000);
      return null;
    }

    const raw_data = data.bottles[0] + "/" + data.bottles[1];

    return fetch("/restaurants/api/cooler-create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken
      },
      body: JSON.stringify({
        cooler_type: cooler_type,
        image: data.file_url,
        raw_data: raw_data
      })
    });
  })
  .then(response => {
    if (!response) return null;
    return response.json();
  })
  .then(coolerData => {
    if (!coolerData) return;

    if (coolerData.error) {
      showAlert("Cooler creation failed: " + coolerData.error);
    } else {
      showAlert("Your Photo has been submitted. Compliance will be updated within 24 hours.");
      setTimeout(() => {
        goToScreen(2);
        window.location.reload()
      }, 3000);
    }
  })
  .catch(error => {
    console.error("Upload or Cooler creation failed:", error);
    // Don’t show generic message here if backend already handled it
    // Only fallback error
    if (!error.message.includes("already been submitted")) {
      showAlert("Upload failed. Please try again.");
    }
  })
  .finally(() => {
    loader.classList.add("hidden");
  });

}




// Cooler selection
const coolerSelect = document.getElementById("coolerSelect");

const planograms = {
  "SAX-400": document.getElementById("SAX-400"),
  "SAX-550": document.getElementById("SAX-550"),
  "SAX-650": document.getElementById("SAX-650"),
  "SAX-1000": document.getElementById("SAX-1000"),
};
coolerSelect.addEventListener("change", function () {
  const selected = this.value;

  
  Object.values(planograms).forEach(img => img.classList.add("hidden"));


  if (planograms[selected]) {
    planograms[selected].classList.remove("hidden");
  }

})




document.getElementById("proccedButton").addEventListener("click", function () {

  const selectedCooler = document.getElementById("coolerSelect").value
  try {
    document.getElementById(`${selectedCooler}-GRID`).classList.remove("hidden");
  } catch (error) {
    showAlert("Please Select Cooler");
    return;
  }


  startCamera();

  goToScreen(4);

})

document.getElementById("coolerPicSubmitBtn").addEventListener("click", function () {

  const selectedCooler = document.getElementById(`coolerSelect`).value;
  document.getElementById(`${selectedCooler}-GRID`).classList.add('hidden');
  
  document.getElementById("coolerSelect").selectedIndex = 0;
  
  Object.values(planograms).forEach(img => img.classList.add("hidden"));

  takePicture(selectedCooler);

})

document.getElementById("coolerCameraBack").addEventListener("click", function () {

  const selectedCooler = document.getElementById("coolerSelect").value

  const grid = document.getElementById(`${selectedCooler}-GRID`)
  if(grid){
    grid.classList.add("hidden");
  }

  document.getElementById("coolerSelect").selectedIndex = 0;

  Object.values(planograms).forEach(img => img.classList.add("hidden"));

  goToScreen(3)

})



// POSM

document.getElementById("posmBtn").addEventListener("click", function () {
  goToScreen(5)


})



function takePicture2(posm_type) {
  document.getElementById("loaderScreen").classList.remove("hidden");
  document.getElementById("screen6").classList.add("hidden");

  const video = document.getElementById("cameraFeed2");
  const canvas = document.getElementById("snapshotCanvas2");
  const context = canvas.getContext("2d");

  // Set canvas size to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw current frame from video
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to base64 image
  const imageData = canvas.toDataURL("image/png");

  // --- Step 1: Upload POSM image ---
 fetch("/restaurants/api/upload-posm-image/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken
  },
  body: JSON.stringify({ image: imageData })
})
  .then(async response => {
    const uploadData = await response.json();

    if (!response.ok) {
      showAlert(uploadData.error || "Upload failed");
      setTimeout(()=>{
        goToScreen(2)
      },3000)
      throw new Error(uploadData.error || "POSM upload failed");
    }

    console.log("Image uploaded:", uploadData.file_url);

    const raw_data = uploadData.detected_brands + "/" + uploadData.total_no_of_brand;
    const posmData = {
      posm_type: posm_type,
      image: uploadData.file_url,
      raw_data: raw_data
    };

    // --- Step 2: Create POSM entry ---
    return fetch("/restaurants/api/posm-create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken
      },
      body: JSON.stringify(posmData)
    });
  })
  .then(async response => {
    if (!response) return null;
    const posmResponse = await response.json();

    if (!response.ok) {
      showAlert(posmResponse.error || "POSM creation failed");
      throw new Error(posmResponse.error || "POSM create failed");
    }

    console.log("POSM created successfully:", posmResponse);
    showAlert("Photo submitted, compliance will reflect within 24 hours");
    setTimeout(() => 
    goToScreen(2),
    window.location.reload()
    , 3000);
  })
  .catch(error => {
    console.error("POSM upload/create failed:", error);
  })
  .finally(() => {
    document.getElementById("loaderScreen").classList.add("hidden");
  });

}


async function startCamera2() {
  const video = document.getElementById("cameraFeed2");
  const text = document.getElementById("cameraText2");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: "environment" } // force back camera
      }
    });

    video.srcObject = stream;
    await video.play();
    video.classList.remove("hidden");
    text.classList.add("hidden");
  } catch (error) {
    console.warn("Exact back camera not available, falling back...", error);

    // fallback to any available camera
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = fallbackStream;
      await video.play();
      video.classList.remove("hidden");
      text.classList.add("hidden");
    } catch (err) {
      alert("❌ Camera access denied or not available.");
    }
  }
}
// Posm selection
const posmSelect = document.getElementById("posmSelect");

const posmplanograms = {
    "Posm0": document.getElementById("Posm0"),
    "Posm1": document.getElementById("Posm1"),
    "Posm2": document.getElementById("Posm2"),
    "Posm3": document.getElementById("Posm3"),

};

posmSelect.addEventListener("change", function () {
  
  const selected = this.value;

  Object.values(posmplanograms).forEach(img => img.classList.add("hidden"));

console.log(posmplanograms[selected])
  if (posmplanograms[selected]) {
    posmplanograms[selected].classList.remove("hidden");
  }

})

document.getElementById("proccedButtonPosm").addEventListener("click", function () {

  const selectedPOSM = document.getElementById("posmSelect").value

  try {
    document.getElementById(`${selectedPOSM}`).classList.remove("hidden");
  } catch (error) {
    showAlert("Please Select POSM");
    return;
  }



  console.log(selectedPOSM);

  startCamera2();
  goToScreen(6);
})



document.getElementById("posmCameraBack").addEventListener("click", function () {
  const selectedPOSM = document.getElementById("posmSelect").value
  if (selectedPOSM){
    document.getElementById(`${selectedPOSM}`).classList.add("hidden");
  }


  document.getElementById("posmSelect").selectedIndex = 0;

  Object.values(posmplanograms).forEach(img => img.classList.add("hidden"));

  goToScreen(5)
})



document.getElementById("posmPicSubmitBtn").addEventListener("click", function () {

   const selectedPOSM = document.getElementById('posmSelect').value;
  document.getElementById(`${selectedPOSM}`).classList.add('hidden');

  document.getElementById("posmSelect").selectedIndex = 0;

  Object.values(posmplanograms).forEach(img => img.classList.add("hidden"));

  takePicture2(selectedPOSM);

})
// Download QR
const downloadqrwrapper = document.querySelector(".download-qr-wrapper")
var qrurl = downloadqrwrapper.getAttribute("data-url")
downloadqrwrapper && downloadqrwrapper.addEventListener("click", function () {
  const link = document.createElement("a");
  console.log(qrurl)
  link.href = qrurl;
  link.download = qrurl;
  document.body.appendChild(link); // required for Firefox
  link.click();
  document.body.removeChild(link);
});


// ====================Custom Alert====================


function showAlert(message) {
  const prompt = document.getElementById("customAlert");
  const promptText = document.getElementById("alertMessage");
  promptText.textContent = message;
  prompt.classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("customAlert").classList.add("hidden");

}
// ==================Request Button=====================

// Get the value from localStorage
let value = localStorage.getItem("cooler_compliance"); // e.g., "7/33"

// Default values to prevent errors
let numerator = 0;
let denominator = 1;

// Convert string to numbers
if (value && value.includes("/")) {
  [numerator, denominator] = value.split("/").map(str => Number(str.trim()));
}

// Calculate compliance percentage
let percentage = 0;
if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
  percentage = (numerator / denominator) * 100;
  percentage = Math.round(percentage * 100) / 100;
} else {
  console.error("Invalid compliance value:", value);
}

// Show compliance in the DOM
const complianceresult = document.getElementById("resultcompliance");
complianceresult.innerHTML = `Compliance ${percentage} %`;




document.getElementById("manualReviewBtn").addEventListener("click", function () {
  showAlert("Your Request has been sent Successfully")
})


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

// =================Crate================================
// document.getElementById("crateBtn").addEventListener("click", function () { 
//   const crateNumInput = document.getElementById("crateNumInput").value;

//   fetchWithAuth("/restaurants/api/add-crate-sale/", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-CSRFToken": csrftoken
//     },
//     body: JSON.stringify({
//       crate_quantity: crateNumInput
//     })
//   })
//   .then(res => res.json())
//   .then(data => {
//     console.log("API response:", data);
//     if (data.success) {
//       showAlert(data.message);
//       setTimeout(()=>{
//         window.location.reload()
//       },3000)
//     } else {
//       showAlert(data.message)
//     }
//   })
//   .catch(err => console.error("Error:", err));
// });
// =======================Info Modals=========================


// ========Bottle Info Opener=========

document.getElementById("bottleBtn").addEventListener("click", function (e) { 
Swal.fire({
  icon: "info",
  html: `
  <p class="text-left">
    Your cases purchase target for this month is assigned by <b>PepsiCo</b>. <br>
    To mark your actualized purchases please click the button above named <b>Input cases purchased</b>. <br>
    Once done, it will reflect in your dashboard once approved by our team.
  </p>
  </br></br>
  <p class="text-right" dir="rtl">
    اس مہینے کے لیے آپ کے کریٹس خریدنے کا ہدف <b>PepsiCo</b> کی طرف سے دیا گیا ہے۔ <br>
    اپنی اصل خریداری درج کرنے کے لیے اوپر موجود <b>input cases purchased</b> والے بٹن پر کلک کریں۔ <br>
    جب آپ یہ کر لیں گے تو ہماری ٹیم کی منظوری کے بعد یہ آپ کے ڈیش بورڈ میں نظر آئے گا۔
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
  customClass: {
    htmlContainer: "swal-scroll"
  }
});

 
})

// ========Consumer Info Opener=========
document.getElementById("consumerBtn").addEventListener("click", function (e) { 
   Swal.fire({
  icon: "info",
  html: `
  <p class="text-left">
    Your consumer engagement target for this month is assigned by <b>PepsiCo</b>.</br>
     The achieved number of consumers is reflected real-time as our consumers scan their receipts and successfully submit their details.
  </p>
  </br></br>
  <p class="text-right" dir="rtl">اس مہینے کے لیے آپ کا کنزیومر انگیجمنٹ ہدف <b>PepsiCo</b> کی طرف سے دیا گیا ہے۔ <br>
جیسے ہی صارفین اپنی رسیدیں اسکین کر کے کامیابی سے تفصیلات جمع کرواتے ہیں، آپ کے حاصل کردہ صارفین کی تعداد ریئل ٹائم میں ظاہر ہو جاتی ہے۔

  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
  customClass: {
    htmlContainer: "swal-scroll"
  }
});
})

// ========Compliance Info Opener=========
document.getElementById("complianceBtn").addEventListener("click", function (e) {
  // Fetch both coolers + posm in parallel
  Promise.all([
    fetch("/restaurants/api/get-restaurant-coolers/").then(r => r.json()),
    fetch("/restaurants/api/get-restaurant-posm/").then(r => r.json())
  ])
  .then(([coolerData, posmData]) => {
    let html = "";

    // --- Coolers Section ---
    if (coolerData.coolers && coolerData.coolers.length > 0) {
      html += `
      <div class="text-lg font-bold text-center">Cooler Submitted</div>
      <div class="d-flex flex-wrap justify-content-center mt-2">`;

      coolerData.coolers.forEach(cooler => {
        html += `
        <div style="width:100%; padding: 10px;">
          <div class="card-image" style="height:200px; display:flex; align-items:center; justify-content:center; overflow:hidden; margin-bottom:10px;">
            ${cooler.image ? `<img src="${cooler.image}" alt="Cooler" style="max-width:100%; max-height:100%;">` : `<span>No Image</span>`}
          </div>
          <div class="card-body font-bold">
            ${"Compliance = " + cooler.compliance + "%" || "-"}
          </div>
          <button class="request-manual-btn bg-[#C6A75F] text-sm text-white w-full py-2 rounded-[5px] shadow-md border-2 border-[#C6A75F] hover:bg-white hover:text-[#C6A75F] transition" 
            data-type="cooler"
            data-id="${cooler.id}">
            Request Manual Review
          </button>
        </div>`;
      });

      html += `</div><hr>`;
    } else {
      html += "<p class='text-center'>No cooler records found for this month.</p><hr>";
    }

    // --- POSM Section ---
    if (posmData.coolers && posmData.coolers.length > 0) {
      html += `
      <div class="text-lg font-bold text-center">POSM Submitted</div>
      <div class="d-flex flex-wrap justify-content-center mt-2">`;

      posmData.coolers.forEach(posm => {
        html += `
        <div style="width:100%; padding: 10px;">
          <div class="card-image" style="height:200px; display:flex; align-items:center; justify-content:center; overflow:hidden; margin-bottom:10px;">
            ${posm.image ? `<img src="${posm.image}" alt="POSM" style="max-width:100%; max-height:100%;">` : `<span>No Image</span>`}
          </div>
          <div class="card-body font-bold">
            ${"Compliance = " + posm.compliance + "%" || "-"}
          </div>
          <button class="request-manual-btn bg-[#C6A75F] text-sm text-white w-full py-2 rounded-[5px] shadow-md border-2 border-[#C6A75F] hover:bg-white hover:text-[#C6A75F] transition" 
            data-type="posm"
            data-id="${posm.id}">
            Request Manual Review
          </button>
        </div>`;
      });

      html += `</div>`;
    } else {
      html += "<p class='text-center'>No POSM records found for this month.</p>";
    }

    // --- Show SweetAlert Modal ---
    Swal.fire({
      icon: "info",
      html: `
        <p class="text-left">
          Cooler and POSM compliance is calculated based on detected <b>Pepsi</b> products in your submitted photos benchmarked against the planogram visible on your screen while selecting cooler type.</br>
          If you disagree with the reflected compliance percentage, please request a manual review.</br>
          Branding compliance is calculated based on photos uploaded of assigned branding material to be displayed at the restaurant.
        </p>
        <br>
        ${html}
      `,
      focusConfirm: true,
      confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
      confirmButtonColor: "#C6A75F",
      iconColor: "#C6A75F",
      customClass: { htmlContainer: "swal-scroll" },
      width: "95%"
    });

    // --- Bind Manual Review Buttons ---
    setTimeout(() => {
      document.querySelectorAll(".request-manual-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          const type = this.dataset.type;
          const id = this.dataset.id;
          const url = type === "cooler" 
            ? "/restaurants/api/request-manual-review/"
            : "/restaurants/api/request-posm-manual-review/";

          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({ 
              cooler_id: type === "cooler" ? id : undefined,
              posm_id: type === "posm" ? id : undefined 
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              Swal.fire({
                icon: "success",
                text: data.message,
                confirmButtonColor: "#C6A75F",
                iconColor: "#C6A75F",
              });
              this.disabled = true;
              this.innerText = "Requested";
            } else {
              Swal.fire({
                icon: "error",
                text: data.error || "Something went wrong",
                confirmButtonColor: "#C6A75F",
                iconColor: "#C6A75F",
              });
            }
          })
          .catch(err => {
            console.error(err);
            Swal.fire({
              icon: "error",
              text: "Failed to request manual review",
              confirmButtonColor: "#C6A75F",
              iconColor: "#C6A75F",
            });
          });
        });
      });
    }, 300);
  })
  .catch(error => {
    console.error("Error fetching data:", error);
    Swal.fire({
      icon: "error",
      text: "Could not load cooler/POSM data",
      confirmButtonColor: "#C6A75F",
      iconColor: "#C6A75F",
    });
  });
});



// ========OverallTarget Info Opener=========

document.getElementById("overalltgtBtn").addEventListener("click", function (e) { 
Swal.fire({
  icon: "info",
  html: `
  <p class="text-left">
  Overall Target consists of 50% weightage of sales target, 20% weightage of consumer target and 30% weightage of cooler and branding compliance.
  </p>
  </br></br>
  <p class="text-right" dir="rtl">
مجموعی ہدف 50٪ سیلز ٹارگٹ، 20٪ کنزیومر ٹارگٹ اور 30٪ کولر اور برانڈنگ کمپلائنس پر مشتمل ہوتا ہے۔
</p>

  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
  customClass: {
    htmlContainer: "swal-scroll"
  }
});
})



// ==================Display Vouchers based on eligibility=====================


const VoucherData = {
  "voucher1": {
    Target: "60-70",
    price: "PKR 2000",
    image: "/static/restaurant/assets/images/voucher.png",
    min: 60,
    max: 70
  },
  "voucher2": {
    Target: "71-80",
    price: "PKR 3000",
    image: "/static/restaurant/assets/images/voucher.png",
    min: 71,
    max: 80
  },
  "voucher3": {
    Target: "81-90",
    price: "PKR 4000",
    image: "/static/restaurant/assets/images/voucher.png",
    min: 81,
    max: 90
  },
  "voucher4": {
    Target: "91-100",
    price: "PKR 5000",
    image: "/static/restaurant/assets/images/voucher.png",
    min: 91,
    max: 100
  }
}



const voucherContainer = document.getElementById("voucherContainer");
voucherContainer.innerHTML = "";


Object.entries(VoucherData).forEach(([key, voucher]) => {

  voucherContainer.innerHTML += `
  <div class="h-full mb-4 relative bg-white rounded-[5px] flex items-center justify-center">

        <!-- Overlay -->
        <div class="absolute inset-0 bg-white opacity-${over_all_target >= voucher.min?"0":"50" } rounded-[5px] z-10 pointer-events-none"></div>

        <!-- Product Card -->
        <div class="relative w-full max-w-sm bg-[#0D4D95]/5 rounded-[5px] shadow-md p-4">

          <!-- Badge (keep above overlay) -->
          <div
            class="absolute top-2 left-2 bg-gradient-to-r from-[#a3894d] to-[#d6bb7a] text-white text-sm font-semibold px-3 py-1 rounded-full shadow z-50">
            Target ${voucher.Target}%
          </div>

          <img  src="${voucher.image}" alt="Product" class="mx-auto  object-contain h-44 w-64 mb-4 mt-2">
          <p class="text-lg font-semibold text-black text-center">${voucher.price}</p>
        </div>
      </div>`
});



// ==================Display Product based on eligibility=====================



const Product = {

 

  
  "product1": {
    Target: "60–66.67",
    item: "Thailand",
    image: "/static/restaurant/assets/images/thailand.jpg",
    min: 60,
    max: 66.67
  },
  "product2": {
    Target: "66.67–73.33",
    item: "Electric Scooter",
    image: "/static/restaurant/assets/images/Electricbike.png",
    min: 66.67,
    max: 73.33
  },
  "product3": {
    Target: "73.33–80.00",
    item: "Smart TV",
    image: "/static/restaurant/assets/images/TCLTV.png",
    min: 73.33,
    max: 80.00
  },
  "product4": {
    Target: "80.00– 86.67",
    item: "Mobile",
    image: "/static/restaurant/assets/images/Redmi.png",
    min: 80.00,
    max: 86.67
  },
  "product5": {
    Target: "86.67–93.33",
    item: "Laptop",
    image: "/static/restaurant/assets/images/Laptop.png",
    min: 86.67,
    max: 93.33
  },
  "product6": {
    Target: "93.33–100.00",
    item: "Tablet",
    image: "/static/restaurant/assets/images/Tablet.jpg",
    min: 93.33,
    max: 100
  }
}



const itemsContainer = document.getElementById("itemsContainer");
itemsContainer.innerHTML = "";


Object.entries(Product).forEach(([key, Product]) => {

  itemsContainer.innerHTML += `
  <div class="h-full mb-4 relative bg-white rounded-[5px] flex items-center justify-center">

        <!-- Overlay -->
        <div class="absolute inset-0 bg-white opacity-${over_all_target >= Product.min?"0":"50" } rounded-[5px] z-10 pointer-events-none"></div>

        <!-- Product Card -->
        <div class="relative w-full max-w-sm bg-[#0D4D95]/5 rounded-[5px] shadow-md p-4">

          <!-- Badge (keep above overlay) -->
          <div
            class="absolute top-2 left-2 bg-gradient-to-r from-[#a3894d] to-[#d6bb7a] text-white text-sm font-semibold px-3 py-1 rounded-full shadow z-50">
            Target ${Product.Target}%
          </div>

          <img  src="${Product.image}" alt="Product" class="mx-auto  object-contain h-44 w-64 mb-4 mt-2">
          <p class="text-lg font-semibold text-black text-center">${Product.item}</p>
        </div>
      </div>`
});


const logoutbtn = document.getElementById("logoutbtn")

logoutbtn && logoutbtn.addEventListener("click",()=>{

 localStorage.removeItem("access");
  localStorage.removeItem("refresh");


  fetch("/restaurants/api/logout/", {
    method: "POST",
    headers: {
      "X-CSRFToken": csrftoken, 
      "Content-Type": "application/json"
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/restaurants/login/";
      }
    });  


})