const TRANSPORT_API_URL = "http://localhost:8080/transport";

// ✅ Fetch all transport records
function fetchTransport() {
    fetch(TRANSPORT_API_URL)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("transportTableBody");
            tableBody.innerHTML = "";
            data.forEach(transport => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${transport.id}</td>
                        <td>${transport.vehicleType}</td>
                        <td>${transport.capacity}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteTransport(${transport.id})">Delete</button>
                        </td>
                    </tr>`;
            });
        })
        .catch(error => console.error("Error fetching transport:", error));
}

// ✅ Add a new transport record
document.getElementById("transportForm").addEventListener("submit", function (e) {
    e.preventDefault();
    let vehicleType = document.getElementById("vehicleType").value;
    let capacity = document.getElementById("capacity").value;

    fetch(TRANSPORT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleType, capacity })
    }).then(() => {
        fetchTransport();  
        document.getElementById("transportForm").reset();
    });
});

// ✅ Delete a transport record
function deleteTransport(id) {
    fetch(`${TRANSPORT_API_URL}/${id}`, { method: "DELETE" }).then(() => fetchTransport());
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchTransport);
