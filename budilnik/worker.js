// Budilnik za Šarena pidžama objave (kopija budilnika za Dosije).
//
// GitHub-ov `schedule` nije rok nego molba: 08.10.2026. (prvi dan) nije okinuo
// nijednom i k12 je objavljen ručno u 21:26. Pozvan spolja (workflow_dispatch)
// posao kreće istog sekunda. Zato sat stoji ovde, a GitHub-ov raspored ostaje
// kao rezerva. Duple objave nisu moguće: `concurrency: objavi` ređa prolaze, a
// publish.py preskače sve što je već u posted.json.
//
//   12:03 i 20:33 Beograd — okine objavu (karusel u 12h na dan sa reelsom, inače 20:30)
//   13, 14, 21, 22, 23h   — proveri posted.json; ako dospela objava nije izašla
//                          i ništa nije u toku, okine ponovo

const API = "https://api.github.com";
const TERMINI = ["12:03", "20:33"];
const PROVERE = [13, 14, 21, 22, 23];

function beograd(kad) {
  const d = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(kad).map((p) => [p.type, p.value]),
  );
  return { sat: +d.hour, hm: `${d.hour}:${d.minute}`, sada: `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}` };
}

function zaglavlja(env) {
  return {
    Authorization: `Bearer ${env.GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "budilnik-sarena", // GitHub odbija zahtev bez ovoga
  };
}

async function okini(env) {
  const r = await fetch(`${API}/repos/${env.REPO}/actions/workflows/${env.WORKFLOW}/dispatches`, {
    method: "POST",
    headers: zaglavlja(env),
    body: JSON.stringify({ ref: env.GRANA, inputs: { dry_run: "0", only_id: "" } }),
  });
  if (!r.ok) throw new Error(`dispatch → ${r.status} ${await r.text()}`);
}

// Repo je javan, pa se fajlovi čitaju bez tokena (token ima samo Actions dozvolu).
async function fajl(env, ime) {
  const r = await fetch(`https://raw.githubusercontent.com/${env.REPO}/${env.GRANA}/${ime}?t=${Date.now()}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${ime} → ${r.status}`);
  return r.json();
}

async function proveri(env, sada) {
  const raspored = await fajl(env, "schedule.json");
  const objavljeno = (await fajl(env, "posted.json")) || {};
  const kasni = raspored.filter(
    (p) => `${p.date}T${p.time}` <= sada && !(objavljeno[p.id]?.ig && objavljeno[p.id]?.fb),
  );
  if (!kasni.length) return console.log("Sve objavljeno.");

  const r = await fetch(
    `${API}/repos/${env.REPO}/actions/workflows/${env.WORKFLOW}/runs?per_page=5`,
    { headers: zaglavlja(env) },
  );
  if (!r.ok) throw new Error(`runs → ${r.status} ${await r.text()}`);
  const { workflow_runs } = await r.json();
  if (workflow_runs.some((w) => w.status !== "completed")) return console.log("Prolaz je u toku.");

  await okini(env);
  console.log(`Kasni ${kasni[0].id} (${kasni[0].name}) — okinuto ponovo.`);
}

export default {
  async scheduled(event, env) {
    const { sat, hm, sada } = beograd(new Date(event.scheduledTime));
    if (TERMINI.includes(hm)) {
      await okini(env);
      console.log("Okinuto u termin.");
    } else if (PROVERE.includes(sat) && hm.endsWith(":03")) {
      await proveri(env, sada);
    }
  },
};
