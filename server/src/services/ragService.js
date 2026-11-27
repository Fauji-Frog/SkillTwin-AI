const mongoose = require('mongoose');
const EvidenceChunk = require('../models/EvidenceChunk');
const { readDb } = require('./store');

const isMongoReady = () => mongoose.connection && mongoose.connection.readyState === 1 && process.env.DB_FALLBACK !== 'true';

let extractorPromise = null;

/**
 * Lazily loads the feature-extraction pipeline once using dynamic import for ESM package
 */
async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    })();
  }
  return extractorPromise;
}

/**
 * Generates normalized 384-dim embeddings from text using Xenova/all-MiniLM-L6-v2
 */
async function embedText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Computes dot product between two normalized vectors (cosine similarity)
 */
function similarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Finds the top-k most semantically relevant evidence chunks for a student's query
 */
async function findBestChunks(profileId, query, k = 3) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const queryEmbedding = await embedText(query);
  if (!queryEmbedding || queryEmbedding.length === 0) {
    return [];
  }

  let chunks = [];
  const normalizedProfileId = profileId ? profileId.toString() : '';

  if (!isMongoReady()) {
    const db = readDb();
    const allChunks = db.evidenceChunks || [];
    chunks = allChunks.filter(
      (c) => c.studentProfileId && c.studentProfileId.toString() === normalizedProfileId
    );
  } else {
    chunks = await EvidenceChunk.find({ studentProfileId: profileId })
      .select('+embedding')
      .lean();
  }

  // Filter out chunks with empty embeddings and calculate similarity
  const scoredChunks = [];
  for (const chunk of chunks) {
    const chunkEmbedding = chunk.embedding;
    if (!chunkEmbedding || !Array.isArray(chunkEmbedding) || chunkEmbedding.length === 0) {
      continue;
    }

    const score = similarity(queryEmbedding, chunkEmbedding);
    scoredChunks.push({
      text: chunk.text,
      evidenceId: (chunk.evidenceId?._id || chunk.evidenceId || '').toString(),
      score: Number(score.toFixed(4))
    });
  }

  // Sort descending by similarity score and take top k
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, k);
}

module.exports = {
  getExtractor,
  embedText,
  similarity,
  findBestChunks
};
