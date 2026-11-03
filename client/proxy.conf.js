// Dev-server proxy: the app calls /api and the calls socket on its own origin, and
// `ng serve` forwards them to the NestJS server. If the server isn't on port 3000, start
// the client with API_URL set, e.g. `API_URL=http://localhost:3300 npm start`.
const target = process.env.API_URL || 'http://localhost:3000';

module.exports = {
  '/api': { target, changeOrigin: true, secure: false },
  '/socket.io': { target, changeOrigin: true, secure: false, ws: true },
};
