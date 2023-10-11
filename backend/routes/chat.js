const express = require("express")


const { protect } = require("../middleware/authmiddleware")

const Router = express.Router()



//register users
Router.route("/send-message").post(register_users)


module.exports=Router