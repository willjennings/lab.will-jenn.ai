#!/usr/bin/env node

/**
 * build-manifest.js
 * Scans /projects/ directories, reads each meta.json,
 * and generates projects.json manifest for the gallery.
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const OUTPUT_FILE = path.join(__dirname, '..', 'projects.json');

function buildManifest() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error('Error: projects/ directory not found');
    process.exit(1);
  }

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const projects = [];
  const errors = [];

  entries.forEach((folder, index) => {
    const metaPath = path.join(PROJECTS_DIR, folder, 'meta.json');

    if (!fs.existsSync(metaPath)) {
      errors.push(`  Warning: ${folder}/meta.json not found, skipping`);
      return;
    }

    try {
      const raw = fs.readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(raw);

      // Validate required fields
      const required = ['title', 'date', 'description'];
      const missing = required.filter(f => !meta[f]);
      if (missing.length) {
        errors.push(`  Warning: ${folder}/meta.json missing fields: ${missing.join(', ')}`);
      }

      // Check for thumbnail
      const thumbPath = path.join(PROJECTS_DIR, folder, 'thumb.png');
      const hasThumb = fs.existsSync(thumbPath);

      projects.push({
        folder,
        title: meta.title || folder,
        date: meta.date || '',
        dayNumber: meta.dayNumber || null,
        description: meta.description || '',
        tags: meta.tags || [],
        tools: meta.tools || [],
        accentColor: meta.accentColor || null,
        thumb: hasThumb ? 'thumb.png' : null,
        liveUrl: meta.liveUrl || null,
        sourceUrl: meta.sourceUrl || null
      });
    } catch (err) {
      errors.push(`  Error: Failed to parse ${folder}/meta.json: ${err.message}`);
    }
  });

  // Sort by date descending (newest first)
  projects.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Auto-assign dayNumber if missing (chronological order)
  const chronological = [...projects].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  chronological.forEach((p, i) => {
    if (p.dayNumber === null) {
      p.dayNumber = i + 1;
    }
  });

  // Write manifest
  const json = JSON.stringify(projects, null, 2);
  fs.writeFileSync(OUTPUT_FILE, json + '\n', 'utf-8');

  // Report
  console.log(`\n  Built projects.json`);
  console.log(`  ${projects.length} project(s) found\n`);

  if (errors.length) {
    errors.forEach(e => console.log(e));
    console.log('');
  }

  projects.forEach(p => {
    console.log(`  Day ${String(p.dayNumber).padStart(3)} | ${p.date} | ${p.title}`);
  });

  console.log('');
}

buildManifest();
