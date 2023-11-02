const socketIo = require('socket.io');

const initialize = (server) => {
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('a user connected');
        const userId = socket.request.user.id;

        socket.on('chat-message', (msg) => {
            io.emit('chat-message', msg);
        });

        socket.on('disconnect', () => {
            console.log('a user disconnected');
        });
    });

    return io;
};

module.exports = { initialize };
