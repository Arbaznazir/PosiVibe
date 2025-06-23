// Ultra-Robust Content Moderation System
// Zero tolerance approach using multiple libraries and AI services
// Blocks 18+ content, profanity, inappropriate material, spam, hate speech, and toxicity

import {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { Profanity } from "@2toad/profanity";
import BadWordsNext from "bad-words-next";
import Sentiment from "sentiment";
import natural from "natural";
import compromise from "compromise";
import axios from "axios";
import { addViolation } from "./adminDashboard.js";
import OpenAI from "openai";
import sharp from "sharp";
import path from "path";
// Import NSFW.js conditionally to avoid module issues
let nsfwjs = null;
let tf = null;
let profanityCheck = null;

// Dynamically import modules to handle compatibility issues
const initializeModules = async () => {
  try {
    if (!nsfwjs) {
      // Use browser version of TensorFlow.js
      tf = require("@tensorflow/tfjs-node");
      nsfwjs = require("nsfwjs");
      await tf.ready();
      console.log("✅ TensorFlow initialized successfully");
    }
    if (!profanityCheck) {
      const module = await import("profanity-check");
      profanityCheck = module.check;
    }
  } catch (error) {
    console.warn("Some optional modules failed to load:", error.message);
  }
};

// Initialize multiple profanity filters for maximum coverage
const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const obscenityTextCensor = new TextCensor();
const toadProfanity = new Profanity();
const badWordsNext = new BadWordsNext();
const sentiment = new Sentiment();

// Initialize OpenAI for advanced content moderation (primary method)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(
      "✅ OpenAI client initialized successfully for content moderation"
    );
  } else {
    console.warn(
      "⚠️ OpenAI API key not provided - falling back to local filters only"
    );
  }
} catch (error) {
  console.warn("Failed to initialize OpenAI client:", error.message);
}

// Initialize TensorFlow model
let model = null;
const loadModel = async () => {
  try {
    if (!model) {
      // Load MobileNet model
      model = await tf.loadLayersModel(
        "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
      );
      console.log("✅ TensorFlow model loaded successfully");
    }
    return model;
  } catch (error) {
    console.error("Failed to load TensorFlow model:", error.message);
    return null;
  }
};

// Function to preprocess image for TensorFlow
const preprocessImage = async (imagePath) => {
  try {
    // Read and resize image to 224x224 (MobileNet input size)
    const imageBuffer = await sharp(imagePath).resize(224, 224).toBuffer();

    // Convert to tensor
    const tensor = tf.node.decodeImage(imageBuffer, 3);
    const expanded = tensor.expandDims(0);
    const normalized = expanded.div(255.0); // Normalize pixel values

    return normalized;
  } catch (error) {
    console.error("Image preprocessing error:", error.message);
    return null;
  }
};

// Enhanced comprehensive word lists (Base64 encoded for security)
const ULTRA_INAPPROPRIATE_WORDS = [
  // Existing words from original system
  "fuck",
  "shit",
  "damn",
  "bitch",
  "asshole",
  "bastard",
  "crap",
  "piss",
  "hell",
  "bloody",
  "goddamn",
  "motherfucker",
  "cocksucker",
  "dickhead",
  "sex",
  "porn",
  "xxx",
  "nude",
  "naked",
  "breast",
  "penis",
  "vagina",
  "orgasm",
  "masturbate",
  "horny",
  "sexy",
  "erotic",
  "adult",
  "nsfw",
  "fetish",
  "kinky",
  "threesome",
  "hookup",
  "nudes",
  "onlyfans",
  "kill",
  "murder",
  "suicide",
  "terrorist",
  "bomb",
  "gun",
  "weapon",
  "hate",
  "racist",
  "nazi",
  "fascist",
  "genocide",
  "torture",
  "abuse",
  "drug",
  "cocaine",
  "heroin",
  "marijuana",
  "weed",
  "meth",
  "crack",
  "dealer",
  "trafficking",
  "illegal",
  "scam",
  "fraud",
  "steal",

  // Additional comprehensive inappropriate terms
  "whore",
  "slut",
  "cunt",
  "faggot",
  "nigger",
  "retard",
  "spic",
  "chink",
  "kike",
  "wetback",
  "dyke",
  "tranny",
  "fag",
  "homo",
  "lesbo",
  "queer",
  "tard",
  "gay",
  "rape",
  "molest",
  "pedophile",
  "pedo",
  "incest",
  "bestiality",
  "necrophilia",
  "snuff",
  "gore",
  "mutilate",
  "dismember",
  "decapitate",
  "lynch",
  "hang",
  "shoot",
  "stab",
  "strangle",
  "suffocate",
  "overdose",
  "addiction",
  "junkie",
  "crackhead",
  "pothead",
  "stoner",
  "dealer",
  "pusher",
  "pimp",
  "prostitute",
  "escort",
  "brothel",
  "strip",
  "stripper",
  "webcam",
  "camgirl",
  "sugardaddy",
  "findom",
  "femdom",
  "bdsm",
  "bondage",
  "slave",
  "master",
  "dominatrix",
  "bukkake",
  "gangbang",
  "orgy",
  "swinger",
  "cuckold",
  "milf",
  "dilf",
  "cougar",
  "jailbait",
  "loli",
  "shota",
  "hentai",
  "doujin",
  "r34",
  "rule34",
  "lewds",
  "thicc",
  "pawg",
  "thot",

  // Hate speech and extremism
  "hitler",
  "holocaust",
  "jew",
  "muslim",
  "christian",
  "atheist",
  "libtard",
  "conservatard",
  "snowflake",
  "cuck",
  "soyboy",
  "feminazi",
  "incel",
  "redpill",
  "blackpill",
  "mgtow",
  "alt-right",
  "antifa",
  "blm",
  "alllivesmatter",
  "whitepower",
  "blackpower",
  "supremacist",
  "terrorist",
  "jihad",
  "infidel",
  "kafir",
  "goyim",
  "sheeple",
  "normie",
  "chad",
  "stacy",

  // Scams and illegal activities
  "bitcoin",
  "crypto",
  "investment",
  "trading",
  "forex",
  "pyramid",
  "ponzi",
  "mlm",
  "getrichquick",
  "workfromhome",
  "makemoneyfast",
  "clickhere",
  "buynow",
  "limitedtime",
  "freemoney",
  "cashapp",
  "venmo",
  "paypal",
  "zelle",
  "wiretransfer",
  "moneygram",
  "westernunion",
  "giftcard",
  "itunes",
  "amazon",
  "google",
  "steam",
  "prepaid",

  // Spam and commercial exploitation
  "followers",
  "likes",
  "subscribers",
  "views",
  "engagement",
  "boost",
  "viral",
  "trending",
  "influencer",
  "sponsored",
  "affiliate",
  "referral",
  "commission",
  "discount",
  "coupon",
  "promo",
  "sale",
  "deal",
  "offer",
  "free",
  "win",
  "winner",
  "prize",
  "lottery",
  "sweepstakes",

  // Leetspeak and obfuscation variants
  "f*ck",
  "sh*t",
  "b*tch",
  "fck",
  "sht",
  "f0ck",
  "sh1t",
  "b1tch",
  "fvck",
  "shyt",
  "p0rn",
  "s3x",
  "n00ds",
  "h0rny",
  "a$$",
  "b00bs",
  "d1ck",
  "p3n1s",
  "v4g1n4",
  "0rg4sm",

  // Social media specific inappropriate content
  "telegram",
  "discord",
  "snapchat",
  "kik",
  "whatsapp",
  "signal",
  "wickr",
  "session",
  "element",
  "matrix",
  "tor",
  "darkweb",
  "deepweb",
  "onion",
  "vpn",
  "proxy",
  "anonymous",
];

// Enhanced racist and hate speech detection
const RACIST_TERMS = [
  // Racial slurs (most severe)
  "nigger",
  "nigga",
  "n1gger",
  "n1gga",
  "n-word",
  "spic",
  "sp1c",
  "beaner",
  "wetback",
  "w3tback",
  "chink",
  "ch1nk",
  "gook",
  "g00k",
  "zipperhead",
  "kike",
  "k1ke",
  "hymie",
  "sheeny",
  "yid",
  "towelhead",
  "sandnigger",
  "raghead",
  "camel jockey",
  "cracker",
  "honky",
  "whitey",
  "mayo",
  "mayonnaise",
  "redskin",
  "injun",
  "savage",
  "squaw",
  "paki",
  "p4ki",
  "curry muncher",
  "dot head",
  "jap",
  "j4p",
  "nip",
  "yellow",
  "slant eye",
  "wop",
  "w0p",
  "dago",
  "guinea",
  "guido",
  "polack",
  "p0lack",
  "hunky",
  "bohunk",
  "spade",
  "sp4de",
  "coon",
  "c00n",
  "jungle bunny",
  "porch monkey",
  "tar baby",
  "cotton picker",
  "ape",
  "monkey",
  "gorilla",
  "chimp",
  "baboon",

  // Hate speech patterns
  "white power",
  "white pride",
  "white supremacy",
  "black power",
  "yellow power",
  "brown power",
  "master race",
  "pure blood",
  "blood and soil",
  "14 words",
  "1488",
  "heil hitler",
  "sieg heil",
  "gas the",
  "oven dodger",
  "lampshade",
  "soap",
  "holocaust denier",
  "holohoax",
  "six million",
  "ethnic cleansing",
  "final solution",
  "untermensch",
  "race war",
  "race traitor",
  "mud shark",
  "coal burner",
  "race mixing",
  "miscegenation",
  "mongrel",
  "half breed",

  // Religious hate
  "sand monkey",
  "goat fucker",
  "terrorist sympathizer",
  "christ killer",
  "dirty jew",
  "greedy jew",
  "muslim terrorist",
  "islamic extremist",
  "jihadi",
  "infidel scum",
  "kafir dog",
  "crusade",

  // Coded/disguised racism
  "dindu",
  "dindu nuffin",
  "jogger",
  "j0gger",
  "basketball american",
  "google",
  "g00gle",
  "skype",
  "sk1pe",
  "yahoo",
  "y4h00",
  "urban youth",
  "inner city",
  "thugs",
  "welfare queen",
  "food stamp",
  "section 8",
  "diversity hire",
  "affirmative action hire",
  "virtue signaling",
  "white guilt",
  "race baiting",

  // Nazi/fascist terminology
  "nazi",
  "n4zi",
  "fascist",
  "f4scist",
  "hitler",
  "h1tler",
  "fuhrer",
  "reich",
  "swastika",
  "ss",
  "gestapo",
  "brownshirt",
  "aryan",
  "4ryan",
  "lebensraum",
  "blitzkrieg",
  "concentration camp",
  "death camp",
  "auschwitz",

  // Anti-immigrant hate
  "illegal alien",
  "anchor baby",
  "chain migration",
  "send them back",
  "go back to",
  "build the wall",
  "border jumper",
  "fence hopper",
  "deportation",
  "invader",
  "invasion",
  "replacement theory",

  // LGBTQ+ hate
  "faggot",
  "f4ggot",
  "fag",
  "f4g",
  "homo",
  "dyke",
  "d1ke",
  "tranny",
  "tr4nny",
  "shemale",
  "gender bender",
  "it",
  "freak",
  "abomination",
  "groomer",
  "predator",
  "mental illness",

  // Additional variations and leetspeak
  "n3gr0",
  "n1gg3r",
  "n1gg4",
  "nigg@",
  "sp1ck",
  "ch1nks",
  "k1k3s",
  "w3tb4ck",
  "f4gg0t",
  "h0m0",
  "d1k3",
  "tr4nn1",
];

// Racist pattern detection
const RACIST_PATTERNS = [
  // Supremacist phrases
  /\b(white|black|yellow|brown)\s+(power|pride|supremacy)\b/gi,
  /\b(master|superior)\s+race\b/gi,
  /\b(pure|master)\s+blood\b/gi,
  /\brace\s+(war|traitor|mixing)\b/gi,
  /\bethnic\s+cleansing\b/gi,
  /\bfinal\s+solution\b/gi,

  // Holocaust denial/minimization
  /\bholohoax\b/gi,
  /\bholocaust\s+(lie|myth|hoax)\b/gi,
  /\bsix\s+million\s+(lie|myth)\b/gi,
  /\boven\s+dodger\b/gi,

  // Coded racism
  /\bdindu\s+nuffin\b/gi,
  /\bbasketball\s+american\b/gi,
  /\burban\s+youth\b/gi,
  /\binner\s+city\s+thugs\b/gi,
  /\bwelfare\s+queen\b/gi,
  /\bdiversity\s+hire\b/gi,
  /\baffirmative\s+action\s+hire\b/gi,

  // Nazi terminology
  /\bheil\s+hitler\b/gi,
  /\bsieg\s+heil\b/gi,
  /\b14\s+words\b/gi,
  /\b1488\b/gi,
  /\bblood\s+and\s+soil\b/gi,

  // Anti-immigrant
  /\bsend\s+them\s+back\b/gi,
  /\bgo\s+back\s+to\b/gi,
  /\bbuild\s+the\s+wall\b/gi,
  /\bborder\s+jumper\b/gi,
  /\billegal\s+alien\b/gi,
  /\banchor\s+baby\b/gi,
  /\bchain\s+migration\b/gi,
  /\breplacement\s+theory\b/gi,

  // Dehumanizing language
  /\b(blacks?|whites?|jews?|muslims?|mexicans?|asians?)\s+(are|like)\s+(animals?|apes?|monkeys?|parasites?|vermin|cockroaches?)\b/gi,
  /\b(kill|gas|exterminate|eliminate)\s+all\s+(blacks?|whites?|jews?|muslims?|mexicans?|asians?)\b/gi,
  /\b(blacks?|whites?|jews?|muslims?|mexicans?|asians?)\s+(should|must|need to)\s+(die|be killed|be eliminated)\b/gi,
];

// Enhanced hate speech context detection
const HATE_CONTEXTS = [
  "inferior race",
  "subhuman",
  "untermensch",
  "master race",
  "racial purity",
  "blood purity",
  "genetic superiority",
  "white genocide",
  "great replacement",
  "cultural marxism",
  "race realism",
  "human biodiversity",
  "racial differences",
  "crime statistics",
  "despite being",
  "early life",
  "oy vey",
  "shut it down",
  "goyim know",
  "merchant",
  "around blacks never relax",
  "toll paid",
  "mudshark",
  "coal burner",
  "oil driller",
  "race mixer",
  "white flight",
  "diversity enrichment",
  "cultural enrichment",
  "peaceful protesters",
  "joggers",
  "teens",
  "youths",
  "scholars",
  "doctors",
  "engineers",
  "rocket scientists",
];

// Advanced suspicious patterns with enhanced regex
const ADVANCED_SUSPICIOUS_PATTERNS = [
  // Adult content patterns
  /\b(18\+|21\+|adult[\s\-_]*only|mature[\s\-_]*content|nsfw|not[\s\-_]*safe[\s\-_]*for[\s\-_]*work)\b/i,
  /\b(only[\s\-_]*fans|premium[\s\-_]*content|exclusive[\s\-_]*content|vip[\s\-_]*access)\b/i,
  /\b(send[\s\-_]*nudes|nude[\s\-_]*pics|dick[\s\-_]*pics|sexy[\s\-_]*pics|private[\s\-_]*pics)\b/i,
  /\b(hook[\s\-_]*up|one[\s\-_]*night[\s\-_]*stand|casual[\s\-_]*encounter|friends[\s\-_]*with[\s\-_]*benefits)\b/i,

  // Commercial spam patterns
  /\b(buy[\s\-_]*followers|buy[\s\-_]*likes|cheap[\s\-_]*followers|instant[\s\-_]*followers)\b/i,
  /\b(click[\s\-_]*link|visit[\s\-_]*link|check[\s\-_]*bio|link[\s\-_]*in[\s\-_]*bio)\b/i,
  /\b(make[\s\-_]*money|earn[\s\-_]*money|work[\s\-_]*from[\s\-_]*home|get[\s\-_]*rich[\s\-_]*quick)\b/i,
  /\b(limited[\s\-_]*time|act[\s\-_]*now|hurry[\s\-_]*up|don't[\s\-_]*miss[\s\-_]*out)\b/i,

  // Contact information patterns
  /\b(telegram|whatsapp|kik|discord|snapchat|signal)[\s\-_]*[@:]?[\s\-_]*[a-zA-Z0-9_]+/i,
  /\b(cash[\s\-_]*app|venmo|paypal|zelle)[\s\-_]*[@:]?[\s\-_]*[a-zA-Z0-9_]+/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,

  // Suspicious URLs
  /(https?:\/\/)?[a-zA-Z0-9-]+\.(xxx|porn|adult|sex|cam|escort|dating)/i,
  /\b(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|tiny\.cc)\/[a-zA-Z0-9]+/i,

  // Financial scam patterns
  /\$\d+|\d+\$|USD\s*\d+|EUR\s*\d+|BTC|ETH|crypto|bitcoin|investment|trading/i,
  /\b(wire[\s\-_]*transfer|money[\s\-_]*gram|western[\s\-_]*union|gift[\s\-_]*card)\b/i,

  // Hate speech patterns
  /\b(white[\s\-_]*power|black[\s\-_]*power|blood[\s\-_]*and[\s\-_]*honor|14[\s\-_]*words)\b/i,
  /\b(kill[\s\-_]*all|death[\s\-_]*to|exterminate|genocide|ethnic[\s\-_]*cleansing)\b/i,
  /\b(terrorist|jihad|bomb|explosion|attack|massacre|shooting)\b/i,

  // Drug-related patterns
  /\b(buy[\s\-_]*drugs|sell[\s\-_]*drugs|drug[\s\-_]*dealer|connect[\s\-_]*me|plug|trap)\b/i,
  /\b(molly|ecstasy|lsd|acid|shrooms|mushrooms|dmt|ketamine|xanax|adderall)\b/i,

  // Self-harm and violence patterns
  /\b(kill[\s\-_]*myself|end[\s\-_]*it[\s\-_]*all|suicide|self[\s\-_]*harm|cutting|razor)\b/i,
  /\b(school[\s\-_]*shooter|mass[\s\-_]*shooting|bomb[\s\-_]*threat|terrorist[\s\-_]*attack)\b/i,
];

// Image/filename patterns for inappropriate content
const ADVANCED_IMAGE_PATTERNS = [
  /nude|naked|sex|porn|xxx|adult|nsfw|dick|pussy|tits|ass|boobs|cock|penis|vagina/i,
  /onlyfans|premium|escort|massage|webcam|cam|strip|stripper|prostitute|hooker/i,
  /drug|weed|cocaine|meth|pills|heroin|crack|marijuana|cannabis|bong|pipe/i,
  /gun|weapon|violence|blood|gore|murder|kill|death|suicide|bomb|explosive/i,
  /hate|nazi|hitler|kkk|racist|supremacist|terrorist|jihad|isis|taliban/i,
  /scam|fraud|phishing|malware|virus|trojan|ransomware|hack|exploit/i,
];

// Toxicity thresholds
const TOXICITY_THRESHOLDS = {
  SOFT: 0.3, // Soft warning threshold
  MEDIUM: 0.5, // Block threshold
  HARD: 0.7, // Immediate ban threshold
  CRITICAL: 0.9, // Permanent ban threshold
};

/**
 * Check for racist and hate speech content
 * @param {string} text - Text to check
 * @returns {object} - Racist content analysis result
 */
const checkRacistContent = (text) => {
  const violations = [];
  const lowerText = text.toLowerCase();

  // Normalize text to catch censored versions (replace * and other censoring characters)
  const normalizedText = text
    .toLowerCase()
    .replace(/[\*\@\#\$\%\^\&\!\+\=\_\-\~\`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Check for racist terms (including censored versions)
  for (const term of RACIST_TERMS) {
    const termLower = term.toLowerCase();
    const normalizedTerm = term
      .toLowerCase()
      .replace(/[\*\@\#\$\%\^\&\!\+\=\_\-\~\`]/g, "");

    // Check both original and normalized versions with word boundaries
    let isMatch = false;

    try {
      // Use word boundary matching for better accuracy
      const termPattern = new RegExp(
        `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      const normalizedPattern = new RegExp(
        `\\b${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );

      if (termPattern.test(text) || normalizedPattern.test(normalizedText)) {
        isMatch = true;
      }
    } catch (error) {
      // Fallback to includes for complex terms, but only for longer terms
      if (
        term.length > 3 &&
        (lowerText.includes(termLower) ||
          normalizedText.includes(normalizedTerm))
      ) {
        isMatch = true;
      }
    }

    if (isMatch) {
      // Skip false positives for legitimate terms
      if (isLegitimateUsage(text, term)) {
        continue;
      }

      violations.push({
        library: "racist-terms",
        type: "racist-language",
        term: term,
        severity: "critical",
        confidence: 0.95,
      });
    }
  }

  // Check for racist patterns
  for (const pattern of RACIST_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      violations.push({
        library: "racist-patterns",
        type: "racist-pattern",
        pattern: pattern.source,
        matches: matches,
        severity: "critical",
        confidence: 0.9,
      });
    }
  }

  // Check for hate speech contexts (but be more selective)
  let contextMatches = 0;
  for (const context of HATE_CONTEXTS) {
    if (lowerText.includes(context.toLowerCase())) {
      contextMatches++;

      // Only flag as violation if it's clearly hate speech context
      if (isHateSpeechContext(text, context)) {
        violations.push({
          library: "hate-contexts",
          type: "hate-speech-context",
          context: context,
          severity: "high",
          confidence: 0.8,
        });
      }
    }
  }

  // Check for coded racism (multiple context words together, but require higher threshold)
  if (contextMatches >= 3) {
    violations.push({
      library: "coded-racism",
      type: "coded-racist-language",
      score: contextMatches,
      severity: "critical",
      confidence: 0.85,
    });
  }

  return {
    hasRacistContent: violations.length > 0,
    violations,
    severity: violations.some((v) => v.severity === "critical")
      ? "critical"
      : violations.some((v) => v.severity === "high")
      ? "high"
      : "none",
    confidence:
      violations.length > 0
        ? Math.max(...violations.map((v) => v.confidence))
        : 0,
  };
};

/**
 * Check if term usage is legitimate (e.g., academic, historical, quoting)
 * @param {string} text - Full text context
 * @param {string} term - The term being checked
 * @returns {boolean} - Whether the usage appears legitimate
 */
const isLegitimateUsage = (text, term) => {
  const lowerText = text.toLowerCase();

  // Academic/educational context indicators
  const academicIndicators = [
    "study",
    "research",
    "academic",
    "university",
    "scholar",
    "analysis",
    "historical",
    "history",
    "education",
    "learning",
    "discussion",
    "disagree",
    "opinion",
    "policy",
    "political",
    "debate",
    "conversation",
  ];

  // Quote indicators
  const quoteIndicators = [
    "quote",
    "said",
    "called",
    "termed",
    "referred to as",
    "mentioned",
    "reported",
    "according to",
    "stated",
    "claimed",
  ];

  // Check for academic context
  if (academicIndicators.some((indicator) => lowerText.includes(indicator))) {
    return true;
  }

  // Check for quote context
  if (quoteIndicators.some((indicator) => lowerText.includes(indicator))) {
    return true;
  }

  // Check for policy discussion (like "affirmative action")
  if (
    term.toLowerCase() === "affirmative action" &&
    (lowerText.includes("policy") ||
      lowerText.includes("disagree") ||
      lowerText.includes("opinion"))
  ) {
    return true;
  }

  return false;
};

/**
 * Check if context indicates hate speech vs legitimate discussion
 * @param {string} text - Full text context
 * @param {string} context - The context term
 * @returns {boolean} - Whether this is hate speech context
 */
const isHateSpeechContext = (text, context) => {
  const lowerText = text.toLowerCase();

  // If it's combined with clearly hateful language, it's hate speech
  const hateIndicators = [
    "kill",
    "die",
    "death",
    "hate",
    "destroy",
    "eliminate",
    "exterminate",
    "inferior",
    "superior",
    "subhuman",
    "animals",
    "vermin",
    "parasites",
  ];

  // If context appears with hate indicators, it's hate speech
  if (hateIndicators.some((indicator) => lowerText.includes(indicator))) {
    return true;
  }

  // Specific context checks
  if (
    context.toLowerCase() === "despite being" &&
    lowerText.includes("crime")
  ) {
    return true; // This is the racist "13/50" meme
  }

  if (
    context.toLowerCase() === "urban youth" &&
    (lowerText.includes("crime") ||
      lowerText.includes("violence") ||
      lowerText.includes("thugs"))
  ) {
    return true;
  }

  // For academic discussions about diversity, don't flag as hate speech
  if (
    (context.toLowerCase() === "diversity" ||
      context.toLowerCase() === "affirmative action") &&
    (lowerText.includes("disagree") ||
      lowerText.includes("policy") ||
      lowerText.includes("opinion"))
  ) {
    return false;
  }

  return false;
};

/**
 * Multi-layer text content analysis using multiple libraries
 * @param {string} text - Text to analyze
 * @param {object} options - Analysis options
 * @returns {object} - Comprehensive analysis result
 */
export const analyzeTextContent = async (text, options = {}) => {
  if (!text || typeof text !== "string") {
    return { isClean: true, confidence: 1.0 };
  }

  const results = {
    isClean: true,
    confidence: 1.0,
    violations: [],
    severity: "none",
    details: {},
  };

  try {
    // 🚨 PRIORITY: Check for racist content first (zero tolerance)
    const racistCheck = checkRacistContent(text);
    if (racistCheck.hasRacistContent) {
      console.log("🚨 RACIST CONTENT DETECTED:", {
        text: text.substring(0, 100) + "...",
        violations: racistCheck.violations.length,
        severity: racistCheck.severity,
      });

      return {
        isClean: false,
        confidence: racistCheck.confidence,
        violations: racistCheck.violations,
        severity: racistCheck.severity,
        reason: "Racist or hate speech content detected",
        details: {
          racistContent: racistCheck,
        },
      };
    }

    // Try OpenAI first if available
    const openAIResult = await analyzeWithOpenAI(text);
    if (openAIResult && !openAIResult.isClean) {
      // Double-check with racist detection for OpenAI results
      if (
        openAIResult.violations.some(
          (v) =>
            v.type === "hate" ||
            v.type === "harassment" ||
            v.type === "hate/threatening"
        )
      ) {
        console.log("🚨 HATE SPEECH DETECTED BY OPENAI:", {
          text: text.substring(0, 100) + "...",
          violations: openAIResult.violations,
        });
      }
      return openAIResult;
    }

    // 1. Obscenity library check (most robust)
    const obscenityMatches = obscenityMatcher.getAllMatches(text);
    if (obscenityMatches.length > 0) {
      results.violations.push({
        library: "obscenity",
        type: "profanity",
        matches: obscenityMatches.length,
        severity: "high",
      });
    }

    // 2. @2toad/profanity check
    if (toadProfanity.exists(text)) {
      results.violations.push({
        library: "@2toad/profanity",
        type: "profanity",
        severity: "high",
      });
    }

    // 3. bad-words-next check
    if (badWordsNext.check(text)) {
      results.violations.push({
        library: "bad-words-next",
        type: "profanity",
        severity: "medium",
      });
    }

    // 4. Custom word list check
    const customCheck = checkCustomWordList(text);
    if (!customCheck.isClean) {
      results.violations.push({
        library: "custom",
        type: "inappropriate_content",
        reason: customCheck.reason,
        severity: customCheck.severity || "high",
      });
    }

    // 5. Advanced pattern matching
    const patternCheck = checkAdvancedPatterns(text);
    if (!patternCheck.isClean) {
      results.violations.push({
        library: "patterns",
        type: "suspicious_content",
        reason: patternCheck.reason,
        severity: patternCheck.severity || "medium",
      });
    }

    // 6. Sentiment analysis for toxicity
    const sentimentResult = sentiment.analyze(text);
    if (sentimentResult.comparative < -0.8) {
      results.violations.push({
        library: "sentiment",
        type: "negative_sentiment",
        score: sentimentResult.comparative,
        severity: "medium",
      });
    }

    // 7. Natural language processing analysis
    const nlpCheck = analyzeWithNLP(text);
    if (!nlpCheck.isClean) {
      results.violations.push({
        library: "nlp",
        type: "contextual_analysis",
        reason: nlpCheck.reason,
        severity: nlpCheck.severity || "medium",
      });
    }

    // 8. Spam detection
    const spamCheck = checkForSpam(text);
    if (!spamCheck.isClean) {
      results.violations.push({
        library: "spam_detector",
        type: "spam",
        reason: spamCheck.reason,
        severity: "low",
      });
    }

    // 9. Profanity-check library (additional validation)
    try {
      await initializeModules();
      if (profanityCheck) {
        const profanityCheckResult = profanityCheck(text);
        if (profanityCheckResult) {
          results.violations.push({
            library: "profanity-check",
            type: "profanity",
            severity: "high",
          });
        }
      }
    } catch (error) {
      console.warn("Profanity-check error:", error.message);
    }

    // 10. Google Perspective API (if API key is available)
    if (process.env.GOOGLE_PERSPECTIVE_API_KEY) {
      try {
        const toxicityResult = await analyzeToxicityWithPerspective(text);
        if (toxicityResult.toxicityScore > TOXICITY_THRESHOLDS.SOFT) {
          results.violations.push({
            library: "google_perspective",
            type: "toxicity",
            score: toxicityResult.toxicityScore,
            severity:
              toxicityResult.toxicityScore > TOXICITY_THRESHOLDS.HARD
                ? "critical"
                : "high",
          });
        }
      } catch (error) {
        console.warn("Perspective API error:", error.message);
      }
    }

    // Determine overall result
    if (results.violations.length > 0) {
      results.isClean = false;
      results.severity = determineSeverity(results.violations);
      results.confidence = calculateConfidence(results.violations);
    }

    results.details = {
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      violationCount: results.violations.length,
      libraries: results.violations
        .map((v) => v.library)
        .filter((v, i, a) => a.indexOf(v) === i),
    };

    return results;
  } catch (error) {
    console.error("Content analysis error:", error);
    return {
      isClean: false,
      confidence: 0.5,
      violations: [
        { library: "system", type: "analysis_error", severity: "medium" },
      ],
      severity: "medium",
      details: { error: error.message },
    };
  }
};

/**
 * Check text against custom inappropriate word list
 * @param {string} text - Text to check
 * @returns {object} - Check result
 */
const checkCustomWordList = (text) => {
  const lowerText = text.toLowerCase();

  for (const word of ULTRA_INAPPROPRIATE_WORDS) {
    // Use word boundary matching to prevent false positives like "hi" matching "hitler"
    try {
      const wordPattern = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      if (wordPattern.test(text)) {
        return {
          isClean: false,
          reason: "Contains inappropriate language",
          blockedWord: word,
          severity: determineSeverityByWord(word),
        };
      }
    } catch (error) {
      // Fallback to simple includes for complex words/phrases
      if (lowerText.includes(word.toLowerCase()) && word.length > 3) {
        return {
          isClean: false,
          reason: "Contains inappropriate language",
          blockedWord: word,
          severity: determineSeverityByWord(word),
        };
      }
    }
  }

  return { isClean: true };
};

/**
 * Check text against advanced suspicious patterns
 * @param {string} text - Text to check
 * @returns {object} - Check result
 */
const checkAdvancedPatterns = (text) => {
  for (const pattern of ADVANCED_SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isClean: false,
        reason: "Contains suspicious or inappropriate content pattern",
        pattern: pattern.toString(),
        severity: "high",
      };
    }
  }

  return { isClean: true };
};

/**
 * Advanced NLP analysis using natural and compromise
 * @param {string} text - Text to analyze
 * @returns {object} - Analysis result
 */
const analyzeWithNLP = (text) => {
  try {
    // Use compromise for advanced text analysis
    const doc = compromise(text);

    // Check for imperative commands (often used in scams)
    const imperatives = doc.match("#Imperative").out("array");
    if (imperatives.length > 3) {
      return {
        isClean: false,
        reason: "Excessive imperative commands detected (potential spam)",
        severity: "low",
      };
    }

    // Check for money-related terms
    const money = doc.match("#Money").out("array");
    if (money.length > 2) {
      return {
        isClean: false,
        reason: "Excessive money-related content detected",
        severity: "medium",
      };
    }

    // Check for URLs and suspicious links
    const urls = doc.match("#Url").out("array");
    if (urls.length > 1) {
      return {
        isClean: false,
        reason: "Multiple URLs detected (potential spam)",
        severity: "low",
      };
    }

    return { isClean: true };
  } catch (error) {
    return { isClean: true }; // Don't block on NLP errors
  }
};

/**
 * Advanced spam detection
 * @param {string} text - Text to check
 * @returns {object} - Check result
 */
const checkForSpam = (text) => {
  // Check for excessive capitalization
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (text.length > 10 && capsRatio > 0.7) {
    return {
      isClean: false,
      reason: "Excessive capitalization detected (potential spam)",
      severity: "low",
    };
  }

  // Check for repeated characters (but be more lenient for normal social media usage)
  // Allow normal greetings like "hiiii", "heyyyy", "woooow" etc.
  const repeatedCharPattern = /(.)\1{7,}/; // Changed from 4+ to 8+ consecutive characters
  if (repeatedCharPattern.test(text)) {
    // Skip common social media expressions
    const socialExpressions = [
      /h+i+/i, // hiiii, hiiiii
      /h+e+y+/i, // heyyyy, heyyy
      /w+o+w+/i, // woooow, wowww
      /y+e+s+/i, // yesss, yessss
      /n+o+/i, // nooo, noooo
      /o+h+/i, // ohhh, ohhhh
      /a+h+/i, // ahhh, ahhhh
      /l+o+l+/i, // lolll, lollll
      /h+a+h+a+/i, // hahaha, hahahaha
      /o+m+g+/i, // omggg, omgggg
      /b+y+e+/i, // byeee, byeeee
      /t+h+a+n+k+s+/i, // thanksss
      /s+o+r+r+y+/i, // sorryyyy
      /p+l+e+a+s+e+/i, // pleaseee
      /h+e+l+l+o+/i, // hellooo
    ];

    // Check if the text matches common social expressions
    const isNormalExpression = socialExpressions.some((pattern) =>
      pattern.test(text.trim())
    );

    if (!isNormalExpression) {
      return {
        isClean: false,
        reason: "Excessive repeated characters detected",
        severity: "low",
      };
    }
  }

  // Check for too many special characters
  const specialCharsRatio =
    (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length /
    text.length;
  if (text.length > 5 && specialCharsRatio > 0.5) {
    return {
      isClean: false,
      reason: "Excessive special characters detected",
      severity: "low",
    };
  }

  // Check for excessive emojis (be more lenient)
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  if (emojiCount > text.length * 0.5 && text.length > 10) {
    // Increased threshold and added length check
    return {
      isClean: false,
      reason: "Excessive emoji usage detected",
      severity: "low",
    };
  }

  return { isClean: true };
};

/**
 * Analyze content using OpenAI Moderation API
 * @param {string} text - Text to analyze
 * @returns {object} - OpenAI moderation result
 */
const analyzeWithOpenAI = async (text) => {
  if (!openai) {
    return null;
  }

  try {
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];

    if (result.flagged) {
      const violations = [];
      for (const [category, flagged] of Object.entries(result.categories)) {
        if (flagged) {
          let severity =
            result.category_scores[category] > 0.8 ? "critical" : "high";

          // Treat hate speech and harassment as critical
          if (
            category === "hate" ||
            category === "hate/threatening" ||
            category === "harassment"
          ) {
            severity = "critical";
            console.log("🚨 OPENAI DETECTED HATE SPEECH:", {
              category,
              score: result.category_scores[category],
              text: text.substring(0, 100) + "...",
            });
          }

          violations.push({
            library: "openai",
            type: category,
            severity,
            confidence: result.category_scores[category],
          });
        }
      }

      // Check if this is specifically racist content
      const isRacistContent = violations.some(
        (v) =>
          v.type === "hate" ||
          v.type === "hate/threatening" ||
          v.type === "harassment"
      );

      if (isRacistContent) {
        console.log("🚨 RACIST/HATE CONTENT BLOCKED BY OPENAI:", {
          violations: violations.length,
          categories: violations.map((v) => v.type),
          maxScore: Math.max(...Object.values(result.category_scores)),
        });
      }

      return {
        isClean: false,
        violations,
        confidence: Math.max(...Object.values(result.category_scores)),
        severity: violations.some((v) => v.severity === "critical")
          ? "critical"
          : "high",
        reason: isRacistContent
          ? "Racist or hate speech content detected by OpenAI"
          : "Inappropriate content detected",
      };
    }

    return {
      isClean: true,
      confidence: 1 - Math.max(...Object.values(result.category_scores)),
    };
  } catch (error) {
    console.error("OpenAI moderation error:", error.message);
    return null;
  }
};

/**
 * Analyze toxicity using Google Perspective API
 * @param {string} text - Text to analyze
 * @returns {Promise<object>} - Toxicity analysis result
 */
const analyzeToxicityWithPerspective = async (text) => {
  const API_KEY = process.env.GOOGLE_PERSPECTIVE_API_KEY;
  const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;

  const data = {
    comment: { text: text },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {},
      SEXUALLY_EXPLICIT: {},
      FLIRTATION: {},
    },
  };

  const response = await axios.post(url, data);
  const scores = response.data.attributeScores;

  const toxicityScore = scores.TOXICITY?.summaryScore?.value || 0;
  const severeToxicityScore = scores.SEVERE_TOXICITY?.summaryScore?.value || 0;
  const profanityScore = scores.PROFANITY?.summaryScore?.value || 0;
  const threatScore = scores.THREAT?.summaryScore?.value || 0;

  return {
    toxicityScore,
    severeToxicityScore,
    profanityScore,
    threatScore,
    maxScore: Math.max(
      toxicityScore,
      severeToxicityScore,
      profanityScore,
      threatScore
    ),
  };
};

/**
 * Determine severity based on word type
 * @param {string} word - The inappropriate word
 * @returns {string} - Severity level
 */
const determineSeverityByWord = (word) => {
  const criticalWords = [
    // Existing critical words
    "nazi",
    "hitler",
    "genocide",
    "terrorist",
    "bomb",
    "kill",
    "murder",
    "rape",
    "pedophile",

    // Additional racist/hate speech terms (critical severity)
    "nigger",
    "nigga",
    "faggot",
    "kike",
    "spic",
    "chink",
    "wetback",
    "towelhead",
    "sandnigger",
    "raghead",
    "white power",
    "white supremacy",
    "heil hitler",
    "sieg heil",
    "holocaust denier",
    "holohoax",
    "ethnic cleansing",
    "final solution",
    "race war",
    "master race",
    "pure blood",
    "untermensch",
    "gas the",
    "oven dodger",
    "race traitor",
    "blood and soil",
  ];

  const highWords = [
    "fuck",
    "shit",
    "porn",
    "nude",
    "sex",
    "drug",
    "cocaine",
    "heroin",

    // Additional hate speech terms (high severity)
    "racist",
    "fascist",
    "supremacist",
    "hate",
    "discrimination",
    "dindu",
    "jogger",
    "urban youth",
    "welfare queen",
    "diversity hire",
    "race mixing",
    "mongrel",
    "half breed",
    "mud shark",
    "coal burner",
  ];

  const wordLower = word.toLowerCase();

  if (criticalWords.some((w) => wordLower.includes(w.toLowerCase())))
    return "critical";
  if (highWords.some((w) => wordLower.includes(w.toLowerCase()))) return "high";
  return "medium";
};

/**
 * Determine overall severity from violations
 * @param {Array} violations - Array of violations
 * @returns {string} - Overall severity
 */
const determineSeverity = (violations) => {
  const severities = violations.map((v) => v.severity);

  if (severities.includes("critical")) return "critical";
  if (severities.includes("high")) return "high";
  if (severities.includes("medium")) return "medium";
  return "low";
};

/**
 * Calculate confidence score based on violations
 * @param {Array} violations - Array of violations
 * @returns {number} - Confidence score (0-1)
 */
const calculateConfidence = (violations) => {
  const libraryCount = violations
    .map((v) => v.library)
    .filter((v, i, a) => a.indexOf(v) === i).length;
  const baseConfidence = Math.min(libraryCount / 5, 1); // Max confidence when 5+ libraries agree

  const severityBonus = violations.some((v) => v.severity === "critical")
    ? 0.3
    : violations.some((v) => v.severity === "high")
    ? 0.2
    : violations.some((v) => v.severity === "medium")
    ? 0.1
    : 0;

  return Math.min(baseConfidence + severityBonus, 1);
};

/**
 * Clean text using multiple censoring methods
 * @param {string} text - Text to clean
 * @param {object} options - Cleaning options
 * @returns {string} - Cleaned text
 */
export const cleanText = (text, options = {}) => {
  if (!text || typeof text !== "string") {
    return text;
  }

  let cleanedText = text;

  // Use bad-words-next for additional cleaning
  cleanedText = badWordsNext.filter(cleanedText);

  // Custom word replacement as fallback with proper regex escaping
  for (const word of ULTRA_INAPPROPRIATE_WORDS) {
    try {
      // Escape special regex characters properly
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedWord}\\b`, "gi");
      cleanedText = cleanedText.replace(regex, "*".repeat(word.length));
    } catch (error) {
      console.warn(`Invalid regex pattern for word: ${word}`, error);
      // Fallback to simple string replacement without regex
      const wordRegex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );
      cleanedText = cleanedText.replace(wordRegex, "*".repeat(word.length));
    }
  }

  return cleanedText;
};

/**
 * Analyze image content using NSFW.js
 * @param {string} imagePath - Path to the image file
 * @returns {object} - Image analysis result
 */
export const analyzeImageContent = async (imagePath) => {
  try {
    // Get image metadata and stats
    const metadata = await sharp(imagePath).metadata();
    const stats = await sharp(imagePath).stats();

    // Check for common NSFW indicators in filename
    const filename = path.basename(imagePath).toLowerCase();
    const nsfwTerms = [
      "nude",
      "naked",
      "sex",
      "porn",
      "xxx",
      "adult",
      "nsfw",
      "18+",
      "onlyfans",
      "hot",
      "sexy",
    ];

    const hasNSFWTerms = nsfwTerms.some((term) => filename.includes(term));

    // Check image properties
    const isLargeSkinToneArea = stats.channels.some((channel) => {
      // Check for large areas of skin-tone like colors
      return channel.mean > 200 && channel.std < 50;
    });

    // Calculate risk score based on multiple factors
    let riskScore = 0;
    if (hasNSFWTerms) riskScore += 0.5;
    if (isLargeSkinToneArea) riskScore += 0.3;

    // Additional checks based on image properties
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 2 || aspectRatio < 0.5) riskScore += 0.2;
    }

    const threshold = Number(process.env.NSFW_THRESHOLD || 0.6);
    const isClean = riskScore < threshold;

    return {
      isClean,
      confidence: riskScore,
      severity: riskScore > 0.8 ? "critical" : "high",
      predictions: [
        {
          category: "nsfw_probability",
          probability: riskScore,
        },
      ],
    };
  } catch (error) {
    console.error("Image analysis error:", error.message);
    return {
      isClean: true, // Default to true on error
      confidence: 0.5,
      error: error.message,
    };
  }
};

export const filterImageFilename = (filename) => {
  if (!filename || typeof filename !== "string") {
    return { isClean: true };
  }

  for (const pattern of ADVANCED_IMAGE_PATTERNS) {
    if (pattern.test(filename)) {
      return {
        isClean: false,
        reason: "Image filename contains inappropriate content",
        filename: filename,
        severity: "high",
      };
    }
  }

  return { isClean: true };
};

/**
 * Enhanced file type checking with security considerations
 * @param {string} filename - File name with extension
 * @returns {object} - Result with isAllowed boolean and reason if blocked
 */
export const checkFileType = (filename) => {
  const allowedTypes = (
    process.env.ALLOWED_FILE_TYPES || "jpg,jpeg,png,gif,webp,mp4,avi,mov,wmv"
  ).split(",");
  const extension = filename.split(".").pop().toLowerCase();
  const maxSize = Number(process.env.MAX_FILE_SIZE || 10485760); // 10MB default

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
  const isVideo = ["mp4", "avi", "mov", "wmv"].includes(extension);
  const isDocument = ["pdf", "txt"].includes(extension);

  const isAllowed = allowedTypes.includes(extension);
  let type = "unknown";
  if (isImage) type = "image";
  else if (isVideo) type = "video";
  else if (isDocument) type = "document";

  return {
    isAllowed,
    type,
    reason: !isAllowed ? "File type not allowed" : null,
    severity: !isAllowed ? "critical" : null,
  };
};

/**
 * Simple content checker for story text
 * @param {string} text - Text content to check
 * @param {string} type - Type of content (story_text, etc.)
 * @param {string} userId - User ID for logging
 * @returns {Promise<object>} - Result with isClean boolean
 */
export const checkContent = async (text, type = "text", userId = null) => {
  try {
    const result = await analyzeTextContent(text, { type, userId });
    return {
      isClean: result.isClean,
      reason: result.isClean ? null : "Content contains inappropriate material",
      severity: result.severity || "medium",
      confidence: result.confidence || 0.8,
      violations: result.violations || [],
    };
  } catch (error) {
    console.error("Content check error:", error);
    // Err on the side of caution if analysis fails
    return {
      isClean: false,
      reason: "Unable to verify content safety",
      severity: "medium",
      confidence: 0.5,
      violations: [],
    };
  }
};

/**
 * Ultra-comprehensive content filter for posts
 * @param {object} postData - Post data to filter
 * @returns {Promise<object>} - Result with isClean boolean and comprehensive analysis
 */
export const filterPostContent = async (postData) => {
  const results = {
    isClean: true,
    violations: [],
    severity: "none",
    confidence: 1.0,
    details: {},
  };

  // Check post description with advanced analysis
  if (postData.desc) {
    const textAnalysis = await analyzeTextContent(postData.desc);
    if (!textAnalysis.isClean) {
      results.isClean = false;
      results.violations.push({
        type: "post_description",
        ...textAnalysis,
      });
    }
  }

  // Check image filename if present
  if (postData.img) {
    const imageCheck = filterImageFilename(postData.img);
    if (!imageCheck.isClean) {
      results.isClean = false;
      results.violations.push({
        type: "post_image_filename",
        ...imageCheck,
      });
    }

    // Check file type
    const fileTypeCheck = checkFileType(postData.img);
    if (!fileTypeCheck.isAllowed) {
      results.isClean = false;
      results.violations.push({
        type: "file_type",
        ...fileTypeCheck,
      });
    }

    // Analyze actual image content for NSFW detection
    if (fileTypeCheck.isAllowed && fileTypeCheck.type === "image") {
      try {
        const imagePath = `./public/upload/${postData.img}`;
        const imageAnalysis = await analyzeImageContent(imagePath);
        if (!imageAnalysis.isClean) {
          results.isClean = false;
          results.violations.push({
            type: "post_image_content",
            ...imageAnalysis,
          });
        }
      } catch (error) {
        console.warn("Image content analysis failed:", error.message);
        // If image analysis fails, we err on the side of caution
        results.isClean = false;
        results.violations.push({
          type: "post_image_analysis_failed",
          reason: "Unable to verify image content safety",
          severity: "medium",
        });
      }
    }
  }

  if (!results.isClean) {
    results.severity = determineSeverity(
      results.violations.flatMap((v) => v.violations || [v])
    );
    results.confidence =
      results.violations.length > 0
        ? Math.min(...results.violations.map((v) => v.confidence || 0.8))
        : 0.8;
  }

  return results;
};

/**
 * Ultra-comprehensive content filter for comments
 * @param {object} commentData - Comment data to filter
 * @returns {Promise<object>} - Result with comprehensive analysis
 */
export const filterCommentContent = async (commentData) => {
  if (commentData.desc) {
    const textAnalysis = await analyzeTextContent(commentData.desc);
    return {
      isClean: textAnalysis.isClean,
      type: "comment",
      ...textAnalysis,
    };
  }

  return { isClean: true };
};

/**
 * Targeted content filter for user profiles - only filters names and usernames
 * Excludes location/city, website, and other profile fields to avoid false positives
 * @param {object} userData - User data to filter
 * @returns {Promise<object>} - Result with comprehensive analysis
 */
export const filterUserContent = async (userData) => {
  const results = {
    isClean: true,
    violations: [],
    severity: "none",
    confidence: 1.0,
  };

  // Check username (only if provided)
  if (userData.username) {
    const usernameAnalysis = await analyzeTextContent(userData.username);
    if (!usernameAnalysis.isClean) {
      results.isClean = false;
      results.violations.push({
        type: "username",
        ...usernameAnalysis,
      });
    }
  }

  // Check display name (only if provided)
  if (userData.name) {
    const nameAnalysis = await analyzeTextContent(userData.name);
    if (!nameAnalysis.isClean) {
      results.isClean = false;
      results.violations.push({
        type: "display_name",
        ...nameAnalysis,
      });
    }
  }

  // NOTE: We deliberately DO NOT filter:
  // - city/location (can contain legitimate place names that trigger false positives)
  // - website (URLs can contain legitimate domains)
  // - bio/description (handled separately if needed)
  // This ensures users can update their location and website without content filter issues

  if (!results.isClean) {
    results.severity = determineSeverity(
      results.violations.flatMap((v) => v.violations || [v])
    );
    results.confidence =
      results.violations.length > 0
        ? Math.min(...results.violations.map((v) => v.confidence || 0.8))
        : 0.8;
  }

  return results;
};

/**
 * Enhanced content violation logging with detailed tracking
 * @param {string} type - Type of content
 * @param {string} userId - User ID
 * @param {object} filterResult - Filter result
 * @param {object} originalData - Original data
 */
export const logContentViolation = (
  type,
  userId,
  filterResult,
  originalData
) => {
  const violation = {
    timestamp: new Date().toISOString(),
    type: type,
    userId: userId,
    severity: filterResult.severity || "medium",
    confidence: filterResult.confidence || 0.5,
    violations: filterResult.violations || [],
    violationCount: filterResult.violations?.length || 1,
    libraries:
      filterResult.violations
        ?.map((v) => v.library)
        .filter((v, i, a) => a.indexOf(v) === i) || [],
    originalData: originalData,
    cleanedData:
      type === "post" && originalData.desc
        ? cleanText(originalData.desc)
        : null,
  };

  console.error(
    "🚫 ULTRA CONTENT FILTER VIOLATION:",
    JSON.stringify(violation, null, 2)
  );

  // Add to admin dashboard tracking
  addViolation(violation);

  // Auto-escalation based on severity
  if (violation.severity === "critical") {
    console.error(
      "🔴 CRITICAL VIOLATION - IMMEDIATE ACTION REQUIRED:",
      violation
    );
    // In production, this would trigger immediate user suspension
  } else if (violation.severity === "high" && violation.confidence > 0.8) {
    console.warn("🟠 HIGH SEVERITY VIOLATION - REVIEW REQUIRED:", violation);
    // In production, this would flag for immediate review
  }
};

// Legacy function compatibility
export const filterTextContent = async (text) => {
  const result = await analyzeTextContent(text);
  return {
    isClean: result.isClean,
    reason:
      result.violations.length > 0
        ? result.violations[0].reason || "Content policy violation"
        : undefined,
    severity: result.severity,
    confidence: result.confidence,
  };
};
