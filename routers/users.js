const { User } = require('../models/user');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');


/*
Get all Users
*/
router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash');
    if (!userList) {
        res.status(500).send({ success: false });
    }
    res.status(200).send(userList);
});


/*
Get user by id
*/
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
        res.status(500).json({ message: 'The user with the given ID was not found.' });
    }

    res.status(200).send(user);
});


/*
Post new User (for admin use)
*/
//  --- Note: Below uses the async & await methodology for req/res protocols
router.post('/', async (req, res) => {
    console.log(req.body);
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, +process.env.password_hash_salt),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
    })
    user = await user.save();
    if (!user) {
        res.status(404).send('The user cannot be created!');
    }
    res.send(user);
})

/*
Register a new User
*/
//  --- Note: Below uses the async & await methodology for req/res protocols
router.post('/register', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.passwordHash, +process.env.password_hash_salt),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country
    })
    user = await user.save();
    if (!user) {
        res.status(404).send('The user cannot be created!');
    }
    res.send(user);
})



/*
Update user - password optional 
*/
router.put('/:id', async (req, res) => {
    const userExist = await User.findById(req.params.id);
    let newPassword;
    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.passwordHash, +process.env.password_hash_salt);
    }
    else {
        newPassword = userExist.passwordHash;
    }
    const user = await User.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country
        },
        { new: true }
    )
    if (!user) {
        res.status(404).send('The user cannot be updated!');
    }
    res.send(user);
});


/*
Login API
*/
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = 'nanb-ecommer-app-secret-jwt-key';//process.env.secret;
    if (!user) {
        return res.status(400).send('User not found');
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign({
            userId: user.id,
            isAdmin: user.isAdmin

        },
            secret,
            { expiresIn: '1d' }
        );

        return res.status(200).send({ user: user.email, token: token });
    }
    else {
        return res.status(400).send('Invalid password');
    }
})


/*
Get User Count
*/
router.get('/get/count', async (req, res) => {
    const userCount = await User.countDocuments();

    if (!userCount) {
        res.status(500).json({ success: false });
    }
    res.status(200).send({ userCount: userCount });
});


/*
Delete User
*/
router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            res.status(200).json({ success: true, message: 'The user has been deleted successfully.' });
        }
        else {
            return res.status(404).json({ success: false, message: "User not found." });
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err });
    });
});




module.exports = router;