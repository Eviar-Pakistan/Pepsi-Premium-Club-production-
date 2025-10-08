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





function goToScreen(screenNumber) {
  document.querySelectorAll("body > div").forEach(div => div.classList.add("hidden"));
  document.getElementById(`screen${screenNumber}`).classList.remove("hidden");
  
  
}

function showAlert(message) {
  const prompt = document.getElementById("customAlert");
  const promptText = document.getElementById("alertMessage");
  promptText.textContent = message;
  prompt.classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("customAlert").classList.add("hidden");

}

// Login Functionality
document.getElementById("loginButton").addEventListener("click", function () {
  const numberInput = document.getElementById("numberInput");
  const contactNo = numberInput.value.trim();

  if (contactNo === "") {
    showAlert("Please Enter Number");
    return;
  } else if (contactNo.length !== 11) {
    showAlert("Please Enter Valid Number");
    return;
  }

  // Show loader
  document.getElementById("loaderScreen").classList.remove("hidden");
  document.getElementById("screen0").classList.add("hidden");

  fetch("/restaurants/api/signin_send_otp/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken 
    },
    body: JSON.stringify({ contactNo: contactNo })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("loaderScreen").classList.add("hidden");

      if (data.success) {
        showAlert("OTP sent successfully!");
        setTimeout(()=>{
          goToScreen(1);
        },3000)
      } else {
        showAlert(data.message || "Failed to send OTP.");
        document.getElementById("screen0").classList.remove("hidden");
      }
    })
    .catch(err => {
      console.error("API Error:", err);
      showAlert("Network error. Please try again.");
      document.getElementById("loaderScreen").classList.add("hidden");
      document.getElementById("screen0").classList.remove("hidden");
    });
});




// ====================Screen2====================

const otpInputs = document.querySelectorAll(".otp-input")

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value;

      if (value.length === 1) {
        let nextIndex = index + 1;
        while (
          nextIndex < otpInputs.length &&
          otpInputs[nextIndex].readOnly
        ) {
          nextIndex++; 
        }
        if (nextIndex < otpInputs.length) {
          otpInputs[nextIndex].focus();
        }
      } else if (value.length > 1) {
        input.value = value.charAt(0);
        let nextIndex = index + 1;
        while (
          nextIndex < otpInputs.length &&
          otpInputs[nextIndex].readOnly
        ) {
          nextIndex++; // Skip readonly inputs
        }
        if (nextIndex < otpInputs.length) {
          otpInputs[nextIndex].focus();
        }
      }
    });

    // Add an event listener for the "keydown" event
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value.length === 0) {
        // Move focus to the previous input
        let prevIndex = index - 1;
        while (prevIndex >= 0 && otpInputs[prevIndex].readOnly) {
          prevIndex--; // Skip readonly inputs
        }
        if (prevIndex >= 0) {
          otpInputs[prevIndex].focus();
        }
      } else if (e.key === "ArrowLeft") {
        // Navigate to the previous input on left arrow
        let prevIndex = index - 1;
        while (prevIndex >= 0 && otpInputs[prevIndex].readOnly) {
          prevIndex--; // Skip readonly inputs
        }
        if (prevIndex >= 0) {
          otpInputs[prevIndex].focus();
        }
      } else if (e.key === "ArrowRight") {
        // Navigate to the next input on right arrow
        let nextIndex = index + 1;
        while (
          nextIndex < otpInputs.length &&
          otpInputs[nextIndex].readOnly
        ) {
          nextIndex++; // Skip readonly inputs
        }
        if (nextIndex < otpInputs.length) {
          otpInputs[nextIndex].focus();
        }
      }
    });

    // Ensure the input field only accepts alphanumeric characters
    input.addEventListener("keypress", (e) => {
      const charCode = e.charCode || e.keyCode;
      if (!/[a-zA-Z0-9]/.test(String.fromCharCode(charCode))) {
        e.preventDefault();
      }
    });

    // Prevent pasting more than one character into the input field
    input.addEventListener("paste", (e) => {
      const pasteData = (e.clipboardData || window.clipboardData).getData(
        "text"
      );
      if (pasteData.length > 1) {
        e.preventDefault();
        input.value = pasteData.charAt(0);
        let nextIndex = index + 1;
        while (
          nextIndex < otpInputs.length &&
          otpInputs[nextIndex].readOnly
        ) {
          nextIndex++; 
        }
        if (nextIndex < otpInputs.length) {
          otpInputs[nextIndex].focus();
        }
      }
    });
  });

// Verfy Button
document.getElementById("verifyOtpButton").addEventListener("click", function () {
  const otpInputs = document.querySelectorAll(".otp-input");
  let otp = "";

  for (let input of otpInputs) {
    const val = input.value.trim();
    if (val === "") {
      showAlert("Please enter all 6 digits of the OTP.");
      return;
    }
    otp += val;
  }

  const numberInput = document.getElementById("numberInput");
  const contactNo = numberInput.value.trim();

  document.getElementById("loaderScreen").classList.remove("hidden");
  document.getElementById("screen1").classList.add("hidden");

  fetch("/restaurants/api/signin_verify_otp/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken
  },
  body: JSON.stringify({ contactNo: contactNo, otpInput: otp })
})
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      showAlert(data.message || "OTP verification failed.");
      setTimeout(()=>{
          goToScreen(1);
        },3000)
      return; // ⬅ stop chain here
    }

    // If OTP success, call signin API
    return fetch("/restaurants/api/signin/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken
      },
      body: JSON.stringify({ contactNo: contactNo, otpInput: otp })
    });
  })
  .then(res => {
    if (!res) return; // ⬅ prevents res.json() when OTP failed
    return res.json();
  })
  .then(data => {
    if (!data) return; // ⬅ prevent errors if previous step stopped

    document.getElementById("loaderScreen").classList.add("hidden");

    if (data.success) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      showAlert(data.message || "Login successful!");
      window.location.href = data.redirect;
    } else {
      showAlert(data.message || "Login failed.");
      goToScreen(1); // back to OTP input
    }
  })
  .catch(err => {
    console.error("API Error:", err);
    showAlert(err.message || "Network error. Please try again.");
    document.getElementById("loaderScreen").classList.add("hidden");
    goToScreen(1);
  });

});
