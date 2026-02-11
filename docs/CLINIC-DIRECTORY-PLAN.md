# Implementation Plan: Plastic Surgery Clinic Directory

> A comprehensive directory of plastic surgery clinics organized by city, with detailed individual clinic pages.

## Overview

Add a clinic directory feature to the plastic surgery blog that allows users to browse clinics by location and view detailed information about each clinic.

---

## 1. Data Structure

### Clinic Schema

```typescript
interface Clinic {
  // Identification
  slug: string;              // URL-friendly ID: "miami-plastic-surgery-center"
  name: string;              // "Miami Plastic Surgery Center"
  
  // Location
  city: string;              // "Miami"
  state: string;             // "FL"
  address: string;           // "1234 Brickell Ave, Suite 500"
  zipCode: string;           // "33131"
  coordinates?: {            // For future map integration
    lat: number;
    lng: number;
  };
  
  // Contact
  phone: string;             // "(305) 555-1234"
  website: string;           // "https://miamiplasticsurgery.com"
  email?: string;            // "info@miamiplasticsurgery.com"
  
  // Details
  description: string;       // Rich text description
  specialties: string[];     // ["rhinoplasty", "breast augmentation", "facelift"]
  surgeons: Surgeon[];       // List of surgeons at this clinic
  
  // Reviews & Ratings
  rating: number;            // 4.8 (out of 5)
  reviewCount: number;       // 127
  reviews: Review[];         // Featured reviews
  
  // Media
  logo?: string;             // "/images/clinics/miami-plastic-surgery-logo.png"
  photos?: string[];         // Gallery images
  
  // Business Info
  yearEstablished?: number;  // 2005
  certifications?: string[]; // ["AAAASF Accredited", "Board Certified"]
  insuranceAccepted?: string[];
  financingAvailable?: boolean;
  
  // Hours
  hours?: {
    monday?: string;         // "9:00 AM - 5:00 PM"
    tuesday?: string;
    // ... etc
  };
  
  // SEO
  metaDescription?: string;
  
  // Status
  verified: boolean;         // Has clinic been verified?
  featured: boolean;         // Show in featured section?
  lastUpdated: string;       // ISO date
}

interface Surgeon {
  name: string;              // "Dr. John Smith"
  title: string;             // "Board-Certified Plastic Surgeon"
  specialties: string[];     // ["facial", "rhinoplasty"]
  photo?: string;
  bio?: string;
}

interface Review {
  author: string;            // "Sarah M."
  rating: number;            // 5
  date: string;              // "2025-12-15"
  procedure?: string;        // "Rhinoplasty"
  text: string;              // Review content
  source?: string;           // "Google", "RealSelf", "Yelp"
}
```

### City Schema

```typescript
interface City {
  slug: string;              // "miami"
  name: string;              // "Miami"
  state: string;             // "FL"
  stateFullName: string;     // "Florida"
  description: string;       // City-specific intro
  clinicCount: number;       // Auto-calculated
  featuredClinics: string[]; // Slugs of featured clinics
  metaDescription: string;   // SEO
  coverImage?: string;       // City hero image
}
```

---

## 2. Content Collection Structure

### Directory Structure

```
src/content/
├── blog/                    # Existing blog posts
├── clinics/                 # NEW: Clinic entries
│   ├── miami-plastic-surgery-center.yaml
│   ├── bal-harbour-aesthetics.yaml
│   ├── coral-gables-cosmetic.yaml
│   └── ...
└── cities/                  # NEW: City landing pages
    ├── miami.yaml
    ├── los-angeles.yaml
    ├── new-york.yaml
    └── ...
```

### Content Collection Config

```typescript
// src/content.config.ts (additions)

const clinicsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    city: z.string(),
    state: z.string(),
    address: z.string(),
    zipCode: z.string(),
    phone: z.string(),
    website: z.string().url(),
    email: z.string().email().optional(),
    description: z.string(),
    specialties: z.array(z.string()),
    surgeons: z.array(z.object({
      name: z.string(),
      title: z.string(),
      specialties: z.array(z.string()).optional(),
      photo: z.string().optional(),
      bio: z.string().optional(),
    })).optional(),
    rating: z.number().min(0).max(5),
    reviewCount: z.number(),
    reviews: z.array(z.object({
      author: z.string(),
      rating: z.number(),
      date: z.string(),
      procedure: z.string().optional(),
      text: z.string(),
      source: z.string().optional(),
    })).optional(),
    logo: z.string().optional(),
    photos: z.array(z.string()).optional(),
    yearEstablished: z.number().optional(),
    certifications: z.array(z.string()).optional(),
    verified: z.boolean().default(false),
    featured: z.boolean().default(false),
    lastUpdated: z.string(),
  }),
});

const citiesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    state: z.string(),
    stateFullName: z.string(),
    description: z.string(),
    metaDescription: z.string(),
    coverImage: z.string().optional(),
    featuredClinics: z.array(z.string()).optional(),
  }),
});
```

---

## 3. URL Structure

```
/clinics/                           → Directory landing page
/clinics/miami/                     → Miami city page (list of clinics)
/clinics/miami/miami-plastic-surgery-center/  → Individual clinic page
/clinics/los-angeles/               → LA city page
/clinics/los-angeles/beverly-hills-aesthetics/ → Individual clinic
```

Alternative (flatter structure):
```
/clinics/                           → Directory landing page  
/clinics/cities/miami/              → Miami city page
/clinics/miami-plastic-surgery-center/  → Individual clinic (no city in URL)
```

**Recommendation:** Use the first (nested) structure for better SEO and user navigation.

---

## 4. Page Templates

### 4.1 Directory Landing Page (`/clinics/`)

**Purpose:** Entry point to the clinic directory

**Content:**
- Hero section with search/filter
- Featured cities grid (Miami, LA, NYC, etc.)
- Map of US with clickable regions (future)
- Featured/top-rated clinics carousel
- "Why Choose a Board-Certified Surgeon" trust section
- FAQ section

**Components Needed:**
- `CityCard.astro` — City preview card with clinic count
- `ClinicCardMini.astro` — Small clinic preview
- `DirectorySearch.astro` — Search input (client-side filter or future API)

### 4.2 City Page (`/clinics/[city]/`)

**Purpose:** Show all clinics in a specific city

**Content:**
- City hero with image and description
- Filter/sort options (rating, specialty, distance)
- Clinic list with cards
- Map showing clinic locations (future)
- City-specific content (about plastic surgery in Miami, etc.)
- Related blog posts for that city
- Nearby cities links

**Components Needed:**
- `ClinicCard.astro` — Full clinic preview card
- `ClinicFilters.astro` — Filter/sort controls
- `CityHero.astro` — City-specific hero section

### 4.3 Clinic Detail Page (`/clinics/[city]/[clinic]/`)

**Purpose:** Complete information about a single clinic

**Content:**
- Clinic header (name, logo, rating, verified badge)
- Photo gallery
- Quick info sidebar (address, phone, hours, website)
- Description/About section
- Surgeons section with bios
- Specialties/procedures offered
- Reviews section with ratings breakdown
- Certifications and accreditations
- Financing information
- Contact form (future)
- Map with location
- "Similar Clinics" recommendations
- Related blog posts

**Components Needed:**
- `ClinicHeader.astro` — Name, rating, verified status
- `ClinicGallery.astro` — Photo carousel
- `ClinicSidebar.astro` — Contact info, hours
- `SurgeonCard.astro` — Individual surgeon bio
- `ReviewCard.astro` — Individual review display
- `RatingBreakdown.astro` — Stars distribution
- `ClinicMap.astro` — Embedded map (Google Maps or Mapbox)

---

## 5. Components List

### New Components Required

| Component | Priority | Description |
|-----------|----------|-------------|
| `CityCard.astro` | P1 | City preview with image, name, clinic count |
| `ClinicCard.astro` | P1 | Full clinic card for listings |
| `ClinicCardMini.astro` | P2 | Compact clinic card for sidebars |
| `ClinicHeader.astro` | P1 | Clinic page header with rating |
| `ClinicSidebar.astro` | P1 | Contact info, hours, website |
| `SurgeonCard.astro` | P2 | Surgeon profile card |
| `ReviewCard.astro` | P1 | Individual review display |
| `RatingStars.astro` | P1 | Star rating display component |
| `RatingBreakdown.astro` | P2 | Rating distribution chart |
| `VerifiedBadge.astro` | P2 | "Verified Clinic" badge |
| `ClinicFilters.astro` | P3 | Filter/sort controls |
| `ClinicMap.astro` | P3 | Map embed component |
| `ClinicGallery.astro` | P2 | Photo gallery/carousel |

---

## 6. Data Sources & Population

### Initial Data Sources

1. **Manual Research**
   - Google Maps searches for "plastic surgery" + city
   - RealSelf clinic listings
   - American Society of Plastic Surgeons directory
   - Yelp business listings

2. **Web Scraping (with permission)**
   - Aggregate public information
   - Respect robots.txt and ToS

3. **API Integration (future)**
   - Google Places API for business info
   - Yelp Fusion API for reviews
   - RealSelf API (if available)

### Data Population Strategy

**Phase 1: Manual (MVP)**
- Manually create 10-20 clinics for Miami
- Validate data structure and display
- Refine based on real data

**Phase 2: Semi-Automated**
- Create data collection script
- Pull basic info from Google Places
- Human review and enrichment

**Phase 3: Automated Pipeline**
- Scheduled data refresh
- Review aggregation
- Automated content generation for descriptions

### Priority Cities (Initial Launch)

1. **Miami, FL** — High demand, competitive market
2. **Los Angeles, CA** — Largest market
3. **New York, NY** — Major metro
4. **Beverly Hills, CA** — Premium market
5. **Houston, TX** — Large market
6. **Atlanta, GA** — Southeast hub
7. **Dallas, TX** — Texas market
8. **Scottsdale, AZ** — Destination market
9. **Las Vegas, NV** — Tourism + procedures
10. **San Francisco, CA** — Bay Area

---

## 7. SEO Strategy

### URL Optimization
- City pages: `/clinics/miami/` targets "plastic surgery clinics Miami"
- Clinic pages: Include city for local SEO

### Title Tags
- Directory: `Find Top Plastic Surgery Clinics Near You | [Site Name]`
- City: `Best Plastic Surgery Clinics in Miami, FL | Reviews & Ratings`
- Clinic: `[Clinic Name] - Reviews, Surgeons & Procedures | Miami, FL`

### Schema Markup (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Miami Plastic Surgery Center",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1234 Brickell Ave",
    "addressLocality": "Miami",
    "addressRegion": "FL",
    "postalCode": "33131"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  },
  "medicalSpecialty": "PlasticSurgery"
}
```

### Internal Linking
- Blog posts link to relevant city pages
- Clinic pages link to related procedures
- City pages link to local blog content

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Define content collections schema
- [ ] Create page templates (directory, city, clinic)
- [ ] Build core components (cards, ratings, sidebar)
- [ ] Add sample data for Miami (5-10 clinics)
- [ ] Basic styling matching site design

### Phase 2: Content (Week 2)
- [ ] Research and add Miami clinics (20+)
- [ ] Create Miami city page content
- [ ] Add 2-3 more cities (LA, NYC)
- [ ] Implement review display
- [ ] Add surgeon profiles

### Phase 3: Enhancement (Week 3)
- [ ] Add filtering/sorting functionality
- [ ] Implement search
- [ ] Add photo galleries
- [ ] Map integration (basic)
- [ ] Schema markup for SEO

### Phase 4: Scale (Week 4+)
- [ ] Add remaining priority cities
- [ ] Automate data collection
- [ ] Review aggregation pipeline
- [ ] Advanced features (comparison, favorites)
- [ ] Mobile optimization

---

## 9. Design Considerations

### Matching Existing Aesthetic
- Use existing color palette (ivory, charcoal, rose gold)
- Cormorant Garamond headings, Inter body text
- Generous whitespace
- Subtle hover effects
- Trust-building elements (verified badges, certifications)

### Clinic Card Design Elements
- Clean white card with soft shadow
- Clinic logo or placeholder
- Star rating with review count
- Key specialties as tags
- Location with distance (if geolocation enabled)
- "Verified" badge for authenticated clinics
- Quick-action buttons (Website, Call, Directions)

### Mobile Considerations
- Card-based layout for easy scrolling
- Sticky filter bar
- Click-to-call phone numbers
- Responsive map

---

## 10. Technical Considerations

### Performance
- Static generation for all pages (Astro default)
- Lazy load images and maps
- Paginate clinic lists if > 20 per city

### Data Updates
- Content in YAML files, easy to update
- Consider headless CMS for non-technical editors (future)
- Webhook for automated updates (future)

### Future API
- If directory grows, consider API for search
- Client-side filtering for MVP
- Server-side search for scale

---

## 11. Success Metrics

### Traffic
- Organic search traffic to clinic pages
- City page rankings for "[city] plastic surgery clinics"

### Engagement
- Time on clinic pages
- Click-through to clinic websites
- Phone call clicks (if tracked)

### Business
- Lead generation (future contact forms)
- Advertising revenue from featured placements (future)

---

## 12. Open Questions

1. **Data verification:** How do we verify clinic information is accurate?
2. **Reviews:** Aggregate from external sources or allow user submissions?
3. **Monetization:** Feature paid placements? Advertising?
4. **Legal:** Disclaimers needed for medical business listings?
5. **Updates:** How often should clinic data be refreshed?
6. **Scope:** How many cities/clinics for initial launch?

---

## 13. Next Steps

1. **Review this plan** with stakeholder
2. **Decide on MVP scope** (how many cities, features)
3. **Create sample data** for one city (Miami)
4. **Build components** in priority order
5. **Test and iterate** before expanding

---

*Document created: 2026-02-11*
*Author: Crane (Development Agent)*
