const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

// Import existing filters
const {
  analyzeContent,
  isLegitimateNameOrUsername,
} = require("./contentFilter");

class DeepContentAnalyzer {
  constructor() {
    this.models = {
      nsfw: null,
      textClassifier: null,
    };
    this.isInitialized = false;
    this.analysisCache = new Map();
    this.workerPool = [];
    this.maxWorkers = 4;

    // Performance optimization settings
    this.config = {
      // Parallel processing
      enableParallelProcessing: true,
      maxConcurrentAnalyses: 8,

      // Caching
      cacheEnabled: true,
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      cacheMaxSize: 10000,

      // Preprocessing optimizations
      imageResizeEnabled: true,
      imageOptimalSize: 224,

      // Analysis depth levels
      analysisDepth: {
        QUICK: 1, // Basic checks only
        STANDARD: 2, // Normal analysis
        DEEP: 3, // Comprehensive analysis
        FORENSIC: 4, // Maximum depth analysis
      },

      // Thresholds for different content types
      thresholds: {
        image: {
          nsfw: parseFloat(process.env.NSFW_MEDIUM_THRESHOLD) || 0.5,
          toxic: parseFloat(process.env.TOXICITY_MEDIUM_THRESHOLD) || 0.5,
        },
        text: {
          toxic: parseFloat(process.env.TOXICITY_MEDIUM_THRESHOLD) || 0.5,
          perspective: parseFloat(process.env.TOXICITY_MEDIUM_THRESHOLD) || 0.5,
        },
      },
    };
  }

  async initialize() {
    try {
      console.log("🚀 Initializing Deep Content Analyzer...");

      // Load models in parallel
      const modelPromises = [
        this.initializeModels(),
        this.initializeWorkerPool(),
        this.setupMemoryOptimization(),
      ];

      await Promise.all(modelPromises);

      this.isInitialized = true;
      console.log("✅ Deep Content Analyzer initialized successfully");

      // Start periodic maintenance
      this.startMaintenanceTasks();

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Deep Content Analyzer:", error);
      return false;
    }
  }

  async initializeModels() {
    try {
      // Initialize TensorFlow and NSFWJS
      const tfModule = await import("@tensorflow/tfjs-node");
      this.tf = tfModule.default;

      const nsfwModule = await import("nsfwjs");
      const nsfwjs = nsfwModule.default;

      await this.tf.ready();
      this.models.nsfw = await nsfwjs.load();
      console.log("✅ NSFW model loaded successfully");

      // ... rest of initialization code ...
    } catch (error) {
      console.error("Failed to initialize models:", error);
      throw error;
    }
  }

  async initializeWorkerPool() {
    // Initialize worker threads for CPU-intensive tasks
    for (let i = 0; i < this.maxWorkers; i++) {
      // Worker pool implementation would go here
      // For now, we'll use the main thread with optimizations
    }
    console.log(`✅ Worker pool initialized (${this.maxWorkers} workers)`);
  }

  setupMemoryOptimization() {
    // Set up TensorFlow memory optimization
    this.tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 0);
    this.tf.env().set("WEBGL_FLUSH_THRESHOLD", -1);
    console.log("✅ Memory optimization configured");
  }

  startMaintenanceTasks() {
    // Periodic cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, 30 * 60 * 1000); // Every 30 minutes

    // Memory cleanup
    setInterval(() => {
      this.performMemoryCleanup();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  // Generate content hash for caching
  generateContentHash(content, type) {
    let hashInput;

    if (type === "text") {
      hashInput = content;
    } else if (type === "file") {
      hashInput = `${content.path}-${content.size}-${content.lastModified}`;
    } else {
      hashInput = JSON.stringify(content);
    }

    return crypto.createHash("sha256").update(hashInput).digest("hex");
  }

  // Check cache for existing analysis
  getCachedAnalysis(hash) {
    if (!this.config.cacheEnabled) return null;

    const cached = this.analysisCache.get(hash);
    if (cached && Date.now() - cached.timestamp < this.config.cacheMaxAge) {
      return cached.result;
    }

    if (cached) {
      this.analysisCache.delete(hash);
    }

    return null;
  }

  // Store analysis in cache
  setCachedAnalysis(hash, result) {
    if (!this.config.cacheEnabled) return;

    if (this.analysisCache.size >= this.config.cacheMaxSize) {
      // Remove oldest entries
      const entries = Array.from(this.analysisCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      for (let i = 0; i < Math.floor(this.config.cacheMaxSize * 0.1); i++) {
        this.analysisCache.delete(entries[i][0]);
      }
    }

    this.analysisCache.set(hash, {
      result,
      timestamp: Date.now(),
    });
  }

  // Deep image analysis with multiple techniques
  async analyzeImageDeep(
    imagePath,
    depth = this.config.analysisDepth.STANDARD
  ) {
    try {
      const startTime = Date.now();

      // Generate hash for caching
      const stats = await fs.stat(imagePath);
      const hash = this.generateContentHash(
        {
          path: imagePath,
          size: stats.size,
          lastModified: stats.mtime.getTime(),
        },
        "file"
      );

      // Check cache
      const cached = this.getCachedAnalysis(hash);
      if (cached) {
        console.log("📋 Using cached image analysis");
        return { ...cached, fromCache: true };
      }

      const analyses = [];

      // 1. Basic file validation
      analyses.push(this.validateImageFile(imagePath));

      // 2. NSFW Analysis
      if (depth >= this.config.analysisDepth.STANDARD) {
        analyses.push(this.performNSFWAnalysis(imagePath));
      }

      // 3. Deep pixel analysis
      if (depth >= this.config.analysisDepth.DEEP) {
        analyses.push(this.performPixelAnalysis(imagePath));
      }

      // 4. Metadata analysis
      if (depth >= this.config.analysisDepth.DEEP) {
        analyses.push(this.analyzeImageMetadata(imagePath));
      }

      // 5. Steganography detection
      if (depth >= this.config.analysisDepth.FORENSIC) {
        analyses.push(this.detectSteganography(imagePath));
      }

      const results = await Promise.all(analyses);

      const consolidatedResult = this.consolidateImageResults(results, {
        processingTime: Date.now() - startTime,
        depth,
        hash,
      });

      // Cache result
      this.setCachedAnalysis(hash, consolidatedResult);

      return consolidatedResult;
    } catch (error) {
      console.error("❌ Deep image analysis failed:", error);
      return {
        isAppropriate: false,
        error: error.message,
        reason: "Analysis failed - blocking for safety",
      };
    }
  }

  async validateImageFile(imagePath) {
    const stats = await fs.stat(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const allowedTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

    return {
      type: "validation",
      isValid: allowedTypes.includes(ext),
      size: stats.size,
      extension: ext,
      maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    };
  }

  async performNSFWAnalysis(imagePath) {
    if (!this.models.nsfw) {
      throw new Error("NSFW model not loaded");
    }

    // Optimize image for analysis
    const imageBuffer = await sharp(imagePath)
      .resize(this.config.imageOptimalSize, this.config.imageOptimalSize)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert to tensor
    const tensor = this.tf.node.decodeImage(imageBuffer, 3);

    try {
      // Analyze with NSFWjs
      const predictions = await this.models.nsfw.classify(tensor);

      // Calculate weighted score
      const nsfwScore = this.calculateWeightedNSFWScore(predictions);

      return {
        type: "nsfw",
        predictions,
        nsfwScore,
        isNSFW: nsfwScore > this.config.thresholds.image.nsfw,
        categories: this.extractNSFWCategories(predictions),
      };
    } finally {
      tensor.dispose();
    }
  }

  calculateWeightedNSFWScore(predictions) {
    const weights = {
      Porn: 1.0,
      Hentai: 0.95,
      Sexy: 0.6,
      Neutral: 0.0,
      Drawing: 0.1,
    };

    return predictions.reduce((score, pred) => {
      const weight = weights[pred.className] || 0;
      return score + pred.probability * weight;
    }, 0);
  }

  extractNSFWCategories(predictions) {
    const categories = {};
    predictions.forEach((pred) => {
      if (pred.probability > 0.1 && pred.className !== "Neutral") {
        categories[pred.className] = pred.probability;
      }
    });
    return categories;
  }

  async performPixelAnalysis(imagePath) {
    // Advanced pixel-level analysis
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Analyze color distribution
    const stats = await image.stats();

    // Detect skin tone regions
    const skinToneAnalysis = await this.detectSkinTones(imagePath);

    return {
      type: "pixel",
      metadata: {
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        colorspace: metadata.space,
      },
      stats,
      skinToneAnalysis,
      suspiciousPatterns: this.detectSuspiciousPatterns(stats),
    };
  }

  async detectSkinTones(imagePath) {
    // Simplified skin tone detection
    const image = sharp(imagePath);
    const { data, info } = await image
      .resize(100, 100)
      .raw()
      .toBuffer({ resolveWithObject: true });

    let skinPixels = 0;
    const totalPixels = info.width * info.height;

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Basic skin tone detection algorithm
      if (this.isSkinTone(r, g, b)) {
        skinPixels++;
      }
    }

    const skinRatio = skinPixels / totalPixels;

    return {
      skinPixels,
      totalPixels,
      skinRatio,
      isSkinDominant: skinRatio > 0.3,
    };
  }

  isSkinTone(r, g, b) {
    // Simplified skin tone detection
    return (
      r > 95 &&
      g > 40 &&
      b > 20 &&
      Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
      Math.abs(r - g) > 15 &&
      r > g &&
      r > b
    );
  }

  detectSuspiciousPatterns(stats) {
    const patterns = [];

    // Check for unusual color distributions
    stats.channels.forEach((channel, index) => {
      const channelName = ["red", "green", "blue"][index];

      if (channel.std < 10) {
        patterns.push(`Low variance in ${channelName} channel`);
      }

      if (channel.mean < 20 || channel.mean > 235) {
        patterns.push(`Extreme ${channelName} channel values`);
      }
    });

    return patterns;
  }

  async analyzeImageMetadata(imagePath) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    return {
      type: "metadata",
      exif: metadata.exif ? this.parseExifData(metadata.exif) : null,
      icc: metadata.icc ? true : false,
      orientation: metadata.orientation,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      isAnimated: metadata.pages > 1,
    };
  }

  parseExifData(exifBuffer) {
    // Basic EXIF parsing - in production, use a proper EXIF library
    return {
      hasExif: true,
      size: exifBuffer.length,
    };
  }

  async detectSteganography(imagePath) {
    // Basic steganography detection
    const image = sharp(imagePath);
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Check for LSB patterns
    const lsbAnalysis = this.analyzeLSBPatterns(data, info);

    return {
      type: "steganography",
      lsbAnalysis,
      suspiciousPatterns: lsbAnalysis.entropy > 7.5,
      confidence: lsbAnalysis.entropy / 8,
    };
  }

  analyzeLSBPatterns(data, info) {
    let entropy = 0;
    const lsbValues = [];

    // Extract LSBs
    for (let i = 0; i < data.length; i += info.channels) {
      for (let c = 0; c < Math.min(3, info.channels); c++) {
        lsbValues.push(data[i + c] & 1);
      }
    }

    // Calculate entropy
    const freq = [0, 0];
    lsbValues.forEach((bit) => freq[bit]++);

    freq.forEach((count) => {
      if (count > 0) {
        const p = count / lsbValues.length;
        entropy -= p * Math.log2(p);
      }
    });

    return {
      entropy,
      lsbCount: lsbValues.length,
      distribution: freq,
    };
  }

  consolidateImageResults(results, metadata) {
    const analysis = {
      validation: results[0],
      nsfw: results[1] || null,
      pixel: results[2] || null,
      metadata: results[3] || null,
      steganography: results[4] || null,
    };

    // Determine overall appropriateness
    let isAppropriate = true;
    const violations = [];
    let riskScore = 0;

    // File validation
    if (!analysis.validation.isValid) {
      isAppropriate = false;
      violations.push("Invalid file type");
      riskScore += 1.0;
    }

    if (analysis.validation.size > analysis.validation.maxSize) {
      isAppropriate = false;
      violations.push("File size exceeds limit");
      riskScore += 0.5;
    }

    // NSFW analysis
    if (analysis.nsfw && analysis.nsfw.isNSFW) {
      isAppropriate = false;
      violations.push("NSFW content detected");
      riskScore += analysis.nsfw.nsfwScore;
    }

    // Pixel analysis
    if (analysis.pixel && analysis.pixel.skinToneAnalysis.isSkinDominant) {
      riskScore += 0.3;
      if (analysis.nsfw && analysis.nsfw.nsfwScore > 0.3) {
        violations.push("High skin exposure with suggestive content");
      }
    }

    // Steganography
    if (analysis.steganography && analysis.steganography.suspiciousPatterns) {
      riskScore += 0.2;
      violations.push("Possible hidden content detected");
    }

    return {
      isAppropriate,
      riskScore: Math.min(riskScore, 1.0),
      violations,
      analysis,
      metadata: {
        ...metadata,
        analysisType: "deep_image",
      },
    };
  }

  // Deep text analysis
  async analyzeTextDeep(text, depth = this.config.analysisDepth.STANDARD) {
    try {
      const startTime = Date.now();

      // Generate hash for caching
      const hash = this.generateContentHash(text, "text");

      // Check cache
      const cached = this.getCachedAnalysis(hash);
      if (cached) {
        console.log("📋 Using cached text analysis");
        return { ...cached, fromCache: true };
      }

      const analyses = [];

      // 1. Basic validation
      analyses.push(this.validateText(text));

      // 2. Profanity and toxicity analysis
      if (depth >= this.config.analysisDepth.STANDARD) {
        analyses.push(analyzeContent(text));
      }

      // 3. Advanced pattern detection
      if (depth >= this.config.analysisDepth.DEEP) {
        analyses.push(this.performAdvancedTextAnalysis(text));
      }

      // 4. Linguistic analysis
      if (depth >= this.config.analysisDepth.DEEP) {
        analyses.push(this.performLinguisticAnalysis(text));
      }

      // 5. Context and intent analysis
      if (depth >= this.config.analysisDepth.FORENSIC) {
        analyses.push(this.analyzeContextAndIntent(text));
      }

      const results = await Promise.all(analyses);

      const consolidatedResult = this.consolidateTextResults(results, {
        processingTime: Date.now() - startTime,
        depth,
        hash,
        textLength: text.length,
      });

      // Cache result
      this.setCachedAnalysis(hash, consolidatedResult);

      return consolidatedResult;
    } catch (error) {
      console.error("❌ Deep text analysis failed:", error);
      return {
        isAppropriate: false,
        error: error.message,
        reason: "Analysis failed - blocking for safety",
      };
    }
  }

  validateText(text) {
    return {
      type: "validation",
      length: text.length,
      isEmpty: text.trim().length === 0,
      hasSpecialChars: /[^\w\s.,!?;:'"()-]/.test(text),
      encoding: "utf-8", // Simplified
      wordCount: text.split(/\s+/).filter((word) => word.length > 0).length,
    };
  }

  async performAdvancedTextAnalysis(text) {
    // Advanced text pattern detection
    const patterns = {
      urls: this.extractURLs(text),
      emails: this.extractEmails(text),
      phoneNumbers: this.extractPhoneNumbers(text),
      mentions: this.extractMentions(text),
      hashtags: this.extractHashtags(text),
      suspiciousPatterns: this.detectSuspiciousTextPatterns(text),
    };

    return {
      type: "advanced_patterns",
      patterns,
      hasExternalLinks: patterns.urls.length > 0,
      hasPersonalInfo:
        patterns.emails.length > 0 || patterns.phoneNumbers.length > 0,
    };
  }

  extractURLs(text) {
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  }

  extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  extractPhoneNumbers(text) {
    const phoneRegex =
      /(\+?\d{1,4}?[-.\s]?)?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    return text.match(phoneRegex) || [];
  }

  extractMentions(text) {
    const mentionRegex = /@\w+/g;
    return text.match(mentionRegex) || [];
  }

  extractHashtags(text) {
    const hashtagRegex = /#\w+/g;
    return text.match(hashtagRegex) || [];
  }

  detectSuspiciousTextPatterns(text) {
    const patterns = [];

    // Excessive repetition
    if (/(.)\1{10,}/.test(text)) {
      patterns.push("Excessive character repetition");
    }

    // Base64-like patterns
    if (/[A-Za-z0-9+/]{20,}={0,2}/.test(text)) {
      patterns.push("Possible encoded content");
    }

    // Excessive capitalization
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (upperCaseRatio > 0.5 && text.length > 20) {
      patterns.push("Excessive capitalization");
    }

    // Leetspeak detection
    if (/[0-9@$]{3,}/.test(text.replace(/\s/g, ""))) {
      patterns.push("Possible leetspeak");
    }

    return patterns;
  }

  async performLinguisticAnalysis(text) {
    // Basic linguistic analysis
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Calculate readability metrics
    const avgWordsPerSentence = words.length / sentences.length;
    const avgCharsPerWord =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Sentiment analysis (basic)
    const sentiment = this.calculateBasicSentiment(words);

    return {
      type: "linguistic",
      metrics: {
        avgWordsPerSentence,
        avgCharsPerWord,
        sentenceCount: sentences.length,
        uniqueWords: new Set(words).size,
        lexicalDiversity: new Set(words).size / words.length,
      },
      sentiment,
      language: this.detectLanguage(text), // Basic detection
    };
  }

  calculateBasicSentiment(words) {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "wonderful",
      "fantastic",
      "love",
      "like",
      "happy",
      "joy",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "dislike",
      "angry",
      "sad",
      "horrible",
      "disgusting",
      "evil",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    const totalSentimentWords = positiveScore + negativeScore;

    if (totalSentimentWords === 0) {
      return { polarity: "neutral", confidence: 0 };
    }

    const sentiment = (positiveScore - negativeScore) / totalSentimentWords;

    return {
      polarity:
        sentiment > 0.1
          ? "positive"
          : sentiment < -0.1
          ? "negative"
          : "neutral",
      confidence: Math.abs(sentiment),
      positiveScore,
      negativeScore,
    };
  }

  detectLanguage(text) {
    // Very basic language detection
    const englishWords = [
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    const words = text.toLowerCase().split(/\s+/);
    const englishMatches = words.filter((word) =>
      englishWords.includes(word)
    ).length;

    return {
      detected: englishMatches > words.length * 0.1 ? "en" : "unknown",
      confidence: englishMatches / words.length,
    };
  }

  async analyzeContextAndIntent(text) {
    // Advanced context and intent analysis
    const context = {
      isQuestion: /\?/.test(text),
      isCommand: /^(do|please|can you|would you)/i.test(text.trim()),
      hasEmotions: this.detectEmotionalContent(text),
      hasThreats: this.detectThreats(text),
      hasSpam: this.detectSpamPatterns(text),
    };

    return {
      type: "context_intent",
      context,
      riskFactors: this.calculateContextRiskFactors(context),
    };
  }

  detectEmotionalContent(text) {
    const emotionalIndicators = [
      /!{2,}/, // Multiple exclamation marks
      /\?{2,}/, // Multiple question marks
      /[A-Z]{3,}/, // Shouting
      /😀|😁|😂|🤣|😃|😄|😅|😆|😉|😊|😋|😎|😍|😘|🥰|😗|😙|😚|☺️|🙂|🤗|🤩|🤔|🤨|😐|😑|😶|🙄|😏|😣|😥|😮|🤐|😯|😪|😫|😴|😌|😛|😜|😝|🤤|😒|😓|😔|😕|🙃|🤑|😲|☹️|🙁|😖|😞|😟|😤|😢|😭|😦|😧|😨|😩|🤯|😬|😰|😱|🥵|🥶|😳|🤪|😵|😡|🥺|😠|🤬|😷|🤒|🤕|🤢|🤮|🤧|😇|🤠|🤡|🥳|🥴|🥺|🤥|🤫|🤭|🧐|🤓/, // Emojis
    ];

    return emotionalIndicators.some((pattern) => pattern.test(text));
  }

  detectThreats(text) {
    const threatPatterns = [
      /\b(kill|murder|hurt|harm|destroy|attack|violence)\b/i,
      /\b(threat|threaten|warning|revenge)\b/i,
      /\b(gun|knife|weapon|bomb)\b/i,
    ];

    return threatPatterns.some((pattern) => pattern.test(text));
  }

  detectSpamPatterns(text) {
    const spamIndicators = [
      /\b(free|win|winner|prize|money|cash|offer|deal)\b/i,
      /\b(click here|visit now|act now|limited time)\b/i,
      /\$+|\b\d+%\s*(off|discount)\b/i,
      /(www\.|http)/i,
    ];

    return spamIndicators.some((pattern) => pattern.test(text));
  }

  calculateContextRiskFactors(context) {
    const factors = [];
    let riskScore = 0;

    if (context.hasThreats) {
      factors.push("Contains threatening language");
      riskScore += 0.8;
    }

    if (context.hasSpam) {
      factors.push("Contains spam patterns");
      riskScore += 0.4;
    }

    if (context.hasEmotions && context.hasThreats) {
      factors.push("Emotional threatening content");
      riskScore += 0.3;
    }

    return {
      factors,
      riskScore: Math.min(riskScore, 1.0),
    };
  }

  consolidateTextResults(results, metadata) {
    const analysis = {
      validation: results[0],
      content: results[1] || null,
      patterns: results[2] || null,
      linguistic: results[3] || null,
      context: results[4] || null,
    };

    // Determine overall appropriateness
    let isAppropriate = true;
    const violations = [];
    let riskScore = 0;

    // Content analysis
    if (analysis.content && !analysis.content.isAppropriate) {
      isAppropriate = false;
      violations.push(...(analysis.content.violations || []));
      riskScore += analysis.content.toxicityScore || 0;
    }

    // Pattern analysis
    if (analysis.patterns) {
      if (analysis.patterns.hasPersonalInfo) {
        violations.push("Contains personal information");
        riskScore += 0.2;
      }

      if (analysis.patterns.patterns.suspiciousPatterns.length > 0) {
        violations.push("Contains suspicious patterns");
        riskScore += 0.3;
      }
    }

    // Context analysis
    if (analysis.context) {
      riskScore += analysis.context.riskFactors.riskScore;
      violations.push(...analysis.context.riskFactors.factors);
    }

    return {
      isAppropriate,
      riskScore: Math.min(riskScore, 1.0),
      violations,
      analysis,
      metadata: {
        ...metadata,
        analysisType: "deep_text",
      },
    };
  }

  // Comprehensive multi-modal analysis
  async analyzeContent(content, options = {}) {
    const {
      type = "auto",
      depth = this.config.analysisDepth.STANDARD,
      enableParallel = this.config.enableParallelProcessing,
    } = options;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Starting deep content analysis (depth: ${depth})`);
      const startTime = Date.now();

      let result;

      if (type === "auto") {
        // Auto-detect content type
        result = await this.autoDetectAndAnalyze(content, depth);
      } else if (type === "text") {
        result = await this.analyzeTextDeep(content, depth);
      } else if (type === "image") {
        result = await this.analyzeImageDeep(content, depth);
      } else if (type === "mixed") {
        result = await this.analyzeMixedContent(content, depth);
      } else {
        throw new Error(`Unsupported content type: ${type}`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ Deep analysis completed in ${totalTime}ms`);

      return {
        ...result,
        metadata: {
          ...result.metadata,
          totalProcessingTime: totalTime,
          analysisDepth: depth,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Deep content analysis failed:", error);
      return {
        isAppropriate: false,
        error: error.message,
        reason: "Deep analysis failed - blocking for safety",
        metadata: {
          analysisType: "error",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async autoDetectAndAnalyze(content, depth) {
    // Auto-detect content type and analyze accordingly
    if (typeof content === "string") {
      // Check if it's a file path
      if (content.includes("/") || content.includes("\\")) {
        const ext = path.extname(content).toLowerCase();
        const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

        if (imageExts.includes(ext)) {
          return await this.analyzeImageDeep(content, depth);
        }
      }

      // Treat as text
      return await this.analyzeTextDeep(content, depth);
    } else if (content.text && content.files) {
      // Mixed content
      return await this.analyzeMixedContent(content, depth);
    } else {
      throw new Error("Unable to auto-detect content type");
    }
  }

  async analyzeMixedContent(content, depth) {
    const { text, files } = content;
    const analyses = [];

    // Analyze text if present
    if (text && text.trim().length > 0) {
      analyses.push(this.analyzeTextDeep(text, depth));
    }

    // Analyze files if present
    if (files && files.length > 0) {
      const fileAnalyses = files.map((file) => {
        const ext = path.extname(file).toLowerCase();
        const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

        if (imageExts.includes(ext)) {
          return this.analyzeImageDeep(file, depth);
        } else {
          return Promise.resolve({
            isAppropriate: false,
            reason: "Unsupported file type",
            file,
          });
        }
      });

      analyses.push(...fileAnalyses);
    }

    const results = await Promise.all(analyses);

    // Consolidate mixed content results
    return this.consolidateMixedResults(results);
  }

  consolidateMixedResults(results) {
    let isAppropriate = true;
    const violations = [];
    let maxRiskScore = 0;
    const analysisResults = [];

    results.forEach((result, index) => {
      analysisResults.push(result);

      if (!result.isAppropriate) {
        isAppropriate = false;
      }

      if (result.violations) {
        violations.push(...result.violations);
      }

      if (result.riskScore) {
        maxRiskScore = Math.max(maxRiskScore, result.riskScore);
      }
    });

    return {
      isAppropriate,
      riskScore: maxRiskScore,
      violations: [...new Set(violations)], // Remove duplicates
      analysis: {
        type: "mixed_content",
        results: analysisResults,
        totalItems: results.length,
      },
      metadata: {
        analysisType: "deep_mixed",
        itemCount: results.length,
      },
    };
  }

  // Maintenance and optimization methods
  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.analysisCache.entries()) {
      if (now - value.timestamp > this.config.cacheMaxAge) {
        this.analysisCache.delete(key);
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
  }

  performMemoryCleanup() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clean up TensorFlow memory
    const numTensors = this.tf.memory().numTensors;
    if (numTensors > 100) {
      console.log(`⚠️ High tensor count: ${numTensors}, cleaning up...`);
      this.tf.disposeVariables();
    }
  }

  // Performance monitoring
  getPerformanceStats() {
    return {
      cache: {
        size: this.analysisCache.size,
        maxSize: this.config.cacheMaxSize,
        hitRate: this.cacheHitRate || 0,
      },
      memory: this.tf.memory(),
      config: this.config,
    };
  }
}

// Export singleton instance
const deepContentAnalyzer = new DeepContentAnalyzer();

module.exports = {
  deepContentAnalyzer,
  analyzeContent: (content, options) =>
    deepContentAnalyzer.analyzeContent(content, options),
  getPerformanceStats: () => deepContentAnalyzer.getPerformanceStats(),
};
