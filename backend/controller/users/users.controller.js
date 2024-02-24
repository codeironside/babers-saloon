const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const COMMENT = require("../../model/blogs/comments");
const BLOGS = require("../../model/blogs/blog");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const BOOKING = require("../../model/payment/booking");

const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");
/**
 * @api {post} /login Login User
 * @apiName LoginUser
 * @apiGroup User
 *
 * @apiParam {String} email User's email.
 * @apiParam {String} password User's password.
 *
 * @apiSuccess {Object} userWithoutPassword User object without password.
 * @apiSuccess {Number} referralCount Number of users referred by the user.
 * @apiSuccess {Array} referredUsers Array of users referred by the user.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "userWithoutPassword": {
 *         "_id": "userId",
 *         "email": "user@example.com",
 *         // other user fields
 *       },
 *       "referralCount": 5,
 *       "referredUsers": [
 *         // array of user objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) FieldsEmpty Email and password cannot be empty.
 * @apiError (401) InvalidCredentials The provided credentials are invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "FieldsEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "InvalidCredentials"
 *     }
 */

const login_users = asynchandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }
    const user = await USER.findOne({ email: email });
    // console.log(user);
    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const appointments = await BOOKING.find({ user: user._id });
      const bum = await BLOGS.find({ owner_id: user._id });
      const referralCount = referredUsers.length;
      const appointmentCount = appointments.length;
      const blogCount = bum.length;
      // console.log(blogCount);
      const token = generateToken(user._id);
      const userWithoutPassword = await USER.findById(user.id).select(
        "-password"
      );
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          ...userWithoutPassword._doc,
          referralCount,
          appointmentCount,
          blogCount,
          referredUsers,
        });
      logger.info(
        `user with id ${
          user._id
        } logged in at ${currentDateTimeWAT.toString()} - ${res.statusCode} - ${
          res.statusMessage
        } - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } else {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {post} /register Register User
 * @apiName RegisterUser
 * @apiGroup User
 *
 * @apiParam {String} firstName User's first name.
 * @apiParam {String} middleName User's middle name.
 * @apiParam {String} lastName User's last name.
 * @apiParam {String} email User's email.
 * @apiParam {String} password User's password.
 * @apiParam {String} userName User's username.
 * @apiParam {String} phoneNumber User's phone number.
 * @apiParam {String} referralCode Referral code of the user who referred this user.
 * @apiParam {String} pictureUrl URL of the user's picture.
 *
 * @apiSuccess {Object} userWithoutPassword User object without password.
 * @apiSuccess {Number} referralCount Number of users referred by the user.
 * @apiSuccess {Array} referredUsers Array of users referred by the user.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 Accepted
 *     {
 *       "userWithoutPassword": {
 *         "_id": "userId",
 *         "email": "user@example.com",
 *         // other user fields
 *       },
 *       "referralCount": 5,
 *       "referredUsers": [
 *         // array of user objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) FieldsEmpty First name, last name, email, password, username, and phone number cannot be empty.
 * @apiError (409) UserExists User already exists.
 * @apiError (409) UserNameExists Username already exists.
 * @apiError InvalidReferralCode The provided referral code is invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "FieldsEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "error": "UserExists"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "error": "UserNameExists"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "InvalidReferralCode"
 *     }
 */
const register_users = asynchandler(async (req, res) => {
  try {
    const ip = req.ip;
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      userName,
      phoneNumber,
      referralCode,
      pictureUrl,
      state,
      city,
      county,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !userName ||
      !phoneNumber
    ) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }

    const findEmail = await USER.findOne({ email: email });
    if (findEmail) {
      throw Object.assign(new Error("User already exists"), {
        statusCode: 409,
      });
    }

    const exist = await USER.findOne({ userName: userName });
    if (exist)
      throw Object.assign(new Error("User Name already exists"), {
        statusCode: 409,
      });
    let referredUsers = [];

    if (referralCode) {
      const referrer = await USER.findOne({ referCode: referralCode });
      if (!referrer) {
        throw new Error("Invalid referral code");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const createUsers = await USER.create({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        userName,
        phoneNumber,
        pictureUrl,
        referredBy: referralCode,
        state,
        city,
        county,
      });

      const codeOne = createUsers._id.toString().slice(2, 9);
      const codeTwo = firstName.toString().slice(0, 3);
      const codeThree = firstName.toString().slice(0, 2);
      const codeFour = userName.toString().slice(0, 2);
      const referrerCode = `REF-${codeOne}${codeTwo}${codeThree}${codeFour}${codeTwo}`;
      const token = generateToken(createUsers._id);
      const updateReferral = await USER.findByIdAndUpdate(
        createUsers._id,
        { $set: { referCode: referrerCode, token: token } },
        { new: true }
      );
      if (updateReferral) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.email,
            pass: process.env.password,
          },
        });

        const html = `
        <!DOCTYPE html
        PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta content="width=device-width, initial-scale=1" name="viewport">
        <meta name="x-apple-disable-message-reformatting">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="telephone=no" name="format-detection">
        <title>New Template</title>
       
        <style type="text/css">
            #outlook a {
                padding: 0;
            }
    
            .es-button {
                mso-style-priority: 100 !important;
                text-decoration: none !important;
            }
    
            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }
    
            .es-desk-hidden {
                display: none;
                float: left;
                overflow: hidden;
                width: 0;
                max-height: 0;
                line-height: 0;
                mso-hide: all;
            }
    
            @media only screen and (max-width:600px) {
    
                p,
                ul li,
                ol li,
                a {
                    line-height: 150% !important
                }
    
                h1,
                h2,
                h3,
                h1 a,
                h2 a,
                h3 a {
                    line-height: 120%
                }
    
                h1 {
                    font-size: 36px !important;
                    text-align: left
                }
    
                h2 {
                    font-size: 26px !important;
                    text-align: left
                }
    
                h3 {
                    font-size: 20px !important;
                    text-align: left
                }
    
                .es-header-body h1 a,
                .es-content-body h1 a,
                .es-footer-body h1 a {
                    font-size: 36px !important;
                    text-align: left
                }
    
                .es-header-body h2 a,
                .es-content-body h2 a,
                .es-footer-body h2 a {
                    font-size: 26px !important;
                    text-align: left
                }
    
                .es-header-body h3 a,
                .es-content-body h3 a,
                .es-footer-body h3 a {
                    font-size: 20px !important;
                    text-align: left
                }
    
                .es-menu td a {
                    font-size: 12px !important
                }
    
                .es-header-body p,
                .es-header-body ul li,
                .es-header-body ol li,
                .es-header-body a {
                    font-size: 14px !important
                }
    
                .es-content-body p,
                .es-content-body ul li,
                .es-content-body ol li,
                .es-content-body a {
                    font-size: 16px !important
                }
    
                .es-footer-body p,
                .es-footer-body ul li,
                .es-footer-body ol li,
                .es-footer-body a {
                    font-size: 14px !important
                }
    
                .es-infoblock p,
                .es-infoblock ul li,
                .es-infoblock ol li,
                .es-infoblock a {
                    font-size: 12px !important
                }
    
                *[class="gmail-fix"] {
                    display: none !important
                }
    
                .es-m-txt-c,
                .es-m-txt-c h1,
                .es-m-txt-c h2,
                .es-m-txt-c h3 {
                    text-align: center !important
                }
    
                .es-m-txt-r,
                .es-m-txt-r h1,
                .es-m-txt-r h2,
                .es-m-txt-r h3 {
                    text-align: right !important
                }
    
                .es-m-txt-l,
                .es-m-txt-l h1,
                .es-m-txt-l h2,
                .es-m-txt-l h3 {
                    text-align: left !important
                }
    
                .es-m-txt-r img,
                .es-m-txt-c img,
                .es-m-txt-l img {
                    display: inline !important
                }
    
                .es-button-border {
                    display: inline-block !important
                }
    
                a.es-button,
                button.es-button {
                    font-size: 20px !important;
                    display: inline-block !important
                }
    
                .es-adaptive table,
                .es-left,
                .es-right {
                    width: 100% !important
                }
    
                .es-content table,
                .es-header table,
                .es-footer table,
                .es-content,
                .es-footer,
                .es-header {
                    width: 100% !important;
                    max-width: 600px !important
                }
    
                .es-adapt-td {
                    display: block !important;
                    width: 100% !important
                }
    
                .adapt-img {
                    width: 100% !important;
                    height: auto !important
                }
    
                .es-m-p0 {
                    padding: 0 !important
                }
    
                .es-m-p0r {
                    padding-right: 0 !important
                }
    
                .es-m-p0l {
                    padding-left: 0 !important
                }
    
                .es-m-p0t {
                    padding-top: 0 !important
                }
    
                .es-m-p0b {
                    padding-bottom: 0 !important
                }
    
                .es-m-p20b {
                    padding-bottom: 20px !important
                }
    
                .es-mobile-hidden,
                .es-hidden {
                    display: none !important
                }
    
                tr.es-desk-hidden,
                td.es-desk-hidden,
                table.es-desk-hidden {
                    width: auto !important;
                    overflow: visible !important;
                    float: none !important;
                    max-height: inherit !important;
                    line-height: inherit !important
                }
    
                tr.es-desk-hidden {
                    display: table-row !important
                }
    
                table.es-desk-hidden {
                    display: table !important
                }
    
                td.es-desk-menu-hidden {
                    display: table-cell !important
                }
    
                .es-menu td {
                    width: 1% !important
                }
    
                table.es-table-not-adapt,
                .esd-block-html table {
                    width: auto !important
                }
    
                table.es-social {
                    display: inline-block !important
                }
    
                table.es-social td {
                    display: inline-block !important
                }
    
                .es-m-p5 {
                    padding: 5px !important
                }
    
                .es-m-p5t {
                    padding-top: 5px !important
                }
    
                .es-m-p5b {
                    padding-bottom: 5px !important
                }
    
                .es-m-p5r {
                    padding-right: 5px !important
                }
    
                .es-m-p5l {
                    padding-left: 5px !important
                }
    
                .es-m-p10 {
                    padding: 10px !important
                }
    
                .es-m-p10t {
                    padding-top: 10px !important
                }
    
                .es-m-p10b {
                    padding-bottom: 10px !important
                }
    
                .es-m-p10r {
                    padding-right: 10px !important
                }
    
                .es-m-p10l {
                    padding-left: 10px !important
                }
    
                .es-m-p15 {
                    padding: 15px !important
                }
    
                .es-m-p15t {
                    padding-top: 15px !important
                }
    
                .es-m-p15b {
                    padding-bottom: 15px !important
                }
    
                .es-m-p15r {
                    padding-right: 15px !important
                }
    
                .es-m-p15l {
                    padding-left: 15px !important
                }
    
                .es-m-p20 {
                    padding: 20px !important
                }
    
                .es-m-p20t {
                    padding-top: 20px !important
                }
    
                .es-m-p20r {
                    padding-right: 20px !important
                }
    
                .es-m-p20l {
                    padding-left: 20px !important
                }
    
                .es-m-p25 {
                    padding: 25px !important
                }
    
                .es-m-p25t {
                    padding-top: 25px !important
                }
    
                .es-m-p25b {
                    padding-bottom: 25px !important
                }
    
                .es-m-p25r {
                    padding-right: 25px !important
                }
    
                .es-m-p25l {
                    padding-left: 25px !important
                }
    
                .es-m-p30 {
                    padding: 30px !important
                }
    
                .es-m-p30t {
                    padding-top: 30px !important
                }
    
                .es-m-p30b {
                    padding-bottom: 30px !important
                }
    
                .es-m-p30r {
                    padding-right: 30px !important
                }
    
                .es-m-p30l {
                    padding-left: 30px !important
                }
    
                .es-m-p35 {
                    padding: 35px !important
                }
    
                .es-m-p35t {
                    padding-top: 35px !important
                }
    
                .es-m-p35b {
                    padding-bottom: 35px !important
                }
    
                .es-m-p35r {
                    padding-right: 35px !important
                }
    
                .es-m-p35l {
                    padding-left: 35px !important
                }
    
                .es-m-p40 {
                    padding: 40px !important
                }
    
                .es-m-p40t {
                    padding-top: 40px !important
                }
    
                .es-m-p40b {
                    padding-bottom: 40px !important
                }
    
                .es-m-p40r {
                    padding-right: 40px !important
                }
    
                .es-m-p40l {
                    padding-left: 40px !important
                }
    
                .es-desk-hidden {
                    display: table-row !important;
                    width: auto !important;
                    overflow: visible !important;
                    max-height: inherit !important
                }
            }
    
            @media screen and (max-width:384px) {
                .mail-message-content {
                    width: 414px !important
                }
            }
        </style>
    </head>
    
    <body
        style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
        <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FAFAFA">
            
            <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none"
                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
                <tr>
                    <td valign="top" style="padding:0;Margin:0">
                        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                            <tr>
                                <td class="es-info-area" align="center" style="padding:0;Margin:0">
                                    <table class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"
                                        bgcolor="#FFFFFF" role="none">
                                        <tr>
                                            <td align="left" style="padding:20px;Margin:0">
                                                <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                    <tr>
                                                        <td align="center" valign="top"
                                                            style="padding:0;Margin:0;width:560px">
                                                            <table cellpadding="0" cellspacing="0" width="100%"
                                                                role="presentation"
                                                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                <tr>
                                                                    <td align="center" class="es-infoblock"
                                                                        style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC">
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px">
                                                                            UniverSoul Barbers!<br></p>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <table cellpadding="0" cellspacing="0" class="es-header" align="center" role="none"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                            <tr>
                                <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0"
                                        cellspacing="0" role="none"
                                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px">
                                        <tr>
                                            <td align="left"
                                                style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px">
                                                <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                    <tr>
                                                        <td class="es-m-p0r" valign="top" align="center"
                                                            style="padding:0;Margin:0;width:560px">
                                                            <table cellpadding="0" cellspacing="0" width="100%"
                                                                role="presentation"
                                                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding:0;Margin:0;font-size:0px"><img
                                                                            class="adapt-img"
                                                                            src="https://feorsom.stripocdn.email/content/guids/CABINET_f71dfa6fe2663f9d985a20b64c2da57d673dcd41293867eee9659ce22a0c5741/images/logo_mNo.png"
                                                                            alt
                                                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                            width="40" height="42"></td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding:0;Margin:0;padding-bottom:20px;font-size:0px">
                                                                        <img src="https://feorsom.stripocdn.email/content/guids/CABINET_f71dfa6fe2663f9d985a20b64c2da57d673dcd41293867eee9659ce22a0c5741/images/universoul.png"
                                                                            alt="Logo"
                                                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;font-size:12px"
                                                                            width="200" title="Logo" height="26"></td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                            <tr>
                                <td align="center" style="padding:0;Margin:0">
                                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0"
                                        cellspacing="0" role="none"
                                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                                        <tr>
                                            <td align="left"
                                                style="Margin:0;padding-left:20px;padding-right:20px;padding-top:30px;padding-bottom:30px">
                                                <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                    <tr>
                                                        <td align="center" valign="top"
                                                            style="padding:0;Margin:0;width:560px">
                                                            <table cellpadding="0" cellspacing="0" width="100%"
                                                                role="presentation"
                                                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px;font-size:0px">
                                                                        <img src="https://feorsom.stripocdn.email/content/guids/CABINET_67e080d830d87c17802bd9b4fe1c0912/images/55191618237638326.png"
                                                                            alt
                                                                            style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                                                            width="100" height="72"></td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center" class="es-m-txt-c"
                                                                        style="padding:0;Margin:0;padding-bottom:10px">
                                                                        <h1
                                                                            style="Margin:0;line-height:46px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:46px;font-style:normal;font-weight:bold;color:#333333">
                                                                            Confirm Your Email</h1>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center" class="es-m-p0r es-m-p0l"
                                                                        style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                                                            You’ve received this message because your email
                                                                            address has been registered with our site.
                                                                            Please click the button below to verify your
                                                                            email address and confirm that you are the owner
                                                                            of this account.</p>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding:0;Margin:0;padding-bottom:5px;padding-top:10px">
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                                                            If you did not register with us, please
                                                                            disregard this email.</p>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                                                <span class="es-button-border" style="border-style:solid;border-color:#2CB543;background:#d5bb6a;border-width:0px;display:inline-block;border-radius:6px;width:auto">
                                                                  <a href="http://yourwebsite.com/confirm/${token}" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;padding:10px 30px 10px 30px;display:inline-block;background:#d5bb6a;border-radius:6px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';font-weight:normal;font-style:normal;line-height:17px;width:auto;text-align:center;mso-padding-alt:0;mso-border-alt:10px solid #d5bb6a;padding-left:30px;padding-right:30px">
                                                                    CONFIRM YOUR EMAIL
                                                                  </a>
                                                                </span>
                                                              </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center" class="es-m-p0r es-m-p0l"
                                                                        style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:40px;padding-right:40px">
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                                                            Once confirmed, this email will be uniquely
                                                                            associated with your account.</p>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <table cellpadding="0" cellspacing="0" class="es-footer" align="center" role="none"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                            <tr>
                                <td align="center" style="padding:0;Margin:0">
                                    <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0"
                                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:640px"
                                        role="none">
                                        <tr>
                                            <td align="left"
                                                style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px">
                                                <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                    <tr>
                                                        <td align="left" style="padding:0;Margin:0;width:600px">
                                                            <table cellpadding="0" cellspacing="0" width="100%"
                                                                role="presentation"
                                                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px;font-size:0">
                                                                        <table cellpadding="0" cellspacing="0"
                                                                            class="es-table-not-adapt es-social"
                                                                            role="presentation"
                                                                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                            <tr>
                                                                                <td align="center" valign="top"
                                                                                    style="padding:0;Margin:0;padding-right:40px">
                                                                                    <img title="Facebook"
                                                                                        src="https://feorsom.stripocdn.email/content/assets/img/social-icons/logo-black/facebook-logo-black.png"
                                                                                        alt="Fb" width="32" height="32"
                                                                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                                                </td>
                                                                                <td align="center" valign="top"
                                                                                    style="padding:0;Margin:0;padding-right:40px">
                                                                                    <img title="Twitter"
                                                                                        src="https://feorsom.stripocdn.email/content/assets/img/social-icons/logo-black/twitter-logo-black.png"
                                                                                        alt="Tw" width="32" height="32"
                                                                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                                                </td>
                                                                                <td align="center" valign="top"
                                                                                    style="padding:0;Margin:0;padding-right:40px">
                                                                                    <img title="Instagram"
                                                                                        src="https://feorsom.stripocdn.email/content/assets/img/social-icons/logo-black/instagram-logo-black.png"
                                                                                        alt="Inst" width="32" height="32"
                                                                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                                                </td>
                                                                                <td align="center" valign="top"
                                                                                    style="padding:0;Margin:0"><img
                                                                                        title="Youtube"
                                                                                        src="https://feorsom.stripocdn.email/content/assets/img/social-icons/logo-black/youtube-logo-black.png"
                                                                                        alt="Yt" width="32" height="32"
                                                                                        style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="center"
                                                                        style="padding:0;Margin:0;padding-bottom:35px">
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">
                                                                            Style Casual&nbsp;© 2021 Style Casual, Inc. All
                                                                            Rights Reserved.</p>
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">
                                                                            4562 Hazy Panda Limits, Chair Crossing,
                                                                            Kentucky, US, 607898</p>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding:0;Margin:0">
                                                                        <table cellpadding="0" cellspacing="0" width="100%"
                                                                            class="es-menu" role="presentation"
                                                                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                            <tr class="links">
                                                                                <td align="center" valign="top"
                                                                                    width="33.33%"
                                                                                    style="Margin:0;padding-left:5px;padding-right:5px;padding-top:5px;padding-bottom:5px;border:0">
                                                                                    <a target="_blank" href=""
                                                                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:arial, 'helvetica neue', helvetica, sans-serif;color:#999999;font-size:12px">Visit
                                                                                        Us </a></td>
                                                                                <td align="center" valign="top"
                                                                                    width="33.33%"
                                                                                    style="Margin:0;padding-left:5px;padding-right:5px;padding-top:5px;padding-bottom:5px;border:0;border-left:1px solid #cccccc">
                                                                                    <a target="_blank" href=""
                                                                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:arial, 'helvetica neue', helvetica, sans-serif;color:#999999;font-size:12px">Privacy
                                                                                        Policy</a></td>
                                                                                <td align="center" valign="top"
                                                                                    width="33.33%"
                                                                                    style="Margin:0;padding-left:5px;padding-right:5px;padding-top:5px;padding-bottom:5px;border:0;border-left:1px solid #cccccc">
                                                                                    <a target="_blank" href=""
                                                                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;display:block;font-family:arial, 'helvetica neue', helvetica, sans-serif;color:#999999;font-size:12px">Terms
                                                                                        of Use</a></td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none"
                            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                            <tr>
                                <td class="es-info-area" align="center" style="padding:0;Margin:0">
                                    <table class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"
                                        bgcolor="#FFFFFF" role="none">
                                        <tr>
                                            <td align="left" style="padding:20px;Margin:0">
                                                <table cellpadding="0" cellspacing="0" width="100%" role="none"
                                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                    <tr>
                                                        <td align="center" valign="top"
                                                            style="padding:0;Margin:0;width:560px">
                                                            <table cellpadding="0" cellspacing="0" width="100%"
                                                                role="presentation"
                                                                style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                                                <tr>
                                                                    <td align="center" class="es-infoblock"
                                                                        style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC">
                                                                        <p
                                                                            style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px">
                                                                            <a target="_blank" href=""
                                                                                style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a>No
                                                                            longer want to receive these emails?&nbsp;<a
                                                                                href="" target="_blank"
                                                                                style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px">Unsubscribe</a>.<a
                                                                                target="_blank" href=""
                                                                                style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a>
                                                                        </p>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    
    </html>
              `;

        const mailOptions = {
          from: process.env.email,
          to: email,
          subject: `confirm yout mail, ${lastName} `,
          html: html,
        };
        referredUsers = await USER.find(
          { referredBy: referrerCode },
          "firstName lastName userName pictureUrl"
        );
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            throw new Error("email not sent");
          } else {
            console.log("Email sent: " + info.response);

  
      res
        .status(202)
        .header("Authorization", `Bearer ${token}`)
        .json({
          ...userWithoutPassword._doc,
          referredUsers,
        });

      logger.info(
        `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
          }
        });
      }

    } else {
      // Continue the registration process without referral code
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const createUsers = await USER.create({
        firstName,
        middleName,
        lastName,
        email,
        pictureUrl,
        password: hashedPassword,
        userName,
        phoneNumber,
      });

      const codeOne = createUsers._id.toString().slice(3, 7);
      const codeTwo = firstName.toString().slice(0, 3);
      const codeThree = firstName.toString().slice(0, 2);
      const codeFour = userName.toString().slice(0, 2);
      const referrerCode = `REF-${codeOne}${codeTwo}${codeThree}${codeFour}${codeTwo}`;

      const updateReferral = await USER.findByIdAndUpdate(
        createUsers._id,
        { $set: { referCode: referrerCode } },
        { new: true }
      );
      const token = generateToken(createUsers._id);
          
      res.status(202).header("Authorization", `Bearer ${token}`).json({
        status: "202",
        message: updateReferral,
        referralCount: referredUsers.length,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {get} /users Get Landing Page Data
 * @apiName GetLandingPageData
 * @apiGroup LandingPage
 *
 * @apiHeader {String} Authorization User's authorization token.
 *
 * @apiSuccess {Array} data Array of shop and blog objects sorted by creation date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           "type": "shop",
 *           // other shop fields
 *         },
 *         {
 *           "_id": "blogId",
 *           "title": "blogTitle",
 *           "type": "blog",
 *           // other blog fields
 *         },
 *         // more shop and blog objects
 *       ]
 *     }
 *
 * @apiError (404) UserNotFound The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 */

const landing_page = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;

    const user = await USER.findById(id);
    if (!user)
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    const shops = await SHOPS.find({ approved: true });

    // Define the order of subscription types
    const subscriptionOrder = ["platinum", "gold", "basic"];

    // Sort shops based on subscription type and creation date
    shops.sort((a, b) => {
      const aIndex = subscriptionOrder.indexOf(a.subscriptionType);
      const bIndex = subscriptionOrder.indexOf(b.subscriptionType);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // If the subscription type is the same, sort by creation date
      return b.createdAt - a.createdAt;
    });

    const blogs = await BLOGS.find({ approved: true });

    let blogDict = {};
    for (const blog of blogs) {
      const commentCount = await COMMENT.countDocuments({ blog_id: blog._id });
      blog.commentCount = commentCount;
      blogDict[blog] = commentCount;
    }

    const sortedShops = shops.map((shop) => ({ ...shop._doc, type: "shop" }));
    const sortedBlogs = Object.keys(blogDict).map((blog) => ({
      ...blog,
      type: "blog",
    }));

    const combinedData = [...sortedShops, ...sortedBlogs];

    combinedData.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      data: combinedData,
    });

    logger.info(
      `Landing page data fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {get} /home Get Landing Page Data
 * @apiName GetLandingPageData
 * @apiGroup LandingPage
 *
 * @apiSuccess {Array} data Array of shop and blog objects sorted by subscription type and creation date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           "subscriptionType": "platinum",
 *           "createdAt": "creationDate",
 *           // other shop fields
 *         },
 *         {
 *           "_id": "blogId",
 *           "title": "blogTitle",
 *           "commentCount": 5,
 *           "createdAt": "creationDate",
 *           // other blog fields
 *         },
 *         // more shop and blog objects
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

const landingpage = asynchandler(async (req, res) => {
  try {
    const shops = await SHOPS.find({ approved: true });

    // Define the order of subscription types
    const subscriptionOrder = ["platinum", "gold", "basic"];

    // Sort shops based on subscription type and creation date
    shops.sort((a, b) => {
      const aIndex = subscriptionOrder.indexOf(a.subscriptionType);
      const bIndex = subscriptionOrder.indexOf(b.subscriptionType);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // If the subscription type is the same, sort by creation date
      return b.createdAt - a.createdAt;
    });

    const blogs = await BLOGS.find({ approved: true });

    for (const blog of blogs) {
      const commentCount = await COMMENT.countDocuments({ blog_id: blog._id });
      blog.commentCount = commentCount;
    }

    // Mix blogs with sorted shops
    let combinedData = [];
    let shopIndex = 0;
    let blogIndex = 0;

    while (shopIndex < shops.length || blogIndex < blogs.length) {
      if (shopIndex < shops.length) {
        combinedData.push(shops[shopIndex++]);
      }

      if (blogIndex < blogs.length) {
        combinedData.push(blogs[blogIndex++]);
      }
    }

    res.status(200).json({
      data: combinedData,
    });

    logger.info(
      `Landing page data fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {get} /getone Get User Data
 * @apiName GetUserData
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} user_id ID of the user to get data for.
 *
 * @apiSuccess {Object} user User object.
 * @apiSuccess {Number} referralCount Number of users referred by the user.
 * @apiSuccess {Array} referredUsers Array of users referred by the user.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 Accepted
 *     {
 *       "status": 200,
 *       "user": {
 *         "_id": "userId",
 *         "email": "user@example.com",
 *         // other user fields
 *       },
 *       "referralCount": 5,
 *       "referredUsers": [
 *         // array of user objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (404) UserNotFound The user was not found.
 * @apiError Unauthorized The user is not authorized to access this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Unauthorized"
 *     }
 */

const getUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { user_id } = req.body;
    const user = await USER.findById(user_id);
    const admin = await USER.findById(d);
    if (admin.role === "superadmin") {
      owner = true;
      if (!user) {
        throw Object.assign(new Error("user Not authorized"), {
          statusCode: 403,
        });
      }

      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const referralCount = referredUsers.length;
      const token = generateToken(id);
      res.status(202).header("Authorization", `Bearer ${token}`).json({
        status: 200,
        user: user,
        referralCount: referralCount,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with id ${userId} information was fetched successfully. ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - from ${req.ip}`
      );
    } else {
      throw new Error("unauthorized");
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//one user
const oneUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (id === user._id.toString() || process.env.role === "superadmin") {
      if (!user) {
        throw Object.assign(new Error("user Not authorized"), {
          statusCode: 403,
        });
      }

      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const referralCount = referredUsers.length;
      const token = generateToken(id);
      res.status(202).header("Authorization", `Bearer ${token}`).json({
        user: user,
        referralCount: referralCount,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with id ${id} information was fetched successfully. ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method}  - from ${req.ip}`
      );
    } else {
      throw Object.assign(new Error(`unauthorized`), { statusCode: 403 });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
/**
 * @api {get} /getall Get All Users
 * @apiName GetAllUsers
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {Number} [page=1] Page number.
 * @apiParam {Number} [pageSize=10] Number of users per page.
 *
 * @apiSuccess {Array} data Array of user objects with referral counts.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} totalPages Total number of pages.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "userId",
 *           "email": "user@example.com",
 *           "referralCount": 5,
 *           // other user fields
 *         },
 *         // more user objects
 *       ],
 *       "page": 1,
 *       "totalPages": 10,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (403) NotAuthorized The user is not authorized to access this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "NotAuthorized"
 *     }
 */

const getallusers = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  console.log(page, "   ", pageSize);
  const { id } = req.auth;
  const user = await USER.findById(id);
  try {
    if (user.role === "superadmin" || process.env.role === "superadmin") {
      const allUsers = await USER.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      const referredUsers = await USER.aggregate([
        {
          $group: {
            _id: "$referredBy",
            count: { $sum: 1 },
          },
        },
      ]);

      const usersWithReferrals = allUsers.map((user) => {
        const referral = referredUsers.find((u) => u._id === user.referCode);
        return {
          ...user._doc,
          referralCount: referral ? referral.count : 0,
        };
      });

      const totalCount = await USER.countDocuments();

      const token = generateToken(id);
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          data: usersWithReferrals,
          page: page,
          totalPages: Math.ceil(totalCount / pageSize),
        });

      logger.info(
        `users were fetched- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method}  from ${req.ip}`
      );
    } else {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
  } catch (error) {
    console.log(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {put} /update/:userId Update User Data
 * @apiName UpdateUserData
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} userId ID of the user to update.
 * @apiParam {Object} updateData Data to update.
 *
 * @apiSuccess {Object} updatedUser Updated user object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "userId",
 *       "email": "user@example.com",
 *       // other updated user fields
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) FieldsEmpty User ID and update data cannot be empty.
 * @apiError (403) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) UserNotFound The user was not found.
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
 */

const updateUser = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const clientIp = req.clientIp;
  const { id } = req.auth;
  const updateData = req.body;
  try {
    if (!userId || !updateData) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }

    const updatUser = await USER.findById(userId);
    if (!updatUser) {
      throw Object.assign(new Error("user not found"), { statusCode: 404 });
    }
    console.log(updatUser._id);
    if (id !== updatUser._id.toString()) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
    // if (req.body.data) {
    //   const result = await cloudinary.uploader.upload(req.body.data, { resource_type: 'image', format: 'png' });
    //   updateData.profile_image = result.secure_url;
    // }
    const updatedUser = await USER.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      throw Object.assign(new Error("User not  found"), { statusCode: 404 });
    }

    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json(updatedUser);
    const createdAt = updatedUser.updatedAt; // Assuming createdAt is a Date object in your Mongoose schema
    const watCreatedAt = convertToWAT(createdAt);
    const location = await getLocation(clientIp);
    logger.info(
      `user with id ${userId},updated profile ${watCreatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}  - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const changePassword = asynchandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { userId } = req.params;
    if (!userId || !oldPassword || !newPassword) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }

    const user = await USER.findById(userId);

    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }

    if (await bcrypt.compare(oldPassword, user.password)) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const updatedUser = await USER.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true }
      );
      res.status(200).json({
        message: "Password changed successfully",
        user: updatedUser,
      });
    } else {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const getLocation = asynchandler(async (ip) => {
  try {
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
 * @api {put} /updatefor/:userId Update User Forum Status
 * @apiName UpdateUserForumStatus
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} userId ID of the user to update.
 * @apiParam {Boolean} status New forum status.
 *
 * @apiSuccess {Boolean} successful Indicates whether the update was successful.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) ErrorUpdating An error occurred while updating the user.
 * @apiError Unauthorized The user is not authorized to update this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "ErrorUpdating"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Unauthorized"
 *     }
 */

const forum_status = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { userId } = req.params;
    const { status } = req.body;
    const role = await USER.findById(id);
    if (
      role._role === "superadmin" ||
      !(process.env.role.toString() === "superadmin")
    )
      throw new Error("not authorized");
    const updatedUser = await USER.findByIdAndUpdate(
      userId,
      { $set: { banned_from_forum: status } },
      { new: true }
    );
    if (!updatedUser) {
      throw Object.assign(new Error("error updating"), { statusCode: 400 });
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      successful: true,
    });
    logger.info(
      `admin with id ${id}, changed user with ${userId} forum status - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "48h" }
  );
};
/**
 * @api {get} /search Search Items
 * @apiName SearchItems
 * @apiGroup Search
 *
 * @apiParam {String} query Search query.
 *
 * @apiSuccess {Array} data Array of shop and blog objects sorted by creation date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           "createdAt": "creationDate",
 *           // other shop fields
 *         },
 *         {
 *           "_id": "blogId",
 *           "title": "blogTitle",
 *           "createdAt": "creationDate",
 *           // other blog fields
 *         },
 *         // more shop and blog objects
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

const searchItems = asynchandler(async (req, res) => {
  const query = req.query.query;
  try {
    const shopResults = await SHOPS.find({ $text: { $search: query } });
    const blogResults = await BLOGS.find({ $text: { $search: query } });

    // Combine and sort the results
    const combinedResults = [...shopResults, ...blogResults].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    // const token = generateToken(id);.header("Authorization", `Bearer ${token}`)
    res.status(200).json({
      data: combinedResults,
    });

    logger.info(
      `Search results fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
const logout_user = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    res.status(200).header("Authorization", null).json({
      message: "Logged out successfully",
    });
    logger.info(
      `user with id ${id} logged out at ${currentDateTimeWAT.toString()} - ${
        res.statusCode
      } - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

module.exports = {
  register_users,
  login_users,
  landing_page,
  updateUser,
  getUser,
  getallusers,
  forum_status,
  searchItems,
  landingpage,
  oneUser,
  changePassword,
  logout_user,
};
