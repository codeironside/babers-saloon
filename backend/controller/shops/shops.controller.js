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
/**
 * @api {post} /register Create Shop
 * @apiName CreateShop
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shop_name Name of the shop.
 * @apiParam {String} shop_address Address of the shop.
 * @apiParam {String} contact_email Contact email of the shop.
 * @apiParam {String} contact_number Contact number of the shop.
 * @apiParam {String} keywords Keywords related to the shop.
 * @apiParam {String} services Services offered by the shop.
 * @apiParam {String} google_maps_place_id Google Maps Place ID of the shop.
 * @apiParam {Number} longitude Longitude of the shop.
 * @apiParam {Array} images Array of image URLs of the shop.
 * @apiParam {String} facebook Facebook page of the shop.
 * @apiParam {String} description Description of the shop.
 * @apiParam {String} website Website of the shop.
 * @apiParam {String} twitter Twitter handle of the shop.
 * @apiParam {String} whatsapp Whatsapp number of the shop.
 * @apiParam {String} instagram Instagram handle of the shop.
 * @apiParam {Number} minimum_price Minimum price of the services offered by the shop.
 * @apiParam {Number} maximum_price Maximum price of the services offered by the shop.
 * @apiParam {Boolean} instant_booking Whether the shop supports instant booking.
 * @apiParam {String} category Category of the shop.
 * @apiParam {String} monday_opening_hours Opening hours on Monday.
 * @apiParam {String} monday_closing_hours Closing hours on Monday.
 * @apiParam {String} tuesday_opening_hours Opening hours on Tuesday.
 * @apiParam {String} tuesday_closing_hours Closing hours on Tuesday.
 * @apiParam {String} wednesday_opening_hours Opening hours on Wednesday.
 * @apiParam {String} wednesday_closing_hours Closing hours on Wednesday.
 * @apiParam {String} thursday_opening_hours Opening hours on Thursday.
 * @apiParam {String} thursday_closing_hours Closing hours on Thursday.
 * @apiParam {String} friday_opening_hours Opening hours on Friday.
 * @apiParam {String} friday_closing_hours Closing hours on Friday.
 * @apiParam {String} saturday_opening_hours Opening hours on Saturday.
 * @apiParam {String} saturday_closing_hours Closing hours on Saturday.
 * @apiParam {String} sunday_opening_hours Opening hours on Sunday.
 * @apiParam {String} sunday_closing_hours Closing hours on Sunday.
 *
 * @apiSuccess {Object} shop Created shop object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "shopId",
 *       "name": "shopName",
 *       // other shop fields
 *     }
 *
 * @apiError (400) FieldsEmpty Shop name, address, contact email, contact number, services, Google Maps Place ID, longitude, images, Facebook page, description, website, Twitter handle, Whatsapp number, Instagram handle, minimum price, maximum price, instant booking, category, and opening and closing hours cannot be empty.
 * @apiError (403) NotAuthorized The user is not authorized to create a shop.
 * @apiError (404) UserNotFound The user was not found.
 * @apiError (422) InvalidSubscriptionType The user's subscription type is invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "FieldsEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "error": "InvalidSubscriptionType"
 *     }
 */

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



/**
 * @api {post} /login Login Shop
 * @apiName LoginShop
 * @apiGroup Shop
 *
 * @apiParam {String} SHOP_ID ID of the shop to login.
 *
 * @apiSuccess {Boolean} successful Indicates whether the login was successful.
 * @apiSuccess {Object} data Shop object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true,
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         // other shop fields
 *       }
 *     }
 *
 * @apiError (404) NoShopsFound No shops were found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NoShopsFound"
 *     }
 */
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
/**
 * @api {get} /getone Get Shop
 * @apiName GetShop
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} SHOP_ID ID of the shop to get.
 *
 * @apiSuccess {Boolean} successful Indicates whether the request was successful.
 * @apiSuccess {Object} data Shop object.
 * @apiSuccess {Boolean} owner Indicates whether the user is the owner of the shop.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true,
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         // other shop fields
 *       },
 *       "owner": true,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (401) NotAuthorized The user is not authorized to access this data.
 * @apiError (404) NoShopsFound No shops were found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NoShopsFound"
 *     }
 */

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
/**
 * @api {get} /getall Get All Shops
 * @apiName GetAllShops
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {Number} [page=1] Page number.
 * @apiParam {Number} [pageSize=10] Number of shops per page.
 *
 * @apiSuccess {Boolean} owner Indicates whether the user is the owner of the shop.
 * @apiSuccess {Array} data Array of shop objects.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} totalPages Total number of pages.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "owner": true,
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           // other shop fields
 *         },
 *         // more shop objects
 *       ],
 *       "page": 1,
 *       "totalPages": 10,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (403) NotAuthorized The user is not authorized to access this data.
 * @apiError (404) NoShopsFound No shops were found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NoShopsFound"
 *     }
 */

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
/**
 * @api {get} /all Get All Shops
 * @apiName GetAllShops
 * @apiGroup Shop
 *
 * @apiParam {Number} [page=1] Page number.
 * @apiParam {Number} [pageSize=10] Number of shops per page.
 *
 * @apiSuccess {Boolean} owner Indicates whether the user is the owner of the shop.
 * @apiSuccess {Array} data Array of shop objects.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} totalPages Total number of pages.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "owner": false,
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           // other shop fields
 *         },
 *         // more shop objects
 *       ],
 *       "page": 1,
 *       "totalPages": 10
 *     }
 *
 * @apiError (500) ServerError An error occurred on the server.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ServerError"
 *     }
 */

// desc list all shops
// route /shops/al
const getall = asynchandler(async (req, res) => {
  try {
    const shops = await SHOPS.find();
    res.status(200).json({
      data: shops,
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

//desc get all barbers end point
//access public
//routes /babers
// const getbabers = asynchandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.pageSize) || 10;
//   try {
//     owner = false;
//     const totalCount = await SHOPS.countDocuments();
//     const totalPages = Math.ceil(totalCount / pageSize);
//     const shops = await SHOPS.find({category:"barbers"})
//       .skip((page - 1) * pageSize)
//       .limit(pageSize);
//     res.status(200).json({
//       owner: owner,
//       data: shops,
//       page: page,
//       totalPages: totalPages,
//     });

//     logger.info(
//       `shops were fetched  - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
//     );
//   } catch (error) {
//     console.log(error);
//     throw Object.assign(new Error(`${error}`), {
//       statusCode: error.statusCode,
//     });
//   }
// });

/**
 * @api {get} /getallone Get All Shops for One User
 * @apiName GetAllShopsOne
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {Number} [page=1] Page number.
 * @apiParam {Number} [pageSize=10] Number of shops per page.
 *
 * @apiSuccess {Array} data Array of shop objects owned by the user.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} totalPages Total number of pages.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           // other shop fields
 *         },
 *         // more shop objects
 *       ],
 *       "page": 1,
 *       "totalPages": 10,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (401) NotAuthorized The user is not authorized to access this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 */

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

/**
 * @api {put} /updateS/:shopId Update Shop
 * @apiName UpdateShop
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shopId ID of the shop to update.
 * @apiParam {Object} updateData Data to update.
 *
 * @apiSuccess {Boolean} successful Indicates whether the update was successful.
 * @apiSuccess {Object} data Updated shop object.
 * @apiSuccess {Object} workingHours Working hours of the shop.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 Accepted
 *     {
 *       "successful": true,
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         // other updated shop fields
 *       },
 *       "workingHours": {
 *         "monday": {
 *           "opening": "09:00",
 *           "closing": "17:00"
 *         },
 *         // other days
 *       },
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) ShopIdEmpty Shop ID is empty.
 * @apiError (400) UpdateDataEmpty Update data is empty.
 * @apiError (401) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) ShopNotFound The shop was not found.
 * @apiError (404) ErrorUpdatingShop An error occurred while updating the shop.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "ShopIdEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "UpdateDataEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "ShopNotFound"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "ErrorUpdatingShop"
 *     }
 */

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

    // if (req.file) {
    //   const result = await cloudinary.uploader.upload(req.file.path);

    //   if (!result || !result.secure_url) {
    //     throw Object.assign(new Error("failed to upload shops"), {
    //       statusCode: 500,
    //     });
    //   }

    //   updateData.image = result.secure_url;
    // }

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
/**
 * @api {put} /updateH/:shopId Update Shop Working Hours
 * @apiName UpdateShopWorkingHours
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shopId ID of the shop to update.
 * @apiParam {String} monday_opening_hours Opening hours on Monday.
 * @apiParam {String} monday_closing_hours Closing hours on Monday.
 * @apiParam {String} tuesday_opening_hours Opening hours on Tuesday.
 * @apiParam {String} tuesday_closing_hours Closing hours on Tuesday.
 * @apiParam {String} wednesday_opening_hours Opening hours on Wednesday.
 * @apiParam {String} wednesday_closing_hours Closing hours on Wednesday.
 * @apiParam {String} thursday_opening_hours Opening hours on Thursday.
 * @apiParam {String} thursday_closing_hours Closing hours on Thursday.
 * @apiParam {String} friday_opening_hours Opening hours on Friday.
 * @apiParam {String} friday_closing_hours Closing hours on Friday.
 * @apiParam {String} saturday_opening_hours Opening hours on Saturday.
 * @apiParam {String} saturday_closing_hours Closing hours on Saturday.
 * @apiParam {String} sunday_opening_hours Opening hours on Sunday.
 * @apiParam {String} sunday_closing_hours Closing hours on Sunday.
 *
 * @apiSuccess {Boolean} successful Indicates whether the update was successful.
 * @apiSuccess {Object} data Updated working hours object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 Accepted
 *     {
 *       "successful": true,
 *       "data": {
 *         "shopId": "shopId",
 *         "hours": {
 *           "monday": {
 *             "opening": "09:00",
 *             "closing": "17:00"
 *           },
 *           // other days
 *         },
 *       },
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) WorkingHoursIdEmpty Working hours ID is empty.
 * @apiError (400) RequiredFieldsEmpty Required fields cannot be empty.
 * @apiError (401) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) WorkingHoursNotFound The working hours were not found.
 * @apiError (500) ErrorUpdatingHours An error occurred while updating the working hours.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "WorkingHoursIdEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "RequiredFieldsEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "WorkingHoursNotFound"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ErrorUpdatingHours"
 *     }
 */
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
/**
 * @api {put} /updateapp/:shopId Update Shop Approval Status
 * @apiName UpdateShopApproval
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shopId ID of the shop to update.
 * @apiParam {Boolean} status New approval status.
 *
 * @apiSuccess {Object} data Updated shop object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         "approved": true,
 *         // other updated shop fields
 *       },
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (401) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) NotAUser The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NotAUser"
 *     }
 */

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
/**
 * @api {put} /updatesub/:shopId Update Shop Subscription Status
 * @apiName UpdateShopSubscription
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shopId ID of the shop to update.
 * @apiParam {Boolean} status New subscription status.
 *
 * @apiSuccess {Object} data Updated shop object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         "subscribed": true,
 *         // other updated shop fields
 *       },
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (401) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) UserNotFound The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 */
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
/**
 * @api {put} /updateavb/:shopId Update Shop Availability Status
 * @apiName UpdateShopAvailability
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shopId ID of the shop to update.
 * @apiParam {Boolean} status New availability status.
 *
 * @apiSuccess {Object} data Updated shop object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         "avalabilty": true,
 *         // other updated shop fields
 *       },
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (401) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) UserNotFound The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 */

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

/**
 * @api {get} /search Search Shops
 * @apiName SearchShops
 * @apiGroup Shop
 *
 * @apiParam {String} query Search query.
 *
 * @apiSuccess {Array} data Array of shop objects that match the search query.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           // other shop fields
 *         },
 *         // more shop objects
 *       ]
 *     }
 *
 * @apiError (500) ServerError An error occurred on the server.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ServerError"
 *     }
 */
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

/**
 * @api {put} /updateservices/:shopId Update Shop Services
 * @apiName UpdateShopServices
 * @apiGroup Shop
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} shopId ID of the shop to update.
 * @apiParam {Array} services Array of services offered by the shop.
 *
 * @apiSuccess {String} status Status of the request.
 * @apiSuccess {Object} data Updated shop object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "data": {
 *         "_id": "shopId",
 *         "name": "shopName",
 *         "servicesOffered": ["service1", "service2"],
 *         // other updated shop fields
 *       },
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (401) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) NoShopsFound No shops were found.
 * @apiError (422) InvalidData The provided data is invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NoShopsFound"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "error": "InvalidData"
 *     }
 */
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
