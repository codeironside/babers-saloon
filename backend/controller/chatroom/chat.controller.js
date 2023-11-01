const asynchandler = require('express-async-handler')
const { initialize } = require('./chatroom');
const users = require('../../model/users/user')

const chatlogic = asynchandler(async(req,res)=>{
    const {id}=req.auth
    const { message } = req.body; // Assuming the message is sent in the request body
    const name = user.findById(id)
    const new_message ={name:name.firstName, message:message  }
    initialize.emit('chat-message', new_message); // Emit the message to all connected users
  
    // You can send an appropriate response back to the client
    res.status(200).json({ success: true, new_message: 'Message sent successfully' });
})


module.exports = {chatlogic};
