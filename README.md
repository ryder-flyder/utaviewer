# UtaViewer

**Live site: https://ryder-flyder.github.io/utaviewer/**

A browser tool that shows vocal synth project files on a piano roll, plays the pitch curve and lyrics back over the notes, and exports the result as a video. Everything runs locally in your browser; files are never uploaded.

## Supported files

| Program | Extension |
| --- | --- |
| UTAU | `.ust` |
| OpenUtau | `.ustx` |
| VOCALOID 4 | `.vsqx` |
| VOCALOID 6 | `.vpr` |
| Synthesizer V | `.svp` |
| CeVIO AI | `.ccs` |
| VoiSona | `.tssln` |
| MIDI | `.mid` |

Several UST files layer on one roll. Any other project replaces the one that is loaded. Drop an audio file on the preview to play it with the project.

## Features

- Pitch curves drawn onto the notes as they play, plus glow, note highlight, sparks and lyrics
- Preset looks based on each program, with editable colors and effects
- Grid that follows the file's tempo
- Optional auto-shift of the view with the notes
- Export to MP4 (WebM in browsers that cannot record MP4), default 1920x1080 at 60 fps

## Use it

Open the [live site](https://ryder-flyder.github.io/utaviewer/), add or drop project files, press play, then use the Export tab and Record video. Recording plays the project once in real time, so keep the tab in the foreground until it finishes.

To run it locally, open `index.html` in a browser, or serve the folder with any static server (`python3 -m http.server`).

## Libraries

[js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 and [JSZip](https://stuk.github.io/jszip/) 3.10.1, both MIT, are bundled in `vendor/`.

## License

MIT
