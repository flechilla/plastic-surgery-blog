#!/usr/bin/env npx tsx
/**
 * Logo Extractor Script
 * Extracts logos from clinic websites and saves them locally
 * 
 * Usage: npx tsx scripts/extract-logos.ts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CLINICS_DIR = path.join(process.cwd(), 'src/content/clinics');
const LOGOS_DIR = path.join(process.cwd(), 'public/images/clinics/logos');

// Ensure logos directory exists
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

interface ClinicData {
  name: string;
  slug: string;
  website?: string;
  logo?: string;
  [key: string]: unknown;
}

async function extractLogoUrl(websiteUrl: string): Promise<string | null> {
  try {
    console.log(`  Fetching: ${websiteUrl}`);
    
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log(`  ⚠️ HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Try multiple strategies to find the logo
    const strategies = [
      // 1. Look for og:image meta tag (often the logo)
      () => {
        const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        return match?.[1];
      },
      // 2. Look for logo in header/nav with common class names
      () => {
        const logoPatterns = [
          /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
          /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
          /<img[^>]*id=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
          /<img[^>]*src=["']([^"']+logo[^"']+)["']/i,
          /<a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
        ];
        
        for (const pattern of logoPatterns) {
          const match = html.match(pattern);
          if (match?.[1]) return match[1];
        }
        return null;
      },
      // 3. Look in header for first image
      () => {
        const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
        if (headerMatch) {
          const imgMatch = headerMatch[1].match(/<img[^>]*src=["']([^"']+)["']/i);
          return imgMatch?.[1];
        }
        return null;
      },
      // 4. Look for site icon/favicon (fallback)
      () => {
        const iconPatterns = [
          /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
          /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
        ];
        
        for (const pattern of iconPatterns) {
          const match = html.match(pattern);
          if (match?.[1]) return match[1];
        }
        return null;
      },
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result) {
        // Convert relative URLs to absolute
        if (result.startsWith('//')) {
          return `https:${result}`;
        } else if (result.startsWith('/')) {
          const baseUrl = new URL(websiteUrl);
          return `${baseUrl.origin}${result}`;
        } else if (!result.startsWith('http')) {
          const baseUrl = new URL(websiteUrl);
          return `${baseUrl.origin}/${result}`;
        }
        return result;
      }
    }

    return null;
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

async function downloadLogo(logoUrl: string, slug: string): Promise<string | null> {
  try {
    console.log(`  Downloading logo from: ${logoUrl.slice(0, 80)}...`);
    
    const response = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`  ⚠️ Logo download failed: HTTP ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let extension = 'png';
    
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = 'jpg';
    } else if (contentType.includes('svg')) {
      extension = 'svg';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
    } else if (contentType.includes('gif')) {
      extension = 'gif';
    }

    const filename = `${slug}.${extension}`;
    const filepath = path.join(LOGOS_DIR, filename);
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Skip if too small (likely a tracking pixel)
    if (buffer.length < 500) {
      console.log(`  ⚠️ Image too small (${buffer.length} bytes), skipping`);
      return null;
    }

    fs.writeFileSync(filepath, buffer);
    console.log(`  ✅ Saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
    
    return `/images/clinics/logos/${filename}`;
  } catch (error) {
    console.log(`  ❌ Download error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return null;
  }
}

async function processClinic(yamlPath: string): Promise<boolean> {
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const data = yaml.load(content) as ClinicData;
  
  // Skip if already has a logo
  if (data.logo) {
    console.log(`⏭️  ${data.name} - already has logo`);
    return false;
  }
  
  // Skip if no website
  if (!data.website) {
    console.log(`⏭️  ${data.name} - no website`);
    return false;
  }

  console.log(`\n🔍 ${data.name}`);
  
  // Extract logo URL from website
  const logoUrl = await extractLogoUrl(data.website);
  
  if (!logoUrl) {
    console.log(`  ⚠️ No logo found`);
    return false;
  }

  // Download the logo
  const localPath = await downloadLogo(logoUrl, data.slug);
  
  if (!localPath) {
    return false;
  }

  // Update the YAML file
  data.logo = localPath;
  const updatedYaml = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
  
  fs.writeFileSync(yamlPath, updatedYaml);
  console.log(`  📝 Updated YAML`);
  
  return true;
}

async function main() {
  console.log('🖼️  Logo Extractor for Clinic Directory\n');
  console.log(`Clinics directory: ${CLINICS_DIR}`);
  console.log(`Logos directory: ${LOGOS_DIR}\n`);

  const files = fs.readdirSync(CLINICS_DIR).filter(f => f.endsWith('.yaml'));
  console.log(`Found ${files.length} clinic files\n`);

  let processed = 0;
  let success = 0;
  
  // Process with rate limiting
  for (const file of files) {
    const yamlPath = path.join(CLINICS_DIR, file);
    
    try {
      const updated = await processClinic(yamlPath);
      if (updated) success++;
      processed++;
      
      // Rate limit: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log(`\n✨ Done! Extracted ${success} logos from ${processed} clinics`);
}

main().catch(console.error);
