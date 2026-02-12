import { useState, useMemo, useRef, useEffect } from 'react';

export interface ClinicData {
  name: string;
  slug: string;
  city: string;
  cityDisplay: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  googleCategoryDisplay: string;
  description: string;
  verified: boolean;
  featured: boolean;
}

interface Props {
  clinics: ClinicData[];
}

type SortOption = 'rating' | 'reviews' | 'name';
type RatingFilter = 'all' | '4' | '4.5';

// --- Sub-components ---

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`f${i}`} className={`${cls} text-rose-gold`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className={`${cls} text-rose-gold`} viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`half-${rating}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill={`url(#half-${rating})`} stroke="currentColor" strokeWidth="0.5" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`e${i}`} className={`${cls} text-warm-sand`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ClinicCardComponent({ clinic }: { clinic: ClinicData }) {
  const href = `/clinics/${clinic.city}/${clinic.slug}/`;

  return (
    <a href={href} className="group block">
      <article
        className={`overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-400 hover:-translate-y-1 hover:shadow-card-hover ${clinic.featured ? 'ring-1 ring-rose-gold/20' : ''}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-serif text-xl font-medium text-charcoal transition-colors duration-200 group-hover:text-rose-gold-dark">
                  {clinic.name}
                </h3>
                {clinic.verified && (
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-deep-sage/10" title="Verified Clinic">
                    <svg className="h-3 w-3 text-deep-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* City + Category */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs font-medium text-charcoal/40">{clinic.cityDisplay}</span>
                {clinic.googleCategoryDisplay && (
                  <>
                    <span className="text-charcoal/20">·</span>
                    <span className="rounded-md bg-soft-blush/60 px-2 py-0.5 text-[10px] font-medium text-rose-gold-dark">
                      {clinic.googleCategoryDisplay}
                    </span>
                  </>
                )}
              </div>
              {/* Rating */}
              <div className="mt-2 flex items-center gap-2">
                <RatingStars rating={clinic.rating} size="sm" />
                <span className="text-sm font-medium text-charcoal">{clinic.rating}</span>
                <span className="text-xs text-charcoal/40">({clinic.reviewCount} reviews)</span>
              </div>
            </div>
            {clinic.featured && (
              <span className="flex-shrink-0 rounded-md bg-rose-gold/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-rose-gold-dark">
                Featured
              </span>
            )}
          </div>

          {/* Address */}
          <div className="mt-4 flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-sm text-charcoal/60">{clinic.address}</span>
          </div>

          {/* Description */}
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-charcoal/50">{clinic.description}</p>

          {/* Specialties */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {clinic.specialties.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md bg-warm-sand/40 px-2.5 py-0.5 text-[11px] font-medium text-charcoal/60">
                {s}
              </span>
            ))}
            {clinic.specialties.length > 3 && (
              <span className="rounded-md bg-warm-sand/40 px-2.5 py-0.5 text-[11px] font-medium text-charcoal/40">
                +{clinic.specialties.length - 3} more
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between border-t border-warm-sand/40 pt-4">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal/50 transition-colors hover:text-charcoal"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {clinic.phone}
            </span>
            <span className="text-xs font-medium tracking-wide text-rose-gold transition-all duration-200 group-hover:translate-x-1">
              View details →
            </span>
          </div>
        </div>
      </article>
    </a>
  );
}

// --- Filter pill component ---

function FilterPill({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? 'bg-charcoal text-white shadow-sm'
          : 'bg-warm-sand/30 text-charcoal/60 hover:bg-warm-sand/50 hover:text-charcoal/80'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] ${active ? 'text-white/60' : 'text-charcoal/30'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// --- Main component ---

export default function ClinicDirectory({ clinics }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Extract unique cities and categories
  const cities = useMemo(() => {
    const map = new Map<string, { slug: string; display: string; count: number }>();
    clinics.forEach((c) => {
      const existing = map.get(c.city);
      if (existing) {
        existing.count++;
      } else {
        map.set(c.city, { slug: c.city, display: c.cityDisplay, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.display.localeCompare(b.display));
  }, [clinics]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    clinics.forEach((c) => {
      if (c.googleCategoryDisplay) {
        map.set(c.googleCategoryDisplay, (map.get(c.googleCategoryDisplay) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [clinics]);

  // Filter and sort
  const filteredClinics = useMemo(() => {
    const query = search.toLowerCase().trim();

    let result = clinics.filter((c) => {
      // Search
      if (query) {
        const searchable = `${c.name} ${c.cityDisplay} ${c.googleCategoryDisplay || ''} ${c.specialties.join(' ')}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      // City filter
      if (selectedCity !== 'all' && c.city !== selectedCity) return false;
      // Category filter
      if (selectedCategory !== 'all' && c.googleCategoryDisplay !== selectedCategory) return false;
      // Rating filter
      if (ratingFilter === '4' && c.rating < 4) return false;
      if (ratingFilter === '4.5' && c.rating < 4.5) return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      // Featured always first
      if (a.featured !== b.featured) return a.featured ? -1 : 1;

      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [clinics, search, selectedCity, selectedCategory, ratingFilter, sortBy]);

  const activeFilterCount = [
    selectedCity !== 'all',
    selectedCategory !== 'all',
    ratingFilter !== 'all',
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedCity('all');
    setSelectedCategory('all');
    setRatingFilter('all');
    setSortBy('rating');
    if (searchRef.current) searchRef.current.value = '';
  };

  // Animate cards on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">

        {/* Section header */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-rose-gold">
            All Clinics
          </p>
          <h2 className="font-serif text-3xl font-medium text-charcoal md:text-4xl">
            Browse our directory
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-charcoal/50">
            Search, filter, and compare {clinics.length} verified clinics across South Florida.
          </p>
        </div>

        {/* Search + controls bar */}
        <div className="mb-6 space-y-4">
          {/* Top row: Search + Sort + Filter toggle */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-md">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-charcoal/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name, city, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-warm-sand/60 bg-ivory/50 py-3 pl-11 pr-4 text-sm text-charcoal placeholder-charcoal/30 outline-none transition-all duration-200 focus:border-rose-gold/40 focus:shadow-[0_0_0_3px_rgba(201,168,124,0.1)] focus:ring-1 focus:ring-rose-gold/20"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-charcoal/30 transition-colors hover:text-charcoal/60"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium uppercase tracking-wide transition-all duration-200 ${
                  showFilters || activeFilterCount > 0
                    ? 'border-rose-gold/30 bg-soft-blush/40 text-rose-gold-dark'
                    : 'border-warm-sand/60 text-charcoal/50 hover:border-warm-sand hover:text-charcoal/70'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-gold text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="hidden text-xs font-medium tracking-wide uppercase text-charcoal/40 sm:block">
                  Sort
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-xl border border-warm-sand/60 bg-ivory/50 py-3 pl-4 pr-9 text-xs font-medium uppercase tracking-wide text-charcoal/60 outline-none transition-all duration-200 focus:border-rose-gold/40 focus:ring-1 focus:ring-rose-gold/20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232d2d2d' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="rating">Top Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="name">A – Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter panels */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showFilters ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="rounded-2xl border border-warm-sand/40 bg-ivory/40 p-5 md:p-6">
              <div className="space-y-5">
                {/* City filter */}
                <div>
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-charcoal/40">
                    City
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      label="All Cities"
                      active={selectedCity === 'all'}
                      count={clinics.length}
                      onClick={() => setSelectedCity('all')}
                    />
                    {cities.map((city) => (
                      <FilterPill
                        key={city.slug}
                        label={city.display}
                        active={selectedCity === city.slug}
                        count={city.count}
                        onClick={() => setSelectedCity(selectedCity === city.slug ? 'all' : city.slug)}
                      />
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-charcoal/40">
                    Specialty
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      label="All Specialties"
                      active={selectedCategory === 'all'}
                      onClick={() => setSelectedCategory('all')}
                    />
                    {categories.map((cat) => (
                      <FilterPill
                        key={cat.name}
                        label={cat.name}
                        active={selectedCategory === cat.name}
                        count={cat.count}
                        onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'all' : cat.name)}
                      />
                    ))}
                  </div>
                </div>

                {/* Rating filter */}
                <div>
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-charcoal/40">
                    Minimum Rating
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      label="Any Rating"
                      active={ratingFilter === 'all'}
                      onClick={() => setRatingFilter('all')}
                    />
                    <FilterPill
                      label="4+ Stars"
                      active={ratingFilter === '4'}
                      onClick={() => setRatingFilter(ratingFilter === '4' ? 'all' : '4')}
                    />
                    <FilterPill
                      label="4.5+ Stars"
                      active={ratingFilter === '4.5'}
                      onClick={() => setRatingFilter(ratingFilter === '4.5' ? 'all' : '4.5')}
                    />
                  </div>
                </div>

                {/* Clear all */}
                {activeFilterCount > 0 && (
                  <div className="border-t border-warm-sand/30 pt-4">
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium text-rose-gold-dark transition-colors hover:text-rose-gold"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-charcoal/40">
            Showing <span className="font-medium text-charcoal/70">{filteredClinics.length}</span>{' '}
            {filteredClinics.length === 1 ? 'clinic' : 'clinics'}
            {(search || activeFilterCount > 0) && (
              <span>
                {' '}
                of {clinics.length}
              </span>
            )}
          </p>
          {(search || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-charcoal/40 transition-colors hover:text-charcoal"
            >
              Reset
            </button>
          )}
        </div>

        {/* Clinic grid */}
        {filteredClinics.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClinics.map((clinic, i) => (
              <div
                key={clinic.slug}
                className="transition-all duration-500"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: `${Math.min(i * 30, 300)}ms`,
                }}
              >
                <ClinicCardComponent clinic={clinic} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-sand/30">
              <svg className="h-7 w-7 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="font-serif text-xl text-charcoal/60">No clinics found</p>
            <p className="mt-2 text-sm text-charcoal/40">
              Try adjusting your search or filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-rose-gold to-rose-gold-dark px-6 py-2.5 text-xs font-medium uppercase tracking-wide text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
