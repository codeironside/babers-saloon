const express = require("express");
const Router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  createCrowdfunding,
  contributeToCrowdfunding,
  getAllCrowdfundingsWithContributorsforadmin,
  getCrowdfundingsForUser,
  getContributionForUser,
  getCampaignDetails,
  getCampaignDetailsWithoutContributors,
  getallCampaignDetailsWithoutContributors,
} = require("../controller/payment/contribution.controller");

// //access private
Router.route("/create").post(protect, createCrowdfunding);

// //ccess public
Router.route("/getall").get(protect, getallCampaignDetailsWithoutContributors);
// //ccess public
Router.route("/getall/:crowdfundingId").get(
  protect,
  getCampaignDetailsWithoutContributors
);
// //ccess private
Router.route("/getone").get(
  protect,
  getAllCrowdfundingsWithContributorsforadmin
);
// //ccess private
Router.route("/getone/:userId").get(protect, getCrowdfundingsForUser);
// //ccess private
Router.route("/getone/:crowdfundingId").get(protect, getCampaignDetails);
// //ccess private
Router.route("/getone/:userId").get(protect, getContributionForUser);

// //access private
Router.route("/updatebooking/:crowdfundingId").put(
  protect,
  contributeToCrowdfunding
);
//access private

module.exports = Router;
