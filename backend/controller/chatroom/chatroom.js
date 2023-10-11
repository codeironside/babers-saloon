const socketIo = require('socket.io')



const initialize = (server)=>{
    const io = socketIo(server)

    socket.on('connection',(server)=>{
        console.log("a user connected")
        const Userid =socket.request.user.id
        socket.on('chat-message',(msg)=>{io.emit('chat-message',msg)})
    })
    socket.on('disconnect',()=>{
        console.log('a user disconnected')
    })

    return io
}

module.exports =initialize