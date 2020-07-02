const express = require('express');
const menuItemsRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId`,
    {
        $menuItemId: menuItemId
    },
    (error, menuItem) => {
        if(error){
            next(error);
        } else if (menuItem) {
            req.menuItem = menuItem;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

menuItemsRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`,
    {
        $menuId: req.params.menuId
    },
    (error, menuItems) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json({ menuItems: menuItems });
        }
    })
});

menuItemsRouter.post('/', (req, res, next) => {
    const name = req.body.menuItem.name, 
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuId = req.params.menuId;

    db.get(`SELECT * FROM Menu WHERE Menu.id = $menuId`, 
    {
        $menuId: menuId
    },
    (error, menu) => {
        if(error){
            next(error);
        } else {
            if(!name || !inventory || !price || !menu) {
                return res.sendStatus(400);
            };
        
            const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) 
            VALUES ($name, $description, $inventory, $price, $menuId)`;
        
            const values = {
                $name: name, 
                $description: description, 
                $inventory: inventory, 
                $price: price,
                $menuId: menuId    
            };
        
            db.run(sql, values, function(error) {
                if(error){
                    next(error);
                } else {
                    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
                    (error, menuItem) => {
                        res.status(201).json({ menuItem: menuItem });
                    });
                }
            });
        }
    });
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const name = req.body.menuItem.name, 
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuId = req.params.menuId,
    menuItemId = req.params.menuItemId;

    if(!name || !inventory || !price || !menuId || !menuItemId) {
        return res.sendStatus(400);
    };

    const sql = `UPDATE MenuItem SET name = $name, description = $description,
        inventory = $inventory, price = $price WHERE MenuItem.id = $menuItemId`;

    const values = {
        $name: name, 
        $description: description, 
        $inventory: inventory, 
        $price: price,
        $menuItemId: menuItemId    
    };

    db.run(sql, values, function(error) {
        if(error){
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
            (error, menuItem) => {
                res.status(200).json({ menuItem: menuItem })
            });
        }
    });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run(`DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId`,
    {
        $menuItemId: req.params.menuItemId
    },
    (error) => {
        if(error){
            next(error);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = menuItemsRouter;