document.addEventListener("DOMContentLoaded", () => {
    const userForm = document.getElementById("userForm");
    const userList = document.getElementById("userList");
    const loader = document.getElementById("loader");
    const formMessage = document.getElementById("formMessage");

    const API_URL = "/api/users";

    // Fetch and display active profiles
    async function fetchUsers() {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            
            loader.style.display = "none";
            userList.innerHTML = "";

            if (data.length === 0) {
                userList.innerHTML = "<li class='loader'>No registered users found inside Atlas.</li>";
                return;
            }

            data.forEach(user => {
                const li = document.createElement("li");
                li.className = "user-item";
                li.innerHTML = `
                    <span class="user-name">${user.name}</span>
                    <span class="user-email">${user.email}</span>
                `;
                userList.appendChild(li);
            });
        } catch (error) {
            loader.textContent = "Error communicating with cloud cluster.";
            console.error("Fetch error:", error);
        }
    }

    // Submit new profile registration
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        formMessage.className = "message";
        formMessage.textContent = "";

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email })
            });

            if (res.ok) {
                formMessage.textContent = "User registered successfully! 🎉";
                formMessage.className = "message success";
                userForm.reset();
                fetchUsers();
            } else {
                const errData = await res.json();
                formMessage.textContent = `Error: ${errData.message || 'Submission rejected'}`;
                formMessage.className = "message error";
            }
        } catch (error) {
            formMessage.textContent = "Network timeout error.";
            formMessage.className = "message error";
        }
    });

    fetchUsers();
});
