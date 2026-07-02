// Application Operations Orchestration Script
document.addEventListener("DOMContentLoaded", () => {
  // Component Event Declarations
  const checkHealthBtn = document.getElementById("checkHealthBtn");
  const healthResponse = document.getElementById("healthResponse");
  const healthBadge = document.getElementById("healthBadge");

  const createUserForm = document.getElementById("createUserForm");
  const usernameInput = document.getElementById("usernameInput");
  const emailInput = document.getElementById("emailInput");
  const formFeedback = document.getElementById("formFeedback");

  const refreshUsersBtn = document.getElementById("refreshUsersBtn");
  const usersTableBody = document.getElementById("usersTableBody");

  // 📡 Operations Logic: Run API Engine Diagnostics
  checkHealthBtn.addEventListener("click", async () => {
    healthResponse.textContent = "Querying live core status...";
    try {
      const response = await fetch("/api/health");
      const data = await response.json();

      healthResponse.textContent = JSON.stringify(data, null, 2);

      if (response.ok && data.status === "ok") {
        healthBadge.textContent = `Live: Mode [${data.environment}]`;
        healthBadge.className = "badge healthy";
      } else {
        healthBadge.textContent = "Service Degraded";
        healthBadge.className = "badge unhealthy";
      }
    } catch (error) {
      healthResponse.textContent = `Connection Failure: ${error.message}`;
      healthBadge.textContent = "Offline Check Alert";
      healthBadge.className = "badge unhealthy";
    }
  });

  // 🔄 Operations Logic: Fetch and Display Users from MongoDB
  const fetchUserDirectory = async () => {
    usersTableBody.innerHTML = `<tr><td colspan="3" class="table-empty">Querying database engine cluster...</td></tr>`;
    try {
      const response = await fetch("/api/users");
      const users = await response.json();

      if (!Array.isArray(users) || users.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="3" class="table-empty">No active user collections found. Create one!</td></tr>`;
        return;
      }

      usersTableBody.innerHTML = users
        .map(
          (user) => `
                <tr>
                    <td><strong>${escapeHtml(user.username)}</strong></td>
                    <td>${escapeHtml(user.email || "N/A")}</td>
                    <td><span style="color:#10b981; font-weight:600;">● Active</span></td>
                </tr>
            `,
        )
        .join("");
    } catch (error) {
      usersTableBody.innerHTML = `<tr><td colspan="3" class="table-empty" style="color:#ef4444;">Failed to read collection: ${error.message}</td></tr>`;
    }
  };

  // ➕ Operations Logic: Register a New User Account
  createUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formFeedback.textContent = "Transmitting profile payload...";
    formFeedback.style.color = "#2563eb";

    const payload = {
      username: usernameInput.value,
      email: emailInput.value,
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        formFeedback.textContent = "✅ User collection written successfully!";
        formFeedback.style.color = "#10b981";
        createUserForm.reset();
        fetchUserDirectory(); // Instantly refresh table data grid view
      } else {
        formFeedback.textContent = `❌ Write Error: ${result.message || "Validation rejected"}`;
        formFeedback.style.color = "#ef4444";
      }
    } catch (error) {
      formFeedback.textContent = `❌ Network Error: ${error.message}`;
      formFeedback.style.color = "#ef4444";
    }
  });

  // Wire up explicit click triggers and self-load on boot
  refreshUsersBtn.addEventListener("click", fetchUserDirectory);
  fetchUserDirectory();

  // Helper sanitization logic to clean up text injections
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
