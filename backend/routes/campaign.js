const express = require("express");
const Router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  createCrowdfunding,
  contributeToCrowdfunding,
  getCrowdfundingsForUser,
  getContributionForUser,
  getAllCrowdfundingsWithContributorsforadmin,
  getCampaignDetails,
  getCampaignDetailsWithoutContributors,
  getallCampaignDetailsWithoutContributors,
} = require("../controller/payment/contribution.controller");

// //access private
Router.route("/create").post(protect, createCrowdfunding);

// //ccess public
Router.route("/getall").get(getallCampaignDetailsWithoutContributors);
// //ccess public
Router.route("/one/:crowdfundingId").get(
  getCampaignDetailsWithoutContributors
);

// //ccess private
Router.route("/user/:userId").get(protect, getCrowdfundingsForUser);
// //ccess private
Router.route("/details/:crowdfundingId").get(protect, getCampaignDetails);
// //ccess private
Router.route("/contributions/:userId").get(protect, getContributionForUser);
//admin
Router.route("/admin").get(protect, getAllCrowdfundingsWithContributorsforadmin);

// //access private
Router.route("/contribute/:crowdfundingId").put(
  protect,
  contributeToCrowdfunding
);
//access private

module.exports = Router;
