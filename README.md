# Deenverse.com

A responsive Quran and learning website with streaming recitation, readable Arabic Quran text and English translation, saved reflections, theme selection, and official One Islam Productions links.

## Run the site

Node.js 20 or newer is required. From this folder, in PowerShell:

```powershell
node server.mjs
```

Open `http://localhost:8765`.

## Features and sources

- Read all 114 surahs in Uthmani Arabic with the M.A.S. Abdel Haleem English translation from Quran Foundation; browse and search surahs, then play the selected recitation. The home-page Quran moment lets you choose any surah.
- Save Quran reading and recitation progress as you go, including when the page is closed. The site opens on Home, where the resume card shows your last surah and ayah; choose it to reopen your reading spot or restore audio paused at its saved position and reciter. Press play to continue, as browsers block automatic audio playback.
- Request device location on demand to display local prayer times; the coordinates are sent to AlAdhan for calculation and are not stored by DeenVerse.
- Stream verse-by-verse Quran recitations from Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, or Maher Al-Muaiqly through AlQuran Cloud. In the reader, choose any starting ayah and listen with the selected reciter. The reader displays Bismillah separately before each surah except Al-Fatiha, where it remains part of the first ayah, and At-Tawbah, which does not begin with Bismillah. Reading text and audio require an internet connection.
- Switch between light and dark mode and choose from eight saved color themes: Sage, Ocean, Indigo, Plum, Rose, Amber, Teal, and Slate. Themes tint the page backgrounds, cards, navigation, illustrations, and Quran/read-along accents throughout the site.
- Save individual daily verses, hadiths, and the currently playing Quran ayah. Saved entries keep their own content and source even after the daily quote changes.
- Read rotating Quran verses and sourced hadith excerpts on the home page. The selection changes every six hours, and “Another verse” / “Another hadith” let you browse more immediately. Browse 18 featured narrations with Arabic text or excerpts, independently worded summaries, and direct source citations.
- Search Sunnah.com by topic or reference, jump directly to featured narrations, and browse 26 collection links. Open Sunnah.com for its full narration pages, translations, and grading.
- See a random featured reminder from One Islam Productions in Listen & Learn and on the Lectures page; choose another lecture there or browse the complete official YouTube uploads playlist. Videos are embedded from YouTube and remain the creators' work.
- The app shell is cached for basic offline page access. Quran text and audio are not downloaded for offline use. Playback may continue while the device screen is locked when supported; powered-off devices cannot play audio.
