import { buildServer } from './server';

const start = async () => {
  const server = buildServer();
  
  const PORT = process.env.PORT || 8080;
  const HOST = '0.0.0.0';
  
  try {
    await server.listen({ 
      port: Number(PORT), 
      host: HOST 
    });
    
    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 USThing Case Competition API');
    console.log('='.repeat(50));
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ API docs: http://localhost:${PORT}/`);
    console.log(`✓ Competitions: http://localhost:${PORT}/api/v1/competitions`);
    console.log('='.repeat(50));
    console.log('');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
