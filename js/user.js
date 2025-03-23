const USER_API_URL = "http://localhost:8080/users";

// ✅ Fetch all users
function fetchUsers() {
    fetch(USER_API_URL)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById("userTableBody");
            tableBody.innerHTML = "";
            data.forEach(user => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                        </td>
                    </tr>`;
            });
        })
        .catch(error => console.error("Error fetching users:", error));
}

// ✅ Add a new user
document.getElementById("userForm").addEventListener("submit", function (e) {
    e.preventDefault();
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;

    fetch(USER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
    }).then(() => {
        fetchUsers();  
        document.getElementById("userForm").reset();
    });
});

// ✅ Delete a user
function deleteUser(id) {
    fetch(`${USER_API_URL}/${id}`, { method: "DELETE" }).then(() => fetchUsers());
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchUsers);
