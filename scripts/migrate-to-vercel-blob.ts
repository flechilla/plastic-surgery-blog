#!/usr/bin/env npx tsx
/**
 * Migrate all images to Vercel Blob
 * 
 * Uploads images from public/images/ to Vercel Blob
 * organized by folder structure, then updates content files.
 * 
 * Usage:
 *   BLOB_READ_WRITE_TOKEN="..." npx tsx scripts/migrate-to-vercel-blob.ts
 */

import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN required');
  process.exit(1);
}

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const MAPPING_FILE = path.join(process.cwd(), 'scripts/.blob-mapping.json');

interface BlobMapping {
  [localPath: string]: string; // local path -> blob URL
}

async function uploadImage(localPath: string, relativePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  const contentType = getContentType(localPath);
  
  // Use the relative path as the blob pathname (e.g., "images/blog/my-image.png")
  const blobPath = relativePath.replace(/^\//, '');
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType,
    token: BLOB_TOKEN,
  });
  
  return blob.url;
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

async function getAllImages(): Promise<string[]> {
  const patterns = [
    'public/images/**/*.jpg',
    'public/images/**/*.jpeg',
    'public/images/**/*.png',
    'public/images/**/*.gif',
    'public/images/**/*.webp',
    'public/images/**/*.svg',
  ];
  
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern);
    files.push(...matches);
  }
  return [...new Set(files)].sort();
}

async function loadExistingMapping(): Promise<BlobMapping> {
  if (fs.existsSync(MAPPING_FILE)) {
    return JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
  }
  return {};
}

async function saveMapping(mapping: BlobMapping): Promise<void> {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
}

async function updateContentFiles(mapping: BlobMapping): Promise<void> {
  // Update MDX files
  const mdxFiles = await glob('src/content/blog/**/*.mdx');
  for (const file of mdxFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let updated = false;
    
    for (const [localPath, blobUrl] of Object.entries(mapping)) {
      // Convert local path to URL path (e.g., public/images/blog/x.png -> /images/blog/x.png)
      const urlPath = '/' + localPath.replace(/^public\//, '');
      if (content.includes(urlPath)) {
        content = content.replaceAll(urlPath, blobUrl);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`  📝 Updated: ${file}`);
    }
  }
  
  // Update YAML clinic files
  const yamlFiles = await glob('src/content/clinics/**/*.yaml');
  for (const file of yamlFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    let updated = false;
    
    for (const [localPath, blobUrl] of Object.entries(mapping)) {
      const urlPath = '/' + localPath.replace(/^public\//, '');
      if (content.includes(urlPath)) {
        content = content.replaceAll(urlPath, blobUrl);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(file, content);
      console.log(`  📝 Updated: ${file}`);
    }
  }
}

async function main() {
  console.log('🚀 Migrating images to Vercel Blob\n');
  
  const images = await getAllImages();
  console.log(`📦 Found ${images.length} images to process\n`);
  
  const mapping = await loadExistingMapping();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const imagePath of images) {
    // Check if already uploaded
    if (mapping[imagePath]) {
      skipped++;
      continue;
    }
    
    const relativePath = imagePath.replace(/^public\//, '');
    
    try {
      const blobUrl = await uploadImage(imagePath, relativePath);
      mapping[imagePath] = blobUrl;
      uploaded++;
      console.log(`  ✅ ${relativePath}`);
      
      // Save mapping periodically
      if (uploaded % 10 === 0) {
        await saveMapping(mapping);
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      failed++;
      console.error(`  ❌ ${relativePath}: ${error}`);
    }
  }
  
  // Final save
  await saveMapping(mapping);
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`⏭️  Skipped (already uploaded): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n📄 Mapping saved to: ${MAPPING_FILE}`);
  
  // Update content files
  console.log('\n📝 Updating content files...\n');
  await updateContentFiles(mapping);
  
  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Review changes with: git diff');
  console.log('2. Commit: git add -A && git commit -m "feat: migrate images to Vercel Blob"');
  console.log('3. Deploy: git push origin main');
}

main().catch(console.error);
