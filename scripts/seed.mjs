import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ── Insérer les événements ───────────────────────────────────
const eventsToInsert = [
  ['FHT 2026 - Food Hotel Tech', 'fht-2026', 'Paris Expo Porte de Versailles', '2026-06-09', '2026-06-11',
   'Le salon de reference des technologies pour la restauration, l hotel et le tourisme. 193 exposants.', '#C0392B', true],
  ['TechInnov 2026', 'techinnov-2026', 'Paris-Saclay', '2026-03-24', '2026-03-24',
   'Le salon des startups deeptech et des grands groupes innovants. Focus IA, robotique, healthtech, greentech.', '#2C3E7A', true]
];
for (const ev of eventsToInsert) {
  await conn.execute(
    'INSERT IGNORE INTO events (name, slug, location, startDate, endDate, description, color, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ev
  );
}
console.log('✅ Événements insérés');

const [evRows] = await conn.execute('SELECT id, slug FROM events');
const evMap = {};
for (const r of evRows) evMap[r.slug] = r.id;
console.log('Event IDs:', evMap);

// ── Charger les données JSON ─────────────────────────────────
const fhtData = JSON.parse(fs.readFileSync('/home/ubuntu/evenements_pro/fht_sodexo_final.json', 'utf8'));
const tiData  = JSON.parse(fs.readFileSync('/home/ubuntu/evenements_pro/techinnov_sodexo_final.json', 'utf8'));
console.log(`📦 FHT: ${fhtData.length} | TechInnov: ${tiData.length}`);

// Mapping thématique → tags visuels
function extractTags(themes, hashtags, name, desc) {
  const tags = [];
  const text = `${themes || ''} ${hashtags || ''} ${name || ''} ${desc || ''}`.toLowerCase();
  if (text.match(/food|restaur|cuisine|haccp|nutri|menu|repas|alimentation|traiteur/)) tags.push('🍽️ Food');
  if (text.match(/wellness|santé|health|bien.être|qvt|sport|médic|prévention/)) tags.push('🧘 Wellness');
  if (text.match(/robot|automat|ia |intelligence artificielle|machine|capteur|iot|drone/)) tags.push('🤖 Robotique & IA');
  if (text.match(/rse|green|énergie|durable|carbone|écologie|environnement/)) tags.push('🌱 RSE & GreenTech');
  if (text.match(/rh|planning|ressource humaine|paie|formation|recrutement/)) tags.push('👥 RH & Opérations');
  if (text.match(/paiement|caisse|pos|transaction|fidélité|commande/)) tags.push('💳 Paiement & POS');
  if (text.match(/hôtel|hospitality|pms|réservation|hébergement/)) tags.push('🏨 Hospitality');
  if (text.match(/data|analytics|dashboard|reporting|bi |business intelligence/)) tags.push('📊 Data & Analytics');
  if (tags.length === 0) tags.push('🔧 Autre');
  return tags;
}

// Scoring Sodexo basé sur le tier et les thèmes
const TIER_SCORE = { A: 85, B: 65, C: 40, D: 15 };

async function insertExhibitors(data, eventId, eventName) {
  let count = 0;
  for (const ex of data) {
    const tier = ['A','B','C','D'].includes(ex.tier) ? ex.tier : 'C';
    const tags = extractTags(ex.themes, ex.hashtags, ex.name, ex.description);
    const score = TIER_SCORE[tier] + Math.floor(Math.random() * 15);
    const themes = ex.themes || '';
    const desc = ex.description || '';
    const shortDesc = desc.length > 280 ? desc.substring(0, 277) + '...' : desc;
    const reason = ex.pertinence_sodexo || null;

    await conn.execute(
      `INSERT INTO exhibitors (eventId, name, stand, website, description, shortDescription, sector, themes, tier, sodexoScore, sodexoReason, thematicTags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        ex.name,
        ex.stand || null,
        ex.website || null,
        desc || null,
        shortDesc || null,
        themes || null,
        themes || null,
        tier,
        score,
        reason,
        JSON.stringify(tags)
      ]
    );
    count++;
    if (count % 50 === 0) process.stdout.write(`\r  ${eventName}: ${count}/${data.length}...`);
  }
  console.log(`\n✅ ${eventName}: ${count} exposants insérés`);
}

await insertExhibitors(fhtData, evMap['fht-2026'], 'FHT 2026');
await insertExhibitors(tiData, evMap['techinnov-2026'], 'TechInnov 2026');

// Vérification
const [counts] = await conn.execute(`
  SELECT e.name, COUNT(ex.id) as total,
    SUM(CASE WHEN ex.tier='A' THEN 1 ELSE 0 END) as tierA,
    SUM(CASE WHEN ex.tier='B' THEN 1 ELSE 0 END) as tierB,
    SUM(CASE WHEN ex.tier='C' THEN 1 ELSE 0 END) as tierC,
    SUM(CASE WHEN ex.tier='D' THEN 1 ELSE 0 END) as tierD
  FROM events e LEFT JOIN exhibitors ex ON e.id = ex.eventId
  GROUP BY e.id, e.name
`);
console.log('\n📊 Résumé:');
for (const r of counts) {
  console.log(`  ${r.name}: ${r.total} exposants (A:${r.tierA} B:${r.tierB} C:${r.tierC} D:${r.tierD})`);
}

await conn.end();
console.log('✅ Seed terminé !');
