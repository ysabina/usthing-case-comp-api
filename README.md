# USThing Backend Technical Test 2025

A web scraper and REST API that aggregates case competition opportunities from major Hong Kong universities and organizations. Built to help students discover competitions they might otherwise miss.

## 📚 Tech Stack

- **Backend Framework**: Fastify (chosen for speed and TypeScript support)
- **Language**: TypeScript
- **Web Scraping**: Axios + Cheerio
- **Fuzzy Matching**: Fuzzball (to detect duplicate competitions across sources)
- **Containerization**: Docker

## 🎯 What It Scrapes

Currently pulling from 7 sources:
- HKUST Business School announcements
- HKU Faculty of Business and Economics
- HSBC/HKU Asia Pacific Business Case Competition
- HKGCC (Hong Kong General Chamber of Commerce)
- HKUST International Case Competition (HKICC)
- HKSI Institute Case Competition
- PolyU Student Competitions

The scraper uses keyword filtering (Case, Challenge, Competition, Hackathon, etc.) and fuzzy matching at 90% similarity threshold to remove duplicates.

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- Docker (if you want to run in a container)

### Local Development

Clone the repo
git clone https://github.com/ysabina/usthing-case-comp-api.git
cd usthing-case-comp-ap

Install dependencies
npm install

Run in development mode (with auto-reload)
npm run dev



The server will start on `http://localhost:8080`

### Production Build

Compile TypeScript
npm run build

Run the compiled version
npm start



### Docker

Build the image
docker build -t usthing-case-comp-api .

Run the container
docker run -p 8080:8080 usthing-case-comp-api

Or use docker-compose:

docker-compose up



## 🧪 Testing the API

### Quick Health Check

First, make sure the server is running:

curl http://localhost:8080/health

text

Expected response:
{
"status": "ok
, "timestamp": "2025-10-18T07:40:00.00
Z", "service": "USThing Case Competition
API", "version":
}

### Get All Competitions

This endpoint triggers the scraping process (takes 5-15 seconds):

curl http://localhost:8080/api/v1/competitions

You'll see output in the server logs showing which sources are being scraped and how many competitions were found.

Sample response:
{
"competitions":
[
{ "id": "comp-0-176
758524821", "title": "HSBC HKU Business Case
ompetition 2025",
organizer": "HSBC/HKU", "
eadline": "15 December 2024", "description": "HSBC/
KU Business Case Competition 2025", "eligibi
https://competition.acrc.hku.hk",
https://competition.acrc.hku.hk",
}




### Filter by Organizer

Get only HKUST competitions
curl "http://localhost:8080/api/v1/competitions/filter?organizer=HKUST"

Get only HKU competitions
curl "http://localhost:8080/api/v1/competitions/filter?organizer=HKU"



### Filter by Keyword

Find competitions with "case" in the title
curl "http://localhost:8080/api/v1/competitions/filter?keyword=case"

Find hackathons
curl "http://localhost:8080/api/v1/competitions/filter?keyword=hackathon"


### Combined Filters

curl "http://localhost:8080/api/v1/competitions/filter?organizer=HKUST&keyword=case"



### Get Specific Competition

curl http://localhost:8080/api/v1/competitions/comp-0-1760758524821



Replace the ID with an actual competition ID from the list.

### Using a Browser

If you prefer a GUI, just open these URLs in your browser:

- **API Documentation**: http://localhost:8080/
- **All Competitions**: http://localhost:8080/api/v1/competitions
- **Filtered Results**: http://localhost:8080/api/v1/competitions/filter?organizer=HKUST

The browser will format the JSON nicely for you.

### Testing with Postman

1. Import the endpoints into Postman
2. Create a new GET request
3. Use any of the URLs above
4. Hit Send

No authentication required since this is a public API.



## ⚙️ How the Scraper Works

1. **Parallel Requests**: All 7 sources are scraped simultaneously using `Promise.all()` for speed
2. **HTML Parsing**: Cheerio loads each page and extracts competitions using CSS selectors
3. **Keyword Filtering**: Only keeps announcements containing competition-related keywords
4. **Fuzzy Deduplication**: Uses Fuzzball to compare titles and detect near-duplicates (90% similarity)
5. **Data Transformation**: Converts raw scraped data into structured Competition objects

The fuzzy matching is important because the same competition might be announced differently on different sites. For example:
- "HSBC/HKU Business Case Competition 2025" (HKU site)
- "HSBC HKU Case Competition 2025!" (HKUST site)

These would be detected as duplicates and merged.

## ⚠️ Known Limitations

- **Scraping Speed**: First request takes 10-15 seconds since it scrapes live. Consider adding a caching layer for production.
- **Website Changes**: If universities redesign their sites, the CSS selectors might break and need updating.
- **Deadline Extraction**: Not all sites format dates consistently, so some deadlines show as "TBD".
- **No Persistence**: Data isn't stored; each request scrapes fresh. This ensures data is current but impacts performance.

## 💡 Future Improvements

If I had more time, I'd add:
- Redis caching to speed up repeat requests
- Scheduled background jobs to scrape periodically
- PostgreSQL to store historical competition data
- More detailed competition info (prizes, eligibility requirements)
- Email notifications for new competitions
- Admin dashboard to manually add competitions

## 📝 Development Notes

The scraper follows functional programming principles where possible (map, filter, reduce) rather than imperative loops. TypeScript provides type safety throughout. Error handling is built in so one failing source doesn't crash the whole scraper.

Logs use pino-pretty in development for readability. The Docker build uses multi-stage compilation to keep the final image small (~150MB).

---

## 💌 A Note to the USThing Team

Thank you for taking the time to review this submission. I really enjoyed working on this technical test – it combined several things I'm interested in: solving real student problems, web scraping, and building clean APIs.

I chose to scrape actual Hong Kong competition sites rather than mock data because I thought it would be more useful and demonstrate handling real-world HTML structures. The fuzzy deduplication was particularly interesting to implement since competition announcements vary so much across sites.

I'm excited about the possibility of joining USThing and contributing to tools that help the HKUST community. I believe in building products that solve genuine student needs, and I'd love to bring that mindset to your team.

Looking forward to hearing from you!

Best,  
Sabina ^_^

---

**Repository**: https://github.com/ysabina/usthing-case-comp-api
