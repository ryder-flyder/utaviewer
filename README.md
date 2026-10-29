# UtaViewer

**Try it: https://ryder-flyder.github.io/utaviewer/**

UtaViewer plays vocal synth projects on a piano roll, with the pitch curves and lyrics drawn on the notes, and exports the result as a video. It runs entirely in your browser, so your files are never uploaded.

## Supported files

`.ust` `.ustx` `.vsq` `.vsqx` `.vpr` `.svp` `.ccs` `.tssln` `.mid` `.musicxml` `.mxl`, and NEUTRINO projects as a `.zip` of the project folder

Synthesizer V Studio 1 and Studio 2 projects both work, and the badge on each file shows which one it is. Several UST files can share one roll. Any other project replaces the one that's loaded. NEUTRINO: zip the whole project folder (the one with the `edit` and `render` folders) and add the zip. The notes and the pitch curve in `edit` are used, and if the project has been rendered, the sound of each phrase is joined into one audio track. A `.ntpj` file on its own only points to those files, so it can't be read by itself. A bare `score.xml` or any part-wise MusicXML file works for the notes alone.

You can also drop in an audio file to play along with it.

## Features

**Look**
- Pitch curves drawn on the notes as they play, as one line that runs through the whole track, with glow, highlights, sparks and lyrics
- Presets based on each program's editor, character themes in dark and light, and black or white themes in ten colors
- Colors and effects you can adjust, and a note color and opacity for each track
- Save a theme as a small JSON file, or load someone else's. Themes only hold colors and effects, never your portraits, backgrounds or lyrics
- Light, dark or automatic app theme, separate from the piano roll's look
- Text styles for note lyrics and the lyric box: fonts, weight, italic, case, spacing, color, outline, shadow and alignment
- Two sidebars and a timeline you can drag to any size, with an Editor on the left holding the settings you'll reach for most, and hover tips on everything (the Tips button turns them off)

**On the roll**
- A grid that follows the song's tempo
- Optional auto-shift to keep the notes in view
- Character portraits behind the notes, at the opacity you choose
- A lyric box in the corner, taken from the notes, your own text, or an .lrc file, with an optional romaji or typed second line, and any syllable can be reworded or hidden
- UTAU lyrics cleaned up: VCV and CVVC parts, breaths and symbols are left out of the notes and the lyric box
- Optional lip sync: give a track mouth images for A, I, U, E, O, N and silence, and the picture follows the vowel being sung
- A background image or video
- An audio visualizer built from your audio: scope line, spectrum bars or piano-key spectrum, one at a time

**Export**
- Video at 1920x1080 and 60 fps by default, as MP4 where your browser supports it. Otherwise it records WebM and the Export tab can convert it to MP4 with a bundled copy of ffmpeg (runs in the page, nothing is uploaded)
- 16:9, 4:3, 9:16 or 1:1, with a start and end time
- Transparent or green screen backgrounds, for overlaying in an editor
- A render queue for doing several songs in a row

**Handy**
- Loop a section while you tweak it
- Preview speed settings for slower computers (automatic quality, 30 fps, lighter effects). Recording always uses the full video size
- Keyboard shortcuts (press `?`)

## Using it

Open the site, add your files and press play. When you're ready, go to Export and record. Recording runs in real time, so keep the tab open until it finishes.

## Desktop apps

Desktop builds are on the [Releases](https://github.com/ryder-flyder/utaviewer/releases) page. They are the same program as the website in its own window.

- **Windows:** download `UtaViewer-windows-x64.zip`, unzip it and run `UtaViewer.exe`.
- **macOS (experimental):** download `UtaViewer-mac-apple-silicon.zip` (M1 and newer) or `UtaViewer-mac-intel.zip`, unzip it and drag `UtaViewer.app` to Applications. The app is not signed by Apple, so the first time, right-click it and choose Open. If macOS says it is damaged, open Terminal and run `xattr -dr com.apple.quarantine /Applications/UtaViewer.app`.
- **Linux (experimental):** download `UtaViewer-linux-x64.tar.gz`, extract it and run `start-utaviewer.sh` inside the folder (it turns off Chromium's sandbox, which many systems will not start with otherwise). If you run `UtaViewer` directly and it will not open, add `--no-sandbox`.

> **The macOS and Linux apps are experimental builds.** They have had far less testing than the website, and may fail to open or behave oddly on some systems. If something goes wrong, the web version is the safest fallback: it works in any current browser and gives the same results.

Video from the desktop apps is MP4 when the app can record it directly, and is otherwise converted to MP4 after recording.

To run the web version yourself, open `index.html` or serve the folder with any static server.

## AI-assisted code

UtaViewer contains AI-assisted code. The idea, design, direction and testing are by ryderflyder, and much of the code was written with the help of Claude, an AI assistant made by Anthropic. If you find a bug, please report it.

## Credits

Uses [js-yaml](https://github.com/nodeca/js-yaml) and [JSZip](https://stuk.github.io/jszip/), both MIT licensed and included in `vendor/`. `vendor/ffmpeg` holds ffmpeg.wasm (@ffmpeg/ffmpeg 0.12.15 and @ffmpeg/core 0.12.10, the core under GPL-2.0-or-later, from https://github.com/ffmpegwasm/ffmpeg.wasm). It is only loaded when you convert a video to MP4.

UtaViewer is MIT licensed.

