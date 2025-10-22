let io = null;

module.exports = {
  init: (server) => {
    const socketIO = require('socket.io');
    io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('authenticate', (data) => {
        if (data.userId) {
          socket.join(`user:${data.userId}`);
          console.log(`User ${data.userId} authenticated`);
        }
        if (data.role === 'admin') {
          socket.join('admin');
          console.log('Admin joined admin room');
        }
      });

      socket.on('track:order', (orderId) => {
        socket.join(`order:${orderId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    module.exports.instance = io;
    return io;
  },
  instance: null
};
