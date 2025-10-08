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


// Create Lucky Draw
const createLuckyDrawBtn = document.getElementById("createLuckyDraw");

const luckyDrawName = document.getElementById("luckydrawName");
const luckyDrawParticipant = document.getElementById("luckydrawparticipant");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const type= document.getElementById("type")

createLuckyDrawBtn && createLuckyDrawBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const formData = {
    name: luckyDrawName.value.trim(),
    participants: luckyDrawParticipant.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
    type :type.value
  };

  console.log(formData); // 👈 now you have all values
});

//  Edit Lucky Draw

const editLuckyDrawBtn = document.getElementById("editLuckyDrawBtn");

const editluckyDrawName = document.getElementById("luckydrawName");
const editluckyDrawParticipant = document.getElementById("luckydrawparticipant");
const editstartDate = document.getElementById("startDate");
const editendDate = document.getElementById("endDate");
const edittype= document.getElementById("type")

editLuckyDrawBtn && editLuckyDrawBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const formData = {
    name: editluckyDrawName.value.trim(),
    participants: editluckyDrawParticipant.value.trim(),
    startDate: editstartDate.value,
    endDate: editendDate.value,
        type :type.value

  };

  console.log(formData); // 👈 now you have all values
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
