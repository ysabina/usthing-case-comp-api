import fastify from 'fastify';
import competitionRoutes from './routes/competitions';

export const buildServer = () => {
  const server = fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        }
      }
    }
  });

  // Register routes with prefix
  server.register(competitionRoutes, { prefix: '/api/v1' });

  // Health check endpoint
  server.get('/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date(),
      service: 'USThing Case Competition API',
      version: '1.0.0'
    };
  });

  // Root endpoint with API documentation
  server.get('/', async () => {
    return {
      message: 'USThing Case Competition API',
      description: 'Backend service to scrape case competitions in Hong Kong',
      version: '1.0.0',
      endpoints: {
        health: {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint'
        },
        allCompetitions: {
          path: '/api/v1/competitions',
          method: 'GET',
          description: 'Get all competitions'
        },
        filterCompetitions: {
          path: '/api/v1/competitions/filter',
          method: 'GET',
          query: 'organizer=HKUST&keyword=case',
          description: 'Filter competitions by organizer or keyword'
        },
        competitionById: {
          path: '/api/v1/competitions/:id',
          method: 'GET',
          description: 'Get specific competition by ID'
        }
      }
    };
  });

  return server;
};
