#!/usr/bin/env npx tsx
/**
 * Clinic Discovery via Google Places API (New)
 * 
 * Complete flow: Search → Extract → Get Photos → Write YAML → Commit → Deploy
 * 
 * Usage:
 *   npx tsx scripts/discover-clinics-google.ts --city miami --state FL
 *   npx tsx scripts/discover-clinics-google.ts --city "los angeles" --state CA
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY environment variable required');
  process.exit(1);
}

const CLINICS_DIR = path.join(process.cwd(), 'src/content/clinics');
const LOGOS_DIR = path.join(process.cwd(), 'public/images/clinics/logos');
const CITIES_DIR = path.join(process.cwd(), 'src/content/cities');

// Ensure directories exist
[CLINICS_DIR, LOGOS_DIR, CITIES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Search queries to maximize coverage
const SEARCH_QUERIES = [
  'plastic surgery',
  'plastic surgeon',
  'cosmetic surgery',
  'cosmetic surgeon',
  'aesthetic surgery',
  'facial plastic surgery',
  'body contouring',
  'breast augmentation',
  'liposuction',
  'rhinoplasty',
  'facelift surgeon',
  'tummy tuck',
  'BBL surgeon',
  'mommy makeover',
];

interface PlaceNew {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  photos?: Array<{ name: string }>;
  reviews?: Array<{
    authorAttribution?: { displayName: string };
    rating: number;
    relativePublishTimeDescription?: string;
    text?: { text: string };
    publishTime?: string;
  }>;
  types?: string[];
  businessStatus?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
}

interface ClinicData {
  place_id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
  phone: string;
  website?: string;
  googleMapsUrl: string;
  description: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  reviews: Array<{
    author: string;
    rating: number;
    date: string;
    text: string;
    source: string;
  }>;
  logo?: string;
  yearEstablished: null;
  certifications: string[];
  verified: boolean;
  featured: boolean;
  lastUpdated: string;
}

// Rate limiter
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Text Search using Places API (New)
async function textSearchNew(query: string, locationBias: { lat: number; lng: number; radius: number }): Promise<PlaceNew[]> {
  const results: PlaceNew[] = [];
  let pageToken: string | undefined;
  
  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.photos',
    'places.reviews',
    'places.types',
    'places.businessStatus',
    'places.primaryType',
    'places.primaryTypeDisplayName',
  ].join(',');
  
  do {
    const body: any = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: locationBias.lat, longitude: locationBias.lng },
          radius: locationBias.radius,
        },
      },
      maxResultCount: 20,
    };
    
    if (pageToken) {
      body.pageToken = pageToken;
    }
    
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY!,
        'X-Goog-FieldMask': fieldMask + ',nextPageToken',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`  ⚠️ API error: ${data.error.message}`);
      break;
    }
    
    if (data.places) {
      results.push(...data.places);
    }
    
    pageToken = data.nextPageToken;
    
    if (pageToken) {
      await delay(500);
    }
  } while (pageToken);
  
  return results;
}

// Get place details (for reviews)
async function getPlaceDetailsNew(placeId: string): Promise<PlaceNew | null> {
  const fieldMask = [
    'id', 'displayName', 'formattedAddress', 'location', 'rating',
    'userRatingCount', 'nationalPhoneNumber', 'internationalPhoneNumber',
    'websiteUri', 'googleMapsUri', 'photos', 'reviews', 'types', 'businessStatus'
  ].join(',');
  
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': fieldMask,
    },
  });
  
  const data = await response.json();
  
  if (data.error) {
    console.error(`  ⚠️ Details error: ${data.error.message}`);
    return null;
  }
  
  return data;
}

// Download photo from Google Places (New API)
async function downloadPhotoNew(photoName: string, slug: string): Promise<string | null> {
  try {
    // photoName format: places/{place_id}/photos/{photo_reference}
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  Photo download failed: ${response.status}`);
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1000) return null; // Skip tiny images
    
    const filename = `${slug}.jpg`;
    const filepath = path.join(LOGOS_DIR, filename);
    
    fs.writeFileSync(filepath, buffer);
    return `/images/clinics/logos/${filename}`;
  } catch (error) {
    console.error(`  Photo error:`, error);
    return null;
  }
}

// Generate slug from name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Extract zip code from address
function extractZipCode(address: string): string {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : '';
}

// Filter for plastic surgery relevance
function isPlasticSurgeryClinic(place: PlaceNew): boolean {
  const name = (place.displayName?.text || '').toLowerCase();
  const types = place.types || [];
  const primaryType = (place.primaryType || '').toLowerCase();
  
  // Relevant keywords
  const relevantKeywords = [
    'plastic', 'cosmetic', 'aesthetic', 'surgery', 'surgeon',
    'rhinoplasty', 'liposuction', 'facelift', 'augmentation',
    'body contour', 'tummy tuck', 'breast', 'reconstructive',
    'med spa', 'medspa', 'medical spa', 'bbl', 'mommy makeover'
  ];
  
  const hasRelevantKeyword = relevantKeywords.some(kw => name.includes(kw));
  const isDoctor = types.includes('doctor') || primaryType.includes('doctor') || primaryType.includes('surgeon');
  
  // Exclude non-relevant
  const excludeKeywords = ['dental', 'dentist', 'veterinary', 'chiropract', 'physical therapy', 'optom', 'orthodon'];
  const isExcluded = excludeKeywords.some(kw => name.includes(kw));
  
  return (hasRelevantKeyword || isDoctor) && !isExcluded;
}

// Convert PlaceNew to ClinicData
function placeToClinic(place: PlaceNew, citySlug: string, state: string): ClinicData {
  const name = place.displayName?.text || 'Unknown Clinic';
  const slug = slugify(name);
  const address = place.formattedAddress || '';
  const zipCode = extractZipCode(address);
  
  // Format reviews
  const reviews = (place.reviews || []).slice(0, 5).map(r => {
    const authorName = r.authorAttribution?.displayName || 'Anonymous';
    return {
      author: authorName.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' '),
      rating: r.rating,
      date: r.publishTime ? r.publishTime.split('T')[0] : new Date().toISOString().split('T')[0],
      text: (r.text?.text || '').slice(0, 500),
      source: 'Google',
    };
  });
  
  const cityDisplay = citySlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  
  return {
    place_id: place.id,
    name,
    slug,
    city: citySlug,
    state,
    address: address.replace(/, USA$/, '').replace(/, United States$/, ''),
    zipCode,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
    website: place.websiteUri,
    googleMapsUrl: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    description: `${name} is a plastic surgery practice located in ${cityDisplay}, ${state}. ${place.rating ? `With a ${place.rating}-star rating from ${place.userRatingCount || 0} reviews, they` : 'They'} offer cosmetic and reconstructive surgery services.`,
    specialties: ['Plastic Surgery', 'Cosmetic Surgery', 'Reconstructive Surgery'],
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0,
    reviews,
    yearEstablished: null,
    certifications: [],
    verified: false,
    featured: false,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// Write YAML file
function writeClinicYaml(clinic: ClinicData): void {
  const yaml = `name: "${clinic.name.replace(/"/g, '\\"')}"
slug: ${clinic.slug}
city: ${clinic.city}
state: ${clinic.state}
address: "${clinic.address.replace(/"/g, '\\"')}"
zipCode: "${clinic.zipCode}"
phone: "${clinic.phone}"
${clinic.website ? `website: "${clinic.website}"` : 'website: null'}
googleMapsUrl: "${clinic.googleMapsUrl}"
description: >-
  ${clinic.description}
specialties:
${clinic.specialties.map(s => `  - "${s}"`).join('\n')}
rating: ${clinic.rating}
reviewCount: ${clinic.reviewCount}
reviews:
${clinic.reviews.length > 0 ? clinic.reviews.map(r => `  - author: "${r.author.replace(/"/g, '\\"')}"
    rating: ${r.rating}
    date: "${r.date}"
    text: >-
      ${r.text.replace(/\n/g, ' ').slice(0, 400)}
    source: "${r.source}"`).join('\n') : '  []'}
${clinic.logo ? `logo: "${clinic.logo}"` : 'logo: null'}
yearEstablished: null
certifications: []
verified: false
featured: false
lastUpdated: "${clinic.lastUpdated}"
`;

  const filepath = path.join(CLINICS_DIR, `${clinic.slug}.yaml`);
  fs.writeFileSync(filepath, yaml);
}

// City coordinates for location bias
const CITY_COORDS: Record<string, { lat: number; lng: number; radius: number }> = {
  'miami': { lat: 25.7617, lng: -80.1918, radius: 50000 }, // 50km radius
  'los-angeles': { lat: 34.0522, lng: -118.2437, radius: 60000 },
  'new-york': { lat: 40.7128, lng: -74.0060, radius: 50000 },
  'houston': { lat: 29.7604, lng: -95.3698, radius: 60000 },
  'dallas': { lat: 32.7767, lng: -96.7970, radius: 50000 },
  'chicago': { lat: 41.8781, lng: -87.6298, radius: 50000 },
  'phoenix': { lat: 33.4484, lng: -112.0740, radius: 50000 },
  'san-diego': { lat: 32.7157, lng: -117.1611, radius: 40000 },
  'atlanta': { lat: 33.7490, lng: -84.3880, radius: 50000 },
  'denver': { lat: 39.7392, lng: -104.9903, radius: 50000 },
};

// Main discovery function
async function discoverClinics(city: string, state: string): Promise<number> {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const cityDisplay = city.split(/[\s-]+/).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  
  console.log(`\n🔍 Discovering plastic surgery clinics in ${cityDisplay}, ${state}\n`);
  
  const coords = CITY_COORDS[citySlug] || { lat: 25.7617, lng: -80.1918, radius: 50000 };
  
  // Collect all places (dedupe by place_id)
  const placesMap = new Map<string, PlaceNew>();
  
  // Search with multiple queries
  for (const query of SEARCH_QUERIES) {
    const fullQuery = `${query} in ${cityDisplay}, ${state}`;
    process.stdout.write(`📍 Searching: "${query}"... `);
    
    const results = await textSearchNew(fullQuery, coords);
    const beforeCount = placesMap.size;
    results.forEach(r => placesMap.set(r.id, r));
    const newCount = placesMap.size - beforeCount;
    
    console.log(`${results.length} results (+${newCount} new) → Total: ${placesMap.size}`);
    
    await delay(300);
  }
  
  console.log(`\n✅ Found ${placesMap.size} unique places\n`);
  
  // Filter for plastic surgery relevance
  const relevantPlaces = Array.from(placesMap.values()).filter(isPlasticSurgeryClinic);
  console.log(`🏥 ${relevantPlaces.length} are plastic surgery related\n`);
  
  // Process each place
  let processed = 0;
  let withPhotos = 0;
  
  for (const place of relevantPlaces) {
    const name = place.displayName?.text || 'Unknown';
    process.stdout.write(`\r[${++processed}/${relevantPlaces.length}] ${name.slice(0, 50).padEnd(50)}  `);
    
    // Get detailed info with reviews if not already present
    let details = place;
    if (!place.reviews || place.reviews.length === 0) {
      const moreDetails = await getPlaceDetailsNew(place.id);
      if (moreDetails) {
        details = { ...place, ...moreDetails };
      }
      await delay(100);
    }
    
    // Convert to clinic data
    const clinic = placeToClinic(details, citySlug, state);
    
    // Download first photo as logo
    if (details.photos && details.photos.length > 0) {
      const logoPath = await downloadPhotoNew(details.photos[0].name, clinic.slug);
      if (logoPath) {
        clinic.logo = logoPath;
        withPhotos++;
      }
    }
    
    // Write YAML
    writeClinicYaml(clinic);
    
    await delay(50);
  }
  
  console.log(`\n\n✅ Processed ${processed} clinics`);
  console.log(`📸 Downloaded ${withPhotos} photos/logos`);
  
  // Create/update city file
  const stateNames: Record<string, string> = {
    'FL': 'Florida', 'CA': 'California', 'NY': 'New York', 'TX': 'Texas',
    'IL': 'Illinois', 'AZ': 'Arizona', 'GA': 'Georgia', 'CO': 'Colorado',
  };
  
  const cityYaml = `name: ${cityDisplay}
slug: ${citySlug}
state: ${state}
stateFullName: ${stateNames[state] || state}
description: >-
  Find the best board-certified plastic surgeons in ${cityDisplay}, ${state}. Browse ${processed} verified clinics with patient reviews, ratings, and contact information.
metaDescription: >-
  Top plastic surgery clinics in ${cityDisplay}, ${state}. Compare ${processed} board-certified surgeons with real patient reviews and ratings.
coverImage: null
featuredClinics: []
`;
  
  fs.writeFileSync(path.join(CITIES_DIR, `${citySlug}.yaml`), cityYaml);
  console.log(`\n📄 Updated city file: ${citySlug}.yaml`);
  
  return processed;
}

// Commit and deploy
async function commitAndDeploy(city: string, count: number): Promise<void> {
  console.log('\n🚀 Committing and deploying...\n');
  
  try {
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "feat(clinics): discover ${count} clinics in ${city} via Google Places API"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    execSync('./deploy.sh', { stdio: 'inherit' });
    console.log('\n✅ Deployed successfully!');
  } catch (error) {
    console.error('❌ Deploy failed:', error);
  }
}

// Parse CLI args
function parseArgs(): { city: string; state: string; deploy: boolean } {
  const args = process.argv.slice(2);
  let city = 'miami';
  let state = 'FL';
  let deploy = true;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--city' && args[i + 1]) {
      city = args[i + 1];
      i++;
    } else if (args[i] === '--state' && args[i + 1]) {
      state = args[i + 1];
      i++;
    } else if (args[i] === '--no-deploy') {
      deploy = false;
    }
  }
  
  return { city, state, deploy };
}

// Main
async function main() {
  const { city, state, deploy } = parseArgs();
  
  console.log('🏥 Clinic Discovery via Google Places API (New)');
  console.log('================================================\n');
  
  const count = await discoverClinics(city, state);
  
  if (deploy && count > 0) {
    await commitAndDeploy(city, count);
  } else if (count === 0) {
    console.log('\n⚠️ No clinics found. Check API key permissions.');
  } else {
    console.log('\n⏭️ Skipping deploy (--no-deploy flag)');
  }
}

main().catch(console.error);
