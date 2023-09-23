const mongoose = require("mongoose")

const SHOPS = new mongoose.schema({
 shop_name :{
    type:String,
    required:[true, 'please add a shop name'],
    unique:true
 },
 shop_address :{
    type:String,
    required:[true,'please add an address']
 },
 owner:{
    type:mongoose.Schema.ObjectId,
    required:[true,'please include an owners Id']
},
contact_number:{
    type:String,
    required:[true,'please include a contact number']

},
contact_email:{
    type:String,
    required:[true,'please include a contact email']
}},
{
    timestamps:true
})

module.exports =mongoose.model("SHOPS", SHOPS)