# Changelog

## UtaViewer 1.5.0

### Major features
- Exact frame rendering: every frame is drawn at its own moment and encoded directly (WebCodecs), so a 60 fps video really is 60 fps even on a slow computer, instead of whatever the computer managed to record. It also works with the tab in the background. Live recording is still there as a choice, and is used automatically in Firefox and for transparent video
- NEUTRINO projects (zip the project folder): notes, pitch curve and the rendered vocals as audio
- MusicXML files (.musicxml, .mxl)
- Lip sync tab: a set of mouth images (A, I, U, E, O, N and Silent) for each track that follows the vowel of the note being sung
- MP4 in every browser: browsers that only record WebM get a Convert to MP4 button (H.264 and AAC) in the Export tab, or leave the automatic option on. It runs in the page with a bundled copy of ffmpeg, so nothing is uploaded
- Experimental macOS and Linux desktop apps next to the Windows one, built automatically for each release. All desktop apps now have an icon and run from their own secure address instead of file://

### Minor additions
- Breaths and pauses in NEUTRINO and MusicXML files show as rests, and closures ("cl") are not shown as lyrics
- Fix length button for recordings
- Export range shows the exact start, end and length, and a Whole project button clears it
- Soft fades on buttons, tabs and panels (off when the system asks for reduced motion)

### Fixes
- Recorded WebM files had no length stored, so players showed a start time but no end time and could not skip ahead. Convert to MP4 or Fix length repairs this
- The MP4 converter now works when index.html is opened straight from disk (it failed to load there), and its files are compressed to about 13 MB in total (no file over 7 MB), well inside GitHub's upload limits. Load errors now say which step failed
- Windows: recording could produce an empty 0 MB MP4. The H.264 level now matches the video size and frame rate, and if a recording still comes out empty the app switches to WebM by itself (and converts it to MP4)
- The second song in a render queue could save as an empty file when it had no audio
- An end time before the start now says so instead of silently recording the whole project

## UtaViewer 1.4.0

### Major features
- VSQ support (VOCALOID 2)
- Color themes (black or white, in ten colors)
- Two sidebars and the timeline can all be resized by dragging (double-click to reset): Editor on the left, Effects, Look and Export on the right
- Editor tab with files, portraits, background, lyric box and the most-used settings (replaces the Visuals tab)
- Text styles for the lyrics on the notes and the lyric box (font, weight, italic, case, spacing, color, outline, shadow, alignment, panel)
- Edit the lyric box text note by note
- Karaoke styles for the lyric box: sweep, underline or pop, and how faint unsung words are

### Minor additions
- Per-track opacity
- Separate Kagamine Rin and Len themes
- Full names for all character themes
- Themes menu split into dropdown groups
- Drag the audio on the timeline to move it, with snapping to beats and notes (hold Alt to move freely)
- Audio visualizers can be made smaller and moved anywhere in the view
- Lighter on the computer when idle, and no hitch the first time you press play
- Preview speed settings: quality (automatic by default, so the preview is drawn at the size it is shown), 30 fps cap and a lighter effects mode. Recorded video is always full quality
- UST and USTX lyrics show only the sung syllable: VCV and CVVC parts, breaths, arrows, pitch suffixes and symbols are hidden (can be turned off in Effects)
- Setting for how far apart notes can be and still share a pitch line
- Hover tips on every setting, switched on or off with the Tips button

### Fixes
- Pitch lines no longer break at note edges or hide behind the next note
- VSQX files start at the first bar instead of the empty count-in bar
- Synthesizer V vibrato set in note properties now shows in the pitch curve

## UtaViewer 1.3.0

### Major features
- Audio visualizer: scope line, spectrum bars or piano-key spectrum
- Character themes (dark and light)
- Theme files
- Transparent export
- Render queue

### Minor additions
- Viewer light/dark toggle
- Per-track note colors
- Romaji lyric line
- Loop region
- 4:3 export shape

### Fixes
- Synthesizer V Studio 2 files
- MIDI files opening as audio in Chrome
- Clearer errors for damaged files

## UtaViewer 1.2.0
- Theme toggle
- Portraits and lyric box
- Background image/video
- Export range
- Saving Looks
- Shortcuts
- Misc. fixes
