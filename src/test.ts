import { scrapeCompetitions } from './services/scraper';

const test = async () => {
  const result = await scrapeCompetitions();
  
  console.log('\n' + '='.repeat(60));
  console.log('SCRAPED COMPETITIONS');
  console.log('='.repeat(60));
  
  result.competitions.forEach((comp, i) => {
    console.log(`\n${i + 1}. ${comp.title}`);
    console.log(`   Organizer: ${comp.organizer}`);
    console.log(`   Deadline: ${comp.deadline}`);
    console.log(`   Link: ${comp.registrationLink}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${result.totalFound} competitions`);
  console.log('='.repeat(60));
};

test();
