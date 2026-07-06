/**
 * =============================================================================
 * APP.JS — Lógica da aplicação "Tu Visse?"
 * =============================================================================
 */

let db = null;
let supabaseReady = false;

(function initSupabase() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};

  const isPlaceholder =
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("SEU-PROJETO") ||
    SUPABASE_ANON_KEY.includes("SUA_CHAVE_ANON");

  if (isPlaceholder) {
    console.warn(
      "[Tu Visse?] Configure as chaves do Supabase em js/config.js antes de usar o app."
    );
    return;
  }

  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  supabaseReady = true;
})();

// -----------------------------------------------------------------------
// REFERÊNCIAS DOM
// -----------------------------------------------------------------------
const moodGrid = document.getElementById("mood-grid");
const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const modalAnotherBtn = document.getElementById("modal-another");
const modalLoading = document.getElementById("modal-loading");
const modalError = document.getElementById("modal-error");
const modalErrorText = document.getElementById("modal-error-text");
const modalContent = document.getElementById("modal-content");
const modalCover = document.getElementById("modal-cover");
const modalSongTitle = document.getElementById("modal-song-title");
const modalArtist = document.getElementById("modal-artist");
const modalYoutube = document.getElementById("modal-youtube");
const modalInstagram = document.getElementById("modal-instagram");

let currentMood = null;

// -----------------------------------------------------------------------
// EVENTOS
// -----------------------------------------------------------------------
moodGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".mood-card");
  if (!card) return;
  handleMoodClick(card.dataset.mood, card);
});

modalClose.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalOverlay.hidden) closeModal();
});

modalAnotherBtn.addEventListener("click", () => {
  if (currentMood) fetchAndShowSong(currentMood);
});

// -----------------------------------------------------------------------
// FUNÇÕES PRINCIPAIS
// -----------------------------------------------------------------------
function handleMoodClick(mood, cardEl) {
  if (!supabaseReady) {
    showToast(
      "Configuração pendente: adicione as chaves do Supabase em js/config.js."
    );
    return;
  }

  currentMood = mood;

  cardEl.classList.add("is-pressed");
  setTimeout(() => cardEl.classList.remove("is-pressed"), 150);

  openModal();
  fetchAndShowSong(mood);
}

async function fetchAndShowSong(mood) {
  showLoadingState();

  try {
    const { data: idRows, error: idError } = await db
      .from("songs")
      .select("id")
      .eq("mood", mood);

    if (idError) throw idError;

    if (!idRows || idRows.length === 0) {
      showErrorState(
        "Ainda não temos músicas curadas para esse mood. Volte em breve!"
      );
      return;
    }

    const randomId = idRows[Math.floor(Math.random() * idRows.length)].id;

    const { data: song, error: songError } = await db
      .from("songs")
      .select("title, artist, mood, youtube_url, insta_url, cover_url")
      .eq("id", randomId)
      .single();

    if (songError) throw songError;

    showSongState(song);
  } catch (err) {
    console.error("[Tu Visse?] Erro ao buscar música:", err);
    showErrorState("Deu ruim na conexão com o banco. Tenta de novo?");
  }
}

// -----------------------------------------------------------------------
// CONTROLE DE ESTADOS DO MODAL
// -----------------------------------------------------------------------
function openModal() {
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  currentMood = null;
}

function showLoadingState() {
  modalLoading.hidden = false;
  modalError.hidden = true;
  modalContent.hidden = true;
  modalAnotherBtn.setAttribute("aria-busy", "true");
}

function showErrorState(message) {
  modalLoading.hidden = true;
  modalError.hidden = false;
  modalContent.hidden = true;
  modalErrorText.textContent = message;
  modalAnotherBtn.removeAttribute("aria-busy");
}

function showSongState(song) {
  modalLoading.hidden = true;
  modalError.hidden = true;
  modalContent.hidden = false;
  modalAnotherBtn.removeAttribute("aria-busy");

  modalSongTitle.textContent = song.title;
  modalArtist.textContent = song.artist;

  modalCover.src = song.cover_url || buildFallbackCover(song.artist);
  modalCover.alt = `Capa de "${song.title}", por ${song.artist}`;

  setActionLink(modalYoutube, song.youtube_url);
  setActionLink(modalInstagram, song.insta_url);
}

function setActionLink(anchorEl, url) {
  if (url) {
    anchorEl.href = url;
    anchorEl.removeAttribute("aria-disabled");
    anchorEl.style.opacity = "1";
    anchorEl.style.pointerEvents = "auto";
  } else {
    anchorEl.href = "#";
    anchorEl.setAttribute("aria-disabled", "true");
    anchorEl.style.opacity = "0.5";
    anchorEl.style.pointerEvents = "none";
  }
}

function buildFallbackCover(artist) {
  const initials = encodeURIComponent((artist || "?").slice(0, 2).toUpperCase());
  return `https://placehold.co/300x300/FF007A/FFFFFF?text=${initials}&font=montserrat`;
}

// -----------------------------------------------------------------------
// TOAST
// -----------------------------------------------------------------------
let toastTimeout = null;

function showToast(message) {
  let toastEl = document.querySelector(".toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.remove(), 4000);
}

document.getElementById("year").textContent = new Date().getFullYear();



function showErrorState(message) {
  modalLoading.hidden = true;  // Isso vai sumir com o "Garimpando..."
  modalError.hidden = false;   // Isso vai mostrar a mensagem de erro na tela
  modalContent.hidden = true;
  modalErrorText.textContent = message;
  modalAnotherBtn.removeAttribute("aria-busy");
}
