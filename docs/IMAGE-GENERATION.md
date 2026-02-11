# Image Generation Guide

## Overview

Blog images are generated using **Nano Banana Pro** (Gemini 3 Pro Image) to create artistic, editorial-quality visuals that match our "Quiet Luxury Medical" aesthetic.

## Storage

- **Current:** Local storage in `public/images/blog/`
- **Future:** Vercel Blob (pending API key)

## Generating Images

### Command

```bash
uv run /root/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "YOUR PROMPT HERE" \
  --filename "public/images/blog/YYYY-MM-DD-slug-name.png" \
  --resolution 2K
```

### Resolution Guidelines

| Use Case | Resolution | Dimensions |
|----------|------------|------------|
| Blog cover images | 2K | 2048×2048 |
| Featured posts | 2K | 2048×2048 |
| Procedure illustrations | 1K | 1024×1024 |

## Art Direction

### Style: "Quiet Luxury Medical Editorial"

Our images should feel like they belong in **Architectural Digest meets Vogue Health** — sophisticated, warm, and trustworthy.

### Core Aesthetic Principles

1. **Soft, warm lighting** — Golden hour quality, never harsh clinical lighting
2. **Muted, elegant palette** — Ivory, blush, warm sand tones; subtle rose gold accents
3. **Abstract & artistic** — NOT realistic before/after photos or clinical imagery
4. **Editorial composition** — Thoughtful negative space, magazine-worthy framing
5. **Tactile textures** — Soft fabrics, organic materials, subtle gradients
6. **Human elements** — Graceful silhouettes, partial profiles, hands; never full faces

### What to AVOID

- ❌ Clinical/sterile hospital imagery
- ❌ Graphic surgical content
- ❌ Stock photo clichés (pointing at face, mirror selfies)
- ❌ Bright, saturated colors
- ❌ AI-looking distorted faces or bodies
- ❌ Before/after comparison imagery

---

## Prompt Templates by Category

### Facial Procedures (Rhinoplasty, Facelifts, etc.)

```
Artistic editorial photograph, soft golden hour lighting, elegant woman's profile silhouette 
against warm ivory background, subtle rose gold accents, minimalist composition with generous 
negative space, soft shadows, luxury medical spa aesthetic, Architectural Digest style, 
muted warm tones, no text, photorealistic quality
```

```
Abstract artistic composition featuring soft flowing organic shapes in blush and ivory tones, 
suggesting facial harmony and balance, editorial magazine quality, warm diffused lighting, 
elegant and sophisticated, luxury aesthetic medicine mood, subtle golden accents
```

### Body Contouring (Liposuction, Tummy Tuck, etc.)

```
Elegant artistic photograph, graceful feminine silhouette draped in flowing ivory silk fabric, 
soft warm studio lighting, abstract body contour composition, luxury spa aesthetic, 
editorial magazine quality, muted warm color palette with subtle rose gold, 
generous negative space, sophisticated and empowering
```

```
Abstract artistic composition of flowing curves and organic shapes in warm sand and blush tones, 
suggesting body confidence and transformation, soft gradient lighting, editorial luxury aesthetic, 
no human figures, sophisticated medical spa mood
```

### Non-Surgical (Injectables, Laser, Skin)

```
Close-up artistic photograph of luxury skincare moment, soft hands touching elegant glass vessel, 
warm diffused lighting, ivory and blush color palette, editorial beauty photography style, 
sophisticated spa aesthetic, subtle textures, magazine quality composition
```

```
Abstract artistic composition of soft light rays and gentle gradient transitions, 
suggesting skin renewal and radiance, warm golden and ivory tones, minimalist elegant aesthetic, 
luxury medical spa mood, no faces, editorial magazine quality
```

### Recovery & Wellness

```
Serene artistic photograph, soft natural morning light through sheer curtains, 
cozy neutral textiles in ivory and warm sand tones, peaceful healing atmosphere, 
editorial interior design aesthetic, spa-like tranquility, generous negative space, 
sophisticated and calming composition
```

```
Artistic still life composition featuring soft organic elements - smooth stones, 
flowing fabric, gentle botanicals - in muted warm palette, suggesting rest and renewal, 
luxury wellness aesthetic, soft shadows, editorial magazine quality
```

---

## Workflow for New Blog Posts

### 1. Determine the image type needed

- **Cover image:** Main visual for the post (required)
- **Section illustrations:** Optional supporting images

### 2. Select appropriate prompt template

Choose from templates above based on post category, then customize:
- Add specific procedure references if helpful
- Adjust color emphasis to match content mood
- Include any specific compositional needs

### 3. Generate the image

```bash
# Example for a rhinoplasty article
uv run /root/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Artistic editorial photograph, soft golden hour lighting, elegant woman's profile silhouette against warm ivory background, subtle rose gold accents, minimalist composition with generous negative space, soft shadows, luxury medical spa aesthetic, Architectural Digest style, muted warm tones, no text, photorealistic quality" \
  --filename "public/images/blog/2026-02-11-rhinoplasty-guide.png" \
  --resolution 2K
```

### 4. Update blog post frontmatter

```yaml
coverImage: '/images/blog/2026-02-11-rhinoplasty-guide.png'
```

---

## Naming Convention

```
YYYY-MM-DD-[post-slug]-[descriptor].png
```

Examples:
- `2026-02-11-rhinoplasty-guide.png`
- `2026-02-11-rhinoplasty-guide-recovery.png`
- `2026-02-15-breast-augmentation-cover.png`

---

## Quality Checklist

Before using a generated image:

- [ ] Matches luxury medical editorial aesthetic
- [ ] No distorted anatomy or AI artifacts
- [ ] Warm, sophisticated color palette
- [ ] Appropriate for medical/wellness context
- [ ] Works well at both large and thumbnail sizes
- [ ] No text or watermarks in the image

If the image doesn't meet standards, regenerate with adjusted prompt.

---

## Future: Vercel Blob Integration

When Vercel Blob API key is available:

1. Generate image locally first
2. Upload to Vercel Blob
3. Update frontmatter with Blob URL
4. Delete local file (optional)

Documentation will be updated when this is implemented.
