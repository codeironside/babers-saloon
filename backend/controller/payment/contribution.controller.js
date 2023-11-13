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
      throw new Error("user not found");
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
    const token = generateToken(user._id);
    if (newCrowdfunding) {
      res.status(201).header("Authorization", `Bearer ${token}`).json({
        status: "success",
        data: newCrowdfunding,
      });
      logger.info(
        `user with id:${user._id}, create a campaign with id: ${newCrowdfunding._id} with name ${campaignName} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }
  } catch (error) {
    throw new Error(`${error}`);
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
      throw new Error("user not found");
    }
    const crowdfunding = await Crowdfunding.findById(crowdfundingId);
    if (!crowdfunding) throw new Error("Crowdfunding not found");

    crowdfunding.contributors.push({
      user: user._id,
      contributor_name: user.userName,
      amount,
      contributionDate: new Date(),
    });

    crowdfunding.currentAmount += amount;

    const sav = await crowdfunding.save();
    const token = generateToken(user._id);
    if (sav) {
      res.status(201).header("Authorization", `Bearer ${token}`).json({
        status: "success",
        data: crowdfunding,
      });
      logger.info(
        `user with id:${user._id} and name ${user.userName}, contributed to a  campaign with id: ${crowdfunding._id} with name ${crowdfunding.campaignName} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }
  } catch (error) {
    throw new Error(`${error}`);
  }
});
//get all campaign for 
const getAllCrowdfundingsWithContributorsforadmin = asynchandler(
  async (req, res) => {
    try {
        const {id}=req.auth
        const user = await USE.findById(id)
        if(!id){throw new Error('user nt founf')}
        if(user.role !== "superadmin"||process.env.role.toString() !== "superadmin"){throw new Error('not authorized')}
      const allCrowdfundings = await Crowdfunding.find()
      const token = generateToken(user._id)
if(allCrowdfundings){
    res.status(201).header("Authorization",`Bearer ${token}`).json({status: "success",
    data: allCrowdfundings,
  });
  logger.info(
    `admin with id:${user._id}, fecthed all data - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
}
        
    } catch (error) {
      throw new Error("Error");
    }
  }
);
//get all campaign for a user
const getCrowdfundingsForUser = asynchandler(async (req, res) => {try{
    const {id}= req.auth
    const { userId } = req.params;
  const user = await USER.findById(id)
  if(!user){throw new Error('user not found')}
    const crowdfunding= await Crowdfunding.findOne({organizer:id})
    if(!crowdfunding){throw new Error('no campaign yet')}
    if(id !== crowdfunding.organizer||user.role!== 'superadmin'||process.env.role.toString()!=='superadmin'){
        throw new Error('not authorized')
    }
    const crowdfundings = await Crowdfunding.find({organizer: userId })
  const token = generateToken(user._id)
  if(crowdfundings){
    res.status(200).header("Authorization",`Bearer ${token}`).json({status: "success", data: crowdfundings,
});
logger.info(
    `campain data was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  }
   
     
}catch(error){
    throw new Error(`${error}`)
}

  });
//get all contribution for a user
const getContributionForUser = asynchandler(async (req, res) => {try{
    const {id}= req.auth
    const { userId } = req.params;
  const user = await USER.findById(id)
  if(!user){throw new Error('user not found')}
    const crowdfunding= await Crowdfunding.findOne({organizer:id})
    if(!crowdfunding){throw new Error('no campaign yet')}
    if(!user||process.env.role.toString()!=='superadmin'){
        throw new Error('not authorized')
    }
    const crowdfundings = await Crowdfunding.find({'contributions.contributor': userId })
  const token = generateToken(user._id)
  if(crowdfundings){
    res.status(200).header("Authorization",`Bearer ${token}`).json({status: "success", data: crowdfundings,
});
logger.info(
    `contribution data was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );
  }
   
     
}catch(error){
    throw new Error(`${error}`)
}

  });
//get one caontibution 
const getCampaignDetails = asynchandler(async (req, res) => {
    try{
        const { crowdfundingId } = req.params;
  const {id}=req.auth
  const user = await USER.findById(id)
      const crowdfunding = await Crowdfunding.findById(crowdfundingId)
      if(user.role!=='superadmin'||id!==crowdfunding.organizer||process.env.role.toString()!=='superadmin'){
        throw new Error("not authorized")
      }
  
    if (!crowdfunding) {
   throw new Error('campain not found')
    }
  
    res.status(200).json({
      status: 'success',
      data: crowdfunding,
    });
    logger.info(
        `campaign data with id ${crowdfunding._id} was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }catch(error){
        throw new Error(`${error}`)
    }    
  });
  
//get capaign without contibutors
const getCampaignDetailsWithoutContributors = asynchandler(async (req, res) => {
    const { crowdfundingId } = req.params;
  
    const crowdfunding = await Crowdfunding.findById(crowdfundingId).select('-contributors');
  
    if (!crowdfunding) {
throw new Error('campaign not found')
    }
  
    res.status(200).json({
      status: 'success',
      data: crowdfunding,
    });
    logger.info(
        `campaign data with id ${crowdfunding._id} was fetched  - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      )
  });
  //get all campaign without contributors
const getallCampaignDetailsWithoutContributors = asynchandler(async (req, res) => {
    const { crowdfundingId } = req.params;
  
    const crowdfunding = await Crowdfunding.find().select('-contributors');
  
    if (!crowdfunding) {
throw new Error('campaign not found')
    }
  
    res.status(200).json({
      status: 'success',
      data: crowdfunding,
    });
    logger.info(
        `campaign data  was fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      )
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

module.exports={
    createCrowdfunding,
    contributeToCrowdfunding,getAllCrowdfundingsWithContributorsforadmin,getCrowdfundingsForUser,
    getContributionForUser,
    getCampaignDetails,
    getCampaignDetailsWithoutContributors,
    getallCampaignDetailsWithoutContributors
}
