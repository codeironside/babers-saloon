const socketIo = require('socket.io');
const asynchandler = require('express-async-handler')
const { initialize } = require('./chatroom');
const users = require('../../model/users/user')

const chatlogic = asynchandler(async(req,res,io)=>{
    try {
        const { id } = req.auth;
        const { message } = req.body;
        console.log(message)
        const name = await users.findById(id); // Assuming you have a findById method in your userModel
        const newMessage = { name: name.firstName, message: message };
        // chatHistory.push(newMessage); // Example storage of chat history, replace with your database storage logic
        io.emit('chat message', newMessage);
        return res.status(200).json({ success: true, message: 'Message sent successfully' });
      } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
})


module.exports = {chatlogic};
