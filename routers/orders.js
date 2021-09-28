const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-items');
const { Product } = require('../models/product');
const stripe = require('stripe')('sk_test_51JcIwxEtYX566LWVgEj0sJSjeZ895NPH9cFNHY8G2svU30Zwq3OU57WY6Pn6MyjyEqP1L4mAvMjVxFwONysxDn3400oTrxiJME');
const router = express.Router();

//http://localhost:4200/
const angularURL = 'http:nanb.link:4200/';

/*
Get All Orders
*/
router.get('/', async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });

    if (!orderList) {
        res.status(500).json({ success: false })
    }
    res.send(orderList);
})


/*
Get Order By Id
*/
router.get('/:id', async (req, res) => {
    /* note the nested json paths which populate neseted data objects in response */
    const order = await Order.findById(req.params.id).populate('user').populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    });

    if (!order) {
        res.status(500).json({ success: false })
    }
    res.send(order);
})

router.post('/create-checkout-session', async (req, res) => {
    const orderItems = req.body;

    if (!orderItems) {
        return res.status(400).send('checkout session cannot be created - check the order items');
    }

    const lineItems = await Promise.all(
        orderItems.map(async (orderItem) => {
            const product = await Product.findById(orderItem.product);
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                    },
                    unit_amount: product.price * 100,
                },
                quantity: orderItem.quantity,
            };
        })
    )
    const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: 'http://nanb.link:4200/success',
        cancel_url: 'http://nanb.link:4200/error'
    })

    res.json({ id: stripeSession.id });
});

/*
Post new Order
*/
//  --- Note: Below uses the async & await methodology for req/res protocols
router.post('/', async (req, res) => {
    console.log(req.body);
    const orderItemIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }));
    const orderItemsIdsResolved = await orderItemIds;

    /* get price from orderItem.product.price & quantity from orderItem.quantity to calculate total price */
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }));

    /* sum all elements in totalPrices array and assign value to totalPrice */
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        state: req.body.state,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })
    order = await order.save();
    if (!order) {
        res.status(404).send('The order cannot be created!');
    }
    res.send(order);
})


/*
Update order status
*/
router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id,
        {
            status: req.body.status
        },
        { new: true }
    )
    if (!order) {
        res.status(404).send('The order cannot be updated!');
    }
    res.send(order);
});


/*
Delete Order
*/
//  --- Note:  Below uses the promise methodology for req/res protocols
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            /*Note - because we are storing orderItem._id in the DB on the Order object - below is actually deleting the orderItem by Id */
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem);
            });
            res.status(200).json({ success: true, message: 'The order has been deleted successfully.' });
        }
        else {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err });
    });
})


/*
Get Order Count
*/
router.get('/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments();

    if (!orderCount) {
        res.status(500).json({ success: false });
    }
    res.status(200).send({ orderCount: orderCount });
});


/*
Get total sum of all orders
*/
router.get('/get/totalSales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated');
    }

    return res.status(200).send({ totalSales: totalSales.pop().totalSales });
});



/*
Get Orders for specific user
*/
router.get('/get/userOrders/:userId', async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userId }).populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    })
        .sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
        res.status(500).json({ success: false })
    }
    res.send(userOrderList);
})




module.exports = router;

