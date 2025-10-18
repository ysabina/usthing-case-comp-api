import axios from 'axios';
import * as cheerio from 'cheerio';
import { ratio } from 'fuzzball';
import { Competition, ScraperResult } from '../types/competition';

const KEYWORDS = ['Case', 'Challenge', 'Competition', 'Hackathon', 'Datathon', 'Contest'];

// ---------------------------
// HELPER FUNCTIONS
// ---------------------------

const normalizeText = (text: string): string => {
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/[^\w\s]/g, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
};

const isNearDuplicate = (textA: string, textB: string, threshold: number = 90): boolean => {
  const similarityScore = ratio(textA, textB);
  return similarityScore >= threshold;
};

const sanitizeOutput = (text: string): string => {
  let sanitized = text.replace(/[^\x00-\x7F]/g, '');
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized;
};

const extractDeadline = (text: string): string => {
  const patterns = [
    /deadline[:\s]+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /deadline[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /by\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /(\d{1,2}\s+[A-Za-z]+\s+\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return 'TBD';
};

// ---------------------------
// SCRAPERS
// ---------------------------

// 1. HKU FBE Competitions (Most comprehensive)
const scrapeHKUFBE = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://ug.fbe.hku.hk/competition', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping HKU FBE...');

    $('h3, h4').each((_, element) => {
      const title = $(element).text().trim();
      
      if (title.length > 15 && 
          !title.toLowerCase().includes('upcoming') &&
          !title.toLowerCase().includes('training') &&
          !title.toLowerCase().includes('archived')) {
        
        const hasKeyword = KEYWORDS.some(kw => title.toLowerCase().includes(kw.toLowerCase()));
        
        if (hasKeyword) {
          const parent = $(element).closest('div, section, article');
          const contextText = parent.text();
          const deadline = extractDeadline(contextText);
          
          const link = parent.find('a').first().attr('href') || '';
          const fullLink = link.startsWith('http') ? link : `https://ug.fbe.hku.hk${link}`;
          
          console.log(`  ✓ Found: ${title}`);
          entries.push({ title: title + ' [HKU-FBE]', deadline, link: fullLink });
        }
      }
    });

    console.log(`✓ HKU FBE: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape HKU FBE');
    return [];
  }
};

// 2. HKUST Business Announcements
const scrapeHKUST = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://bmundergrad.hkust.edu.hk/announcement', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping HKUST...');

    $('td').each((_, element) => {
      const $el = $(element);
      const h2 = $el.find('h2');
      
      if (h2.length > 0) {
        const fullText = h2.text().trim();
        const hasKeyword = KEYWORDS.some(kw => fullText.toLowerCase().includes(kw.toLowerCase()));
        
        if (hasKeyword && fullText.length > 10) {
          const deadline = extractDeadline($el.text());
          const link = $el.find('a').first().attr('href') || '';
          const fullLink = link.startsWith('http') ? link : `https://bmundergrad.hkust.edu.hk${link}`;
          
          console.log(`  ✓ Found: ${fullText}`);
          entries.push({ title: fullText + ' [UST]', deadline, link: fullLink });
        }
      }
    });

    console.log(`✓ HKUST: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape HKUST');
    return [];
  }
};

// 3. HKGCC Business Case Competition
const scrapeHKGCC = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://www.chamber.org.hk/bcc2024/', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping HKGCC...');

    const title = $('h1, h2').first().text().trim();
    if (title.includes('Case Competition') || title.includes('Business Case')) {
      const bodyText = $('body').text();
      const deadline = extractDeadline(bodyText);
      
      console.log(`  ✓ Found: ${title}`);
      entries.push({
        title: title + ' [HKGCC]',
        deadline,
        link: 'https://www.chamber.org.hk/bcc2024/'
      });
    }

    console.log(`✓ HKGCC: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape HKGCC');
    return [];
  }
};

// 4. HKICC
const scrapeHKICC = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://hkicc.hkust.edu.hk', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping HKICC...');

    $('h1, h2, h3').each((_, element) => {
      const title = $(element).text().trim();
      if (title.toLowerCase().includes('hkicc') || title.toLowerCase().includes('international case competition')) {
        const bodyText = $('body').text();
        const deadline = extractDeadline(bodyText);
        
        console.log(`  ✓ Found: ${title}`);
        entries.push({
          title: title + ' [HKICC]',
          deadline,
          link: 'https://hkicc.hkust.edu.hk'
        });
      }
    });

    console.log(`✓ HKICC: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape HKICC');
    return [];
  }
};

// 5. HSBC/HKU Competition
const scrapeHSBCHKU = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://competition.acrc.hku.hk', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping HSBC/HKU...');

    $('h1, h2').each((_, element) => {
      const title = $(element).text().trim();
      if (title.toLowerCase().includes('hsbc') || title.toLowerCase().includes('asia pacific')) {
        const bodyText = $('body').text();
        const deadline = extractDeadline(bodyText);
        
        console.log(`  ✓ Found: ${title}`);
        entries.push({
          title: title + ' [HSBC/HKU]',
          deadline,
          link: 'https://competition.acrc.hku.hk'
        });
      }
    });

    console.log(`✓ HSBC/HKU: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape HSBC/HKU');
    return [];
  }
};

// 6. HKSI Institute
const scrapeHKSI = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://www.hksi.org/membership/outreach/case-competition/', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping HKSI...');

    $('h1, h2, h3').each((_, element) => {
      const title = $(element).text().trim();
      if (title.toLowerCase().includes('case competition 202')) {
        const bodyText = $('body').text();
        const deadline = extractDeadline(bodyText);
        
        console.log(`  ✓ Found: ${title}`);
        entries.push({
          title: title + ' [HKSI]',
          deadline,
          link: 'https://www.hksi.org/membership/outreach/case-competition/'
        });
      }
    });

    console.log(`✓ HKSI: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape HKSI');
    return [];
  }
};

// 7. PolyU Competitions
const scrapePolyU = async (): Promise<Array<{title: string, deadline: string, link: string}>> => {
  try {
    const response = await axios.get('https://www.polyu.edu.hk/af/Experience-and-Opportunities/Student-Competitions?sc_lang=en', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const entries: Array<{title: string, deadline: string, link: string}> = [];

    console.log('🔍 Scraping PolyU...');

    $('table tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const title = $(cells[0]).text().trim();
        const deadline = $(cells[1]).text().trim();
        
        if (title.length > 10 && !title.toLowerCase().includes('competition name')) {
          console.log(`  ✓ Found: ${title}`);
          entries.push({
            title: title + ' [PolyU]',
            deadline,
            link: 'https://www.polyu.edu.hk/af/Experience-and-Opportunities/Student-Competitions'
          });
        }
      }
    });

    console.log(`✓ PolyU: ${entries.length} competitions\n`);
    return entries;
  } catch (error) {
    console.error('✗ Failed to scrape PolyU');
    return [];
  }
};

// ---------------------------
// DEDUPLICATE
// ---------------------------

interface IndexedEntry {
  index: number;
  originalText: string;
  normalizedText: string;
  deadline: string;
  link: string;
}

const deduplicateEntries = (entries: Array<{title: string, deadline: string, link: string}>): IndexedEntry[] => {
  const uniqueEntries: IndexedEntry[] = [];

  entries.forEach((entry, idx) => {
    const normText = normalizeText(entry.title);
    
    const duplicateFound = uniqueEntries.some(existing => 
      isNearDuplicate(normText, existing.normalizedText)
    );

    if (!duplicateFound) {
      uniqueEntries.push({
        index: idx,
        originalText: entry.title,
        normalizedText: normText,
        deadline: entry.deadline,
        link: entry.link
      });
    } else {
      console.log(`  → Skipped duplicate: "${entry.title}"`);
    }
  });

  return uniqueEntries;
};

// ---------------------------
// MAIN FUNCTION
// ---------------------------

export const scrapeCompetitions = async (): Promise<ScraperResult> => {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 COMPREHENSIVE HONG KONG CASE COMPETITION SCRAPER');
    console.log('='.repeat(70) + '\n');

    // Scrape ALL sources in parallel
    const [hkuFBE, hkust, hkgcc, hkicc, hsbcHku, hksi, polyu] = await Promise.all([
      scrapeHKUFBE(),
      scrapeHKUST(),
      scrapeHKGCC(),
      scrapeHKICC(),
      scrapeHSBCHKU(),
      scrapeHKSI(),
      scrapePolyU()
    ]);

    const allEntries = [...hkuFBE, ...hkust, ...hkgcc, ...hkicc, ...hsbcHku, ...hksi, ...polyu];
    
    console.log('📊 SUMMARY');
    console.log('-'.repeat(70));
    console.log(`   HKU FBE: ${hkuFBE.length} | HKUST: ${hkust.length} | HKGCC: ${hkgcc.length}`);
    console.log(`   HKICC: ${hkicc.length} | HSBC/HKU: ${hsbcHku.length} | HKSI: ${hksi.length} | PolyU: ${polyu.length}`);
    console.log(`   TOTAL: ${allEntries.length} entries\n`);

    console.log('🔄 Deduplicating...\n');
    const uniqueEntries = deduplicateEntries(allEntries);
    
    console.log(`✅ Final unique competitions: ${uniqueEntries.length}\n`);
    console.log('='.repeat(70) + '\n');

    const competitions: Competition[] = uniqueEntries.map(entry => {
      const cleanedTitle = sanitizeOutput(entry.originalText);
      const sourceMatch = entry.originalText.match(/\[(.*?)\]$/);
      const source = sourceMatch ? sourceMatch[1] : 'Unknown';
      const titleWithoutTag = entry.originalText.replace(/\s*\[.*?\]$/, '');

      return {
        id: `comp-${entry.index}-${Date.now()}`,
        title: cleanedTitle,
        organizer: source,
        deadline: entry.deadline,
        description: titleWithoutTag,
        eligibility: 'University students in Hong Kong',
        prizes: '',
        registrationLink: entry.link,
        source: entry.link,
        scrapedAt: new Date()
      };
    });

    return {
      competitions,
      lastUpdated: new Date(),
      totalFound: competitions.length
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      competitions: [],
      lastUpdated: new Date(),
      totalFound: 0
    };
  }
};

export { scrapeHKUFBE, scrapeHKUST, scrapeHKGCC, scrapeHKICC, scrapeHSBCHKU, scrapeHKSI, scrapePolyU };
