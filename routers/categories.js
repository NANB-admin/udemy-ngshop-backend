const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();

/*
Get All Categories
*/
router.get('/', async (req, res) => {
    const categoryList = await Category.find();

    if (!categoryList) {
        res.status(500).json({ success: false });
    }

    res.status(200).send(categoryList);
});


/*
Get category by id
*/
router.get('/:id', async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(500).json({ message: 'The category with the given ID was not found.' });
    }

    res.status(200).send(category);
});


/*
Post new category
*/
//  --- Note: Below uses the async & await methodology for req/res protocols
router.post('/', async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color
    })
    category = await category.save();
    if (!category) {
        res.status(404).send('The category cannot be created!');
    }
    res.send(category);
})


/*
Delete category
*/
//  --- Note:  Below uses the promise methodology for req/res protocols
router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id).then(category => {
        if (category) {
            res.status(200).json({ success: true, message: 'The category has been deleted successfully.' });
        }
        else {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err });
    });
})


/*
Update category
*/
router.put('/:id', async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
        { new: true }
    )
    if (!category) {
        res.status(404).send('The category cannot be updated!');
    }
    res.send(category);
});



module.exports = router;