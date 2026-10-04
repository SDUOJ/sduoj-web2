#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const prefix = process.argv[2];
if (!prefix || !/^\/[A-Za-z0-9._/-]+$/.test(prefix) || prefix.endsWith('/')) {
  throw new Error('usage: patch-build-prefix.cjs /v2-pre');
}

const manifestPath = path.resolve('build/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.start_url = prefix + '/home';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
