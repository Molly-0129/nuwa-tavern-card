import { open, readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const textChunks = new Set(['tEXt', 'zTXt', 'iTXt']);
const cardKeywords = new Set(['ccv3', 'chara']);
const stringFields = [
  'name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example',
  'creator', 'creator_notes', 'character_version', 'system_prompt',
  'post_history_instructions',
];
const listFields = ['tags', 'alternate_greetings', 'group_only_greetings'];

function check(condition, message) {
  if (!condition) throw new Error(message);
}
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isStringList = value => Array.isArray(value) && value.every(item => typeof item === 'string');

export function validateCard(card) {
  check(card?.spec === 'chara_card_v3' && card.spec_version === '3.0',
    'Expected a Character Card V3 object with spec_version "3.0".');
  const { data } = card;
  check(isObject(data), 'data must be an object.');
  for (const field of stringFields) {
    check(typeof data[field] === 'string', 'data.' + field + ' must be a string.');
  }
  check(data.name.trim().length, 'data.name must not be blank.');
  for (const field of listFields) {
    check(isStringList(data[field]), 'data.' + field + ' must be a string array.');
  }
  check(isObject(data.extensions), 'data.extensions must be an object.');
  if (!Object.hasOwn(data, 'character_book')) return;
  const book = data.character_book;
  check(isObject(book) && isObject(book.extensions) && Array.isArray(book.entries),
    'character_book must contain an extensions object and entries array.');
  const ids = new Set();
  for (const [index, entry] of book.entries.entries()) {
    const at = 'character_book.entries[' + index + ']';
    check(isObject(entry) && isStringList(entry.keys) && typeof entry.content === 'string'
      && Number.isFinite(entry.insertion_order) && isObject(entry.extensions),
    at + ' has invalid keys, content, insertion_order or extensions.');
    for (const field of ['enabled', 'use_regex']) {
      check(typeof entry[field] === 'boolean', at + '.' + field + ' must be boolean.');
    }
    if (Object.hasOwn(entry, 'constant')) {
      check(typeof entry.constant === 'boolean', at + '.constant must be boolean.');
    }
    if (Object.hasOwn(entry, 'position')) {
      check(['before_char', 'after_char'].includes(entry.position), at + '.position is invalid.');
    }
    if (Object.hasOwn(entry, 'secondary_keys')) {
      check(isStringList(entry.secondary_keys), at + '.secondary_keys must be a string array.');
    }
    if (Object.hasOwn(entry, 'id')) {
      check(typeof entry.id === 'string' || Number.isFinite(entry.id), at + '.id is invalid.');
      check(!ids.has(String(entry.id)), at + '.id is duplicated.');
      ids.add(String(entry.id));
    }
  }
}

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) {
    value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return value;
});

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const buffer = Buffer.alloc(data.length + 12);
  buffer.writeUInt32BE(data.length);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);
  buffer.writeUInt32BE(crc32(buffer.subarray(4, -4)), buffer.length - 4);
  return buffer;
}

function readChunks(png) {
  check(png.subarray(0, 8).equals(signature), 'Expected a PNG file.');
  const chunks = [];
  let hasData = false;
  let offset = 8;
  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const end = offset + 12 + length;
    check(end <= png.length && length <= 0x7fffffff, 'Truncated or oversized PNG chunk.');
    const type = png.toString('latin1', offset + 4, offset + 8);
    check(/^[A-Za-z]{4}$/.test(type), 'Invalid PNG chunk type.');
    check(crc32(png.subarray(offset + 4, end - 4)) === png.readUInt32BE(end - 4),
      'Bad PNG CRC in ' + type + '.');
    const data = png.subarray(offset + 8, end - 4);
    if (!chunks.length) {
      check(type === 'IHDR' && length === 13 && data.readUInt32BE() && data.readUInt32BE(4),
        'Invalid PNG header.');
    } else {
      check(type !== 'IHDR', 'Duplicate PNG header.');
    }
    chunks.push({ type, data, bytes: png.subarray(offset, end) });
    if (type === 'IDAT') hasData = true;
    if (type === 'IEND') {
      check(hasData && length === 0 && end === png.length, 'Invalid PNG ending.');
      return chunks;
    }
    offset = end;
  }
  throw new Error('Missing PNG IEND.');
}

function placeholderPng() {
  const width = 480;
  const height = 720;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const stride = width * 3 + 1;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * stride + 1 + x * 3;
      const radius = Math.hypot((x - 240) / 240, (y - 300) / 300);
      const glow = Math.max(0, 1 - radius) * 35;
      const ring = Math.abs(Math.hypot(x - 240, y - 305) - 102) < 1.3;
      pixels[index] = ring ? 186 : 20 + glow;
      pixels[index + 1] = ring ? 155 : 30 + glow;
      pixels[index + 2] = ring ? 109 : 44 + glow;
    }
  }
  return Buffer.concat([signature, chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)), chunk('IEND')]);
}

function keyword({ type, data }) {
  const end = data.indexOf(0);
  return textChunks.has(type) && end > 0 ? data.toString('latin1', 0, end).toLowerCase() : '';
}

function cardChunk(key, card) {
  const payload = Buffer.from(JSON.stringify(card), 'utf8').toString('base64');
  return chunk('tEXt', Buffer.from(key + '\0' + payload, 'ascii'));
}

function asV2(card) {
  const data = Object.fromEntries([...stringFields, 'tags', 'alternate_greetings', 'extensions']
    .map(field => [field, card.data[field]]));
  data.creator_notes = [data.creator_notes,
    'This PNG also contains a CCv3 card. A V3 reader can access all fields.']
    .filter(Boolean).join('\n\n');
  if (card.data.character_book) {
    data.character_book = {
      ...card.data.character_book,
      entries: card.data.character_book.entries.map(({ use_regex, ...entry }) => entry),
    };
  }
  return { spec: 'chara_card_v2', spec_version: '2.0', data };
}

function decodeChunk({ data }) {
  const payload = data.toString('latin1', data.indexOf(0) + 1);
  const decoded = Buffer.from(payload, 'base64');
  check(payload === decoded.toString('base64'), 'Invalid card PNG Base64.');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decoded));
}

function verifyBuffers(card, png) {
  validateCard(card);
  const chunks = readChunks(png).filter(item => cardKeywords.has(keyword(item)));
  const v3 = chunks.filter(item => keyword(item) === 'ccv3');
  const v2 = chunks.filter(item => keyword(item) === 'chara');
  check(v3.length === 1 && v3[0].type === 'tEXt', 'Expected exactly one ccv3 tEXt chunk.');
  check(isDeepStrictEqual(decodeChunk(v3[0]), card), 'PNG card data differs from JSON.');
  check(v2.length <= 1, 'Duplicate chara metadata.');
  if (v2.length) {
    check(v2[0].type === 'tEXt' && isDeepStrictEqual(decodeChunk(v2[0]), asV2(card)),
      'V2 fallback does not match the V3 card projection.');
  }
  return { name: card.data.name, v2Fallback: Boolean(v2.length) };
}

async function readJson(file) {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readFile(file)));
}

export async function packCard(input, outputStem, { cover, v2Fallback = false } = {}) {
  const card = await readJson(input);
  validateCard(card);
  const source = cover ? await readFile(cover) : placeholderPng();
  const original = readChunks(source).filter(item => !cardKeywords.has(keyword(item)));
  const end = original.pop().bytes;
  const metadata = v2Fallback ? [cardChunk('chara', asV2(card))] : [];
  metadata.push(cardChunk('ccv3', card));
  const png = Buffer.concat([signature, ...original.map(item => item.bytes), ...metadata, end]);
  const result = verifyBuffers(card, png);
  const jsonPath = outputStem + '.json';
  const pngPath = outputStem + '.png';

  const created = [];
  try {
    for (const [file, content] of [[jsonPath, JSON.stringify(card, null, 2) + '\n'], [pngPath, png]]) {
      const handle = await open(file, 'wx');
      created.push(file);
      try {
        await handle.writeFile(content);
      } finally {
        await handle.close();
      }
    }
  } catch (error) {
    await Promise.allSettled(created.map(file => unlink(file)));
    throw error;
  }
  return { ...result, jsonPath, pngPath, placeholderCover: !cover };
}

export async function verifyPair(jsonPath, pngPath) {
  const [card, png] = await Promise.all([readJson(jsonPath), readFile(pngPath)]);
  return verifyBuffers(card, png);
}

async function main([command, first, second, ...flags]) {
  check(first && second, 'Usage: card.mjs pack INPUT.json OUTPUT_STEM [--cover PNG] [--v2-fallback] or verify JSON PNG');
  if (command === 'verify') {
    check(!flags.length, 'verify does not accept flags.');
    return verifyPair(first, second);
  }
  check(command === 'pack', 'Unknown command: ' + command);
  const options = {};
  while (flags.length) {
    const flag = flags.shift();
    if (flag === '--cover' && flags[0] && !flags[0].startsWith('--') && !options.cover) {
      options.cover = flags.shift();
    } else if (flag === '--v2-fallback' && !options.v2Fallback) {
      options.v2Fallback = true;
    } else {
      throw new Error('Invalid or repeated option: ' + flag);
    }
  }
  return packCard(first, second, options);
}

const runtime = globalThis.process;
if (runtime?.argv[1] && import.meta.url === pathToFileURL(resolve(runtime.argv[1])).href) {
  try {
    console.log(await main(runtime.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    runtime.exitCode = 1;
  }
}
