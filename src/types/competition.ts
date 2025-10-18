export interface Competition {
    id: string;
    title: string;
    organizer: string;
    deadline: string;
    description: string;
    eligibility: string;
    prizes?: string;
    registrationLink: string;
    source: string;
    scrapedAt: Date;
  }
  
  export interface ScraperResult {
    competitions: Competition[];
    lastUpdated: Date;
    totalFound: number;
  }
  