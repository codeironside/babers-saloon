const stripe = require("stripe")("your_secret_key");
const asynchandler = require("express-async-handler");

const cartPayment = asynchandler(async (req, res) => {
  try {
    const { cart, stripeEmail, stripeToken } = req.body;
    if (!cart || !stripeEmail || !stripeToken) {
        throw Object.assign(new Error(`fields can not be empty`), {
            statusCode: "404"
          });
    }
    const customer = await stripe.customers.create({
      email: stripeEmail,
      source: stripeToken,
    });
    for (let item of cart.items) {
      const charge = await stripe.charges.create({
        amount: item.amount,
        description: "Cart Payment",
        currency: "usd",
        customer: customer.id,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Payment successful",
    });
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const bookingPayment = asynchandler(async (req, res) => {
  try {
    const { booking, stripeEmail, stripeToken } = req.body;
    if (!booking || !stripeEmail || !stripeToken) {
      throw Object.assign(new Error(`fields can not be empty`), {
        statusCode: "404",
      });
    }

    const customer = await stripe.customers.create({
      email: stripeEmail,
      source: stripeToken,
    });

    const charge = await stripe.charges.create({
      amount: booking.amount, // amount in cents
      description: "Booking Payment",
      currency: "usd",
      customer: customer.id,
    });
    if (charge) {
      res.status(200).json({
        status: "success",
        message: "Payment successful",
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const contributionPayment = asynchandler(async (req, res) => {
  try {
    const { contribution, stripeEmail, stripeToken } = req.body;
    if (!contribution || !stripeEmail || !stripeToken) {
      throw Object.assign(new Error(`fields can not be empty`), {
        statusCode: "404",
      });
    }
    const customer = await stripe.customers.create({
      email: stripeEmail,
      source: stripeToken,
    });
    const charge = await stripe.charges.create({
      amount: contribution.amount,
      description: "Contribution Payment",
      currency: "usd",
      customer: customer.id,
    });
    if (charge) {
      res.status(200).json({
        status: "success",
        message: "Payment successful",
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const subscriptionPayment = asynchandler(async (req, res) => {
  try {
    const { plan, stripeEmail, stripeToken } = req.body;
    if (!plan || !stripeEmail || !stripeToken) {
      throw Object.assign(new Error(`fields can not be empty`), {
        statusCode: "404",
      });
    }
    const customer = await stripe.customers.create({
      email: stripeEmail,
      source: stripeToken,
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: plan }],
    });
    if (subscription) {
      res.status(200).json({
        status: "success",
        message: "Subscription successful",
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

module.exports ={
    subscriptionPayment,
    contributionPayment,
    cartPayment,
    bookingPayment 
}