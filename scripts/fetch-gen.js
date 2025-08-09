// scripts/fetch-gen.js
// Uso: node scripts/fetch-gen.js [GEN]

const fs = require('fs/promises');
const path = require('path');

const GEN = process.argv[2] || '1';
const OUT_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(OUT_DIR, `gen${GEN}.json`);

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function main() {
  console.log(`Obteniendo generación ${GEN} desde PokeAPI...`);
  const genUrl = `https://pokeapi.co/api/v2/generation/${GEN}`;
  const gen = await fetchJson(genUrl);

  // species contiene nombres de los pokémon de la generación
  const species = gen.pokemon_species.map(s => s.name).sort((a,b) => a.localeCompare(b));
  console.log(`Encontradas ${species.length} especies.`);

  const pokes = [];
  const batchSize = 10;      // número de peticiones concurrentes (ajusta si necesitas)
  const pauseBetweenBatches = 300; // ms de espera entre batches (reduce riesgo de rate-limit)

  for (let i = 0; i < species.length; i += batchSize) {
    const batch = species.slice(i, i + batchSize);
    console.log(`Procesando ${i + 1}..${i + batch.length} de ${species.length}...`);
    const promises = batch.map(async name => {
      try {
        const j = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${name}`);
        return {
          id: j.id,
          name: j.name,
          types: j.types.map(t => t.type.name),
          stats: Object.fromEntries(j.stats.map(s => [s.stat.name, s.base_stat])),
          sprite: j.sprites.front_default,
          artwork: j.sprites.other?.['official-artwork']?.front_default || j.sprites.front_default,
          height: j.height,
          weight: j.weight,
          base_experience: j.base_experience,
          abilities: j.abilities.map(a => a.ability.name)
        };
      } catch (err) {
        console.error('Error fetch pokemon', name, err.message);
        return null;
      }
    });

    const res = await Promise.all(promises);
    pokes.push(...res.filter(x => x));
    await delay(pauseBetweenBatches);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(pokes, null, 2), 'utf8');
  console.log(`Guardado ${pokes.length} registros en ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
