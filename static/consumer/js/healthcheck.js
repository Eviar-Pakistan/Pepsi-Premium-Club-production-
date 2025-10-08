 
    const tableBody = document.querySelector('#data_table tbody');
    document.addEventListener('DOMContentLoaded', function () {
      fetch('http://localhost:8000/consumers/api/v1/request-logs/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => response.json())
        .then(data => {
          tableBody.innerHTML = '';
          data.forEach(entry => {
            const row = tableBody.insertRow();
            row.insertCell(0).innerText = formatDate(entry.timestamp);
            row.insertCell(1).innerText = entry.path;
            row.insertCell(2).innerText = entry.method;
            row.insertCell(3).innerText = entry.status_code;
            row.insertCell(4).innerText = entry.response_time;
          });

          buildCharts(data);
        })
        .catch(error => {
          console.error('Error loading logs:', error);
          tableBody.innerHTML = '<tr><td colspan="6">Failed to load data</td></tr>';
        });
    });

    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function buildCharts(data) {
      const statusCodeData = aggregateStatusCodes(data);
      const responseTimeData = calculateAverageResponseTime(data);

      const ctx1 = document.getElementById('statusCodeChart').getContext('2d');
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: Object.keys(statusCodeData),
          datasets: Object.keys(statusCodeData[Object.keys(statusCodeData)[0]]).map(code => ({
            label: `Status ${code}`,
            data: Object.keys(statusCodeData).map(date => statusCodeData[date][code] || 0),
            backgroundColor: getStatusColor(code),
          }))
        }
      });

      const ctx2 = document.getElementById('responseTimeChart').getContext('2d');
      new Chart(ctx2, {
        type: 'line',
        data: {
          labels: Object.keys(responseTimeData),
          datasets: [{
            label: 'Average Response Time (s)',
            data: Object.values(responseTimeData),
            borderColor: 'rgba(255,99,132,1)',
            backgroundColor: 'rgba(255,99,132,0.2)',
            fill: false,
          }]
        }
      });
    }

    function aggregateStatusCodes(data) {
      const grouped = {};
      data.forEach(entry => {
        const date = formatDate(entry.timestamp).split(' ')[0];
        if (!grouped[date]) grouped[date] = {};
        grouped[date][entry.status_code] = (grouped[date][entry.status_code] || 0) + 1;
      });
      return grouped;
    }

    function calculateAverageResponseTime(data) {
      const grouped = {};
      data.forEach(entry => {
        const date = formatDate(entry.timestamp).split(' ')[0];
        if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
        grouped[date].total += entry.response_time;
        grouped[date].count++;
      });

      const avg = {};
      for (const date in grouped) {
        avg[date] = (grouped[date].total / grouped[date].count).toFixed(3);
      }
      return avg;
    }

    function getStatusColor(code) {
      const first = String(code)[0];
      if (first === '2') return 'rgba(75,192,192,0.6)';
      if (first === '4') return 'rgba(255,206,86,0.6)';
      if (first === '5') return 'rgba(255,99,132,0.6)';
      return 'rgba(201,203,207,0.6)';
    }