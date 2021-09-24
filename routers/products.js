const express = require('express');
const { Category } = require('../models/category');
const { Product } = require('../models/product');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

/*
Allowable file mimetypes & file extension map
*/
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

/*
Multer configuration used for file upload
*/
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        /*
        creating custom error for invalid file type - to be returned if used uploads invalid file type
        */
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image  type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.fieldname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
})

const uploadOptions = multer({ storage: storage })


/*
get products
*/
router.get(`/`, async (req, res) => {

    var ipAddr = req.headers["x-forwarded-for"];
    if (ipAddr) {
        var list = ipAddr.split(",");
        ipAddr = list[list.length - 1];
    } else {
        ipAddr = req.connection.remoteAddress;
    }
    console.log(ipAddr);
    /*
    Note: checking path URL for query param == category - if yes - split the param values on ','
    */
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }
    // Note: Adding .select to mongooseSchema query - will return only the 'selected' Schema properties.
    //.select('name image category _id')  
    const productList = await Product.find(filter).populate('category');
    if (!productList) {
        res.status(500).json({ success: false, note: "productList does not exist" });
    }
    res.send(productList);
})


/*
find product by id
*/
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
        res.status(500).json({ success: false, note: "No product found with id" });
    }
    res.send(product);
})


/*
post / create product
*/
router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.body.category)) {
        res.status(400).send("Invalid Category Id");
    }

    const category = await Category.findById(req.body.category).catch(err => res.status(500).send({ success: false, error: err }));
    if (!category) {
        return res.status(400).send('Invalid Category');
    }

    const file = req.file;
    if (!file) {
        return res.status(400).send('No image found in request.');
    }

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    })

    product = await product.save();

    if (!product) {
        return res.status(500).send({ message: 'Product cannot be created' })
    }
    res.send(product);
})


/*
Update Product
*/
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send("Invalid Product Id");
    }

    const category = await Category.findById(req.body.category).catch(err => res.status(500).send({ success: false, error: err }));
    if (!category) {
        return res.status(400).send('Invalid Category');
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(400).send('Invalid product');
    }

    const file = req.file;
    let imagepath;
    if (file) {

        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`

    }
    else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true }
    )
    if (!updatedProduct) {
        res.status(404).send('The product cannot be updated!');
    }
    res.send(updatedProduct);
});


/*
Delete Product
*/
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            res.status(200).json({ success: true, message: 'The product has been deleted successfully.' });
        }
        else {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err });
    });
});


/*
Get Product Count
*/
router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments();

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.status(200).send({ productCount: productCount });
});


/*
Get Featured Products
*/
router.get('/get/featured/:count', async (req, res) => {

    /* check if req.params.count exist, if yes -> count = req.params.count; else count =0; */
    const count = req.params.count ? req.params.count : 0;

    /* 
    Note: req.params.count (path variable) is a String - must convert String to Number
        -> easy way to conver String to Number is to put '+' infront of the String variable
        -> ex: +count
    */
    const products = await Product.find({ isFeatured: true }).limit(+count);

    if (!products) {
        res.status(500).json({ success: false });
    }
    res.status(200).send(products);
});



/*
Update Product Gallery Images 
*/
router.put('/gallery-images/:id', uploadOptions.array('images', 19), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send("Invalid Product Id");
    }
    const files = req.files;
    let imagePaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if (files) {
        files.map(file => {
            imagePaths.push(`${basePath}${file.filename}`);
        })
    }


    const product = await Product.findByIdAndUpdate(req.params.id,
        {
            images: imagePaths,
        },
        { new: true }
    )
    if (!product) {
        res.status(404).send('The product cannot be updated!');
    }

    res.send(product);
})




module.exports = router;