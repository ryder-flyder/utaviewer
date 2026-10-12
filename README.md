# UtaViewer

**Try it: https://ryder-flyder.github.io/utaviewer/**

Drop in a vocal synth project and watch it play on a piano roll, with the pitch curve and lyrics drawn over the notes. You can export it as a video. Everything runs in your browser, so your files never get uploaded.

## What it opens

`.ust` `.ustx` `.vsqx` `.vpr` `.svp` `.ccs` `.tssln` `.mid`

Several UST files can stack on one roll. Any other project replaces the one that's loaded. You can also drop an audio file on the preview to play it along.

## Features

- Pitch curves drawn onto the notes as they play, plus glow, highlights, sparks and lyrics
- Preset looks based on each program, with colors and effects you can change
- Grid that follows the file's tempo
- Optional auto-shift so the view follows the notes up and down
- Optional character portraits laid under the notes at an opacity you choose
- Lyric box in a corner, from the notes' timings, your own text, or an .lrc file
- Background image or video
- Video export, 1920x1080 at 60 fps by default (MP4 when your browser can do it, WebM if not), with range and 16:9 / 9:16 / 1:1 shapes
- Save and load a look as a small file
- Keyboard shortcuts (press `?`)

## Using it

Open the site, add your files, hit play, then go to Export and record. It records in real time, so keep the tab open until it's done.

Want the Windows app? Grab the zip from [Releases](https://github.com/ryder-flyder/utaviewer/releases), unzip it and run `UtaViewer.exe`.

To run the web version yourself, open `index.html` or serve the folder with any static server.

## Credits

Uses [js-yaml](https://github.com/nodeca/js-yaml) and [JSZip](https://stuk.github.io/jszip/) (both MIT), included in `vendor/`.

MIT licensed.
