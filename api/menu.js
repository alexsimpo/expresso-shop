const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menuItem.js');

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.param('menuId', (req, res, next, menuId) => {
    db.get(`SELECT * FROM Menu WHERE Menu.id = $menuId`, 
    {
        $menuId: menuId
    },
    (error, menu) => {
        if (error) {
            next(error);
        } else if (menu) {
            req.menu = menu;
            next();
        } else {
            res.sendStatus(404);
        }
    })
})

menusRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Menu`, (error, menus) => {
        if(error) {
            next(error);
        } else {
            res.status(200).json({ menus: menus });
        }
    });
});

menusRouter.post('/', (req, res, next) => {
    const title = req.body.menu.title;

    if (!title) {
        return res.sendStatus(400);
    };
    
    db.run(`INSERT INTO Menu (title) VALUES ($title)`,
    {
        $title: title
    },
    function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (error, menu) => {
                res.status(201).json({ menu: menu });
            });
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({ menu: req.menu });
});

menusRouter.put('/:menuId', (req, res, next) => {
    const title = req.body.menu.title;

    if (!title) {
        return res.sendStatus(400);
    };

    db.run(`UPDATE Menu SET title = $title WHERE Menu.id = $menuId`,
    {
        $title: title,
        $menuId: req.params.menuId
    },
    function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (error, menu) => {
                res.status(200).json({ menu: menu });
            });
        }
    });
});

menusRouter.delete('/:menuId', (req, res, next) => {
    db.get(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId`,
    {
        $menuId: req.params.menuId
    },
    (error, menuItem) => {
        if(error){
            next(error);
        } else if (menuItem) {
            return res.sendStatus(400);
        } else {
            db.run(`DELETE FROM Menu WHERE Menu.id = $menuId`,
            {
                $menuId: req.params.menuId
            },
            function(error) {
                if(error){
                    next(error);
                } else {
                    res.sendStatus(204);
                }
            });     
        }
    });
});

module.exports = menusRouter;