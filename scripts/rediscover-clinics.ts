#!/usr/bin/env npx tsx
/**
 * Re-discover clinics with proper address parsing
 * 
 * - Extracts real city from addressComponents
 * - Auto-creates city files
 * - Updates clinics with accurate location data
 * 
 * Usage:
 *   npx tsx scripts/rediscover-clinics.ts --city miami --state FL
 */

import fs from 'fs';
import path from 'path';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY required');
  process.exit(1);
}

const CLINICS_DIR = path.join(process.cwd(), 'src/content/clinics');
const CITIES_DIR = path.join(process.cwd(), 'src/content/cities');
const LOGOS_DIR = path.join(process.cwd(), 'public/images/clinics/logos');

[CLINICS_DIR, CITIES_DIR, LOGOS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const SEARCH_QUERIES = [
  'plastic surgery',
  'cosmetic surgery', 
  'plastic surgeon',
  'rhinoplasty',
  'breast augmentation',
  'liposuction',
  'tummy tuck',
  'BBL surgeon',
  'mommy makeover',
  'facelift surgeon',
  'medspa',
  'body contouring',
];

// City coordinates for location bias
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'miami': { lat: 25.7617, lng: -80.1918 },
  'fort-myers': { lat: 26.6406, lng: -81.8723 },
  'los-angeles': { lat: 34.0522, lng: -118.2437 },
  'new-york': { lat: 40.7128, lng: -74.0060 },
};

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  photos?: Array<{ name: string }>;
  reviews?: Array<{
    authorAttribution?: { displayName: string };
    rating: number;
    publishTime?: string;
    text?: { text: string };
  }>;
}

interface ParsedAddress {
  city: string;
  citySlug: string;
  state: string;
  stateFullName: string;
  county: string;
  neighborhood: string;
  zipCode: string;
  country: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function parseAddressComponents(components: AddressComponent[]): ParsedAddress {
  const find = (type: string) => components.find(c => c.types?.includes(type));
  
  const locality = find('locality');
  const state = find('administrative_area_level_1');
  const county = find('administrative_area_level_2');
  const neighborhood = find('neighborhood');
  const zip = find('postal_code');
  const country = find('country');
  
  const cityName = locality?.longText || 'Unknown';
  
  return {
    city: cityName,
    citySlug: slugify(cityName),
    state: state?.shortText || '',
    stateFullName: state?.longText || '',
    county: county?.longText || '',
    neighborhood: neighborhood?.longText || '',
    zipCode: zip?.longText || '',
    country: country?.shortText || 'US',
  };
}

function ensureCityExists(addr: ParsedAddress): void {
  const cityFile = path.join(CITIES_DIR, `${addr.citySlug}.yaml`);
  
  if (fs.existsSync(cityFile)) {
    return;
  }
  
  console.log(`  📍 Creating new city: ${addr.city}, ${addr.state}`);
  
  const cityYaml = `name: "${addr.city}"
slug: ${addr.citySlug}
state: ${addr.state}
stateFullName: ${addr.stateFullName}
county: "${addr.county}"
description: >-
  Find top plastic surgery clinics in ${addr.city}, ${addr.state}. Browse verified clinics with patient reviews, ratings, and contact information.
metaDescription: >-
  Top plastic surgery clinics in ${addr.city}, ${addr.state}. Compare board-certified surgeons with real patient reviews.
coverImage: null
featuredClinics: []
`;
  
  fs.writeFileSync(cityFile, cityYaml);
}

async function searchPlaces(query: string, center: { lat: number; lng: number }): Promise<PlaceResult[]> {
  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.addressComponents',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.photos',
    'places.reviews',
  ].join(',');
  
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY!,
      'X-Goog-FieldMask': fieldMask + ',nextPageToken',
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: 50000,
        },
      },
      maxResultCount: 20,
    }),
  });
  
  const data = await response.json();
  return data.places || [];
}

async function downloadPhoto(photoName: string, slug: string): Promise<string | null> {
  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1000) return null;
    
    const filename = `${slug}.jpg`;
    const filepath = path.join(LOGOS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return `/images/clinics/logos/${filename}`;
  } catch {
    return null;
  }
}

function isRelevantClinic(place: PlaceResult): boolean {
  const name = (place.displayName?.text || '').toLowerCase();
  const keywords = ['plastic', 'cosmetic', 'aesthetic', 'surgery', 'surgeon', 'medspa', 'med spa'];
  const exclude = ['dental', 'dentist', 'veterinary', 'chiropract'];
  
  const hasKeyword = keywords.some(k => name.includes(k));
  const isExcluded = exclude.some(k => name.includes(k));
  
  return hasKeyword && !isExcluded;
}

async function processPlace(place: PlaceResult, seenIds: Set<string>): Promise<boolean> {
  if (!place.addressComponents || seenIds.has(place.id)) {
    return false;
  }
  
  if (!isRelevantClinic(place)) {
    return false;
  }
  
  seenIds.add(place.id);
  
  const name = place.displayName?.text || 'Unknown';
  const slug = slugify(name);
  const addr = parseAddressComponents(place.addressComponents);
  
  // Skip non-US
  if (addr.country !== 'US') return false;
  
  // Ensure city exists
  ensureCityExists(addr);
  
  // Download photo
  let logo: string | null = null;
  if (place.photos?.[0]) {
    logo = await downloadPhoto(place.photos[0].name, slug);
  }
  
  // Format reviews
  const reviews = (place.reviews || []).slice(0, 5).map(r => ({
    author: (r.authorAttribution?.displayName || 'Anonymous').split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' '),
    rating: r.rating,
    date: r.publishTime?.split('T')[0] || new Date().toISOString().split('T')[0],
    text: (r.text?.text || '').slice(0, 500),
    source: 'Google',
  }));
  
  const clinicYaml = `name: "${name.replace(/"/g, '\\"')}"
slug: ${slug}
city: ${addr.citySlug}
cityDisplay: "${addr.city}"
state: ${addr.state}
stateFullName: ${addr.stateFullName}
county: "${addr.county}"
neighborhood: "${addr.neighborhood}"
address: "${(place.formattedAddress || '').replace(/, USA$/, '').replace(/"/g, '\\"')}"
zipCode: "${addr.zipCode}"
coordinates:
  lat: ${place.location?.latitude || 0}
  lng: ${place.location?.longitude || 0}
phone: "${place.nationalPhoneNumber || ''}"
website: ${place.websiteUri ? `"${place.websiteUri}"` : 'null'}
googleMapsUrl: "${place.googleMapsUri || ''}"
description: >-
  ${name} is a plastic surgery practice located in ${addr.city}, ${addr.state}.${place.rating ? ` With a ${place.rating}-star rating from ${place.userRatingCount || 0} reviews, they offer cosmetic and reconstructive surgery services.` : ''}
specialties:
  - "Plastic Surgery"
  - "Cosmetic Surgery"
rating: ${place.rating || 0}
reviewCount: ${place.userRatingCount || 0}
reviews:
${reviews.map(r => `  - author: "${r.author}"
    rating: ${r.rating}
    date: "${r.date}"
    text: >-
      ${r.text.replace(/\n/g, ' ').slice(0, 400)}
    source: "${r.source}"`).join('\n')}
logo: ${logo ? `"${logo}"` : 'null'}
yearEstablished: null
certifications: []
verified: false
featured: false
lastUpdated: "${new Date().toISOString().split('T')[0]}"
`;

  const clinicFile = path.join(CLINICS_DIR, `${slug}.yaml`);
  fs.writeFileSync(clinicFile, clinicYaml);
  
  console.log(`  ✅ ${name} → ${addr.city}, ${addr.state}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const cityIdx = args.indexOf('--city');
  const stateIdx = args.indexOf('--state');
  
  if (cityIdx === -1 || stateIdx === -1) {
    console.log('Usage: npx tsx scripts/rediscover-clinics.ts --city miami --state FL');
    process.exit(1);
  }
  
  const searchCity = args[cityIdx + 1].toLowerCase().replace(/\s+/g, '-');
  const state = args[stateIdx + 1].toUpperCase();
  const coords = CITY_COORDS[searchCity] || { lat: 25.7617, lng: -80.1918 };
  
  console.log(`\n🔍 Searching: ${searchCity}, ${state}\n`);
  
  const seenIds = new Set<string>();
  let totalAdded = 0;
  const cityCounts = new Map<string, number>();
  
  for (const query of SEARCH_QUERIES) {
    const fullQuery = `${query} ${searchCity.replace(/-/g, ' ')} ${state}`;
    console.log(`\n📌 Query: "${fullQuery}"`);
    
    const places = await searchPlaces(fullQuery, coords);
    console.log(`   Found ${places.length} results`);
    
    for (const place of places) {
      const added = await processPlace(place, seenIds);
      if (added) {
        totalAdded++;
        const addr = parseAddressComponents(place.addressComponents || []);
        cityCounts.set(addr.city, (cityCounts.get(addr.city) || 0) + 1);
      }
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Total clinics added: ${totalAdded}`);
  console.log(`\nBy city:`);
  for (const [city, count] of [...cityCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${city}: ${count}`);
  }
}

main().catch(console.error);
