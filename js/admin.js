const ADMIN_API_URL = "http://localhost:8080/admins";

// ✅ Fetch all admins
function fetchAdmins() {
    fetch(ADMIN_API_URL)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("adminTableBody");
            tableBody.innerHTML = "";
            data.forEach(admin => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${admin.id}</td>
                        <td>${admin.username}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteAdmin(${admin.id})">Delete</button>
                        </td>
                    </tr>`;
            });
        })
        .catch(error => console.error("Error fetching admins:", error));
}

// ✅ Add a new admin
document.getElementById("adminForm").addEventListener("submit", function (e) {
    e.preventDefault();
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    fetch(ADMIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    }).then(() => {
        fetchAdmins();  
        document.getElementById("adminForm").reset();
    });
});

// ✅ Delete an admin
function deleteAdmin(id) {
    fetch(`${ADMIN_API_URL}/${id}`, { method: "DELETE" }).then(() => fetchAdmins());
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchAdmins);
