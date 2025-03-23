const ROUTE_API_URL = "http://localhost:8080/routes";

// ✅ Fetch all routes
function fetchRoutes() {
    fetch(ROUTE_API_URL)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("routeTableBody");
            tableBody.innerHTML = "";
            data.forEach(route => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${route.id}</td>
                        <td>${route.source}</td>
                        <td>${route.destination}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteRoute(${route.id})">Delete</button>
                        </td>
                    </tr>`;
            });
        })
        .catch(error => console.error("Error fetching routes:", error));
}

// ✅ Add a new route
document.getElementById("routeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    let source = document.getElementById("source").value;
    let destination = document.getElementById("destination").value;

    fetch(ROUTE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination })
    }).then(() => {
        fetchRoutes();  
        document.getElementById("routeForm").reset();
    });
});

// ✅ Delete a route
function deleteRoute(id) {
    fetch(`${ROUTE_API_URL}/${id}`, { method: "DELETE" }).then(() => fetchRoutes());
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchRoutes);
