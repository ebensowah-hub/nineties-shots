import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

interface MigrationStats {
  discovered: number;
  created: number;
  skipped: number;
  failed: number;
  details: {
    collection: string;
    discovered: number;
    created: number;
    skipped: number;
    failed: number;
  }[];
}

export async function runMigration(): Promise<MigrationStats> {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Firebase applet config not found at ${configPath}`);
  }
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const jsonDbPath = path.join(process.cwd(), 'data', 'ninetiesshots_db.json');
  if (!fs.existsSync(jsonDbPath)) {
    throw new Error(`Source JSON database not found at ${jsonDbPath}`);
  }
  const jsonData = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));

  const stats: MigrationStats = {
    discovered: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const collectionsToMigrate: {
    key: string;
    targetCollection: string;
    getId: (item: any) => string;
    isSingleton?: boolean;
  }[] = [
    { key: 'settings', targetCollection: 'settings', getId: () => 'global', isSingleton: true },
    { key: 'adminUsers', targetCollection: 'adminUsers', getId: (i) => i.id },
    { key: 'portfolio', targetCollection: 'portfolio', getId: (i) => i.id },
    { key: 'services', targetCollection: 'services', getId: (i) => i.id },
    { key: 'inquiries', targetCollection: 'inquiries', getId: (i) => i.id },
    { key: 'clients', targetCollection: 'clients', getId: (i) => i.id },
    { key: 'bookings', targetCollection: 'bookings', getId: (i) => i.id },
    { key: 'expenses', targetCollection: 'expenses', getId: (i) => i.id },
    { key: 'auditLogs', targetCollection: 'auditLogs', getId: (i) => i.id },
    { key: 'analyticsEvents', targetCollection: 'analyticsEvents', getId: (i) => i.id },
    { key: 'conversionHistory', targetCollection: 'conversionHistory', getId: (i) => i.id },
    { key: 'sessions', targetCollection: 'sessions', getId: (i) => i.token },
  ];

  for (const colDef of collectionsToMigrate) {
    const rawVal = jsonData[colDef.key];
    const items: any[] = colDef.isSingleton ? (rawVal ? [rawVal] : []) : (Array.isArray(rawVal) ? rawVal : []);
    
    const colStat = {
      collection: colDef.targetCollection,
      discovered: items.length,
      created: 0,
      skipped: 0,
      failed: 0,
    };

    stats.discovered += items.length;

    for (const item of items) {
      const docId = colDef.getId(item);
      if (!docId) {
        console.warn(`[MIGRATION] Missing ID for item in ${colDef.targetCollection}`);
        colStat.failed++;
        stats.failed++;
        continue;
      }

      const docRef = doc(db, colDef.targetCollection, docId);
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          colStat.skipped++;
          stats.skipped++;
        } else {
          await setDoc(docRef, item);
          colStat.created++;
          stats.created++;
        }
      } catch (err) {
        console.error(`[MIGRATION] Failed to migrate ${colDef.targetCollection}/${docId}:`, err);
        colStat.failed++;
        stats.failed++;
      }
    }

    stats.details.push(colStat);
  }

  return stats;
}

if (process.argv[1]?.endsWith('migrate-firestore.ts')) {
  console.log('====================================================');
  console.log('  NINETIES SHOTS — FIRESTORE IDEMPOTENT MIGRATION   ');
  console.log('====================================================');
  runMigration()
    .then((stats) => {
      console.log('\n--- Migration Summary by Collection ---');
      for (const d of stats.details) {
        console.log(`- ${d.collection.padEnd(20)}: Discovered: ${d.discovered}, Created: ${d.created}, Skipped: ${d.skipped}, Failed: ${d.failed}`);
      }
      console.log('\n--- Overall Migration Totals ---');
      console.log(`Total Records Discovered: ${stats.discovered}`);
      console.log(`Total Records Created:    ${stats.created}`);
      console.log(`Total Records Skipped:    ${stats.skipped}`);
      console.log(`Total Failures:           ${stats.failed}`);
      console.log('====================================================');
      if (stats.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}
