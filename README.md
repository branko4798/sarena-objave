# Šarena pidžama — zakazane objave

`schedule.json` (pravi ga `../raspored.py` iz `oglasi/reels-organski/raspored-zajednicki.json`) → GitHub Actions
`Objavi` objavljuje dospelu objavu (karusel ili reels) na Instagram i Facebook i upisuje je u `posted.json`.
Termini (Beograd): karusel 20:30; na dan sa reelsom karusel 12:00, reels 20:30. Okida `budilnik/` (Cloudflare).
Slike (`img/`) i videi (`video/`) služe se preko GitHub Pages. Secrets: `META_TOKEN`, `IG_ID`.
Ručno: Actions → Objavi → Run (dry_run=1 proba, only_id=k03-10-12 ili r<video_id>).
