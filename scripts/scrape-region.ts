#!/usr/bin/env npx tsx
/**
 * Region-based clinic scraping pipeline
 * 
 * Processes cities one-by-one within a region, tracks status,
 * uploads new images to Vercel Blob, and deploys.
 * 
 * Usage:
 *   npx tsx scripts/scrape-region.ts --region south-florida          # Next queued city
 *   npx tsx scripts/scrape-region.ts --region south-florida --all    # All queued cities
 *   npx tsx scripts/scrape-region.ts --status                        # Show all regions
 *   npx tsx scripts/scrape-region.ts --status --region south-florida # Show one region
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCATIONS_FILE = path.join(__dirname, '.clinic-locations.json');
const BLOB_MAPPING_FILE = path.join(__dirname, '.blob-mapping.json');
const PROJECT_ROOT = path.resolve(__dirname, '..');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// ── Types ──────────────────────────────────────────────

interface CityEntry {
  city: string;
  state: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  clinics?: number;
  date?: string;
  error?: string;
}

interface Region {
  name: string;
  cities: CityEntry[];
}

interface LocationsData {
  regions: Record<string, Region>;
}

// ── Helpers ────────────────────────────────────────────

function loadLocations(): LocationsData {
  return JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf-8'));
}

function saveLocations(data: LocationsData): void {
  fs.writeFileSync(LOCATIONS_FILE, JSON.stringify(data, null, 2) + '\n');
}

function loadBlobMapping(): Record<string, string> {
  if (fs.existsSync(BLOB_MAPPING_FILE)) {
    return JSON.parse(fs.readFileSync(BLOB_MAPPING_FILE, 'utf-8'));
  }
  return {};
}

function saveBlobMapping(mapping: Record<string, string>): void {
  fs.writeFileSync(BLOB_MAPPING_FILE, JSON.stringify(mapping, null, 2));
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

// ── Status Display ─────────────────────────────────────

function showStatus(regionFilter?: string): void {
  const data = loadLocations();
  
  console.log('\n📊 Clinic Discovery Status\n');
  
  let totalDone = 0;
  let totalQueued = 0;
  let totalClinics = 0;
  
  for (const [regionId, region] of Object.entries(data.regions)) {
    if (regionFilter && regionId !== regionFilter) continue;
    
    const done = region.cities.filter(c => c.status === 'done');
    const queued = region.cities.filter(c => c.status === 'queued');
    const failed = region.cities.filter(c => c.status === 'failed');
    const running = region.cities.filter(c => c.status === 'running');
    const clinicCount = done.reduce((sum, c) => sum + (c.clinics || 0), 0);
    
    totalDone += done.length;
    totalQueued += queued.length;
    totalClinics += clinicCount;
    
    console.log(`┌─ ${region.name} (${regionId})`);
    console.log(`│  Done: ${done.length}/${region.cities.length} | Clinics: ${clinicCount}`);
    
    for (const city of region.cities) {
      const icon = city.status === 'done' ? '✅' 
        : city.status === 'running' ? '🔄' 
        : city.status === 'failed' ? '❌' 
        : '⏳';
      const info = city.status === 'done' 
        ? `${city.clinics} clinics (${city.date})` 
        : city.status === 'failed' 
        ? `Error: ${city.error}` 
        : city.status;
      console.log(`│  ${icon} ${city.city}, ${city.state} — ${info}`);
    }
    console.log('│');
  }
  
  if (!regionFilter) {
    console.log(`\n📈 Total: ${totalDone} cities done, ${totalQueued} queued, ${totalClinics} clinics\n`);
  }
}

// ── Upload New Images to Vercel Blob ───────────────────

async function uploadNewImages(): Promise<number> {
  if (!BLOB_TOKEN) {
    console.log('  ⚠️  No BLOB_READ_WRITE_TOKEN — skipping blob upload');
    return 0;
  }
  
  const mapping = loadBlobMapping();
  const logosDir = path.join(PROJECT_ROOT, 'public/images/clinics/logos');
  
  if (!fs.existsSync(logosDir)) return 0;
  
  const files = fs.readdirSync(logosDir).filter(f => 
    /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f)
  );
  
  let uploaded = 0;
  
  for (const file of files) {
    const localPath = `public/images/clinics/logos/${file}`;
    if (mapping[localPath]) continue; // already uploaded
    
    const fullPath = path.join(logosDir, file);
    const buffer = fs.readFileSync(fullPath);
    
    try {
      const blob = await put(`images/clinics/logos/${file}`, buffer, {
        access: 'public',
        contentType: getContentType(file),
        token: BLOB_TOKEN,
      });
      
      mapping[localPath] = blob.url;
      uploaded++;
      
      // Rate limit
      await new Promise(r => setTimeout(r, 50));
    } catch (err) {
      console.log(`  ⚠️  Failed to upload ${file}: ${err}`);
    }
  }
  
  if (uploaded > 0) {
    saveBlobMapping(mapping);
    
    // Update YAML files to use blob URLs
    const clinicsDir = path.join(PROJECT_ROOT, 'src/content/clinics');
    const yamlFiles = fs.readdirSync(clinicsDir).filter(f => f.endsWith('.yaml'));
    
    for (const file of yamlFiles) {
      const filePath = path.join(clinicsDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      let updated = false;
      
      for (const [localPath, blobUrl] of Object.entries(mapping)) {
        const urlPath = '/' + localPath.replace(/^public\//, '');
        if (content.includes(urlPath)) {
          content = content.replaceAll(urlPath, blobUrl);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
      }
    }
  }
  
  return uploaded;
}

// ── Fix Empty Reviews ──────────────────────────────────

function fixEmptyReviews(): void {
  const clinicsDir = path.join(PROJECT_ROOT, 'src/content/clinics');
  const files = fs.readdirSync(clinicsDir).filter(f => f.endsWith('.yaml'));
  
  for (const file of files) {
    const filePath = path.join(clinicsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix "reviews:\n\nlogo:" → "reviews: []\nlogo:"
    // (empty reviews that would be parsed as null)
    const fixed = content.replace(/^reviews:\s*\n(?=logo:)/m, 'reviews: []\n');
    
    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed);
    }
  }
}

// ── Scrape a Single City ───────────────────────────────

async function scrapeCity(city: CityEntry): Promise<{ clinics: number }> {
  console.log(`\n🔍 Scraping: ${city.city}, ${city.state}\n`);
  
  const cmd = `node_modules/.bin/tsx scripts/rediscover-clinics.ts --city "${city.city}" --state ${city.state}`;
  
  const output = execSync(cmd, {
    cwd: PROJECT_ROOT,
    env: { ...process.env, GOOGLE_API_KEY },
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
    timeout: 300_000, // 5 min max
  });
  
  console.log(output);
  
  // Parse clinic count from output
  const match = output.match(/Total clinics added: (\d+)/);
  const clinics = match ? parseInt(match[1], 10) : 0;
  
  return { clinics };
}

// ── Deploy Changes ─────────────────────────────────────

function deploy(message: string): void {
  console.log('\n🚀 Deploying...\n');
  
  try {
    execSync('git add -A', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    execSync(`git commit -m "${message}"`, { cwd: PROJECT_ROOT, stdio: 'inherit' });
    execSync('git push origin main', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    
    // Run deploy.sh manually (webhook may timeout)
    execSync('./deploy.sh', { 
      cwd: PROJECT_ROOT, 
      stdio: 'inherit',
      timeout: 120_000,
    });
    
    console.log('✅ Deployed!\n');
  } catch (err) {
    console.log('⚠️  Deploy issue — may need manual deploy');
  }
}

// ── Build Check ────────────────────────────────────────

function buildCheck(): boolean {
  try {
    execSync('npm run build', { 
      cwd: PROJECT_ROOT, 
      stdio: 'pipe',
      timeout: 120_000,
    });
    return true;
  } catch {
    return false;
  }
}

// ── Main ───────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  
  // Status mode
  if (args.includes('--status')) {
    const regionIdx = args.indexOf('--region');
    const region = regionIdx !== -1 ? args[regionIdx + 1] : undefined;
    showStatus(region);
    return;
  }
  
  // Region required for scraping
  const regionIdx = args.indexOf('--region');
  if (regionIdx === -1) {
    console.log('Usage:');
    console.log('  npx tsx scripts/scrape-region.ts --region south-florida');
    console.log('  npx tsx scripts/scrape-region.ts --region south-florida --all');
    console.log('  npx tsx scripts/scrape-region.ts --status');
    process.exit(1);
  }
  
  const regionId = args[regionIdx + 1];
  const processAll = args.includes('--all');
  
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY required');
    process.exit(1);
  }
  
  const data = loadLocations();
  const region = data.regions[regionId];
  
  if (!region) {
    console.error(`❌ Region "${regionId}" not found`);
    console.log('Available:', Object.keys(data.regions).join(', '));
    process.exit(1);
  }
  
  const queued = region.cities.filter(c => c.status === 'queued');
  
  if (queued.length === 0) {
    console.log(`\n✅ All cities in ${region.name} are done!\n`);
    showStatus(regionId);
    return;
  }
  
  const toProcess = processAll ? queued : [queued[0]];
  
  console.log(`\n📋 Processing ${toProcess.length} city(s) in ${region.name}\n`);
  
  for (const cityEntry of toProcess) {
    // Mark as running
    cityEntry.status = 'running';
    saveLocations(data);
    
    try {
      const result = await scrapeCity(cityEntry);
      
      // Fix empty reviews before build
      fixEmptyReviews();
      
      // Upload new logos to Vercel Blob
      console.log('\n📤 Uploading new images to Vercel Blob...');
      const uploaded = await uploadNewImages();
      console.log(`   ${uploaded} new images uploaded\n`);
      
      // Build check
      console.log('🔨 Build check...');
      if (!buildCheck()) {
        console.log('❌ Build failed — fixing...');
        fixEmptyReviews();
        if (!buildCheck()) {
          throw new Error('Build failed after fix attempt');
        }
      }
      console.log('✅ Build passed\n');
      
      // Deploy
      deploy(`feat(clinics): add ${cityEntry.city} ${cityEntry.state} clinics (${result.clinics} found)`);
      
      // Mark as done
      cityEntry.status = 'done';
      cityEntry.clinics = result.clinics;
      cityEntry.date = new Date().toISOString().split('T')[0];
      delete cityEntry.error;
      saveLocations(data);
      
      console.log(`\n✅ ${cityEntry.city}, ${cityEntry.state}: ${result.clinics} clinics\n`);
      
      // Pause between cities
      if (processAll && toProcess.indexOf(cityEntry) < toProcess.length - 1) {
        console.log('⏳ Pausing 5s before next city...\n');
        await new Promise(r => setTimeout(r, 5000));
      }
      
    } catch (err: any) {
      cityEntry.status = 'failed';
      cityEntry.error = err.message?.slice(0, 200) || 'Unknown error';
      saveLocations(data);
      console.error(`\n❌ Failed: ${cityEntry.city}, ${cityEntry.state}: ${err.message}\n`);
      
      if (!processAll) break;
    }
  }
  
  // Final status
  showStatus(regionId);
}

main().catch(console.error);
