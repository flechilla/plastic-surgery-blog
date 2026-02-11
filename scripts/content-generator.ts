#!/usr/bin/env npx tsx
/**
 * Automated Content Generator for Plastic Surgery Blog
 * 
 * Runs every 10 minutes via cron to generate SEO-optimized blog content.
 * Follows CONTENT-GUIDE.md specifications for the target audience.
 * 
 * Target: Women 30-55, high-income ($150K+), researching plastic surgery
 * Goal: Rank #1 on Google for procedure-related queries
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ROOT = '/root/.openclaw/workspace/projects/plastic-surgery-blog';
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/blog');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/blog');
const STATE_FILE = path.join(PROJECT_ROOT, 'scripts/.content-state.json');
const LOCK_FILE = path.join(PROJECT_ROOT, 'scripts/.content-generator.lock');

// Topic database with SEO keywords and priorities
const TOPIC_DATABASE: TopicEntry[] = [
  // Facial Procedures - High search volume
  { slug: 'rhinoplasty-cost-guide', category: 'facial', keywords: ['rhinoplasty cost', 'nose job price', 'how much is rhinoplasty'], author: 'Dr. Sarah Mitchell', priority: 1 },
  { slug: 'facelift-recovery-timeline', category: 'facial', keywords: ['facelift recovery', 'facelift healing time', 'recovery after facelift'], author: 'Dr. Sarah Mitchell', priority: 1 },
  { slug: 'blepharoplasty-guide', category: 'facial', keywords: ['blepharoplasty', 'eyelid surgery', 'eyelid lift'], author: 'Dr. Sarah Mitchell', priority: 2 },
  { slug: 'brow-lift-vs-botox', category: 'facial', keywords: ['brow lift', 'forehead lift', 'brow lift vs botox'], author: 'Dr. Sarah Mitchell', priority: 2 },
  { slug: 'chin-augmentation-options', category: 'facial', keywords: ['chin augmentation', 'chin implant', 'genioplasty'], author: 'Dr. Sarah Mitchell', priority: 3 },
  { slug: 'neck-lift-complete-guide', category: 'facial', keywords: ['neck lift', 'neck rejuvenation', 'turkey neck surgery'], author: 'Dr. Sarah Mitchell', priority: 2 },
  { slug: 'otoplasty-ear-surgery', category: 'facial', keywords: ['otoplasty', 'ear surgery', 'ear pinning'], author: 'Dr. Sarah Mitchell', priority: 3 },
  { slug: 'mini-facelift-guide', category: 'facial', keywords: ['mini facelift', 'weekend facelift', 'short scar facelift'], author: 'Dr. Sarah Mitchell', priority: 2 },
  
  // Body Procedures - High intent
  { slug: 'liposuction-complete-guide', category: 'body', keywords: ['liposuction', 'lipo surgery', 'fat removal surgery'], author: 'Dr. Michael Torres', priority: 1 },
  { slug: 'tummy-tuck-recovery-guide', category: 'body', keywords: ['tummy tuck recovery', 'abdominoplasty recovery', 'tummy tuck healing'], author: 'Dr. Michael Torres', priority: 1 },
  { slug: 'mommy-makeover-guide', category: 'body', keywords: ['mommy makeover', 'post pregnancy surgery', 'mommy makeover cost'], author: 'Dr. Michael Torres', priority: 1 },
  { slug: 'brazilian-butt-lift-safety', category: 'body', keywords: ['bbl surgery', 'brazilian butt lift', 'bbl safety'], author: 'Dr. Michael Torres', priority: 1 },
  { slug: 'arm-lift-brachioplasty', category: 'body', keywords: ['arm lift', 'brachioplasty', 'arm contouring'], author: 'Dr. Michael Torres', priority: 2 },
  { slug: 'thigh-lift-surgery', category: 'body', keywords: ['thigh lift', 'thigh contouring', 'inner thigh lift'], author: 'Dr. Michael Torres', priority: 3 },
  { slug: 'body-lift-after-weight-loss', category: 'body', keywords: ['body lift', 'after weight loss surgery', 'post bariatric surgery'], author: 'Dr. Michael Torres', priority: 2 },
  { slug: 'liposuction-vs-tummy-tuck', category: 'body', keywords: ['liposuction vs tummy tuck', 'lipo or tummy tuck', 'which is better'], author: 'Dr. Michael Torres', priority: 1 },
  
  // Breast Procedures - High volume
  { slug: 'breast-augmentation-implant-types', category: 'breast', keywords: ['breast implant types', 'silicone vs saline', 'breast augmentation options'], author: 'Dr. Emily Chen', priority: 1 },
  { slug: 'breast-reduction-guide', category: 'breast', keywords: ['breast reduction', 'breast reduction surgery', 'reduction mammoplasty'], author: 'Dr. Emily Chen', priority: 1 },
  { slug: 'breast-lift-mastopexy', category: 'breast', keywords: ['breast lift', 'mastopexy', 'breast lift without implants'], author: 'Dr. Emily Chen', priority: 1 },
  { slug: 'breast-implant-sizing', category: 'breast', keywords: ['breast implant size', 'how to choose implant size', 'breast augmentation sizing'], author: 'Dr. Emily Chen', priority: 1 },
  { slug: 'breast-revision-surgery', category: 'breast', keywords: ['breast revision', 'implant revision', 'breast implant replacement'], author: 'Dr. Emily Chen', priority: 2 },
  { slug: 'breast-augmentation-recovery', category: 'breast', keywords: ['breast augmentation recovery', 'recovery after breast surgery', 'breast implant recovery'], author: 'Dr. Emily Chen', priority: 1 },
  { slug: 'natural-looking-breast-augmentation', category: 'breast', keywords: ['natural breast augmentation', 'natural looking implants', 'subtle breast augmentation'], author: 'Dr. Emily Chen', priority: 1 },
  { slug: 'breast-implant-illness', category: 'breast', keywords: ['breast implant illness', 'BII symptoms', 'implant safety'], author: 'Dr. Emily Chen', priority: 2 },
  
  // Non-Surgical - Growing segment
  { slug: 'botox-complete-guide', category: 'non-surgical', keywords: ['botox', 'botox injections', 'botox for wrinkles'], author: 'Dr. Jennifer Park', priority: 1 },
  { slug: 'dermal-fillers-guide', category: 'non-surgical', keywords: ['dermal fillers', 'juvederm', 'restylane', 'facial fillers'], author: 'Dr. Jennifer Park', priority: 1 },
  { slug: 'liquid-facelift', category: 'non-surgical', keywords: ['liquid facelift', 'non-surgical facelift', 'injectable facelift'], author: 'Dr. Jennifer Park', priority: 2 },
  { slug: 'kybella-double-chin', category: 'non-surgical', keywords: ['kybella', 'double chin treatment', 'non-surgical chin reduction'], author: 'Dr. Jennifer Park', priority: 2 },
  { slug: 'laser-skin-resurfacing', category: 'non-surgical', keywords: ['laser skin resurfacing', 'laser treatment face', 'co2 laser'], author: 'Dr. Jennifer Park', priority: 2 },
  { slug: 'chemical-peels-guide', category: 'non-surgical', keywords: ['chemical peel', 'skin peel treatment', 'chemical peel types'], author: 'Dr. Jennifer Park', priority: 3 },
  { slug: 'microneedling-benefits', category: 'non-surgical', keywords: ['microneedling', 'micro needling skin', 'collagen induction therapy'], author: 'Dr. Jennifer Park', priority: 2 },
  { slug: 'coolsculpting-vs-liposuction', category: 'non-surgical', keywords: ['coolsculpting', 'coolsculpting vs lipo', 'fat freezing'], author: 'Dr. Jennifer Park', priority: 1 },
  
  // Recovery - High value content
  { slug: 'plastic-surgery-recovery-tips', category: 'recovery', keywords: ['plastic surgery recovery', 'surgery recovery tips', 'healing after surgery'], author: 'Dr. David Kim', priority: 1 },
  { slug: 'managing-swelling-after-surgery', category: 'recovery', keywords: ['swelling after surgery', 'reduce post-surgery swelling', 'post op swelling'], author: 'Dr. David Kim', priority: 1 },
  { slug: 'scar-care-guide', category: 'recovery', keywords: ['scar care', 'minimize surgical scars', 'scar treatment after surgery'], author: 'Dr. David Kim', priority: 1 },
  { slug: 'returning-to-exercise-after-surgery', category: 'recovery', keywords: ['exercise after surgery', 'working out after plastic surgery', 'post surgery fitness'], author: 'Dr. David Kim', priority: 2 },
  { slug: 'emotional-recovery-plastic-surgery', category: 'recovery', keywords: ['emotional recovery surgery', 'mental health after surgery', 'surgery anxiety'], author: 'Dr. David Kim', priority: 2 },
  { slug: 'compression-garments-guide', category: 'recovery', keywords: ['compression garments', 'surgical compression wear', 'post surgery garments'], author: 'Dr. David Kim', priority: 2 },
  
  // Decision Making - High intent
  { slug: 'choosing-plastic-surgeon', category: 'facial', keywords: ['how to choose plastic surgeon', 'finding the right surgeon', 'board certified surgeon'], author: 'Dr. David Kim', priority: 1 },
  { slug: 'plastic-surgery-consultation-questions', category: 'recovery', keywords: ['plastic surgery consultation', 'questions to ask surgeon', 'surgery consultation prep'], author: 'Dr. David Kim', priority: 1 },
  { slug: 'plastic-surgery-financing-options', category: 'recovery', keywords: ['plastic surgery financing', 'cosmetic surgery payment plans', 'surgery financing'], author: 'Dr. David Kim', priority: 1 },
  { slug: 'realistic-expectations-plastic-surgery', category: 'recovery', keywords: ['realistic expectations', 'plastic surgery results', 'what to expect surgery'], author: 'Dr. David Kim', priority: 2 },
  
  // Trending/News - Fresh content
  { slug: 'plastic-surgery-trends-2026', category: 'news', keywords: ['plastic surgery trends 2026', 'cosmetic surgery trends', 'popular procedures 2026'], author: 'Dr. Sarah Mitchell', priority: 1 },
  { slug: 'ai-plastic-surgery-planning', category: 'news', keywords: ['AI plastic surgery', 'surgery simulation', '3D surgery planning'], author: 'Dr. David Kim', priority: 2 },
];

// Internal linking database
const INTERNAL_LINKS: Record<string, string[]> = {
  'facial': ['/blog/rhinoplasty-recovery-timeline', '/blog/choosing-plastic-surgeon', '/blog/facelift-recovery-timeline'],
  'body': ['/blog/liposuction-complete-guide', '/blog/tummy-tuck-recovery-guide', '/blog/mommy-makeover-guide'],
  'breast': ['/blog/breast-augmentation-implant-types', '/blog/breast-augmentation-recovery', '/blog/breast-lift-mastopexy'],
  'non-surgical': ['/blog/botox-complete-guide', '/blog/dermal-fillers-guide', '/blog/liquid-facelift'],
  'recovery': ['/blog/plastic-surgery-recovery-tips', '/blog/managing-swelling-after-surgery', '/blog/scar-care-guide'],
  'news': ['/blog/plastic-surgery-trends-2026', '/blog/choosing-plastic-surgeon'],
};

// Authoritative external sources for links
const EXTERNAL_SOURCES = [
  { domain: 'plasticsurgery.org', name: 'American Society of Plastic Surgeons (ASPS)', topics: ['all'] },
  { domain: 'surgery.org', name: 'The Aesthetic Society', topics: ['all'] },
  { domain: 'fda.gov', name: 'U.S. Food and Drug Administration', topics: ['breast', 'non-surgical'] },
  { domain: 'mayoclinic.org', name: 'Mayo Clinic', topics: ['recovery', 'facial', 'body'] },
  { domain: 'ncbi.nlm.nih.gov', name: 'National Institutes of Health', topics: ['all'] },
  { domain: 'healthline.com', name: 'Healthline', topics: ['recovery', 'non-surgical'] },
];

interface TopicEntry {
  slug: string;
  category: 'facial' | 'body' | 'breast' | 'non-surgical' | 'recovery' | 'news';
  keywords: string[];
  author: string;
  priority: number;
}

interface ContentState {
  generatedSlugs: string[];
  lastRun: string;
  totalGenerated: number;
}

interface GeneratedContent {
  title: string;
  description: string;
  content: string;
  tags: string[];
}

// Utility functions
function loadState(): ContentState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return { generatedSlugs: [], lastRun: '', totalGenerated: 0 };
}

function saveState(state: ContentState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function acquireLock(): boolean {
  if (fs.existsSync(LOCK_FILE)) {
    const lockTime = fs.statSync(LOCK_FILE).mtimeMs;
    const now = Date.now();
    // Stale lock (older than 30 minutes)
    if (now - lockTime > 30 * 60 * 1000) {
      fs.unlinkSync(LOCK_FILE);
    } else {
      return false;
    }
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString());
  return true;
}

function releaseLock(): void {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}

function getExistingSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''));
}

function selectNextTopic(state: ContentState): TopicEntry | null {
  const existingSlugs = new Set([...getExistingSlugs(), ...state.generatedSlugs]);
  
  // Filter available topics and sort by priority
  const availableTopics = TOPIC_DATABASE
    .filter(t => !existingSlugs.has(t.slug))
    .sort((a, b) => a.priority - b.priority);
  
  if (availableTopics.length === 0) {
    console.log('All topics have been generated!');
    return null;
  }
  
  // Pick from top priority topics with some randomness
  const topPriority = availableTopics[0].priority;
  const topTierTopics = availableTopics.filter(t => t.priority === topPriority);
  return topTierTopics[Math.floor(Math.random() * topTierTopics.length)];
}

function getInternalLinks(category: string, currentSlug: string): string[] {
  const links = INTERNAL_LINKS[category] || [];
  const existingSlugs = getExistingSlugs();
  return links
    .filter(link => {
      const slug = link.replace('/blog/', '');
      return slug !== currentSlug && existingSlugs.includes(slug);
    })
    .slice(0, 3);
}

function getExternalSources(category: string): typeof EXTERNAL_SOURCES {
  return EXTERNAL_SOURCES.filter(
    s => s.topics.includes('all') || s.topics.includes(category)
  ).slice(0, 3);
}

async function generateContent(topic: TopicEntry): Promise<GeneratedContent> {
  const anthropic = new Anthropic();
  
  const internalLinks = getInternalLinks(topic.category, topic.slug);
  const externalSources = getExternalSources(topic.category);
  
  const prompt = `You are an expert medical content writer creating content for a luxury plastic surgery blog targeting women ages 30-55 with high household incomes ($150K+) who are actively researching procedures.

**WRITING STYLE:**
- Warm, knowledgeable, reassuring (like a trusted doctor friend)
- NOT clinical jargon, NOT pushy sales, NOT fear-mongering
- Elegant, sophisticated tone matching "Architectural Digest meets Mayo Clinic"
- Educational and empowering, helping readers make informed decisions

**TOPIC:** ${topic.slug.replace(/-/g, ' ')}
**CATEGORY:** ${topic.category}
**TARGET KEYWORDS:** ${topic.keywords.join(', ')}
**AUTHOR:** ${topic.author}

**SEO REQUIREMENTS:**
1. Title: 50-60 characters, primary keyword in first 3 words
2. Description: 150-160 characters with keyword + benefit + credibility signal
3. Content: 1,500-2,500 words
4. Primary keyword in first 100 words
5. H2 headings with secondary keywords
6. Include FAQ section with 4-5 questions targeting "People Also Ask"

**REQUIRED SECTIONS:**
For procedure articles:
1. What is [Procedure]? (2-3 paragraphs)
2. Who is a Good Candidate?
3. The Consultation Process
4. What to Expect
5. Recovery Timeline (use a markdown table)
6. Results & Longevity
7. Risks & Considerations
8. Cost Factors (general ranges only, no specific prices)
9. Choosing the Right Surgeon
10. FAQ Section

For recovery articles:
1. What to Expect Immediately After
2. Week-by-Week Timeline (table format)
3. Do's and Don'ts
4. Managing Common Side Effects
5. When to Call Your Surgeon
6. Long-term Care Tips
7. FAQ Section

**INTERNAL LINKS TO INCLUDE:**
${internalLinks.length > 0 ? internalLinks.map(l => `- ${l}`).join('\n') : '- (none available yet - skip internal links)'}

**EXTERNAL AUTHORITY SOURCES TO REFERENCE:**
${externalSources.map(s => `- ${s.name} (${s.domain})`).join('\n')}

**OUTPUT FORMAT:**
Return a JSON object with:
{
  "title": "SEO-optimized title",
  "description": "Meta description 150-160 chars",
  "tags": ["keyword1", "keyword2", "keyword3"],
  "content": "Full MDX content starting with first heading (no frontmatter)"
}

The content field should be complete markdown/MDX with:
- Proper H2 (##) and H3 (###) headings
- Tables where specified
- Bold and italic for emphasis
- Internal links using markdown format: [anchor text](/blog/slug)
- External links with proper attribution
- NO frontmatter (I'll add that separately)

Generate the content now:`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }
  
  return JSON.parse(jsonMatch[0]) as GeneratedContent;
}

async function generateCoverImage(topic: TopicEntry): Promise<string> {
  const dateStr = new Date().toISOString().split('T')[0];
  const outputFilename = `${dateStr}-${topic.slug}.png`;
  const outputPath = path.join(IMAGES_DIR, outputFilename);
  
  // Art direction prompts by category
  const categoryPrompts: Record<string, string> = {
    facial: `Artistic editorial photograph, elegant feminine profile silhouette in soft golden hour lighting, warm ivory background with subtle blush tones, minimalist composition with generous negative space, luxury medical spa aesthetic, sophisticated and serene, suggesting facial harmony and refinement, Architectural Digest style, no text, no faces visible`,
    body: `Elegant artistic photograph, graceful feminine silhouette draped in flowing ivory silk fabric, soft warm studio lighting creating gentle shadows, abstract body confidence composition, luxury spa aesthetic, editorial magazine quality, muted warm color palette with subtle rose gold tones, sophisticated and empowering, no faces visible`,
    breast: `Sophisticated abstract photograph, soft flowing fabric in ivory and blush creating elegant curves, warm diffused lighting, luxury fashion editorial style, tasteful and empowering, feminine elegance, Vogue aesthetic, generous negative space, no human figures`,
    'non-surgical': `Artistic close-up photograph of luxury skincare moment, elegant glass vessel with golden serum, soft hands in frame, warm diffused lighting, ivory and blush color palette, editorial beauty photography style, sophisticated spa aesthetic, subtle textures, magazine quality, no faces, serene and indulgent mood`,
    recovery: `Serene artistic photograph, soft natural morning light through sheer curtains, cozy neutral textiles in ivory and warm sand tones, peaceful healing atmosphere, editorial interior design aesthetic, spa-like tranquility, generous negative space, calming and restorative composition`,
    news: `Modern minimalist photograph, architectural forms with soft shadows, clean lines meeting organic shapes, ivory and deep sage color palette, contemporary luxury aesthetic, editorial design magazine style, sophisticated and forward-thinking, abstract composition`,
  };
  
  const prompt = categoryPrompts[topic.category] || categoryPrompts.facial;
  
  // Use GPT Image 1.5 (more reliable than Gemini)
  const genScript = '/root/.nvm/versions/node/v24.13.0/lib/node_modules/openclaw/skills/openai-image-gen/scripts/gen.py';
  
  execSync(`python3 ${genScript} \
    --prompt "${prompt.replace(/"/g, '\\"')}" \
    --model gpt-image-1.5 \
    --size 1536x1024 \
    --quality high \
    --count 1 \
    --out-dir "${IMAGES_DIR}"`, { stdio: 'inherit' });
  
  // Rename the generated file
  const generatedFiles = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.match(/^\d{3}-.*\.png$/))
    .sort()
    .reverse();
  
  if (generatedFiles.length > 0) {
    const latestFile = path.join(IMAGES_DIR, generatedFiles[0]);
    fs.renameSync(latestFile, outputPath);
    
    // Clean up index.html and prompts.json if they exist
    const indexFile = path.join(IMAGES_DIR, 'index.html');
    const promptsFile = path.join(IMAGES_DIR, 'prompts.json');
    if (fs.existsSync(indexFile)) fs.unlinkSync(indexFile);
    if (fs.existsSync(promptsFile)) fs.unlinkSync(promptsFile);
    
    return `/images/blog/${outputFilename}`;
  }
  
  throw new Error('Failed to generate cover image');
}

function writeMdxFile(topic: TopicEntry, content: GeneratedContent, coverImage: string): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const filePath = path.join(CONTENT_DIR, `${topic.slug}.mdx`);
  
  const frontmatter = `---
title: '${content.title.replace(/'/g, "''")}'
description: '${content.description.replace(/'/g, "''")}'
date: ${dateStr}
author: '${topic.author}'
category: '${topic.category}'
tags: [${content.tags.map(t => `'${t}'`).join(', ')}]
coverImage: '${coverImage}'
draft: false
featured: false
---

`;
  
  fs.writeFileSync(filePath, frontmatter + content.content);
  console.log(`✅ Created: ${filePath}`);
}

function commitAndDeploy(topic: TopicEntry): void {
  const commitMsg = `feat(content): add ${topic.slug.replace(/-/g, ' ')} article

- Category: ${topic.category}
- Author: ${topic.author}
- Keywords: ${topic.keywords.join(', ')}
- Auto-generated by content-generator`;

  execSync(`cd ${PROJECT_ROOT} && git add -A && git commit -m "${commitMsg}" && git push origin main`, {
    stdio: 'inherit',
  });
  
  console.log('✅ Committed and pushed to main (auto-deploy triggered)');
}

async function main(): Promise<void> {
  console.log('🚀 Content Generator Starting...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  // Acquire lock to prevent concurrent runs
  if (!acquireLock()) {
    console.log('⏳ Another instance is running. Exiting.');
    process.exit(0);
  }
  
  try {
    const state = loadState();
    
    // Select next topic
    const topic = selectNextTopic(state);
    if (!topic) {
      console.log('📭 No new topics to generate.');
      return;
    }
    
    console.log(`\n📝 Generating: ${topic.slug}`);
    console.log(`   Category: ${topic.category}`);
    console.log(`   Keywords: ${topic.keywords.join(', ')}`);
    console.log(`   Author: ${topic.author}`);
    
    // Generate content with Claude
    console.log('\n🤖 Generating content with Claude...');
    const content = await generateContent(topic);
    console.log(`   Title: ${content.title}`);
    console.log(`   Tags: ${content.tags.join(', ')}`);
    
    // Generate cover image
    console.log('\n🖼️ Generating cover image with GPT Image 1.5...');
    const coverImage = await generateCoverImage(topic);
    console.log(`   Image: ${coverImage}`);
    
    // Write MDX file
    console.log('\n📄 Writing MDX file...');
    writeMdxFile(topic, content, coverImage);
    
    // Build to verify
    console.log('\n🔨 Building to verify...');
    execSync(`cd ${PROJECT_ROOT} && npm run build`, { stdio: 'inherit' });
    
    // Commit and deploy
    console.log('\n🚀 Deploying...');
    commitAndDeploy(topic);
    
    // Update state
    state.generatedSlugs.push(topic.slug);
    state.lastRun = new Date().toISOString();
    state.totalGenerated++;
    saveState(state);
    
    console.log(`\n✨ Successfully generated and deployed: ${topic.slug}`);
    console.log(`   Total articles generated: ${state.totalGenerated}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    releaseLock();
  }
}

main();
