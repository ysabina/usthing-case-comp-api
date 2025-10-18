import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { scrapeCompetitions } from '../services/scraper';

interface FilterQuery {
  organizer?: string;
  keyword?: string;
}

interface CompetitionParams {
  id: string;
}

export default async function competitionRoutes(fastify: FastifyInstance) {
  
  // GET /api/v1/competitions - Get all competitions
  fastify.get('/competitions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await scrapeCompetitions();
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to fetch competitions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/v1/competitions/filter - Filter competitions
  fastify.get<{ Querystring: FilterQuery }>(
    '/competitions/filter',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            organizer: { type: 'string' },
            keyword: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { organizer, keyword } = request.query;
        const result = await scrapeCompetitions();
        
        // Apply filters using functional programming
        const filtered = result.competitions
          .filter(comp => !organizer || comp.organizer.toLowerCase() === organizer.toLowerCase())
          .filter(comp => !keyword || comp.title.toLowerCase().includes(keyword.toLowerCase()));
        
        return reply.send({
          competitions: filtered,
          totalFound: filtered.length,
          lastUpdated: result.lastUpdated,
          filters: { organizer, keyword }
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to filter competitions' });
      }
    }
  );

  // GET /api/v1/competitions/:id - Get specific competition by ID
  fastify.get<{ Params: CompetitionParams }>(
    '/competitions/:id',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const result = await scrapeCompetitions();
        
        const competition = result.competitions.find(comp => comp.id === id);
        
        if (!competition) {
          return reply.code(404).send({ 
            error: 'Competition not found',
            id 
          });
        }
        
        return reply.send(competition);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to fetch competition' });
      }
    }
  );
}
