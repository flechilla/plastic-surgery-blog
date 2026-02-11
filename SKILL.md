# Plastic Surgery Blog Content Creation Skill

> Create world-class, SEO-optimized content for the Aesthetic Surgery Journal.

## Overview

This skill enables agents to create high-quality blog content for a plastic surgery education website targeting prospective patients (women 30-55, high income, research-driven).

## Before You Start

1. Read `docs/CONTENT-GUIDE.md` for full documentation
2. Review existing content in `src/content/blog/` to understand style
3. Check `docs/DESIGN-DIRECTION.md` for visual aesthetic guidelines

## Content Categories

| Category | Slug | Focus |
|----------|------|-------|
| Facial Procedures | `facial` | Rhinoplasty, facelifts, eyelid surgery |
| Body Procedures | `body` | Liposuction, tummy tucks, body contouring |
| Breast Surgery | `breast` | Augmentation, reduction, lifts |
| Non-Surgical | `non-surgical` | Injectables, laser, skin treatments |
| Recovery | `recovery` | Post-op care, healing guides |
| News | `news` | Industry updates, new technologies |

## Creating a New Article

### Step 1: Generate Cover Image

```bash
python3 /root/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills/openai-image-gen/scripts/gen.py \
  --prompt "YOUR_PROMPT_HERE" \
  --model gpt-image-1.5 \
  --size 1024x1024 \
  --quality high \
  --count 1 \
  --out-dir public/images/blog
```

#### Prompt Templates

**Facial:**
```
Artistic editorial photograph, elegant feminine profile silhouette in soft golden hour lighting, warm ivory background with subtle blush tones, minimalist composition with generous negative space, luxury medical spa aesthetic, sophisticated and serene, Architectural Digest style, no text
```

**Body:**
```
Elegant artistic photograph, graceful feminine silhouette draped in flowing ivory silk fabric, soft warm studio lighting, abstract body confidence composition, luxury spa aesthetic, editorial magazine quality, muted warm palette with rose gold tones, no faces visible
```

**Non-Surgical:**
```
Artistic close-up photograph of luxury skincare moment, soft hands with elegant glass vessel, warm diffused lighting, ivory and blush palette, editorial beauty photography, sophisticated spa aesthetic, magazine quality, no faces
```

**Recovery:**
```
Serene artistic photograph, soft natural morning light through sheer curtains, cozy neutral textiles in ivory and warm sand tones, peaceful healing atmosphere, editorial interior aesthetic, spa-like tranquility
```

### Step 2: Rename Image

```bash
mv public/images/blog/001-*.png public/images/blog/YYYY-MM-DD-post-slug.png
rm -f public/images/blog/index.html public/images/blog/prompts.json
```

### Step 3: Create MDX File

Create `src/content/blog/post-slug.mdx`:

```mdx
---
title: 'SEO Title (50-60 chars, keyword early)'
description: 'Meta description (150-160 chars) with keyword and benefit'
date: YYYY-MM-DD
author: 'Dr. [Name]'
category: 'facial' | 'body' | 'breast' | 'non-surgical' | 'recovery' | 'news'
tags: ['primary-keyword', 'secondary-keyword', 'related-term']
coverImage: '/images/blog/YYYY-MM-DD-post-slug.png'
draft: false
featured: false
---

# Main Title (H1 - only one)

Opening paragraph with primary keyword in first 100 words. Set context and hook the reader.

## Section Title (H2 with secondary keyword)

Content...

### Subsection (H3 if needed)

Content...

## Another Section

| Column 1 | Column 2 |
|----------|----------|
| Data | Data |

## FAQ

### Question 1?
Answer...

### Question 2?
Answer...

## Conclusion

Wrap up with next steps or CTA.
```

### Step 4: Build & Deploy

```bash
cd /root/.openclaw/workspace/projects/plastic-surgery-blog
npm run build
git add -A
git commit -m "feat: add [topic] article with GPT Image 1.5 cover"
git push origin main
```

## SEO Requirements

### Title
- 50-60 characters
- Primary keyword in first 3 words
- Include benefit or descriptor

### Description  
- 150-160 characters
- Include primary keyword naturally
- Mention expertise ("board-certified")
- End with value proposition

### Content
- Primary keyword in first 100 words
- Secondary keywords in H2 headings
- 1-2% keyword density (natural usage)
- At least one table or formatted list
- 3-5 internal links to related content
- FAQ section for "People Also Ask"

## Author Personas

| Name | Use For |
|------|---------|
| Dr. Sarah Mitchell | Facial procedures |
| Dr. Emily Chen | Breast surgery |
| Dr. Michael Torres | Body contouring |
| Dr. Jennifer Park | Non-surgical |
| Dr. David Kim | Recovery, general |

## Image Quality Checklist

Before using generated image:
- [ ] Matches luxury editorial aesthetic
- [ ] No AI artifacts or distortions
- [ ] Warm, sophisticated colors
- [ ] Works at cover and thumbnail sizes
- [ ] No text or watermarks

Regenerate if image doesn't meet standards.

## Content Quality Checklist

- [ ] Medically appropriate (general education, not medical advice)
- [ ] Genuinely helpful to prospective patients
- [ ] Scannable (headers, lists, tables)
- [ ] Warm, expert voice (not clinical or salesy)
- [ ] No specific pricing or guarantees
- [ ] Internal links included
- [ ] CTA to consultation

## Voice & Tone

**Be:** Warm, knowledgeable, reassuring, sophisticated
**Don't be:** Clinical, pushy, fear-mongering, overpromising

Write like a trusted doctor friend explaining options over coffee — expert but approachable.

## File Locations

- **Blog posts:** `src/content/blog/*.mdx`
- **Images:** `public/images/blog/`
- **Full docs:** `docs/CONTENT-GUIDE.md`
- **Design system:** `docs/DESIGN-DIRECTION.md`
- **Image generation:** `docs/IMAGE-GENERATION.md`
