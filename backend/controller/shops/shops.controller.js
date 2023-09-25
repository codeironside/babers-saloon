const asynchandler = require('express-async-handler')
const SHOPS = require('../../model/shops/shop');
const shop = require('../../model/shops/shop');
const USER = requie('../../model/users/user.js')

const create_shops = asynchandler(async(req,res)=>{
const {id} = req.auth
if(!id) throw new Error('not a user');
const {shop_name, shop_address, contact_email,contact_number}= req.body
if(!shop_name || !shop_address || !contact_email)

})