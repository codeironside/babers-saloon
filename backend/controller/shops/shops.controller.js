const asynchandler = require("express-async-handler");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger")
const USER = require("../../model/users/user.js");
const working_hours = require('../../model/shops/openinghours.model')
const create_shops =asynchandler( async (req, res) => {
  try {
    const { id } = req.auth;
    if (!id) throw new Error("Not a user");

    const {
      shop_name,
      shop_address,
      contact_email,
      contact_number,
      keywords,
      google_maps_place_id,
      longitude,
      images,
      facebook,
      description,
      website,
      twitter,
      whatsapp,
      instagram,
      minimum_price,
      maximum_price,
      monday_opening_hours,
      monday_closing_hours,
      tuesday_opening_hours,
      tuesday_closing_hours,
      wednesday_opening_hours,
      wednesday_closing_hours,
      thursday_opening_hours,
      thursday_closing_hours,
      friday_opening_hours,
      friday_closing_hours,
      saturday_opening_hours,
      saturday_closing_hours,
      sunday_opening_hours,
      sunday_closing_hours,
      instant_booking,
      category,
    } = req.body;

    if (!shop_name || !shop_address || !contact_email || !contact_number) {
      throw new Error("Required fields cannot be empty");
    }

    const shopExists = await SHOPS.findOne({ shop_name: shop_name });
    if (shopExists) {
      throw new Error("Shop already exists");
    }

    const role = "SHOP_OWNER"; // The updated role value

    const workingHoursData = {
      hours: {
        monday: {
          opening: monday_opening_hours,
          closing: monday_closing_hours,
        },
        tuesday: {
          opening: tuesday_opening_hours,
          closing: tuesday_closing_hours,
        },
        wednesday: {
          opening: wednesday_opening_hours,
          closing: wednesday_closing_hours,
        },
        thursday: {
          opening: thursday_opening_hours,
          closing: thursday_closing_hours,
        },
        friday: {
          opening: friday_opening_hours,
          closing: friday_closing_hours,
        },
        saturday: {
          opening: saturday_opening_hours,
          closing: saturday_closing_hours,
        },
        sunday: {
          opening: sunday_opening_hours,
          closing: sunday_closing_hours,
        },
      },
    };

    // Create a new "WorkingHours" document
    const newWorkingHours = await WorkingHours.create(workingHoursData);

    // Create a new shop
    const createShops = await SHOPS.create({
      shop_name,
      shop_address,
      contact_email,
      contact_number,
      keywords,
      google_maps_place_id,
      longitude,
      images,
      facebook,
      description,
      website,
      twitter,
      whatsapp,
      instagram,
      minimum_price,
      maximum_price,
      opening_hours: newWorkingHours._id, // Reference to the created working hours
      instant_booking,
      category,
    });

    // Update user's role
    const updatedUser = await USER.findByIdAndUpdate(id, { role }, {
      new: true, // Return the updated document
    });

    if (createShops && updatedUser) {
      res.status(200).json({
        data: {
          shop: createShops,
          workingHours: newWorkingHours,
        },
        SHOP_ID: createShops._id,
      });
      logger.info(
        `User with id ${id} created a shop with id: ${createShops._id} at ${createShops.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${req.session.id} - from ${location}`
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


//desc login shops
//route /shops/login
//access private
const login_shops=asynchandler(async(req,res)=>{
    const {id} =req.auth
    const {SHOP_ID} = req.body
    if(!id){throw new Error('not authorized')}
    if(!SHOP_ID){
        throw new Error('no shops found')
    }
})
module.exports = {create_shops}