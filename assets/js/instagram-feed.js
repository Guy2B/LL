// ===============================
// INSTAGRAM FEED LOADER (Premium)
// ===============================

const INSTAGRAM_TOKEN = "YOUR_LONG_LIVED_TOKEN";
const INSTAGRAM_ID = "YOUR_USER_ID";
const LIMIT = 6;

async function loadInstagram() {
    const url = `https://graph.instagram.com/${INSTAGRAM_ID}/media?fields=id,caption,media_url,thumbnail_url,permalink&access_token=${INSTAGRAM_TOKEN}&limit=${LIMIT}`;

    const container = document.getElementById("instagram-feed");

    try {
        const res = await fetch(url);
        const data = await res.json();

        data.data.forEach(post => {
            const div = document.createElement("a");
            div.classList.add("social-card");
            div.href = post.permalink;
            div.target = "_blank";
            div.style.backgroundImage = `url(${post.media_url})`;
            container.appendChild(div);
        });

    } catch (err) {
        console.error("INSTAGRAM FEED ERROR:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadInstagram);