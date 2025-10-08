  // ===============Statistics Page ==================//
  const venue = document.getElementById("venue");
  new Chart(venue, {
    type: "line",
    data: {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      datasets: [
        {
          label: "Funland Arcade",
          data: [150, 175, 160, 200, 195, 225, 165, 170, 148, 135, 180, 162],
          backgroundColor: "#FEF0CD ",
          borderColor: "#F94144",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Galaxy Arcade",
          data: [165, 170, 148, 135, 180, 162, 150, 175, 160, 200, 195, 225],
          backgroundColor: "#FEF0CD ",
          borderColor: "#F3722C",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      animation: true,
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
          },
        },
        y: {
          display: true,
          grid: {
            display: true,
          },
        },
      },
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          color: "black",
          font: {
            weight: "bold",
          },
          formatter: function (value, context) {
            return value;
          },
        },
        legend: {
          display: true,
          position: "bottom",
          align: "start",
          labels: {
            boxWidth: 6,
            boxHeight: 6,
            color: "#000",
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 14,
              weight: 400,
            },
          },
        },
      },
    },
  });

  const statistics = document.getElementById("statistics");
  new Chart(statistics, {
    type: "bar",
    data: {
      labels: [1, 2, 3, 4, 5, 6],
      datasets: [
        {
          label: "",
          data: [150, 175, 160, 200, 195, 225],
          backgroundColor: [
            "#F94144",
            "#F3722C",
            "#F8961E",
            "#F9C74F",
            "#90BE6D",
            "#2D9CDB",
          ],
          borderColor: [
            "#F94144",
            "#F3722C",
            "#F8961E",
            "#F9C74F",
            "#90BE6D",
            "#2D9CDB",
          ],
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      animation: true,
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
          },
        },
        y: {
          display: true,
          grid: {
            display: true,
          },
        },
      },
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          color: "black",
          font: {
            weight: "bold",
          },
          formatter: function (value, context) {
            return value;
          },
        },
        legend: {
          display: false,
        },
      },
    },
  });

  const distribution = document.getElementById("distribution");
  new Chart(distribution, {
    plugins: [ChartDataLabels],
    type: "pie",
    data: {
      labels: ["Arcade", "Fighting", "Shooting", "Racing", "Puzzle"],
      datasets: [
        {
          label: "",
          data: [10, 15, 30, 20, 25],
          backgroundColor: [
            "#00FF94",
            "#A0A0A0",
            "#FF6B00",
            "#9F69E8",
            "#FFBE4EF7",
          ],
          borderColor: [
            "#00FF94",
            "#A0A0A0",
            "#FF6B00",
            "#9F69E8",
            "#FFBE4EF7",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      animation: true,
      aspectRatio: 1.2,
      plugins: {
        legend: {
          position: "top",
          labels: {
            boxWidth: 6,
            boxHeight: 6,
            color: "#000",
            font: {
              size: 14,
              weight: 400,
            },
          },
        },
        datalabels: {
          formatter: function (value, ctx) {
            var sum = 0;
            var dataArr = ctx.chart.data.datasets[0].data;
            dataArr.map(function (data) {
              sum += data;
            });
            var percentage = ((value * 100) / sum).toFixed(0) + "%";
            return percentage;
          },
          color: "#fff",
          font: {
            size: 12,
            weight: 600,
          },
          anchor: "end",
          align: "end",
          offset: -35,
        },
      },
    },
  });

  const revenuebygame = document.getElementById("revenuebygame");
  new Chart(revenuebygame, {
    type: "line",
    data: {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      datasets: [
        {
          label: "Pac-Man",
          data: [150, 175, 160, 200, 195, 225, 165, 170, 148, 135, 180, 162],
          backgroundColor: "#FEF0CD ",
          borderColor: "#F94144",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Street Fighter II",
          data: [165, 170, 148, 135, 180, 162, 150, 175, 160, 200, 195, 225],
          backgroundColor: "#FEF0CD ",
          borderColor: "#F3722C",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      animation: true,
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
          },
        },
        y: {
          display: true,
          grid: {
            display: true,
          },
        },
      },
      plugins: {
        datalabels: {
          anchor: "end",
          align: "top",
          color: "black",
          font: {
            weight: "bold",
          },
          formatter: function (value, context) {
            return value;
          },
        },
        legend: {
          display: true,
          position: "bottom",
          align: "start",
          labels: {
            boxWidth: 6,
            boxHeight: 6,
            color: "#000",
            usePointStyle: true,
            pointStyle: "circle",
            font: {
              size: 14,
              weight: 400,
            },
          },
        },
      },
    },
  });
  // ===============Statistics Page ==================//