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
const mongoose = require('mongoose');
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

    crowdfunding.currentAmount += Number(amount);


    const saved = await crowdfunding.save();
    if (!saved) {
      throw Object.assign(new Error("Failed to save contribution"), {
        statusCode: 500,
      });
    }
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.email,
//         pass: process.env.password,
//       },
//     });
  
//     const html = `
//     <!DOCTYPE html>
// <html>
// <head>
//   <style>
//     /* Set the body background to the image */
//     body {
//       background-image:url('https://img.freepik.com/free-photo/front-view-stacked-books-graduation-cap-open-book-education-day_23-2149241017.jpg?w=740&t=st=1672839251~exp=1672839851~hmac=250a8619cf050e204e19f685163952c48a928f250756df0e7e70c93e889369da') ;
//       background-size: cover;
//       background-repeat: no-repeat;
//       font-family: sans-serif;
//       color: white;
//       text-align: center;
//       padding: 50px;
//     }

//     /* Style the header */
//     h1 {
//         color:red;
//       font-size: 48px;
//       margin-bottom: 20px;
//       text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
//     }

//     /* Style the message */
//     .class{
//       font-size: 28px;
//       font-family:comic-sans;
//       font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
//       margin-bottom: 20px;
//       text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
//     }
//     .class1{
//       font-size: 20px;
//       font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
//       margin-bottom: 20px;
//       text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
//     }
//     .center{
//       justify-content:center;
//       align-self: flex-start;
//       font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
//       font-size: 17px;
//       color: rgba(17, 17, 17, 0.87);
//       font-weight: bold;
//       text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5)
//     }

//     /* Style the button */
//     .button {
//       display: inline-block;
//       background-color: #3498db;
//       color: white;
//       padding: 15px 30px;
//       border-radius: 5px;
//       text-decoration: none;
//       font-size: 18px;
//       text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
//     }
//   </style>
// </head>

// <body><h1>Welcome to RMS</h1>
//   <p class="class">Dear ${firstName} with id: ${id}.</p>,

//  <div class="center"> <p class="class1">Welcome to RMS</p><br>
 
//  I hope this email finds you well. On behalf of the entire team, I would like to extend a warm welcome to our restaurant platform. We are thrilled to have you as a new member of our team and are excited to embark on this journey together.<br>

// Your registration on the platform marks the beginning of an exciting chapter, and we are confident that your skills and expertise will make a valuable contribution to our restaurant's success. We believe that your presence will help us continue to provide exceptional service and unforgettable dining experiences to our valued customers.<br>

// As you settle into your role, you can expect a supportive and friendly work environment. Our team is dedicated to ensuring that every member feels included, valued, and empowered to thrive. Should you have any questions or need assistance, please don't hesitate to reach out to your manager or any of your colleagues.<br>

// In the coming days, you will receive further information about your specific duties, training sessions, and schedules. We encourage you to familiarize yourself with our platform and our restaurant's mission, values, and service standards.<br>

// <p>We want to emphasize the importance of maintaining the security of your login details. Your account credentials are vital for accessing our platform and performing your duties effectively. Ensuring the confidentiality of these details helps protect sensitive information and maintains the overall security of our system.</p>
// <h1>Security Guidelines for Login Details</h1>
// <h2>To keep your login details safe, we kindly request that you adhere to the following guidelines:</h2>
// <ul>
// <li><strong>Never Share Your Login Information:</strong> 
// Your login credentials are unique to you, and they should never be shared with anyone, including colleagues or friends. Our system is designed to grant appropriate access based on individual accounts, and sharing credentials poses a significant security risk.</li>
// <li><strong>Beware of Phishing Attempts:</strong> Be cautious of any emails or messages requesting your login credentials. Legitimate organizations, including ours, will never ask you to share sensitive information through email or other messaging platforms.</li>
// <li><strong>Log Out When Not in Use:</strong> Always log out of the platform when you are not actively using it, especially if you are using a shared or public computer.</li>
// <li><strong>Inform Management of Any Suspicious Activity:</strong> If you notice any unusual activity related to your account or suspect a security breach, please report it immediately to your manager or our IT department.</li>
// </ul>

// <p>We take the security and privacy of our employees seriously, and these measures are in place to protect both you and our organization from potential security risks.</p>
// Once again, welcome aboard! We are truly delighted to have you as part of our team and are looking forward to achieving great success together.<br>

// If you have any questions before your first day, please feel free to contact Emmanuel Asoba at asomba505@gmail.com or +2348164975474.<br>
// Thank you for joining RMS. We look forward to your contributions to our platform!<br>
// <p class="center">Best regards,<br></p> 
// <p class="center">The RMS team<br></p>
// <p class="center">Oluwatobi Ayoola jolaosho<br></p> 
// <p class="center">Backend developer<br></p> 
// <p class="center">Contact Information: fury25423@gmail.com and 09038745017<br></p> 
  


  
// </body>
// </html>
//   `;
  
//     const mailOptions = {
//       from: process.env.email,
//       to: email,
//       subject: `your c, ${lastName} `,
//       html: html,
//     };
  
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log(error);
//         throw new Error("email not sent");
//       } else {
//         console.log("Email sent: " + info.response);

//         // const token = generateToken(user._id);
//         // res.status(201).header("Authorization", `Bearer ${token}`).json({
//         //   status: "success",
//         //   data: crowdfunding,
//         // });
    
//         // logger.info(
//         //   `user with id:${user._id} and name ${user.userName}, contributed to a  campaign with id: ${crowdfunding._id} with name ${crowdfunding.campaignName} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
//         // );
//     }
//   })
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
      user.role !== "superadmin" 
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
    const user = await USER.findById(userId);
    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    if (
      user.role !== "superadmin" &&
      id !== user._id.toString()
    ) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
    const objectI = new mongoose.Types.ObjectId(userId);
    try{
    const crowdfundings = await Crowdfunding.find({
      contributions: {
        $elemMatch: {
          contributor:objectI,
        },
      },
    }).populate({
        path: "organizer",
        model: "USER",
        select: "firstName userName email number address",
      }).populate({
        path: "contributions.contributor",
        model: "USER",
        select: "firstName userName email number address",
      });
      // if (!crowdfundings || crowdfundings.length === 0) {

      // }
  
      const token = generateToken(user._id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        data: crowdfundings,
      });
  
      logger.info(
        `contribution data was fetched by ${user._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );}catch(error){
        throw Object.assign(new Error("No contributions found"), {
          statusCode: 404,
        });
      }

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
