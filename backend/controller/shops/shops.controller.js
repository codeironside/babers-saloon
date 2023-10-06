const asynchandler = require("express-async-handler");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger")
const USER = require("../../model/users/user.js");
const working_hours = require('../../model/shops/openinghours.model')

//access privare
//route /shops/register/
// route for creating shops
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
///access private 
//desc list all shops
//routes /shops/all
const getallshops = asyncHandler(async(req,res)=>{
  const page = parseInt(req.query.poge)||1
  const pageSize =parseInt(req.query.pageSize)|| 10
  try{
    const totalCount = await SHOP.countDocuments()
    const totalpages = Math.cell(totalCount/pageSize)
    const shops = await SHOP.find()
    .skip((page -1) * pageSize)
    .limit(pageSize)
    res.json({
      data:shops,
      pahe:page,
      totalPages:totalpages
    })
  }
  catch(error){
    throw new Error('internal server Error')
  }
})
// desc update shops
//route /shops/update/
//access private 
// Controller function to update a user
//route /user/updateac
//access private
//data updateData
const updateShops = async (req, res) => {
  const { userId } = req.params; // Get the user ID from the route parameters
  const clientIp = req.clientIp;
  const {_id, ...updateData }= req.body; // Get the updated data from the request body

  try {
    if(!userId){throw new Error('params is empty')}
    // Use findByIdAndUpdate to update the user document by ID
    if(!updateData){
      throw new Error("body is empty")
    }
    if(_id){
      throw new Error('_id not found')
    }
    
    const updatedShops = await SHOPS.findByIdAndUpdate(_id, updateData, {
      new: true, // Return the updated user document
    });

    if (!updatedShops) {
      throw new Error('Shop not found ')
    }

    res.status(202).json(updatedShops);
    const createdAt = updatedShops.updatedAt; // Assuming createdAt is a Date object in your Mongoose schema
  const watCreatedAt = convertToWAT(createdAt);
  const location = await getLocation(clientIp);
    logger.info(
      `user with id ${userId},updated shop ${id} at ${watCreatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}  - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error('server Error')
  }
};

const getLocation = asynchandler(async (ip) => {
  try {
    // Set endpoint and your access key
    const accessKey = process.env.ip_secret_key;
    const url =
      "http://apiip.net/api/check?ip=" + ip + "&accessKey=" + accessKey;

    // Make a request and store the response
    const response = await fetch(url);

    // Decode JSON response:
    const result = await response.json();

    // Output the "code" value inside "currency" object
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
});
module.exports = {create_shops}