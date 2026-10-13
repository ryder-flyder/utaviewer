# UtaViewer

**Try it: https://ryder-flyder.github.io/utaviewer/**

UtaViewer plays vocal synth projects on a piano roll, with the pitch curves and lyrics drawn on the notes, and exports the result as a video. It runs entirely in your browser, so your files are never uploaded.

## Supported files

`.ust` `.ustx` `.vsq` `.vsqx` `.vpr` `.svp` `.ccs` `.tssln` `.mid`

Synthesizer V Studio 1 and Studio 2 projects both work, and the badge on each file shows which one it is. Several UST files can share one roll. Any other project replaces the one that's loaded. You can also drop in an audio file to play along with it.

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
- A background image or video
- An audio visualizer built from your audio: scope line, spectrum bars or piano-key spectrum, one at a time

**Export**
- Video at 1920x1080 and 60 fps by default, as MP4 where your browser supports it and WebM otherwise
- 16:9, 4:3, 9:16 or 1:1, with a start and end time
- Transparent or green screen backgrounds, for overlaying in an editor
- A render queue for doing several songs in a row

**Handy**
- Loop a section while you tweak it
- Preview speed settings for slower computers (automatic quality, 30 fps, lighter effects). Recording always uses the full video size
- Keyboard shortcuts (press `?`)

## Using it

Open the site, add your files and press play. When you're ready, go to Export and record. Recording runs in real time, so keep the tab open until it finishes.

For the Windows app, download the zip from [Releases](https://github.com/ryder-flyder/utaviewer/releases), unzip it and run `UtaViewer.exe`.

To run the web version yourself, open `index.html` or serve the folder with any static server.

## AI-assisted code

UtaViewer does contain AI-assisted code. Please report any bugs to @ryder_flyder on Twitter.

## Credits

Uses [js-yaml](https://github.com/nodeca/js-yaml) and [JSZip](https://stuk.github.io/jszip/), both MIT licensed and included in `vendor/`.

UtaViewer is MIT licensed.
