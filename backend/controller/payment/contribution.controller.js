const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const Crowdfunding = require("../../model/payment/contribution");
const booking = require("../../model/payment/subscription");
const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");

//create campain
const createCrowdfunding = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    const { campaignName, goalAmount, description, startDate, endDate } =
      req.body;

    const newCrowdfunding = await Crowdfunding.create({
      campaignName,
      organizer: user._id,
      organizer_name: user.userName,
      goalAmount,
      description,
      startDate,
      endDate,
    });

    if (!newCrowdfunding) {
      throw Object.assign(new Error("Failed to create campaign"), {
        statusCode: 500,
      });
    }

    const token = generateToken(user._id);
    res.status(201).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: newCrowdfunding,
    });

    logger.info(
      `user with id:${user._id}, create a campaign with id: ${newCrowdfunding._id} with name ${campaignName} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//contribute to funding
const contributeToCrowdfunding = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    const { crowdfundingId } = req.params;
    const { amount } = req.body;

    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    const crowdfunding = await Crowdfunding.findById(crowdfundingId);
    if (!crowdfunding) {
      throw Object.assign(new Error("Crowdfunding not found"), {
        statusCode: 404,
      });
    }
    crowdfunding.contributions.push({
      contributor: user._id,
      contributor_name: user.userName,
      amount,
      contributionDate: new Date(),
    });

    crowdfunding.currentAmount += amount;

    const saved = await crowdfunding.save();
    if (!saved) {
      throw Object.assign(new Error("Failed to save contribution"), {
        statusCode: 500,
      });
    }

    const token = generateToken(user._id);
    res.status(201).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: crowdfunding,
    });

    logger.info(
      `user with id:${user._id} and name ${user.userName}, contributed to a  campaign with id: ${crowdfunding._id} with name ${crowdfunding.campaignName} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//get all campaign for
const getAllCrowdfundingsWithContributorsforadmin = asynchandler(
  async (req, res) => {
    try {
      const { id } = req.auth;
      const user = await USER.findById(id);
      if (!user) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
      }
      if (
        user.role !== "superadmin" &&
        process.env.role.toString() !== "superadmin"
      ) {
        throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
      }
      let allCrowdfundings = await Crowdfunding.find()
        .populate({
          path: "organizer",
          model: "USER",
          select: "firstName userName email number address",
        })
        .populate({
          path: "contributions.contributor",
          model: "USER",
          select: "firstName userName email number address",
        });

      if (!allCrowdfundings) {
        throw Object.assign(new Error("Failed to fetch data"), {
          statusCode: 500,
        });
      }

      const token = generateToken(user._id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        status: "success",
        data: allCrowdfundings,
      });

      logger.info(
        `admin with id:${user._id}, fetched all data - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } catch (error) {
      throw Object.assign(new Error(error.message), { statusCode: 500 });
    }
  }
);

//get all campaign for a user
const getCrowdfundingsForUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { userId } = req.params;
    const user = await USER.findById(id);
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    if (
      id !== userId &&
      user.role !== "superadmin" &&
      process.env.role.toString() !== "superadmin"
    ) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    const crowdfundings = await Crowdfunding.find({ organizer: userId })
      .populate({
        path: "organizer",
        model: "USER",
        select: "firstName userName email number address",
      })
      .populate({
        path: "contributions.contributor",
        model: "USER",
        select: "firstName userName email number address",
      });

    if (!crowdfundings || crowdfundings.length === 0) {
      throw Object.assign(new Error("No campaigns found"), { statusCode: 404 });
    }

    const token = generateToken(user._id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: crowdfundings,
    });

    logger.info(
      `campaign data was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//get all contribution for a user
const getContributionForUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { userId } = req.params;
    const user = await USER.findById(id);
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    if (
      user.role !== "superadmin" &&
      process.env.role.toString() !== "superadmin"
    ) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    const crowdfundings = await Crowdfunding.find({
      contributions: {
        $elemMatch: {
          contributor: userId,
        },
      },
    })
      .populate({
        path: "organizer",
        model: "USER",
        select: "firstName userName email number address",
      })
      .populate({
        path: "contributions.contributor",
        model: "USER",
        select: "firstName userName email number address",
      });

    if (!crowdfundings || crowdfundings.length === 0) {
      throw Object.assign(new Error("No contributions found"), {
        statusCode: 404,
      });
    }

    const token = generateToken(user._id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: crowdfundings,
    });

    logger.info(
      `contribution data was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//get one caontibution
const getCampaignDetails = asynchandler(async (req, res) => {
  try {
    const { crowdfundingId } = req.params;
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    if (user.role !== "superadmin") {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    const crowdfunding = await Crowdfunding.findById(crowdfundingId)
      .populate({
        path: "organizer",
        model: "USER",
        select: "firstName userName email number address",
      })
      .populate({
        path: "contributions.contributor",
        model: "USER",
        select: "firstName userName email number address",
      });

    if (!crowdfunding) {
      throw Object.assign(new Error("Campaign not found"), { statusCode: 404 });
    }

    res.status(200).json({
      status: "success",
      data: crowdfunding,
    });

    logger.info(
      `campaign data with id ${crowdfunding._id} was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//get all campaign for admin

//get capaign without contibutors
const getCampaignDetailsWithoutContributors = asynchandler(async (req, res) => {
  try {
    const { crowdfundingId } = req.params;

    const crowdfunding = await Crowdfunding.findById(crowdfundingId).select(
      "-contributions"
    );

    if (!crowdfunding) {
      throw new Error("campaign not found");
    }

    res.status(200).json({
      status: "success",
      data: crowdfunding,
    });
    logger.info(
      `campaign data with id ${crowdfunding._id} was fetched  - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
//get all campaign without contributors
const getallCampaignDetailsWithoutContributors = asynchandler(
  async (req, res) => {
    try {
      const crowdfunding = await Crowdfunding.find().select("-contributions");

      if (!crowdfunding) {
        throw new Error("campaign not found");
      }

      res.status(200).json({
        status: "success",
        data: crowdfunding,
      });
      logger.info(
        `campaign data  was fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } catch (error) {
      throw Object.assign(new Error(`${error}`), {
        statusCode: error.statusCode,
      });
    }
  }
);

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
  createCrowdfunding,
  contributeToCrowdfunding,
  getAllCrowdfundingsWithContributorsforadmin,
  getCrowdfundingsForUser,
  getContributionForUser,
  getCampaignDetails,
  getCampaignDetailsWithoutContributors,
  getallCampaignDetailsWithoutContributors,
};
