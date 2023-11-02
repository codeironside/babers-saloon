const asynchandler = require("express-async-handler");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const USER = require("../../model/users/user.js");
const working_hours = require("../../model/shops/openinghours.model");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//access privare
//route /shops/register/
// route for creating shops
const create_shops = asynchandler(async (req, res) => {
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

    // Create a new shop
    const createShops = await SHOPS.create({
      owner: id,
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
      instant_booking,
      category,
    });

    if (createShops) {
      let newWorkingHours;

      try {
        const workingHoursData = {
          shopId: createShops._id,
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

        newWorkingHours = await working_hours.create(workingHoursData);
      } catch (error) {
        // If an error occurs during the creation of the working hours, delete the created shop
        console.log(error);
        await SHOPS.findByIdAndDelete(createShops._id);
        throw new Error("Error creating working hours");
      }

      const updatedUser = await USER.findByIdAndUpdate(
        id,
        { role },
        { new: true }
      );

      const location = await getLocation(req.ip);

      if (createShops && updatedUser) {
        res.status(200).json({
          data: {
            shop: createShops,
            workingHours: newWorkingHours,
          },
          SHOP_ID: createShops._id,
        });
        logger.info(
          `User with id ${id} created a shop with id: ${createShops._id} at ${createShops.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
        );
      }
    }
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
});

//desc login shops
//route /shops/login
//access private
const login_shops = asynchandler(async (req, res) => {
  const { id } = req.auth;
  const { SHOP_ID } = req.body;
  if (!id) {
    throw new Error("not authorized");
  }
  if (!SHOP_ID) {
    throw new Error("no shops found");
  }
  try {
    const shop = await SHOPS.findById(SHOP_ID);
    // Get the current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Format the time as a string
    const currentTime = `${hours}:${minutes}:${seconds}`;
    const token = generateToken(shop._id);
    if (shop) {
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        successful: true,
        data: shop,
      });
      logger.info(
        `User with id ${id} logged in a shop with id: ${SHOP_ID} at ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
      );
    }
  } catch (error) {
    throw new Error("internal server error");
  }
});
// access private
// desc list all shops
// route /shops/al

const getallshops = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  console.log(page, "   ", pageSize);
  try {
    const totalCount = await SHOPS.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);
    const shops = await SHOPS.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.json({
      data: shops,
      page: page,
      totalPages: totalPages,
    });
    logger.info(
      `shops were fetched ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.log(error);
    throw new Error("Internal server error");
  }
});

//desc get a shop owbers product
//acess private
//rouyte
const getallshopone = asynchandler(async (req, res) => {
  let page = parseInt(req.query.page) || 1;

  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth; // Assuming you are passing userId as a route parameter

  try {
    const totalCount = await SHOPS.countDocuments({ owner: id }); // Assuming user field represents the user's ID
    const totalPages = Math.ceil(totalCount / pageSize);
    const shops = await SHOPS.find({ user: userId })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    // Get the current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Format the time as a string
    const currentTime = `${hours}:${minutes}:${seconds}`;
    const token = generateToken(id);
    res.json({
      data: shops,
      page: page,
      totalPages: totalPages,
    });
    logger.info(
      `user with id ${id},fectched all his products - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
    );
  } catch (error) {
    console.log(error);
    throw new Error("Internal server error");
  }
});

// Controller function to update a shop
//route /user/updateac
//access private
//data updateData
const updateShops = asynchandler(async (req, res) => {
  const { shopId } = req.params; // Get the shop ID from the route parameters
  const clientIp = req.ip;
  const { id } = req.auth;
  const updateData = req.body; // Get the updated data from the request body

  try {
    if (!shopId) {
      throw new Error("Shop ID is empty");
    }

    if (!updateData) {
      throw new Error("Update data is empty");
    }

    const shop = await SHOPS.findById(shopId);

    if (!shop) {
      throw new Error("Shop not found");
    }

    // Check if the authenticated user is the owner of the shop
    if (shop.owner.toString() !== id) {
      throw new Error("Not authorized");
    }

    const updatedShop = await SHOPS.findByIdAndUpdate(shopId, updateData, {
      new: true, // Return the updated shop document
    });

    if (!updatedShop) {
      throw new Error("Error updating shop");
    }

    const location = await getLocation(clientIp);
    const workingHours = await working_hours.findOne({
      shopId: new mongoose.Types.ObjectId(shopId),
    });
    res.status(202).json({
      successful: true,
      data: updatedShop,
      workingHours,
    });

    logger.info(
      `User with id ${id} updated shop with id: ${shopId} at ${updatedShop.updatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error("Server Error");
  }
});
//update working hours
//access private
const updateWorkingHours = asynchandler(async (req, res) => {
  const { shopId } = req.params; // Get the working hours ID from the route parameters
  const {
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
  } = req.body; // Get the updated data from the request body
  const clientIp = req.ip;
  const { id } = req.auth;

  try {
    if (!shopId) {
      throw new Error("Working hours ID is empty");
    }

    if (!req.body) {
      throw new Error("Update data is empty");
    }

    const workingHours = await working_hours.findOne({ shopId: shopId });

    if (!workingHours) {
      throw new Error("Working hours not found");
    }
    // Check if the authenticated user is the owner of the associated shop
    const shop = await SHOPS.findById(shopId);
    if (!shop || shop.owner.toString() !== id) {
      throw new Error("Not authorized");
    }
    const workingHoursData = {
      shopId: shop._id,
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
    const updatedWorkingHours = await working_hours.findByIdAndUpdate(
      workingHours._id,
      workingHoursData,
      {
        new: true, // Return the updated working hours document
      }
    );

    if (!updatedWorkingHours) {
      throw new Error("Error updating working hours");
    }

    const location = await getLocation(clientIp);

    res.status(202).json({
      successful: true,
      data: updatedWorkingHours,
    });

    logger.info(
      `User with id ${id} updated working hours with id: ${shopId} at ${updatedWorkingHours.updatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error("Server Error");
  }
});

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
const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};
module.exports = {
  create_shops,
  getallshops,
  updateShops,
  login_shops,
  getallshopone,
  updateWorkingHours,
};
