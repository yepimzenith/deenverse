const audio = document.getElementById("audio");
const playToggle = document.getElementById("play-toggle");
const trackTitle = document.getElementById("track-title");
const trackSubtitle = document.getElementById("track-subtitle");
const reciterSelect = document.getElementById("reciter-select");
const toast = document.getElementById("toast");
const featuredLectures = [
  { id: "UxErc6_HDJw", title: "Why Haram Will Never Fulfill Your Heart" },
  { id: "USpegkfoCAw", title: "The Dark Side of Endless Scrolling" },
  { id: "cu1tihE_v3c", title: "This One Deed Could Open Every Door of Jannah" },
  { id: "zNJZw1XG38E", title: "How To Protect Yourself From Secret Sins" },
  { id: "ulmGiCRo7Zg", title: "A Powerful Reminder for Those Who Overthink" },
  { id: "wWpfq9LhY1A", title: "A Dua That Is Stronger Than All Medicine" },
  { id: "C88PZEgc2uQ", title: "Allah Made This Man Blind For His Sin" },
  { id: "b-jtgZZNjNU", title: "Do These 3 Things Before Death Comes" },
  { id: "jB0z4Avseew", title: "A Powerful Story About Escaping Haram Love" },
  { id: "4t7QGRwjunY", title: "How The Angel Of Death Will Take Shaytaans Soul" },
  { id: "h2iSuAnMoJs", title: "What Prophet Muhammad (PBUH) Saw In His Journey To Heaven" },
  { id: "4Tp8qqs1h_I", title: "Six Signs Allah Is Helping You" },
  { id: "Hh7NAjhzBZc", title: "Falling Into Sin Again and Again?" },
  { id: "_yGRAUmXYVc", title: "The Major Sin You Must Avoid During Wudu" },
  { id: "axQOWhv6kJg", title: "What Will Happen When Al-Mahdi Appears?" }
];

function chooseFeaturedLecture(excludeId) {
  const choices = featuredLectures.filter((lecture) => lecture.id !== excludeId);
  return choices[Math.floor(Math.random() * choices.length)];
}

function setHomeFeaturedLecture(lecture) {
  const link = document.getElementById("home-featured-lecture");
  link.href = `https://www.youtube.com/watch?v=${lecture.id}`;
  link.setAttribute("aria-label", `Watch ${lecture.title} on One Islam Productions`);
  document.getElementById("home-lecture-thumbnail").src = `https://i.ytimg.com/vi/${lecture.id}/hqdefault.jpg`;
  document.getElementById("home-lecture-title").textContent = lecture.title;
  document.getElementById("home-lecture-source").textContent = "One Islam Productions · Watch video";
}

function setLecturesFeaturedVideo(lecture) {
  const player = document.getElementById("featured-lecture-player");
  player.src = `https://www.youtube-nocookie.com/embed/${lecture.id}?rel=0`;
  player.title = `${lecture.title} — One Islam Productions`;
  document.getElementById("featured-lecture-title").textContent = lecture.title;
}

const homeFeaturedLecture = chooseFeaturedLecture();
let lecturesFeaturedVideo = chooseFeaturedLecture(homeFeaturedLecture.id);
setHomeFeaturedLecture(homeFeaturedLecture);
setLecturesFeaturedVideo(lecturesFeaturedVideo);
document.getElementById("another-lecture").addEventListener("click", () => {
  lecturesFeaturedVideo = chooseFeaturedLecture(lecturesFeaturedVideo.id);
  setLecturesFeaturedVideo(lecturesFeaturedVideo);
});

function loadSavedKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem("deenverse-saved") || "[]");
    return new Set(Array.isArray(stored) ? stored.filter((key) => typeof key === "string") : []);
  } catch {
    localStorage.removeItem("deenverse-saved");
    return new Set();
  }
}
const saved = loadSavedKeys();
let surahs = [];
let currentSurah = null;
let currentRecitation = null;
let playRequestId = 0;
let readingSurah = null;
let resumePosition = loadResumePosition();
let readingObserver = null;
let lastAudioSaveSecond = -1;
let toastTimer;

function loadResumePosition() {
  try {
    const savedPosition = JSON.parse(localStorage.getItem("deenverse-last-position") || "null");
    if (
      savedPosition &&
      Number.isInteger(savedPosition.surahNumber) &&
      savedPosition.surahNumber >= 1 &&
      savedPosition.surahNumber <= 114 &&
      ["read", "listen"].includes(savedPosition.mode)
    ) {
      if (savedPosition.mode === "listen" && !Number.isInteger(savedPosition.ayahNumber)) {
        return { ...savedPosition, ayahNumber: 1, currentTime: 0, duration: 0 };
      }
      return savedPosition;
    }
  } catch {
    localStorage.removeItem("deenverse-last-position");
  }
  return null;
}

function saveResumePosition(position) {
  resumePosition = position;
  localStorage.setItem("deenverse-last-position", JSON.stringify(position));
  updateResumeCard();
}

function updateResumeCard() {
  const card = document.getElementById("reading-progress-card");
  const title = document.getElementById("resume-title");
  const detail = document.getElementById("resume-detail");
  const progress = document.getElementById("resume-progress");
  const action = document.getElementById("resume-action");
  const surah = surahs.find((item) => item.number === resumePosition?.surahNumber);

  if (!resumePosition) {
    card.setAttribute("aria-label", "Start reading the Quran");
    title.textContent = "Start reading the Quran";
    detail.textContent = "Your reading progress will appear here.";
    progress.style.width = "0%";
    action.textContent = "→";
    return;
  }

  title.textContent = surah?.englishName || `Surah ${resumePosition.surahNumber}`;
  card.setAttribute("aria-label", `Resume ${resumePosition.mode === "read" ? "reading" : "listening to"} ${title.textContent}`);
  action.textContent = "↗";
  if (resumePosition.mode === "read") {
    const ayah = Math.min(resumePosition.ayah || 1, surah?.numberOfAyahs || 1);
    detail.textContent = `Continue from ayah ${ayah}${surah ? ` of ${surah.numberOfAyahs}` : ""}`;
    progress.style.width = `${Math.max(1, ((ayah - 1) / (surah?.numberOfAyahs || ayah)) * 100)}%`;
    return;
  }

  const ayahNumber = resumePosition.ayahNumber || 1;
  detail.textContent = `Resume listening · ayah ${ayahNumber}${surah ? ` of ${surah.numberOfAyahs}` : ""} · ${formatTime(resumePosition.currentTime || 0)}`;
  progress.style.width = `${surah ? Math.min(100, (ayahNumber / surah.numberOfAyahs) * 100) : 0}%`;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function updateDate() {
  const today = new Date();
  document.getElementById("today-date").textContent = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "long",
    day: "numeric"
  }).format(today).toUpperCase();
  document.getElementById("hijri-date").textContent = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(today).toUpperCase();
}
updateDate();
updateResumeCard();

function navigate(page, { focusSearch = true } = {}) {
  const target = document.getElementById(`page-${page}`);
  if (!target) return;
  document.querySelectorAll(".page").forEach((item) => item.classList.toggle("active-page", item === target));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page));
  document.getElementById("page-label").textContent = page.toUpperCase();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "quran" && focusSearch) document.getElementById("surah-search").focus({ preventScroll: true });
  if (page === "saved") renderSaved();
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

async function playSurah(number, startAt = 0, startAyah = 1) {
  const requestId = ++playRequestId;
  let surah = surahs.find((item) => item.number === number);
  if (!surah) {
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
      if (!response.ok) throw new Error("Could not find that surah.");
      const result = await response.json();
      surah = result.data;
    } catch {
      showToast("Could not load the recitation. Check your connection and try again.");
      return;
    }
  }
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/${reciterSelect.value}`);
    if (!response.ok) throw new Error("Could not load this recitation.");
    const result = await response.json();
    if (requestId !== playRequestId) return;
    const ayahs = result.data?.ayahs;
    if (!Array.isArray(ayahs) || !ayahs.length || ayahs.some((ayah) => !ayah.audio)) {
      throw new Error("This recitation is unavailable.");
    }
    saveAudioPosition();
    currentSurah = surah;
    currentRecitation = {
      ayahs,
      index: Math.max(0, ayahs.findIndex((ayah) => ayah.numberInSurah === startAyah)),
      usingSecondary: false,
      requestId
    };
    trackTitle.textContent = surah.englishName;
    audio.dataset.surahNumber = String(surah.number);
    setMediaSession(surah);
    await startRecitationAyah(currentRecitation.index, startAt, requestId);
  } catch {
    if (requestId !== playRequestId) return;
    showToast("Could not start audio. Check your connection and try again.");
    playToggle.textContent = "▷";
    playToggle.setAttribute("aria-label", "Play");
  }
}

function reciterDisplayName() {
  return reciterSelect.selectedOptions[0].textContent.split(" · ")[0];
}

function setMediaSession(surah) {
  trackSubtitle.textContent = `${surah.englishNameTranslation} · ${reciterDisplayName()}`;
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: surah.englishName,
    artist: trackSubtitle.textContent,
    album: "DeenVerse · The Quran"
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
  navigator.mediaSession.setActionHandler("nexttrack", playNext);
}

async function startRecitationAyah(index, startAt = 0, requestId = playRequestId) {
  if (requestId !== playRequestId || !currentRecitation || !currentSurah) return;
  const ayah = currentRecitation.ayahs[index];
  if (!ayah) return;
  currentRecitation.index = index;
  lastAudioSaveSecond = -1;
  trackSubtitle.textContent = `${currentSurah.englishNameTranslation} · ${reciterDisplayName()} · Ayah ${ayah.numberInSurah} of ${currentRecitation.ayahs.length}`;
  audio.dataset.ayahNumber = String(ayah.numberInSurah);
  const recitationKey = `recitation:${currentSurah.number}:${ayah.numberInSurah}:${reciterSelect.value}`;
  const recitationSave = document.querySelector('[data-save="now-playing"], [data-save^="recitation:"]');
  recitationSave.dataset.save = recitationKey;
  recitationSave.disabled = false;
  savedContent[recitationKey] = {
    title: `${currentSurah.englishName} · Ayah ${ayah.numberInSurah}`,
    text: `Quran recitation by ${reciterDisplayName()}\n${currentSurah.englishName} · Ayah ${ayah.numberInSurah}`,
    url: `https://quran.com/${currentSurah.number}/${ayah.numberInSurah}`
  };
  updateSaveButtons();
  audio.src = currentRecitation.usingSecondary ? ayah.audioSecondary?.[0] : ayah.audio;
  if (!audio.src) throw new Error("This ayah's audio is unavailable.");
  audio.load();
  saveResumePosition({
    mode: "listen",
    surahNumber: currentSurah.number,
    ayahNumber: ayah.numberInSurah,
    currentTime: startAt,
    duration: 0,
    reciter: reciterSelect.value
  });
  if (startAt > 0) await seekTo(startAt);
  if (requestId !== playRequestId) return;
  await audio.play();
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${currentSurah.englishName} · Ayah ${ayah.numberInSurah}`,
      artist: `${reciterDisplayName()} · ${currentSurah.englishNameTranslation}`,
      album: "DeenVerse · The Quran"
    });
  }
}

function seekTo(seconds) {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    audio.currentTime = seconds;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while restoring audio progress."));
    }, 15000);
    function cleanup() {
      clearTimeout(timeout);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("error", onError);
    }
    function onMetadata() {
      cleanup();
      audio.currentTime = Math.min(seconds, Math.max(0, audio.duration - 1));
      resolve();
    }
    function onError() {
      cleanup();
      reject(new Error("Could not load this recitation."));
    }
    audio.addEventListener("loadedmetadata", onMetadata, { once: true });
    audio.addEventListener("error", onError, { once: true });
  });
}

function playPrevious() {
  if (currentSurah) playSurah(currentSurah.number > 1 ? currentSurah.number - 1 : 114);
}
function playNext() {
  if (currentSurah) playSurah(currentSurah.number < 114 ? currentSurah.number + 1 : 1);
}

audio.addEventListener("ended", () => {
  if (!currentRecitation) return;
  if (currentRecitation.index + 1 < currentRecitation.ayahs.length) {
    startRecitationAyah(currentRecitation.index + 1).catch(() => {
      showToast("Could not continue to the next ayah. Check your connection and try again.");
    });
    return;
  }
  currentRecitation = null;
  localStorage.removeItem("deenverse-last-position");
  resumePosition = null;
  updateResumeCard();
});

document.querySelectorAll("[data-play-surah]").forEach((button) => {
  button.addEventListener("click", () => playSurah(Number(button.dataset.playSurah)));
});

playToggle.addEventListener("click", () => {
  if (!audio.src) {
    showToast("Choose a Quran recitation to begin listening.");
    navigate("quran");
    return;
  }
  if (audio.paused) audio.play().catch(() => showToast("Could not resume audio."));
  else audio.pause();
});
document.getElementById("previous-track").addEventListener("click", playPrevious);
document.getElementById("next-track").addEventListener("click", playNext);
audio.addEventListener("play", () => {
  playToggle.textContent = "Ⅱ";
  playToggle.setAttribute("aria-label", "Pause");
});
audio.addEventListener("pause", () => {
  playToggle.textContent = "▷";
  playToggle.setAttribute("aria-label", "Play");
  saveAudioPosition();
});
function saveAudioPosition() {
  if (!currentSurah || audio.dataset.surahNumber !== String(currentSurah.number) || !Number.isFinite(audio.duration) || audio.currentTime <= 0) return;
  lastAudioSaveSecond = Math.floor(audio.currentTime);
  saveResumePosition({
    mode: "listen",
    surahNumber: currentSurah.number,
    ayahNumber: Number(audio.dataset.ayahNumber),
    currentTime: audio.currentTime,
    duration: audio.duration,
    reciter: reciterSelect.value
  });
}
audio.addEventListener("timeupdate", () => {
  document.getElementById("elapsed").textContent = formatTime(audio.currentTime);
  if (Number.isFinite(audio.duration)) {
    document.getElementById("duration").textContent = formatTime(audio.duration);
    document.getElementById("seek").value = String((audio.currentTime / audio.duration) * 100);
    if (currentSurah && audio.currentTime >= lastAudioSaveSecond + 5) {
      lastAudioSaveSecond = Math.floor(audio.currentTime);
      saveResumePosition({
        mode: "listen",
        surahNumber: currentSurah.number,
        ayahNumber: Number(audio.dataset.ayahNumber),
        currentTime: audio.currentTime,
        duration: audio.duration,
        reciter: reciterSelect.value
      });
    }
  }
});
audio.addEventListener("error", () => {
  if (!audio.src) return;
  if (currentRecitation && !currentRecitation.usingSecondary) {
    const ayah = currentRecitation.ayahs[currentRecitation.index];
    if (ayah.audioSecondary?.length) {
      currentRecitation.usingSecondary = true;
      startRecitationAyah(currentRecitation.index, 0, currentRecitation.requestId).catch(() => {
        showToast("This recitation is unavailable right now. Try another surah or reciter.");
      });
      return;
    }
  }
  showToast("This recitation is unavailable right now. Try another surah or reciter.");
});
document.getElementById("seek").addEventListener("input", (event) => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (Number(event.target.value) / 100) * audio.duration;
});
document.getElementById("volume").addEventListener("input", (event) => { audio.volume = Number(event.target.value); });
document.getElementById("queue-button").addEventListener("click", () => navigate("quran"));
reciterSelect.addEventListener("change", () => {
  if (currentSurah) playSurah(currentSurah.number);
});

async function loadSurahs() {
  const list = document.getElementById("surah-list");
  try {
    const response = await fetch("https://api.quran.com/api/v4/chapters?language=en");
    if (!response.ok) throw new Error("Could not load the Quran library.");
    const result = await response.json();
    if (!Array.isArray(result.chapters) || result.chapters.length !== 114) {
      throw new Error("The Quran library returned incomplete surah data.");
    }
    surahs = result.chapters.map((chapter) => ({
      number: chapter.id,
      englishName: chapter.name_simple,
      englishNameTranslation: chapter.translated_name.name,
      name: chapter.name_arabic,
      numberOfAyahs: chapter.verses_count
    }));
    populateMomentSurahs();
    renderSurahs(surahs);
    updateResumeCard();
  } catch {
    list.innerHTML = '<div class="empty-state">The Quran library could not load. Please check your internet connection and try again.</div>';
  }
}

function populateMomentSurahs() {
  const select = document.getElementById("moment-surah-select");
  const options = surahs.map((surah) => {
    const option = document.createElement("option");
    option.value = String(surah.number);
    option.textContent = `${surah.number}. ${surah.englishName} · ${surah.englishNameTranslation}`;
    return option;
  });
  select.replaceChildren(...options);
  select.value = "55";
  select.disabled = false;
  document.getElementById("moment-play").disabled = false;
}

document.getElementById("moment-play").addEventListener("click", () => {
  const surahNumber = Number(document.getElementById("moment-surah-select").value);
  if (surahs.some((surah) => surah.number === surahNumber)) playSurah(surahNumber);
});

function renderSurahs(items) {
  const list = document.getElementById("surah-list");
  list.replaceChildren();
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">No surahs match your search.</div>';
    return;
  }
  items.forEach((surah) => {
    const item = document.createElement("article");
    item.className = "surah-item";
    const details = document.createElement("div");
    details.className = "surah-main";
    details.innerHTML = `<span class="surah-number">${String(surah.number).padStart(3, "0")}</span><span class="surah-details"><strong>${escapeHTML(surah.englishName)}</strong><small>${escapeHTML(surah.englishNameTranslation)} · ${surah.numberOfAyahs} ayahs</small></span><span class="surah-arabic" lang="ar" dir="rtl">${escapeHTML(surah.name)}</span>`;
    const actions = document.createElement("div");
    actions.className = "surah-actions";
    const readButton = document.createElement("button");
    readButton.className = "surah-action";
    readButton.type = "button";
    readButton.textContent = "Read";
    readButton.setAttribute("aria-label", `Read ${surah.englishName}`);
    readButton.addEventListener("click", () => readSurah(surah));
    const listenButton = document.createElement("button");
    listenButton.className = "surah-action listen-action";
    listenButton.type = "button";
    listenButton.textContent = "▷ Listen";
    listenButton.setAttribute("aria-label", `Listen to ${surah.englishName}`);
    listenButton.addEventListener("click", () => playSurah(surah.number));
    actions.append(readButton, listenButton);
    item.append(details, actions);
    list.append(item);
  });
}

async function readSurah(surah) {
  const reader = document.getElementById("quran-reader");
  const ayahList = document.getElementById("ayah-list");
  const title = document.getElementById("reader-title");
  const startAyahInput = document.getElementById("reader-start-ayah");
  const listenButton = document.getElementById("reader-listen");
  readingSurah = surah;
  startAyahInput.max = String(surah.numberOfAyahs);
  startAyahInput.value = String(
    resumePosition?.mode === "listen" && resumePosition.surahNumber === surah.number
      ? Math.min(resumePosition.ayahNumber || 1, surah.numberOfAyahs)
      : 1
  );
  startAyahInput.disabled = false;
  listenButton.disabled = false;
  reader.hidden = false;
  title.textContent = `${surah.englishName} · ${surah.englishNameTranslation}`;
  ayahList.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "loading-state";
  loading.textContent = "Loading Arabic text and translation…";
  ayahList.append(loading);
  reader.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surah.number}?translations=85&fields=text_uthmani&per_page=300`);
    if (!response.ok) throw new Error("Could not load this surah.");
    const result = await response.json();
    const ayahs = result.verses;
    if (!Array.isArray(ayahs) || ayahs.length !== surah.numberOfAyahs || ayahs.some((ayah) => !ayah.text_uthmani || !ayah.translations?.[0]?.text)) {
      throw new Error("This surah's text is unavailable or incomplete.");
    }
    readingSurah = surah;
    ayahList.replaceChildren();
    if (surah.number !== 1 && surah.number !== 9) {
      const basmala = document.createElement("div");
      basmala.className = "basmala-card";
      basmala.innerHTML = '<p class="basmala-arabic" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p><p class="basmala-transliteration">Bismillāhi r-raḥmāni r-raḥīm</p>';
      ayahList.append(basmala);
    }
    ayahs.forEach((ayah, index) => {
      const row = document.createElement("article");
      row.className = "ayah-card";
      const number = document.createElement("span");
      number.className = "ayah-number";
      number.textContent = String(ayah.verse_number).padStart(3, "0");
      const arabicText = document.createElement("p");
      arabicText.className = "ayah-arabic";
      arabicText.lang = "ar";
      arabicText.dir = "rtl";
      const text = ayah.text_uthmani.replace(/^\uFEFF/, "");
      arabicText.textContent = index === 0 && surah.number !== 1 && surah.number !== 9
        ? stripLeadingBasmala(text)
        : text;
      const translatedText = document.createElement("p");
      translatedText.className = "ayah-translation";
      translatedText.textContent = ayah.translations[0].text;
      row.append(number, arabicText, translatedText);
      ayahList.append(row);
    });
    const ayahCards = ayahList.querySelectorAll(".ayah-card");
    ayahCards.forEach((ayahCard) => {
      ayahCard.addEventListener("click", () => {
        const ayah = Number(ayahCard.querySelector(".ayah-number").textContent);
        saveResumePosition({ mode: "read", surahNumber: surah.number, ayah });
      });
    });
    const startAyah = Math.min(resumePosition?.mode === "read" && resumePosition.surahNumber === surah.number ? resumePosition.ayah : 1, ayahs.length);
    ayahList.children[startAyah - 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
    saveResumePosition({ mode: "read", surahNumber: surah.number, ayah: startAyah });
    readingObserver?.disconnect();
    readingObserver = new IntersectionObserver((entries) => {
      const visibleAyah = entries.find((entry) => entry.isIntersecting);
      if (!visibleAyah) return;
      const ayah = Number(visibleAyah.target.querySelector(".ayah-number").textContent);
      saveResumePosition({ mode: "read", surahNumber: surah.number, ayah });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    ayahCards.forEach((ayahCard) => readingObserver.observe(ayahCard));
  } catch (error) {
    ayahList.replaceChildren();
    const failure = document.createElement("p");
    failure.className = "empty-state";
    failure.textContent = `${error.message} Please check your connection and try again.`;
    ayahList.append(failure);
  }
}

function stripLeadingBasmala(text) {
  const normalizeArabic = (value) => value.normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u06d6-\u06ed\u0640]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.trim().split(/\s+/);
  if (words.length < 5 || normalizeArabic(words.slice(0, 4).join(" ")) !== "بسم الله الرحمن الرحيم") return text;
  return words.slice(4).join(" ");
}

document.getElementById("reader-close").addEventListener("click", () => {
  document.getElementById("quran-reader").hidden = true;
});
document.getElementById("reader-listen").addEventListener("click", () => {
  if (!readingSurah) return;
  const startAyah = Number(document.getElementById("reader-start-ayah").value);
  if (!Number.isInteger(startAyah) || startAyah < 1 || startAyah > readingSurah.numberOfAyahs) {
    showToast(`Choose an ayah from 1 to ${readingSurah.numberOfAyahs}.`);
    return;
  }
  playSurah(readingSurah.number, 0, startAyah);
});

function resumeLastPosition() {
  if (!resumePosition) {
    navigate("quran");
    return;
  }

  const surah = surahs.find((item) => item.number === resumePosition.surahNumber);
  if (!surah) {
    showToast("The Quran library is still loading. Please try again in a moment.");
    return;
  }
  navigate("quran", { focusSearch: false });
  if (resumePosition.mode === "listen") {
    if (resumePosition.reciter && [...reciterSelect.options].some((option) => option.value === resumePosition.reciter)) {
      reciterSelect.value = resumePosition.reciter;
    }
    playSurah(surah.number, resumePosition.currentTime || 0, resumePosition.ayahNumber || 1);
    return;
  }
  readSurah(surah);
}

const resumeCard = document.getElementById("reading-progress-card");
resumeCard.addEventListener("click", resumeLastPosition);
resumeCard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    resumeLastPosition();
  }
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

document.getElementById("surah-search").addEventListener("input", (event) => {
  const normalizeSearch = (value) => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/aa/g, "a");
  const query = normalizeSearch(event.target.value.trim());
  renderSurahs(surahs.filter((item) => normalizeSearch(`${item.englishName} ${item.englishNameTranslation} ${item.name} ${item.number}`).includes(query)));
});

const savedContent = {};
let savedQuoteContent = {};
try {
  const savedQuotes = JSON.parse(localStorage.getItem("deenverse-saved-quotes") || "{}");
  if (savedQuotes && typeof savedQuotes === "object" && !Array.isArray(savedQuotes)) savedQuoteContent = savedQuotes;
} catch {
  localStorage.removeItem("deenverse-saved-quotes");
}

function isSavedItem(item) {
  return item && typeof item.title === "string" && typeof item.text === "string";
}

function persistSavedItems() {
  localStorage.setItem("deenverse-saved", JSON.stringify([...saved]));
  localStorage.setItem("deenverse-saved-quotes", JSON.stringify(savedQuoteContent));
}

for (const key of [...saved]) {
  if (key === "verse" || key === "daily-hadith") {
    const item = savedQuoteContent[key];
    if (isSavedItem(item) && item.url) {
      const itemKey = `${key}:${item.url}`;
      savedQuoteContent[itemKey] = item;
      saved.add(itemKey);
    }
    saved.delete(key);
    delete savedQuoteContent[key];
  } else if (key === "now-playing" || !isSavedItem(savedQuoteContent[key])) {
    saved.delete(key);
    delete savedQuoteContent[key];
  }
}
for (const key of Object.keys(savedQuoteContent)) {
  if (!saved.has(key)) delete savedQuoteContent[key];
}
persistSavedItems();

const dailyVerses = [
  { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", meaning: "With hardship comes ease.", reference: "Ash-Sharh · 94:5", surah: 94, ayah: 5 },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", meaning: "Indeed, with hardship comes ease.", reference: "Ash-Sharh · 94:6", surah: 94, ayah: 6 },
  { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", meaning: "Surely, in the remembrance of Allah hearts find comfort.", reference: "Ar-Ra'd · 13:28", surah: 13, ayah: 28 },
  { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", meaning: "Allah does not burden a soul beyond what it can bear.", reference: "Al-Baqarah · 2:286", surah: 2, ayah: 286 },
  { arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ إِنْ كُنْتُمْ مُؤْمِنِينَ", meaning: "Do not lose heart or grieve; you will prevail if you are true in faith.", reference: "Aal-e-Imran · 3:139", surah: 3, ayah: 139 },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", meaning: "Remember Me, and I will remember you; be grateful to Me.", reference: "Al-Baqarah · 2:152", surah: 2, ayah: 152 },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", meaning: "Whoever puts their trust in Allah, He is enough for them.", reference: "At-Talaq · 65:3", surah: 65, ayah: 3 },
  { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", meaning: "Believers, seek help through patience and prayer; Allah is with the patient.", reference: "Al-Baqarah · 2:153", surah: 2, ayah: 153 }
];

const dailyHadiths = [
  {
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    fullArabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ",
    meaning: "Actions are judged by intentions, and each person is rewarded according to what they intended.",
    source: "Sahih al-Bukhari 1",
    url: "https://sunnah.com/bukhari:1"
  },
  {
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    fullArabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    meaning: "A person's faith is not complete until they wish for their brother what they wish for themselves.",
    source: "Sahih al-Bukhari 13",
    url: "https://sunnah.com/bukhari:13"
  },
  {
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    fullArabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلَا يُؤْذِ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    meaning: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
    source: "Sahih al-Bukhari 6018",
    url: "https://sunnah.com/bukhari:6018"
  },
  {
    arabic: "وَأَنَّ أَحَبَّ الأَعْمَالِ أَدْوَمُهَا إِلَى اللَّهِ، وَإِنْ قَلَّ",
    fullArabic: "سَدِّدُوا وَقَارِبُوا، وَاعْلَمُوا أَنْ لَنْ يُدْخِلَ أَحَدَكُمْ عَمَلُهُ الْجَنَّةَ، وَأَنَّ أَحَبَّ الأَعْمَالِ أَدْوَمُهَا إِلَى اللَّهِ، وَإِنْ قَلَّ",
    meaning: "The deeds most beloved to Allah are those done consistently, even if they are few.",
    source: "Sahih al-Bukhari 6464",
    url: "https://sunnah.com/bukhari:6464"
  },
  {
    arabic: "وَمَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    fullArabic: "مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ وَمَنْ يَسَّرَ عَلَى مُعْسِرٍ يَسَّرَ اللَّهُ عَلَيْهِ فِي الدُّنْيَا وَالْآخِرَةِ وَمَنْ سَتَرَ مُسْلِمًا سَتَرَهُ اللَّهُ فِي الدُّنْيَا وَالْآخِرَةِ وَاللَّهُ فِي عَوْنِ الْعَبْدِ مَا كَانَ الْعَبْدُ فِي عَوْنِ أَخِيهِ وَمَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ وَمَا اجْتَمَعَ قَوْمٌ فِي بَيْتٍ مِنْ بُيُوتِ اللَّهِ يَتْلُونَ كِتَابَ اللَّهِ وَيَتَدَارَسُونَهُ بَيْنَهُمْ إِلَّا نَزَلَتْ عَلَيْهِمُ السَّكِينَةُ وَغَشِيَتْهُمُ الرَّحْمَةُ وَحَفَّتْهُمُ الْمَلَائِكَةُ وَذَكَرَهُمُ اللَّهُ فِيمَنْ عِنْدَهُ وَمَنْ بَطَّأَ بِهِ عَمَلُهُ لَمْ يُسْرِعْ بِهِ نَسَبُهُ",
    meaning: "Whoever follows a path seeking knowledge, Allah makes a path to Paradise easy for them.",
    source: "Sahih Muslim 2699a",
    url: "https://sunnah.com/muslim:2699a"
  },
  {
    arabic: "بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ",
    meaning: "Islam is built upon five foundational practices.",
    source: "Sahih al-Bukhari 8",
    url: "https://sunnah.com/bukhari:8"
  },
  {
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    meaning: "A Muslim is one from whose tongue and hands other Muslims are safe.",
    source: "Sahih al-Bukhari 10",
    url: "https://sunnah.com/bukhari:10"
  },
  {
    arabic: "إِنَّ الدِّينَ يُسْرٌ",
    meaning: "The religion is ease; avoid taking religious practice to extremes.",
    source: "Sahih al-Bukhari 39",
    url: "https://sunnah.com/bukhari:39"
  },
  {
    arabic: "الْحَلَالُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ",
    meaning: "The lawful and unlawful are clear, with doubtful matters between them.",
    source: "Sahih al-Bukhari 52",
    url: "https://sunnah.com/bukhari:52"
  },
  {
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    meaning: "The best are those who learn the Quran and teach it.",
    source: "Sahih al-Bukhari 5027",
    url: "https://sunnah.com/bukhari:5027"
  },
  {
    arabic: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ",
    meaning: "True strength is not overpowering others; it is controlling oneself in anger.",
    source: "Sahih al-Bukhari 6114",
    url: "https://sunnah.com/bukhari:6114"
  },
  {
    arabic: "نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ",
    meaning: "Many people fail to make good use of two blessings: health and free time.",
    source: "Sahih al-Bukhari 6412",
    url: "https://sunnah.com/bukhari:6412"
  },
  {
    arabic: "الطُّهُورُ شَطْرُ الْإِيمَانِ",
    meaning: "Purification is half of faith.",
    source: "Sahih Muslim 223",
    url: "https://sunnah.com/muslim:223"
  },
  {
    arabic: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ",
    meaning: "Allah does not judge people by appearance or wealth, but by their hearts and deeds.",
    source: "Sahih Muslim 2564",
    url: "https://sunnah.com/muslim:2564"
  },
  {
    arabic: "مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ",
    meaning: "Whoever guides someone to good shares in a reward like the one who does it.",
    source: "Sahih Muslim 1893a",
    url: "https://sunnah.com/muslim:1893a"
  },
  {
    arabic: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ",
    meaning: "A believer can find good in every circumstance: gratitude in ease and patience in hardship.",
    source: "Sahih Muslim 2999",
    url: "https://sunnah.com/muslim:2999"
  },
  {
    arabic: "إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلَاقًا",
    meaning: "Among the best of you are those with the best character.",
    source: "Sahih al-Bukhari 6029",
    url: "https://sunnah.com/bukhari:6029"
  },
  {
    arabic: "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ",
    meaning: "Those who show mercy are shown mercy by the Most Merciful.",
    source: "Jami` at-Tirmidhi 1924",
    url: "https://sunnah.com/tirmidhi:1924"
  }
];

let quoteTimeSlot = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
let dailyVerseIndex = quoteTimeSlot % dailyVerses.length;
let dailyHadithIndex = quoteTimeSlot % dailyHadiths.length;

function renderDailyVerse() {
  const verse = dailyVerses[dailyVerseIndex];
  document.getElementById("verse-arabic").textContent = verse.arabic;
  document.getElementById("verse-meaning").textContent = verse.meaning;
  document.getElementById("verse-reference").textContent = verse.reference;
  document.getElementById("verse-reference").href = `https://quran.com/${verse.surah}/${verse.ayah}`;
  document.getElementById("verse-day").textContent = `Updated every 6 hours · ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())}`;
  document.getElementById("verse-listen").dataset.playSurah = String(verse.surah);
  const itemKey = `verse:https://quran.com/${verse.surah}/${verse.ayah}`;
  document.querySelector('[data-save="verse"], [data-save^="verse:"]').dataset.save = itemKey;
  savedContent[itemKey] = {
    title: `Quran · ${verse.reference}`,
    text: `${verse.arabic}\nMeaning: ${verse.meaning}`,
    url: `https://quran.com/${verse.surah}/${verse.ayah}`
  };
}

function renderDailyHadith() {
  const hadith = dailyHadiths[dailyHadithIndex];
  document.getElementById("daily-hadith-arabic").textContent = hadith.arabic;
  document.getElementById("daily-hadith-meaning").textContent = hadith.meaning;
  const source = document.getElementById("daily-hadith-source");
  source.href = hadith.url;
  source.textContent = `${hadith.source} · Read source ↗`;
  const itemKey = `daily-hadith:${hadith.url}`;
  document.querySelector('[data-save="daily-hadith"], [data-save^="daily-hadith:"]').dataset.save = itemKey;
  savedContent[itemKey] = {
    title: `Hadith · ${hadith.source}`,
    text: `${hadith.arabic}\nMeaning: ${hadith.meaning}`,
    url: hadith.url
  };
}

function renderFeaturedHadiths() {
  const grid = document.getElementById("featured-hadiths");
  grid.replaceChildren();
  for (const hadith of dailyHadiths) {
    const card = document.createElement("article");
    card.className = "featured-hadith-card";
    const arabic = document.createElement("p");
    arabic.className = "featured-hadith-arabic";
    arabic.lang = "ar";
    arabic.dir = "rtl";
    arabic.textContent = hadith.fullArabic || hadith.arabic;
    const excerptLabel = document.createElement("span");
    excerptLabel.className = "hadith-meaning-label";
    excerptLabel.textContent = hadith.fullArabic ? "ARABIC TEXT" : "ARABIC EXCERPT";
    const meaningLabel = document.createElement("span");
    meaningLabel.className = "hadith-meaning-label";
    meaningLabel.textContent = "SUMMARY";
    const meaning = document.createElement("p");
    meaning.className = "featured-hadith-meaning";
    meaning.textContent = hadith.meaning;
    const source = document.createElement("a");
    source.className = "featured-hadith-source";
    source.href = hadith.url;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = `${hadith.source} · View on Sunnah.com ↗`;
    card.append(excerptLabel, arabic, meaningLabel, meaning, source);
    grid.append(card);
  }
}

document.getElementById("next-verse").addEventListener("click", () => {
  dailyVerseIndex = (dailyVerseIndex + 1) % dailyVerses.length;
  renderDailyVerse();
});
document.getElementById("verse-listen").addEventListener("click", (event) => {
  playSurah(Number(event.currentTarget.dataset.playSurah));
});
document.getElementById("next-hadith").addEventListener("click", () => {
  dailyHadithIndex = (dailyHadithIndex + 1) % dailyHadiths.length;
  renderDailyHadith();
});
renderDailyVerse();
renderDailyHadith();
renderFeaturedHadiths();
setInterval(() => {
  const currentTimeSlot = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  if (currentTimeSlot === quoteTimeSlot) return;
  quoteTimeSlot = currentTimeSlot;
  dailyVerseIndex = quoteTimeSlot % dailyVerses.length;
  dailyHadithIndex = quoteTimeSlot % dailyHadiths.length;
  renderDailyVerse();
  renderDailyHadith();
}, 60_000);

const hadithCollections = [
  ["bukhari", "Sahih al-Bukhari", "The most widely studied collection of authentic hadith."],
  ["muslim", "Sahih Muslim", "A major collection of authentic hadith."],
  ["nasai", "Sunan an-Nasa'i", "Hadith collection arranged by topics of Islamic law."],
  ["abudawud", "Sunan Abi Dawud", "A collection with an emphasis on legal traditions."],
  ["tirmidhi", "Jami` at-Tirmidhi", "Hadith, legal discussions, and grading notes."],
  ["ibnmajah", "Sunan Ibn Majah", "One of the well-known Sunni hadith collections."],
  ["malik", "Muwatta Malik", "Hadith and legal practice reported by Imam Malik."],
  ["ahmad", "Musnad Ahmad", "A large collection arranged by narrator."],
  ["darimi", "Sunan ad-Darimi", "Early hadith and scholarly traditions."],
  ["ibnkhuzayma", "Sahih Ibn Khuzayma", "Hadith collection compiled by Ibn Khuzayma."],
  ["ibnhibban", "Sahih Ibn Hibban", "Hadith collection compiled by Ibn Hibban."],
  ["hakim", "Mustadrak al-Hakim", "Supplementary narrations and their assessments."],
  ["abdurrazzaq", "Musannaf `Abd ar-Razzaq", "Early reports and legal traditions."],
  ["ibnabishayba", "Musannaf Ibn Abi Shayba", "Early narrations arranged by subject."],
  ["daraqutni", "Sunan ad-Daraqutni", "Hadith collection arranged around legal topics."],
  ["bayhaqi", "As-Sunan al-Kubra li al-Bayhaqi", "Extensive hadith and jurisprudential collection."],
  ["nasaikubra", "Sunan an-Nasa'i al-Kubra", "The larger Sunan collection of an-Nasa'i."],
  ["adab", "Al-Adab Al-Mufrad", "Prophetic teachings on character and manners."],
  ["shamail", "Ash-Shama'il Al-Muhammadiyah", "Reports about the character and qualities of the Prophet ﷺ."],
  ["nawawi40", "An-Nawawi's 40 Hadith", "Forty foundational hadith selected by Imam an-Nawawi."],
  ["riyadussalihin", "Riyad as-Salihin", "Selected hadith on worship, conduct, and everyday life."],
  ["mishkat", "Mishkat al-Masabih", "A broad compilation of hadith on many subjects."],
  ["bulugh", "Bulugh al-Maram", "Hadith commonly studied for rulings and practice."],
  ["forty", "Collections of Forty", "A group of collections built around forty hadith."],
  ["hisn", "Hisn al-Muslim", "Supplications and remembrances from transmitted sources."],
  ["virtues", "Virtues of Qur'anic Chapters and Verses", "Reports concerning the virtues of Qur'anic passages."]
];

function renderHadithCollections(collections = hadithCollections) {
  const grid = document.getElementById("hadith-collections");
  const count = document.getElementById("collection-count");
  grid.replaceChildren();
  count.textContent = `${collections.length} ${collections.length === 1 ? "collection" : "collections"}`;
  if (!collections.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No collections match that search.";
    grid.append(empty);
    return;
  }
  for (const [slug, name, description] of collections) {
    const link = document.createElement("a");
    link.className = "hadith-collection-card";
    link.href = `https://sunnah.com/${encodeURIComponent(slug)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const icon = document.createElement("span");
    icon.className = "collection-icon";
    icon.textContent = "❞";
    const content = document.createElement("span");
    content.className = "collection-copy";
    const title = document.createElement("strong");
    title.textContent = name;
    const summary = document.createElement("small");
    summary.textContent = description;
    content.append(title, summary);
    const arrow = document.createElement("span");
    arrow.className = "collection-arrow";
    arrow.textContent = "↗";
    link.append(icon, content, arrow);
    grid.append(link);
  }
}

document.getElementById("hadith-search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = document.getElementById("hadith-search-input").value.trim();
  if (!query) {
    document.getElementById("hadith-search-input").focus();
    return;
  }
  window.open(`https://sunnah.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
});
document.getElementById("hadith-search-input").addEventListener("input", (event) => {
  const query = event.target.value.trim().toLocaleLowerCase();
  renderHadithCollections(hadithCollections.filter(([, name, description]) =>
    `${name} ${description}`.toLocaleLowerCase().includes(query)
  ));
});
renderHadithCollections();

function updateSaveButtons() {
  document.querySelectorAll("[data-save]").forEach((button) => {
    const isSaved = saved.has(button.dataset.save);
    button.disabled = !isSaved && !isSavedItem(savedContent[button.dataset.save]);
    button.classList.toggle("is-saved", isSaved);
    button.textContent = isSaved ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", isSaved ? "Remove from saved items" : "Save this item");
  });
}
document.querySelectorAll("[data-save]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.save;
    if (saved.has(key)) {
      saved.delete(key);
      delete savedQuoteContent[key];
      showToast("Removed from your saved items.");
    } else {
      const item = savedContent[key];
      if (!isSavedItem(item)) {
        showToast("This item is not ready to save yet.");
        return;
      }
      saved.add(key);
      savedQuoteContent[key] = { ...item };
      showToast("Saved for another time.");
    }
    persistSavedItems();
    updateSaveButtons();
    if (document.getElementById("page-saved").classList.contains("active-page")) renderSaved();
  });
});

function renderSaved() {
  const list = document.getElementById("saved-list");
  list.replaceChildren();
  const items = [...saved].filter((key) => isSavedItem(savedQuoteContent[key]));
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Your saved verses and reflections will appear here.</div>';
    return;
  }
  items.forEach((key) => {
    const item = document.createElement("article");
    item.className = "saved-item";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const text = document.createElement("p");
    const savedItem = savedQuoteContent[key];
    title.textContent = savedItem.title;
    text.textContent = savedItem.text;
    content.append(title, text);
    if (savedItem.url) {
      const source = document.createElement("a");
      source.href = savedItem.url;
      source.target = "_blank";
      source.rel = "noopener noreferrer";
      source.textContent = "Open source ↗";
      content.append(source);
    }
    const remove = document.createElement("button");
    remove.className = "save-button is-saved";
    remove.dataset.save = key;
    remove.setAttribute("aria-label", "Remove saved item");
    remove.textContent = "♥";
    remove.addEventListener("click", () => {
      saved.delete(key);
      delete savedQuoteContent[key];
      persistSavedItems();
      updateSaveButtons();
      renderSaved();
      showToast("Removed from your saved items.");
    });
    item.append(content, remove);
    list.append(item);
  });
}
updateSaveButtons();

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("deenverse-theme", theme);
  const button = document.getElementById("theme-toggle");
  const dark = theme === "dark";
  button.textContent = dark ? "☀" : "☾";
  button.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
  button.title = `Switch to ${dark ? "light" : "dark"} mode`;
  document.querySelector('meta[name="theme-color"]').content = dark ? "#202821" : "#f6f5f0";
}
const savedTheme = localStorage.getItem("deenverse-theme");
setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
document.getElementById("theme-toggle").addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

document.getElementById("search-trigger").addEventListener("click", () => {
  navigate("quran");
  document.getElementById("surah-search").focus();
});
const prayerDialog = document.getElementById("prayer-dialog");
const locationStatus = document.getElementById("location-status");
const locationButton = document.getElementById("location-button");
document.getElementById("prayer-card").addEventListener("click", () => {
  locationStatus.textContent = "";
  document.getElementById("prayer-times").hidden = true;
  document.getElementById("prayer-source").hidden = true;
  locationButton.disabled = false;
  if (!prayerDialog.open) prayerDialog.showModal();
});
document.getElementById("close-prayer").addEventListener("click", () => prayerDialog.close());

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 300_000
    });
  });
}

function locationErrorMessage(error) {
  if (!window.isSecureContext) return "Location requires a secure website (HTTPS) or localhost. Open DeenVerse through its local server rather than file://.";
  if (error.code === 1) return "Location permission was denied. Allow location access in your browser settings, then try again.";
  if (error.code === 2) return "Your location is unavailable. Check your device location settings and try again.";
  if (error.code === 3) return "Location lookup timed out. Please try again.";
  return "Could not get your location. Please try again.";
}

locationButton.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "This browser does not support location. Try a current browser over HTTPS or localhost.";
    return;
  }
  locationButton.disabled = true;
  locationStatus.textContent = "Requesting your location…";
  document.getElementById("prayer-times").hidden = true;
  document.getElementById("prayer-source").hidden = true;
  try {
    const position = await getCurrentLocation();
    const { latitude, longitude } = position.coords;
    const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&method=3`);
    if (!response.ok) throw new Error("Prayer times could not be loaded. Check your internet connection and try again.");
    const result = await response.json();
    if (result.code !== 200 || !result.data?.timings) throw new Error("Prayer times were unavailable for this location. Please try again.");
    const timings = result.data.timings;
    const container = document.getElementById("prayer-times");
    container.replaceChildren();
    for (const [name, key] of [["Fajr", "Fajr"], ["Sunrise", "Sunrise"], ["Dhuhr", "Dhuhr"], ["Asr", "Asr"], ["Maghrib", "Maghrib"], ["Isha", "Isha"]]) {
      const row = document.createElement("div");
      row.className = "prayer-time-row";
      const label = document.createElement("span");
      label.textContent = name;
      const time = document.createElement("strong");
      time.textContent = String(timings[key] || "—").replace(/\s*\([^)]*\)/g, "");
      row.append(label, time);
      container.append(row);
    }
    locationStatus.textContent = `Prayer times for ${result.data.date?.readable || "today"} · ${result.data.meta?.timezone || "local time"}`;
    container.hidden = false;
    document.getElementById("prayer-source").hidden = false;
  } catch (error) {
    locationStatus.textContent = error.code ? locationErrorMessage(error) : error.message;
  } finally {
    locationButton.disabled = false;
  }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => showToast("Offline app setup is unavailable in this browser."));
}
loadSurahs();
