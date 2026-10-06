
const form = document.getElementById("profileForm");
const preview = document.getElementById("preview");
const message = document.getElementById("message");
const savedProfiles = document.getElementById("savedProfiles");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function createCard(profile) {
  const skills = (profile.skills || "")
    .split(",")
    .map(skill => skill.trim())
    .filter(Boolean);

  const avatar = safeURL(profile.avatar || "");

  const links = [
    ["GitHub", profile.github],
    ["LinkedIn", profile.linkedin]
  ].map(([label, value]) => {
    const url = safeURL(value || "");
    return url
      ? `<a href="${escapeHTML(url)}"
           target="_blank" rel="noopener noreferrer">${label}</a>`
      : "";
  }).join("");

  return `
    <article class="profile-card">
      ${avatar
        ? `<img class="avatar" src="${escapeHTML(avatar)}"
             alt="Profile avatar">`
        : `<div class="avatar"
             style="display:inline-grid;place-items:center;
             font-size:35px">👤</div>`}

      <h2>${escapeHTML(profile.name)}</h2>
      <p>${escapeHTML(profile.bio || "No bio added yet.")}</p>

      <div class="skills">
        ${skills.map(skill =>
          `<span class="skill">${escapeHTML(skill)}</span>`
        ).join("")}
      </div>

      <div>${links}</div>
    </article>
  `;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "Saving profile...";

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save profile");
    }

    preview.innerHTML = createCard(result);
    message.textContent = "Profile created and saved successfully!";
    form.reset();

    await loadProfiles();
  } catch (error) {
    message.textContent = error.message;
  }
});

async function loadProfiles() {
  try {
    const response = await fetch("/api/profiles");

    if (!response.ok) {
      throw new Error("Unable to load saved profiles");
    }

    const profiles = await response.json();

    savedProfiles.innerHTML = profiles.length
      ? profiles.map(profile => `
          <div class="saved-item">
            <strong>${escapeHTML(profile.name)}</strong>
            <p>${escapeHTML(profile.bio || "")}</p>
            <button type="button"
              data-profile-id="${profile.id}">Preview Card</button>
          </div>
        `).join("")
      : "<p>No profiles saved yet.</p>";
  } catch (error) {
    savedProfiles.textContent = error.message;
  }
}

savedProfiles.addEventListener("click", async event => {
  const button = event.target.closest("[data-profile-id]");

  if (!button) return;

  try {
    const response = await fetch("/api/profiles");
    const profiles = await response.json();
    const profile = profiles.find(
      item => item.id === Number(button.dataset.profileId)
    );

    if (profile) {
      preview.innerHTML = createCard(profile);
      preview.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } catch {
    message.textContent = "Unable to display this profile.";
  }
});

loadProfiles();