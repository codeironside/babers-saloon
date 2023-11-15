const asynchandler = require("express-async-handler");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const USER = require("../../model/users/user.js");
const working_hours = require("../../model/shops/openinghours.model");
const jwt = require("jsonwebtoken");
const cloudinary = require('cloudinary').v2;;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const create_shops = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;

    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });

    // Check the user's subscription type
    const user = await USER.findById(id);
    if (!user) throw Object.assign(new Error("Not a user"), { statusCode: 404 });

    
    let maxAllowedShops;

    // Set the maximum allowed shops based on the user's subscription type
    switch (user.type) {
      case "basic":
        maxAllowedShops = 5;
        break;
      case "gold":
        maxAllowedShops = 15;
        break;
      case "diamond":
        maxAllowedShops = Infinity; // Unlimited shops for diamond subscription
        break;
      default:
        throw Object.assign(new Error("Invalid subscription type"), { statusCode: 422 });
    }

    // Check the current number of shops created by the user
    const userShopsCount = await SHOPS.countDocuments({ owner: id });
    if (userShopsCount >= maxAllowedShops) {
      throw Object.assign(new Error(`You have reached the maximum allowed shops (${maxAllowedShops})`), { statusCode: 403 });
    }
    if (req.body.data) {
      const result = await cloudinary.uploader.upload(req.body.data, { resource_type: 'image', format: 'png' });

    image = result.secure_url;
    }

      const {
        shop_name,
        shop_address,
        contact_email,
        contact_number,
        keywords,
        services,
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
      } = req.body;

      // Use the uploaded image URL from Cloudinary
      const image = result.secure_url;

      // Create shop with Cloudinary image URL
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
        image,
        instagram,
        servicesOffered: services.split(","),
        minimum_price,
        maximum_price,
        instant_booking,
        category,
        subscriptionType: user.type,
      });

      if (createShops) {
        let newWorkingHours;

        // Creating working hours for the shop
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
          }
        };

        newWorkingHours = await working_hours.create(workingHoursData);

        // Update user role
        const updatedUser = await USER.findByIdAndUpdate(
          id,
          { $set: { role: 'SHOP_OWNER' } },
          { new: true }
        );

        if (createShops && updatedUser) {
          res.status(200).json({
            data: {
              shop: createShops,
              workingHours: newWorkingHours,
            },
            SHOP_ID: createShops._id,
          });

          logger.info(`User with id ${id} created a shop with id: ${createShops._id} at ${createShops.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`);
        }
      }
    } catch (error) {
      console.error(error);
  
      throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
    }
  });



//desc login shops
//route /shops/login
//access private
const login_shops = asynchandler(async (req, res) => {
  const { SHOP_ID } = req.body;
  if (!SHOP_ID) {
    throw Object.assign(new Error("No shops found"), { statusCode: 404 });
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
    if (shop) {
      res.status(200).json({
        successful: true,
        data: shop,
      });
      logger.info(
        `shop with id ${SHOP_ID} was fetched at ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
//access get one shop for registered users and shop i
const getshop = asynchandler(async (req, res) => {
  const { id } = req.auth;
  const { SHOP_ID } = req.body;
  if (!id) {
    throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
  }
  if (!SHOP_ID) {
    throw Object.assign(new Error("No shops found"), { statusCode: 404 });
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
    let owner = false;
    if ((id === shop.owner, toString())) {
      const token = generateToken(shop._id);
      owner = true;
      if (shop) {
        res.status(200).header("Authorization", `Bearer ${token}`).json({
          successful: true,
          data: shop,
          owner: owner,
        });
        logger.info(
          `User with id ${id} logged in a shop with id: ${SHOP_ID} at ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
        );
      }
    } else {
      const token = generateToken(shop._id);
      if (shop) {
        res.status(200).header("Authorization", `Bearer ${token}`).json({
          successful: true,
          data: shop,
          owner: owner,
        });
        logger.info(
          `User with id ${id} logged in a shop with id: ${SHOP_ID} at ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
        );
      }
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
// access private
// desc list all shops
// route /shops/al

const getallshops = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth;
  try {
    const user = await USER.findById(id);
    if (
      !(
        user.role === "superadmin" ||
        process.env.role.toString() === "superadmin"
      )
    ) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
    let owner = false;
    const shop = await SHOPS.findOne({ owner: id });
    if ((id === shop.owner, toString())) {
      const token = generateToken(shop._id);
      owner = true;
      const totalCount = await SHOPS.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);
      const shops = await SHOPS.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        owner: owner,
        data: shops,
        page: page,
        totalPages: totalPages,
      });
      logger.info(
        `shops were fetched by${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      const token = generateToken(shop._id);
      const totalCount = await SHOPS.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);
      const shops = await SHOPS.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        owner: owner,
        data: shops,
        page: page,
        totalPages: totalPages,
      });
      logger.info(
        `shops were fetched by${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    }
  } catch (error) {
    console.log(error);
    throw Object.assign(new Error(`{error}`), { statusCode: error.statusCode });
  }
});
// access public
// desc list all shops
// route /shops/al
const getall = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  try {
    owner = false;
    const totalCount = await SHOPS.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);
    const shops = await SHOPS.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json({
      owner: owner,
      data: shops,
      page: page,
      totalPages: totalPages,
    });

    logger.info(
      `shops were fetched  - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.log(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//desc get a shop owbers product
//acess private
//rouyte
const getallshopone = asynchandler(async (req, res) => {
  let page = parseInt(req.query.page) || 1;

  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth; // Assuming you are passing userId as a route parameter
  if (!id)
    throw Object.assign(new Error("Not authorized"), { statusCode: 401 });

  try {
    const totalCount = await SHOPS.countDocuments({ owner: id }); // Assuming user field represents the user's ID
    const totalPages = Math.ceil(totalCount / pageSize);
    const shops = await SHOPS.find({ owner: id })
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
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: shops,
      page: page,
      totalPages: totalPages,
    });
    logger.info(
      `user with id ${id},fectched all his products - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    console.log(error);
    throw Object.assign(new Error("Not authorized"), {
      statusCode: error.statusCode,
    });
  }
});

// Controller function to update a shop
//route /user/updateac
//access private
//data updateData
const updateShops = asynchandler(async (req, res) => {
  const { shopId } = req.params; // Get the shop ID from the route parameters
  const clientIp = req.ip;

  const updateData = req.body; // Get the updated data from the request body
  const { id } = req.auth;
  try {
    if (!shopId) {
      throw Object.assign(new Error("shop id is empty"), {
        statusCode: 400,
      });;
    }

    if (!updateData) {
      throw Object.assign(new Error("update data is empty"), {
        statusCode: 400,
      });;
    }

    const shop = await SHOPS.findById(shopId);

    if (!shop) {
      throw Object.assign(new Error("shop not found"), {
        statusCode: 404,
      });;
    }

    // Check if the authenticated user is the owner of the shop
    if (
      !(
        shop.owner.toString() === id ||
        process.env.role.toString() === "superadmin"
      )
    ) {
      throw Object.assign(new Error("not authorized"), {
        statusCode: 403,
      });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);

      if (!result || !result.secure_url) {
        throw Object.assign(new Error("failed to upload shops"), {
          statusCode: 500,
        });
      }

      updateData.image = result.secure_url;
    }

    const updatedShop = await SHOPS.findByIdAndUpdate(shopId, updateData, {
      new: true, // Return the updated shop document
    });


    if (!updatedShop) {
      throw Object.assign(new Error("error updating shop"), {
        statusCode: 404,
      });;
    }

    const location = await getLocation(clientIp);
    const workingHours = await working_hours.findOne({
      shopId: shopId,
    });
    const token = generateToken(id);
    res.status(202).header("Authorization", `Bearer ${token}`).json({
      successful: true,
      data: updatedShop,
      workingHours: workingHours,
    });

    logger.info(
      `User with id ${id} updated shop with id: ${shopId} at ${updatedShop.updatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
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
      throw Object.assign(new Error("Working hours ID is empty"), {
        statusCode: 400,
      });
    }

    if (!req.body) {
      throw Object.assign(new Error("Required fields can not be empty"), {
        statusCode: 400,
      });
    }

    const workingHours = await working_hours.findOne({ shopId: shopId });

    if (!workingHours) {
      throw Object.assign(new Error("working hours not found"), {
        statusCode: 404,
      });
    }
    // Check if the authenticated user is the owner of the associated shop
    const shop = await SHOPS.findById(shopId);
    if (
      !(
        shop.owner.toString() === id ||
        process.env.role.toString() === "superadmin"
      )
    ) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
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
      throw Object.assign(new Error("Error updating hours"), {
        statusCode: 500,
      });
    }

    const location = await getLocation(clientIp);
    const token = generateToken(id);
    res.status(202).header("Authorization", `Bearer ${token}`).json({
      successful: true,
      data: updatedWorkingHours,
    });

    logger.info(
      `User with id ${id} updated working hours with id: ${shopId} at ${updatedWorkingHours.updatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
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
//update shopowner
//access private
const updateapproval = asynchandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { id } = req.auth;
    const { shopId } = req.params;
    const { status } = req.body;
    const shop = await SHOPS.findById(shopId);
    const user = await USER.findById(id);
    if (
      !(
        shop.owner.toString() === id ||
        process.env.role.toString() === "superadmin" ||
        user.role === "superadmin"
      )
    )
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
    const updatedUser = await SHOPS.findByIdAndUpdate(
      shopId,
      { $set: { approved: status } },
      { new: true }
    );

    if (!updatedUser) {
      throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    }
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: updatedUser,
    });
    logger.info(
      `shop with id ${shopId} was updated by user with id ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    console.log(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
//update subscription
//access private
const updatesubscription = asynchandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { id } = req.auth;
    const { shopId } = req.params;
    const { status } = req.body;
    const shop = await SHOPS.findById(shopId);
    const user = await USER.findById(id);
    if (
      !(
        shop.owner.toString() === id ||
        process.env.role.toString() === "superadmin" ||
        user.role === "superadmin"
      )
    )
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
    const updatedUser = await SHOPS.findByIdAndUpdate(
      shopId,
      { $set: { subscribed: status } },
      { new: true }
    );

    if (!updatedUser) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: updatedUser,
    });
    logger.info(
      `admin with id ${id}, updated shop with id ${shopId} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
//update subscription
//access private
const updateavalability = asynchandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { id } = req.auth;
    const { shopId } = req.params;
    const { status } = req.body;
    const shop = await SHOPS.findById(shopId);
    const user = await USER.findById(id);
    if (
      !(
        shop.owner.toString() === id ||
        process.env.role.toString() === "superadmin" ||
        user.role === "superadmin"
      )
    )
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });

    const updatedUser = await SHOPS.findByIdAndUpdate(
      shopId,
      { $set: { avalabilty: status } },
      { new: true }
    );

    if (!updatedUser) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: updatedUser,
    });
    logger.info(
      `admin with id ${id}, updated shop with id ${shopId} avalability - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});
const searchShops = asynchandler(async (req, res) => {
  const query = req.query.query;
  try {
    const shopResults = await SHOPS.find({ $text: { $search: query } }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      data: shopResults,
    });

    logger.info(
      `Shop search results fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

// Controller for updating services offered
const updateServices = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { shopId } = req.params;
    const { services } = req.body;
    if (id !== shop.owner)
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
    if (!servicesOffered || !Array.isArray(servicesOffered)) {
      throw Object.assign(new Error("Invalid data"), { statusCode: 422 });
    }

    const updatedShop = await SHOPS.findByIdAndUpdate(
      shopId,
      { $set: { servicesOffered: services.split(",") } },
      { new: true }
    );

    if (!updatedShop) {
      throw Object.assign(new Error("No shops found"), { statusCode: 404 });
    }

    const token = generateToken(updatedShop.owner);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: updatedShop,
    });

    logger.info(
      `Services for shop with id: ${shopId} updated by user with id ${req.auth.id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: 404 });
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
  updateapproval,
  updatesubscription,
  searchShops,
  getshop,
  getall,
  updateavalability,
  updateServices,
};
