function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const csrftoken = getCookie("csrftoken");
// ======================Confetti Effect======================

"use strict";

// Utility functions grouped into a single object
const Utils = {
  // Parse pixel values to numeric values
  parsePx: (value) => parseFloat(value.replace(/px/, "")),

  // Generate a random number between two values, optionally with a fixed precision
  getRandomInRange: (min, max, precision = 0) => {
    const multiplier = Math.pow(10, precision);
    const randomValue = Math.random() * (max - min) + min;
    return Math.floor(randomValue * multiplier) / multiplier;
  },

  // Pick a random item from an array
  getRandomItem: (array) => array[Math.floor(Math.random() * array.length)],

  // Scaling factor based on screen width
  getScaleFactor: () => Math.log(window.innerWidth) / Math.log(1920),

  // Debounce function to limit event firing frequency
  debounce: (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  },
};

// Precomputed constants
const DEG_TO_RAD = Math.PI / 180;

// Centralized configuration for default values
const defaultConfettiConfig = {
  confettiesNumber: 100,
  confettiRadius: 6,
  confettiColors: [
    "#C6A75F", "#C6A75F", "#C6A75F", "#C6A75F", "#C6A75F", "#C6A75F", "#C6A75F", "#C6A75F"
  ],
  emojies: [],
  svgIcon: null, // Example SVG link
};

// Confetti class representing individual confetti pieces
class Confetti {
  constructor({ initialPosition, direction, radius, colors, emojis, svgIcon }) {
    const speedFactor = Utils.getRandomInRange(0.9, 1.7, 3) * Utils.getScaleFactor();
    this.speed = { x: speedFactor, y: speedFactor };
    this.finalSpeedX = Utils.getRandomInRange(0.2, 0.6, 3);
    this.rotationSpeed = emojis.length || svgIcon ? 0.01 : Utils.getRandomInRange(0.03, 0.07, 3) * Utils.getScaleFactor();
    this.dragCoefficient = Utils.getRandomInRange(0.0005, 0.0009, 6);
    this.radius = { x: radius, y: radius };
    this.initialRadius = radius;
    this.rotationAngle = direction === "left" ? Utils.getRandomInRange(0, 0.2, 3) : Utils.getRandomInRange(-0.2, 0, 3);
    this.emojiRotationAngle = Utils.getRandomInRange(0, 2 * Math.PI);
    this.radiusYDirection = "down";

    const angle = direction === "left" ? Utils.getRandomInRange(82, 15) * DEG_TO_RAD : Utils.getRandomInRange(-15, -82) * DEG_TO_RAD;
    this.absCos = Math.abs(Math.cos(angle));
    this.absSin = Math.abs(Math.sin(angle));

    const offset = Utils.getRandomInRange(-150, 0);
    const position = {
      x: initialPosition.x + (direction === "left" ? -offset : offset) * this.absCos,
      y: initialPosition.y - offset * this.absSin
    };

    this.position = { ...position };
    this.initialPosition = { ...position };
    this.color = emojis.length || svgIcon ? null : Utils.getRandomItem(colors);
    this.emoji = emojis.length ? Utils.getRandomItem(emojis) : null;
    this.svgIcon = null;

    // Preload SVG if provided
    if (svgIcon) {
      this.svgImage = new Image();
      this.svgImage.src = svgIcon;
      this.svgImage.onload = () => {
        this.svgIcon = this.svgImage; // Mark as ready once loaded
      };
    }

    this.createdAt = Date.now();
    this.direction = direction;
  }

  draw(context) {
    const { x, y } = this.position;
    const { x: radiusX, y: radiusY } = this.radius;
    const scale = window.devicePixelRatio;

    if (this.svgIcon) {
      context.save();
      context.translate(scale * x, scale * y);
      context.rotate(this.emojiRotationAngle);
      context.drawImage(this.svgIcon, -radiusX, -radiusY, radiusX * 2, radiusY * 2);
      context.restore();
    } else if (this.color) {
      context.fillStyle = this.color;
      context.beginPath();
      context.ellipse(x * scale, y * scale, radiusX * scale, radiusY * scale, this.rotationAngle, 0, 2 * Math.PI);
      context.fill();
    } else if (this.emoji) {
      context.font = `${radiusX * scale}px serif`;
      context.save();
      context.translate(scale * x, scale * y);
      context.rotate(this.emojiRotationAngle);
      context.textAlign = "center";
      context.fillText(this.emoji, 0, radiusY / 2); // Adjust vertical alignment
      context.restore();
    }
  }

  updatePosition(deltaTime, currentTime) {
    const elapsed = currentTime - this.createdAt;

    if (this.speed.x > this.finalSpeedX) {
      this.speed.x -= this.dragCoefficient * deltaTime;
    }

    this.position.x += this.speed.x * (this.direction === "left" ? -this.absCos : this.absCos) * deltaTime;
    this.position.y = this.initialPosition.y - this.speed.y * this.absSin * elapsed + 0.00125 * Math.pow(elapsed, 2) / 2;

    if (!this.emoji && !this.svgIcon) {
      this.rotationSpeed -= 1e-5 * deltaTime;
      this.rotationSpeed = Math.max(this.rotationSpeed, 0);

      if (this.radiusYDirection === "down") {
        this.radius.y -= deltaTime * this.rotationSpeed;
        if (this.radius.y <= 0) {
          this.radius.y = 0;
          this.radiusYDirection = "up";
        }
      } else {
        this.radius.y += deltaTime * this.rotationSpeed;
        if (this.radius.y >= this.initialRadius) {
          this.radius.y = this.initialRadius;
          this.radiusYDirection = "down";
        }
      }
    }
  }

  isVisible(canvasHeight) {
    return this.position.y < canvasHeight + 100;
  }
}

class ConfettiManager {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; pointer-events: none;";
    document.body.appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
    this.confetti = [];
    this.lastUpdated = Date.now();
    window.addEventListener("resize", Utils.debounce(() => this.resizeCanvas(), 200));
    this.resizeCanvas();
    requestAnimationFrame(() => this.loop());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
  }

  addConfetti(config = {}) {
    const { confettiesNumber, confettiRadius, confettiColors, emojies, svgIcon } = {
      ...defaultConfettiConfig,
      ...config,
    };

    const baseY = (5 * window.innerHeight) / 7;
    for (let i = 0; i < confettiesNumber / 2; i++) {
      this.confetti.push(new Confetti({
        initialPosition: { x: 0, y: baseY },
        direction: "right",
        radius: confettiRadius,
        colors: confettiColors,
        emojis: emojies,
        svgIcon,
      }));
      this.confetti.push(new Confetti({
        initialPosition: { x: window.innerWidth, y: baseY },
        direction: "left",
        radius: confettiRadius,
        colors: confettiColors,
        emojis: emojies,
        svgIcon,
      }));
    }
  }

  resetAndStart(config = {}) {
    // Clear existing confetti
    this.confetti = [];
    // Add new confetti
    this.addConfetti(config);
  }

  loop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdated;
    this.lastUpdated = currentTime;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.confetti = this.confetti.filter((item) => {
      item.updatePosition(deltaTime, currentTime);
      item.draw(this.context);
      return item.isVisible(this.canvas.height);
    });

    requestAnimationFrame(() => this.loop());
  }
}



const triggerButton = document.getElementById("show-again");
if (triggerButton) {
  triggerButton.addEventListener("click", () => manager.addConfetti());
}

const resetInput = document.getElementById("reset");
if (resetInput) {
  resetInput.addEventListener("input", () => manager.resetAndStart());
}

// =======================PROMPTS=======================
function showPrompt(message) {
  const prompt = document.getElementById("customPrompt");
  const promptText = document.getElementById("promptMessage");
  promptText.textContent = message;
  prompt.classList.remove("hidden");
}

function closePrompt(screenNumber) {
  document.getElementById("customPrompt").classList.add("hidden");
  goToScreen(screenNumber);
}

// =======================Alerts=======================

function showAlert(message) {
  const prompt = document.getElementById("customAlert");
  const promptText = document.getElementById("alertMessage");
  promptText.textContent = message;
  prompt.classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("customAlert").classList.add("hidden");
  
}

var restaurant;
var restaurant_id;

document.addEventListener("DOMContentLoaded", function () { 
  const url = new URL(window.location.href); 
  const params = new URLSearchParams(url.search);
  restaurant = params.get("restaurant");
  restaurant_id = params.get("unique");
    if (!restaurant_id) {
    Swal.fire({
  icon: "info",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
  Restaurant not found
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
    document.getElementById("startScanningBtn").style.display = "none";
    document.getElementById("takePictureBtn").style.display = "none";
    document.getElementById("submitButton").style.display = "none";
  }
});


function goToScreen(screenNumber) {
  document.querySelectorAll("body > div").forEach(div => div.classList.add("hidden"));
  document.getElementById(`screen${screenNumber}`).classList.remove("hidden");
  console.log(`Navigated to screen ${screenNumber}`);

}


// Submit Button to Enter Credentials
const manager = new ConfettiManager();
const confettiSound=new Audio("/static/consumer/sound/confetti.mp3");
document.getElementById("submitButton").addEventListener("click", function () { 
  console.log("Submit Button Clicked");
  const nameInput = document.getElementById("nameInput");
  const numberInput = document.getElementById("numberInput");
  const checkbox1 = document.getElementById("checkbox1")
  const checkbox2 = document.getElementById("checkbox2")
  const nameRegex = /^[A-Za-z]+$/;

  
  if (nameInput.value.trim() == "") {
     Swal.fire({
  icon: "info",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Please Enter Name
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
  }
  else if (!nameRegex.test(nameInput.value.trim())) {
   Swal.fire({
  icon: "info",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Name should contain only alphabets  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
}
  else if (numberInput.value.trim() == "") {
     Swal.fire({
  icon: "info",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Please Enter Phone Number  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
  }
  else if (checkbox2.checked == false) {
     Swal.fire({
  icon: "info",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Please agree to the Terms & Conditions and Privacy Policy to proceed.  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
  }
  else { 

    const reciept_url = localStorage.getItem("reciept_url") || null;
    fetch("/consumers/api/consumer/create/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken,
  },
  body: JSON.stringify({
    consumer_name: nameInput.value,
    consumer_phone_number: numberInput.value,
    restaurant_id: restaurant_id,
    reciept_url: reciept_url,
    checkbox1: checkbox1.checked,
    checkbox2: checkbox2.checked,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.error) {
       Swal.fire({
  icon: "error",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
${data.error}
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
      return;
    }

  
    goToScreen(3);

    confettiSound.currentTime = 0;
    confettiSound.playbackRate = 1.8;

    localStorage.removeItem("reciept_url");

    setTimeout(() => {
      manager.resetAndStart();
      confettiSound.play().catch((error) => {
        console.warn("Audio playback failed:", error);
      });
    }, 400);

    setTimeout(() => {
      goToScreen(0);
    }, 3000);
  })
  .catch((err) => {
    console.error("❌ API Error:", err);
     Swal.fire({
  icon: "error",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Network or server error. Please try again.  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
  });

  }
  
  })


  function startScanning() {
    goToScreen(1); // Show camera screen
    startCamera(); // Start camera feed
  }
  
  async function startCamera() {
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
         Swal.fire({
  icon: "info",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Camera access denied or not available.
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
      }
    }
  }
  
  
function takePicture() {
  document.getElementById("loaderScreen").classList.remove("hidden");
  document.getElementById("screen1").classList.add("hidden");

  const video = document.getElementById("cameraFeed");
  const canvas = document.getElementById("recieptImage"); // your hidden canvas
  const context = canvas.getContext("2d");

  // Set canvas size to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw current frame from video
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to base64 image
  const imageData = canvas.toDataURL("image/png");

  // Show captured image
  // const imgElement = document.getElementById("recieptcapturedImage");
  // imgElement.src = imageData;
  // imgElement.classList.remove("hidden");

fetch("/consumers/upload-image/", {
  method: "POST",
  headers: {
    "X-CSRFToken": csrftoken,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ image: imageData }),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.url) {
      console.log("Uploaded to S3:", data.url);
      localStorage.setItem("reciept_url", data.url);
           Swal.fire({
  icon: "success",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Receipt submitted successfully!
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
}).then(() => {
        document.getElementById("screen1").classList.add("hidden");
        document.getElementById("screen2").classList.remove("hidden");
      });
    } else {
       Swal.fire({
  icon: "error",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Invalid image, please try again with a photo of valid receipt
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
}).then(() => {
        window.location.reload();
      });
    }
  })
  .catch((err) => {
    console.error("Error uploading:", err);
     Swal.fire({
  icon: "error",
  html: `
  <p class="text-3xl font-extrabold mb-4 text-black" style="font-family: 'MyFont', sans-serif;">
Upload error
  </p>
  `,
  focusConfirm: false,
  confirmButtonText: `<i class="fa fa-thumbs-up"></i> OK`,
  confirmButtonColor: "#C6A75F",
  iconColor: "#C6A75F",
});
    goToScreen(0);
  })
  .finally(() => {
    // hide loader only when request is complete (success OR error)
    document.getElementById("loaderScreen").classList.add("hidden");
  });

}

//==============================Info Modal========================
document.querySelectorAll(".infoBtn").forEach(btn => {
  btn.addEventListener("click", function () {
    document.getElementById("customInfoModal").classList.remove("hidden");
  });
});



