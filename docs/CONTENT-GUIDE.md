# Content Creation Guide

> World-class content for the Aesthetic Surgery Journal — SEO-optimized, audience-focused, and visually stunning.

## Target Audience

### Primary: Prospective Patients
- **Demographics:** Women 30-55, high household income ($150K+)
- **Psychographics:** Research-driven, quality-focused, value expertise over price
- **Intent:** Actively considering procedures, seeking trusted information
- **Pain Points:** Fear of the unknown, concern about results, overwhelmed by options

### Secondary: Information Seekers
- Early-stage researchers comparing procedures
- People supporting friends/family members considering surgery
- Those interested in non-surgical alternatives first

### Audience Voice Preferences
- **Want:** Warm, knowledgeable, reassuring (like a trusted doctor friend)
- **Don't Want:** Clinical jargon, pushy sales, unrealistic promises, fear-mongering

---

## Content Collections

### 1. Procedures (`category: facial | body | breast | non-surgical`)

**Purpose:** Deep-dive educational content about specific procedures

**Topics Include:**
- Rhinoplasty, facelifts, eyelid surgery, brow lifts
- Liposuction, tummy tuck, body lifts, arm lifts
- Breast augmentation, reduction, lifts, reconstruction
- Botox, fillers, laser treatments, chemical peels

**Content Structure:**
```markdown
1. What is [Procedure]? (2-3 paragraphs)
2. Who is a Good Candidate?
3. The Consultation Process
4. What to Expect During Surgery
5. Recovery Timeline (use table format)
6. Results & Longevity
7. Risks & Considerations
8. Cost Factors (general ranges, no specific prices)
9. Choosing the Right Surgeon
10. FAQ Section (3-5 questions)
```

**Word Count:** 1,500-2,500 words
**Internal Links:** Related procedures, recovery guides, consultation CTA

---

### 2. Recovery & Aftercare (`category: recovery`)

**Purpose:** Support patients through healing with practical guidance

**Topics Include:**
- Post-op care guides by procedure
- Managing swelling, bruising, discomfort
- Return to work/exercise timelines
- Scar care and optimization
- Emotional recovery and expectations

**Content Structure:**
```markdown
1. What to Expect Immediately After Surgery
2. Week-by-Week Recovery Timeline (table)
3. Do's and Don'ts
4. Managing Common Side Effects
5. When to Call Your Surgeon
6. Long-term Care Tips
7. Patient Stories (if available)
```

**Word Count:** 1,000-1,800 words
**Tone:** Supportive, practical, reassuring

---

### 3. Before You Decide (`category: facial | body | breast`)

**Purpose:** Help patients make informed decisions before committing

**Topics Include:**
- Questions to ask your surgeon
- Red flags to watch for
- How to evaluate before/after photos
- Understanding realistic expectations
- Financing and payment considerations
- Combining procedures: pros and cons

**Content Structure:**
```markdown
1. The Decision-Making Framework
2. Key Considerations
3. Questions to Ask (numbered list)
4. What to Look For
5. Warning Signs
6. Next Steps
```

**Word Count:** 1,200-2,000 words
**Tone:** Empowering, educational, balanced

---

### 4. Non-Surgical Alternatives (`category: non-surgical`)

**Purpose:** Educate on less invasive options and combination approaches

**Topics Include:**
- Injectable treatments (Botox, fillers, Kybella)
- Laser and light therapies
- Skin tightening technologies
- Body contouring without surgery
- Maintenance and prevention strategies

**Content Structure:**
```markdown
1. Overview of Non-Surgical Options
2. How It Works
3. Treatment Areas
4. What to Expect During Treatment
5. Results Timeline
6. Maintenance Requirements
7. Combining with Surgical Procedures
8. Cost Comparison
```

**Word Count:** 1,000-1,500 words
**Tone:** Accessible, informative, option-focused

---

### 5. Industry News (`category: news`)

**Purpose:** Position as thought leaders, attract search traffic on trending topics

**Topics Include:**
- New FDA approvals and technologies
- Research and study findings
- Trend analysis (what's popular, what's declining)
- Celebrity procedure discussions (tasteful, educational)
- Industry conference insights

**Content Structure:**
```markdown
1. The News/Development
2. What It Means for Patients
3. Expert Perspective
4. What to Watch For
5. Our Take
```

**Word Count:** 600-1,200 words
**Tone:** Authoritative, timely, thoughtful

---

## SEO Best Practices

### Title Guidelines

**Formula:** `[Primary Keyword]: [Benefit/Descriptor] | [Secondary Hook]`

**Rules:**
- 50-60 characters maximum
- Primary keyword within first 3 words when possible
- Include emotional/benefit trigger
- Avoid clickbait; promise what you deliver

**Examples:**
- ✅ `Rhinoplasty Recovery: Week-by-Week Guide to Healing`
- ✅ `Breast Augmentation: A Complete Guide to Your Options`
- ✅ `Facelift vs. Non-Surgical: Which Is Right for You?`
- ❌ `Everything You Need to Know About Getting a Nose Job` (too long, weak keywords)
- ❌ `AMAZING Facelift Results That Will SHOCK You` (clickbait)

### Meta Description Guidelines

**Formula:** `[What the article covers] + [Key benefit] + [Credibility signal] + [CTA or hook]`

**Rules:**
- 150-160 characters maximum
- Include primary keyword naturally
- Mention "board-certified" or expertise signal
- End with value proposition or soft CTA

**Examples:**
- ✅ `Everything you need to know about rhinoplasty, from consultation to recovery. Expert insights from board-certified plastic surgeons.` (156 chars)
- ✅ `A comprehensive breast augmentation guide covering implant types, sizing, and recovery. Make informed decisions with expert guidance.` (148 chars)

### Keyword Strategy

**Primary Keywords:** One main term per article (e.g., "rhinoplasty recovery")
**Secondary Keywords:** 2-3 related terms (e.g., "nose job healing time", "rhinoplasty swelling")
**Long-tail Keywords:** 3-5 question-based phrases (e.g., "how long does rhinoplasty swelling last")

**Placement:**
- Title (primary keyword)
- First paragraph (primary keyword)
- H2 headings (secondary keywords)
- Throughout body (natural usage, 1-2% density)
- Image alt text
- URL slug

### Content Structure for SEO

```markdown
# H1: Title with Primary Keyword (only one H1)

Introduction paragraph with primary keyword in first 100 words.

## H2: Section with Secondary Keyword
Content...

### H3: Subsection (if needed)
Content...

## H2: Another Section
Content...

[Table or List for featured snippet potential]

## H2: FAQ Section (for "People Also Ask" targeting)
### What is [procedure]?
### How long does [recovery] take?
### How much does [procedure] cost?
```

### Internal Linking Strategy

- Link to 3-5 related articles per post
- Use descriptive anchor text (not "click here")
- Link to both:
  - Related procedures
  - Recovery/aftercare content
  - Decision-making guides
- Always include a consultation CTA link

---

## Image Generation Workflow

### Model: GPT Image 1.5

All blog images are generated using OpenAI's GPT Image 1.5 for consistent, high-quality results.

### Generation Command

```bash
python3 /root/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills/openai-image-gen/scripts/gen.py \
  --prompt "YOUR PROMPT HERE" \
  --model gpt-image-1.5 \
  --size 1024x1024 \
  --quality high \
  --count 1 \
  --out-dir /root/.openclaw/workspace/projects/plastic-surgery-blog/public/images/blog
```

### Post-Generation Steps

1. Rename file to match naming convention:
   ```bash
   mv 001-*.png YYYY-MM-DD-post-slug.png
   ```

2. Clean up generated files:
   ```bash
   rm -f public/images/blog/index.html public/images/blog/prompts.json
   ```

3. Update frontmatter:
   ```yaml
   coverImage: '/images/blog/YYYY-MM-DD-post-slug.png'
   ```

### Art Direction: "Quiet Luxury Medical Editorial"

**Core Aesthetic:**
- Architectural Digest meets Vogue Health
- Warm, sophisticated, trustworthy
- Editorial magazine quality
- Never clinical or sterile

**Color Palette:**
- Ivory, cream, warm white backgrounds
- Blush, rose gold, soft peach accents
- Warm sand, taupe neutrals
- Deep sage or soft navy for contrast

**Composition Rules:**
- Generous negative space (40%+ of image)
- Soft, warm lighting (golden hour quality)
- Abstract or artistic representations
- No full faces (silhouettes, partial profiles OK)
- Flowing fabrics, organic textures

### Prompt Templates by Category

#### Facial Procedures
```
Artistic editorial photograph, elegant feminine profile silhouette in soft golden hour 
lighting, warm ivory background with subtle blush tones, minimalist composition with 
generous negative space, luxury medical spa aesthetic, sophisticated and serene, 
suggesting facial harmony and refinement, Architectural Digest style, no text
```

#### Body Procedures
```
Elegant artistic photograph, graceful feminine silhouette draped in flowing ivory silk 
fabric, soft warm studio lighting creating gentle shadows, abstract body confidence 
composition, luxury spa aesthetic, editorial magazine quality, muted warm color palette 
with subtle rose gold tones, sophisticated and empowering, no faces visible
```

#### Non-Surgical/Skincare
```
Artistic close-up photograph of luxury skincare moment, soft hands with elegant glass 
vessel, warm diffused lighting, ivory and blush color palette, editorial beauty 
photography style, sophisticated spa aesthetic, subtle textures, magazine quality, 
no faces, serene and indulgent mood
```

#### Recovery/Wellness
```
Serene artistic photograph, soft natural morning light through sheer curtains, cozy 
neutral textiles in ivory and warm sand tones, peaceful healing atmosphere, editorial 
interior design aesthetic, spa-like tranquility, generous negative space, calming 
and restorative composition
```

### Image Quality Checklist

Before using any generated image:

- [ ] Matches luxury medical editorial aesthetic
- [ ] No distorted anatomy or AI artifacts
- [ ] Warm, sophisticated color palette
- [ ] Appropriate for medical/wellness context
- [ ] Works well at both large (cover) and small (thumbnail) sizes
- [ ] No text, watermarks, or unwanted elements
- [ ] Conveys the emotional tone of the article

If the image doesn't meet standards, regenerate with adjusted prompt.

---

## Content Creation Workflow

### Step 1: Topic Selection
- Identify keyword opportunity (search volume, competition)
- Check for existing coverage (don't duplicate)
- Confirm audience relevance

### Step 2: Research & Outline
- Review competitor content for gaps
- Gather medical accuracy sources
- Create detailed outline with H2/H3 structure
- Identify internal linking opportunities

### Step 3: Write Content
- Follow content structure for category
- Include all SEO elements
- Write for humans first, optimize second
- Maintain warm, expert voice throughout

### Step 4: Generate Cover Image
- Select appropriate prompt template
- Generate with GPT Image 1.5
- Review against quality checklist
- Rename and organize file

### Step 5: Create MDX File
- Use proper frontmatter schema
- Add content with proper markdown formatting
- Include tables, lists for scannability
- Add internal links

### Step 6: Review & Deploy
- Run `npm run build` to verify
- Check rendered output locally if possible
- Commit with descriptive message
- Push to deploy

---

## Frontmatter Schema

```yaml
---
title: 'SEO-Optimized Title Here'
description: 'Meta description for search results (150-160 chars)'
date: YYYY-MM-DD
author: 'Dr. [First] [Last]'
category: 'facial' | 'body' | 'breast' | 'non-surgical' | 'recovery' | 'news'
tags: ['primary-keyword', 'secondary-keyword', 'related-term']
coverImage: '/images/blog/YYYY-MM-DD-slug.png'
draft: false
featured: false
---
```

### Field Guidelines

| Field | Requirements |
|-------|-------------|
| `title` | 50-60 chars, primary keyword early |
| `description` | 150-160 chars, keyword + benefit + CTA |
| `date` | Publication date in YYYY-MM-DD format |
| `author` | Use realistic surgeon names with credentials |
| `category` | One of the six defined categories |
| `tags` | 3-6 relevant keywords, lowercase with hyphens |
| `coverImage` | Path to generated image |
| `draft` | Set `true` while working, `false` to publish |
| `featured` | Only one post should be `true` at a time |

---

## Author Personas

Use these consistent author names for credibility:

| Name | Specialty | Use For |
|------|-----------|---------|
| Dr. Sarah Mitchell | Facial Plastic Surgery | Rhinoplasty, facelifts, facial procedures |
| Dr. Emily Chen | Breast Surgery | Breast augmentation, reduction, lifts |
| Dr. Michael Torres | Body Contouring | Liposuction, tummy tucks, body procedures |
| Dr. Jennifer Park | Non-Surgical | Injectables, laser, skin treatments |
| Dr. David Kim | General/Recovery | Recovery guides, general topics |

---

## Quality Standards

### Content Must:
- ✅ Be medically accurate (or clearly noted as general information)
- ✅ Provide genuine value to the reader
- ✅ Answer the questions people actually have
- ✅ Be scannable (headers, lists, tables)
- ✅ Include clear next steps or CTAs
- ✅ Link to related content internally

### Content Must NOT:
- ❌ Make medical claims without qualification
- ❌ Promise specific results
- ❌ Use fear-based marketing
- ❌ Include pricing (too variable, becomes outdated)
- ❌ Disparage competitors or other procedures
- ❌ Use stock photo clichés

---

## Measuring Success

### Key Metrics to Track
- Organic search impressions and clicks (GSC)
- Keyword rankings for target terms
- Time on page and scroll depth
- Internal link clicks
- Consultation form submissions

### Content Performance Review
- Monthly: Review top/bottom performing content
- Quarterly: Update underperforming articles
- Annually: Comprehensive content audit

---

## Quick Reference Checklist

For every new article:

- [ ] Title optimized (50-60 chars, keyword early)
- [ ] Meta description written (150-160 chars)
- [ ] Primary keyword in first 100 words
- [ ] H2 headings include secondary keywords
- [ ] At least one table or formatted list
- [ ] 3-5 internal links included
- [ ] FAQ section with 3-5 questions
- [ ] Cover image generated with GPT Image 1.5
- [ ] Image passes quality checklist
- [ ] Frontmatter complete and accurate
- [ ] Build succeeds without errors
- [ ] Committed with descriptive message
