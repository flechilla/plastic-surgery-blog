#!/usr/bin/env npx tsx
/**
 * Clinic Discovery Agent
 * 
 * Discovers plastic surgery clinics in a given location using Google Places API.
 * Outputs YAML files ready for the clinic directory.
 * 
 * Usage: npx tsx scripts/discover-clinics.ts "Miami, FL"
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

const OUTPUT_DIR = path.join(__dirname, '../src/content/clinics');
const CITIES_DIR = path.join(__dirname, '../src/content/cities');

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: { lat: number; lng: number };
  };
  types: string[];
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string; // Google Maps URL
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    relative_time_description: string;
  }>;
  opening_hours?: {
    weekday_text: string[];
    open_now?: boolean;
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface ClinicData {
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
  phone: string;
  website: string;
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
  yearEstablished: number | null;
  certifications: string[];
  verified: boolean;
  featured: boolean;
  lastUpdated: string;
}

// Helper: Create URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Helper: Extract city and state from address components
function extractLocation(components: PlaceDetails['address_components']): { city: string; state: string; zipCode: string } {
  let city = '';
  let state = '';
  let zipCode = '';

  if (!components) return { city, state, zipCode };

  for (const comp of components) {
    if (comp.types.includes('locality')) {
      city = comp.long_name;
    } else if (comp.types.includes('administrative_area_level_1')) {
      state = comp.short_name;
    } else if (comp.types.includes('postal_code')) {
      zipCode = comp.long_name;
    }
  }

  return { city, state, zipCode };
}

// Helper: Format review date
function formatReviewDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

// Search for clinics in a location
async function searchClinics(location: string): Promise<PlaceSearchResult[]> {
  const allResults: PlaceSearchResult[] = [];
  let nextPageToken: string | undefined;

  const queries = [
    `plastic surgery clinic in ${location}`,
    `cosmetic surgery ${location}`,
    `plastic surgeon ${location}`,
  ];

  for (const query of queries) {
    console.log(`🔍 Searching: "${query}"`);
    
    let pageCount = 0;
    nextPageToken = undefined;

    do {
      const params = new URLSearchParams({
        query,
        key: API_KEY!,
        ...(nextPageToken && { pagetoken: nextPageToken }),
      });

      const response = await fetch(`${PLACES_SEARCH_URL}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`⚠️ Search error: ${data.status}`, data.error_message);
        break;
      }

      const results = data.results || [];
      
      // Filter for medical/health related places and dedupe by place_id
      for (const place of results) {
        if (!allResults.some(p => p.place_id === place.place_id)) {
          allResults.push(place);
        }
      }

      nextPageToken = data.next_page_token;
      pageCount++;

      // Wait before next page (required by API)
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } while (nextPageToken && pageCount < 3); // Max 3 pages per query
  }

  console.log(`📊 Found ${allResults.length} unique places\n`);
  return allResults;
}

// Get detailed info for a clinic
async function getClinicDetails(placeId: string): Promise<PlaceDetails | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    key: API_KEY!,
    fields: [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'url',
      'rating',
      'user_ratings_total',
      'reviews',
      'opening_hours',
      'address_components',
    ].join(','),
  });

  const response = await fetch(`${PLACES_DETAILS_URL}?${params}`);
  const data = await response.json();

  if (data.status !== 'OK') {
    console.error(`⚠️ Details error for ${placeId}: ${data.status}`);
    return null;
  }

  return data.result;
}

// Convert Google Places data to our clinic format
function toClinicData(details: PlaceDetails, citySlug: string): ClinicData {
  const { city, state, zipCode } = extractLocation(details.address_components);
  
  // Extract street address (everything before the city)
  const addressParts = details.formatted_address.split(',');
  const streetAddress = addressParts[0]?.trim() || details.formatted_address;

  // Convert reviews
  const reviews = (details.reviews || []).slice(0, 5).map(review => ({
    author: review.author_name.split(' ')[0] + ' ' + (review.author_name.split(' ')[1]?.[0] || '') + '.',
    rating: review.rating,
    date: formatReviewDate(review.time),
    text: review.text.substring(0, 300) + (review.text.length > 300 ? '...' : ''),
    source: 'Google',
  }));

  return {
    name: details.name,
    slug: slugify(details.name),
    city: citySlug,
    state: state || 'FL',
    address: streetAddress,
    zipCode: zipCode || '',
    phone: details.formatted_phone_number || '',
    website: details.website || '',
    googleMapsUrl: details.url || '',
    description: `${details.name} is a plastic surgery practice located in ${city || 'the area'}, ${state}. ` +
      (details.rating ? `With a ${details.rating}-star rating from ${details.user_ratings_total || 0} reviews, ` : '') +
      `they offer cosmetic and reconstructive surgery services.`,
    specialties: [
      'Plastic Surgery',
      'Cosmetic Surgery',
      'Reconstructive Surgery',
    ],
    rating: details.rating || 0,
    reviewCount: details.user_ratings_total || 0,
    reviews,
    yearEstablished: null,
    certifications: [],
    verified: false,
    featured: false,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// Convert clinic data to YAML
function toYaml(clinic: ClinicData): string {
  const reviewsYaml = clinic.reviews.map(r => `  - author: "${r.author}"
    rating: ${r.rating}
    date: "${r.date}"
    text: >-
      ${r.text.replace(/\n/g, ' ').replace(/"/g, '\\"')}
    source: "${r.source}"`).join('\n');

  return `name: ${clinic.name}
slug: ${clinic.slug}
city: ${clinic.city}
state: ${clinic.state}
address: "${clinic.address}"
zipCode: "${clinic.zipCode}"
phone: "${clinic.phone}"
website: "${clinic.website}"
googleMapsUrl: "${clinic.googleMapsUrl}"
description: >-
  ${clinic.description}
specialties:
${clinic.specialties.map(s => `  - "${s}"`).join('\n')}
rating: ${clinic.rating}
reviewCount: ${clinic.reviewCount}
reviews:
${reviewsYaml || '  []'}
yearEstablished: ${clinic.yearEstablished || 'null'}
certifications: []
verified: ${clinic.verified}
featured: ${clinic.featured}
lastUpdated: "${clinic.lastUpdated}"
`;
}

// Create city YAML if it doesn't exist
function ensureCityExists(cityName: string, state: string, citySlug: string): void {
  const cityFile = path.join(CITIES_DIR, `${citySlug}.yaml`);
  
  if (!fs.existsSync(cityFile)) {
    const cityYaml = `name: ${cityName}
slug: ${citySlug}
state: ${state}
stateFullName: ${state === 'FL' ? 'Florida' : state}
description: >-
  Discover top-rated plastic surgery clinics in ${cityName}, ${state}. 
  Browse verified surgeons, read patient reviews, and find the right 
  practice for your cosmetic surgery needs.
metaDescription: >-
  Find the best plastic surgery clinics in ${cityName}, ${state}. Compare 
  ratings, read patient reviews, and discover board-certified surgeons near you.
featuredClinics: []
`;
    fs.writeFileSync(cityFile, cityYaml);
    console.log(`📍 Created city: ${cityFile}`);
  }
}

// Main function
async function main() {
  const location = process.argv[2];

  if (!location) {
    console.error('Usage: npx tsx scripts/discover-clinics.ts "Miami, FL"');
    process.exit(1);
  }

  if (!API_KEY) {
    console.error('Error: GOOGLE_PLACES_API_KEY not set');
    process.exit(1);
  }

  console.log(`\n🏥 Clinic Discovery Agent`);
  console.log(`📍 Location: ${location}`);
  console.log(`${'─'.repeat(50)}\n`);

  // Parse city and state from location
  const [cityName, stateCode] = location.split(',').map(s => s.trim());
  const citySlug = slugify(cityName);
  const state = stateCode || 'FL';

  // Ensure directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(CITIES_DIR, { recursive: true });

  // Ensure city exists
  ensureCityExists(cityName, state, citySlug);

  // Search for clinics
  const searchResults = await searchClinics(location);

  if (searchResults.length === 0) {
    console.log('No clinics found.');
    return;
  }

  // Get details for each clinic
  console.log(`📋 Fetching details for ${searchResults.length} clinics...\n`);

  const clinics: ClinicData[] = [];
  let processed = 0;

  for (const place of searchResults) {
    processed++;
    process.stdout.write(`\r   Processing ${processed}/${searchResults.length}: ${place.name.substring(0, 40)}...`);

    const details = await getClinicDetails(place.place_id);
    
    if (details) {
      const clinic = toClinicData(details, citySlug);
      clinics.push(clinic);

      // Write YAML file
      const filename = `${clinic.slug}.yaml`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, toYaml(clinic));
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n\n✅ Discovery complete!`);
  console.log(`   📁 ${clinics.length} clinic files created in ${OUTPUT_DIR}`);
  console.log(`   ⭐ Average rating: ${(clinics.reduce((sum, c) => sum + c.rating, 0) / clinics.length).toFixed(1)}`);
  console.log(`   📊 Total reviews: ${clinics.reduce((sum, c) => sum + c.reviewCount, 0)}`);

  // Summary
  console.log(`\n📊 Top 5 by rating:`);
  clinics
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`);
    });

  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review generated YAML files`);
  console.log(`   2. Mark top clinics as featured: true`);
  console.log(`   3. Add certifications if known`);
  console.log(`   4. Run: npm run build`);
  console.log(`   5. Deploy!`);
}

main().catch(console.error);
