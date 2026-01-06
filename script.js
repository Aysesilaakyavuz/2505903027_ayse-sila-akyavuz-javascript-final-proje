const cards = document.getElementById("cards");
const status = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const sortOrder = document.getElementById("sortOrder");
const showFavorites = document.getElementById("showFavorites");
const loadMoreArea = document.getElementById("loadMoreArea");
const themeToggle = document.getElementById("themeToggle");
const modal = document.getElementById("modal");

let allShows = [];
let favorites = JSON.parse(localStorage.getItem("cherubFavs")) || [];
let visibleCount = 12;
let isFavPage = false;

const priorityShows = ["one piece", "jojo", "how i met your mother", "friends", "breaking bad", "BoJack Horseman", "sherlock", "the office", "dexter", "the boys", "stranger things", "loki", "narcos", "peaky blinders", "vikings", "dahmer", "yaprak dökümü", "interstellar", "inception", "attack on titan"];

// Başlangıç: Anasayfa Verilerini Çek
async function init() {
    isFavPage = false;
    showFavorites.classList.remove("fav-btn-active");
    status.textContent = "Sinema evreni yükleniyor...";
    allShows = [];
    for (const name of priorityShows) {
        try {
            const res = await fetch(`https://api.tvmaze.com/search/shows?q=${name}`);
            const data = await res.json();
            if (data[0]) allShows.push(data[0].show);
        } catch (e) { console.error("Hata:", e); }
    }
    status.textContent = "";
    renderCards(allShows);
}

// Kartları Ekrana Yazdır
function renderCards(list) {
    cards.innerHTML = "";
    const toDisplay = list.slice(0, visibleCount);

    toDisplay.forEach(show => {
        const isFav = favorites.some(f => f.id === show.id);
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${show.image ? show.image.original : 'https://via.placeholder.com/300x450'}" onclick="showDetail(${show.id})">
            <div class="card-info">
                <h3>${show.name}</h3>
                <button class="fav-add-btn" onclick="toggleFavorite(${show.id})">
                    ${isFav ? "❤️ Kaldır" : "🤍 Favoriye Ekle"}
                </button>
            </div>
        `;
        cards.appendChild(card);
    });

    loadMoreArea.style.display = (visibleCount >= list.length) ? "none" : "flex";
}

// Favori Yönetimi (LocalStorage)
function toggleFavorite(id) {
    const show = allShows.find(s => s.id === id) || favorites.find(s => s.id === id);
    const index = favorites.findIndex(f => f.id === id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else if (show) {
        favorites.push(show);
    }

    localStorage.setItem("cherubFavs", JSON.stringify(favorites));
    renderCards(isFavPage ? favorites : allShows);
}

// Favorileri Listele
showFavorites.addEventListener("click", () => {
    isFavPage = true;
    showFavorites.classList.add("fav-btn-active");
    status.textContent = " Favori Listeniz";
    visibleCount = 100;
    renderCards(favorites);
    if(favorites.length === 0) status.textContent = "Henüz favori eklemediniz.";
});

// A-Z / Z-A Sıralama (burada yapay zekadan yardım aldım)
sortOrder.addEventListener("change", () => {
    let listToSort = isFavPage ? favorites : allShows;
    if (sortOrder.value === "az") {
        listToSort.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder.value === "za") {
        listToSort.sort((a, b) => b.name.localeCompare(a.name));
    }
    renderCards(listToSort);
});

// Arama Motoru
document.getElementById("searchBtn").addEventListener("click", async () => {
    isFavPage = false;
    const q = searchInput.value.trim();
    if(!q) return;
    status.textContent = `"${q}" aranıyor...`;
    try {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${q}`);
        const data = await res.json();
        allShows = data.map(i => i.show);
        visibleCount = 12;
        renderCards(allShows);
        status.textContent = allShows.length === 0 ? "Sonuç bulunamadı." : "";
    } catch (e) { status.textContent = "Hata oluştu."; }
});

// Tür Filtreleme romantik\dram vs.
document.querySelectorAll(".genre-link").forEach(link => {
    link.addEventListener("click", async (e) => {
        e.preventDefault();
        const genre = e.target.getAttribute("data-genre");
        isFavPage = false;
        status.textContent = `${genre} türündeki yapımlar...`;
        try {
            const res = await fetch(`https://api.tvmaze.com/search/shows?q=${genre}`);
            const data = await res.json();
            allShows = data.map(i => i.show).filter(s => s.genres.includes(genre));
            visibleCount = 12;
            renderCards(allShows);
            status.textContent = allShows.length === 0 ? "Sonuç bulunamadı." : "";
        } catch (e) { status.textContent = "Hata oluştu."; }
    });
});

// Detay Penceresi
async function showDetail(id) {
    try {
        const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
        const show = await res.json();
        modal.classList.remove("hidden");
        modal.innerHTML = `
            <div class="modal-content">
                <img src="${show.image ? show.image.original : ''}">
                <div style="flex:1; min-width:300px;">
                    <h2>${show.name}</h2>
                    <p style="margin:15px 0; color:var(--primary); font-weight:bold;">Tür: ${show.genres.join(", ")}</p>
                    <p>${show.summary || "Açıklama yok."}</p>
                    <button onclick="document.getElementById('modal').classList.add('hidden')" class="action-btn" style="margin-top:20px; background:var(--primary)">Kapat</button>
                </div>
            </div>`;
    } catch (e) { console.error(e); }
}

loadMoreArea.addEventListener("click", () => {
    visibleCount += 12;
    renderCards(isFavPage ? favorites : allShows);
});

document.getElementById("nav-home").addEventListener("click", (e) => {
    e.preventDefault();
    init();
});

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
});

init();