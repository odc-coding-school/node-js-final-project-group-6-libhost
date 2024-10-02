app.get('/api/search', (req, res) => {
    const { name, city, address, bedrooms, price } = req.query;
    let query = "SELECT * FROM accommodations WHERE ";
    const conditions = [];

    if (name) {
        conditions.push(`name LIKE '%${name}%'`);
    }
    if (city) {
        conditions.push(`city = ${city}`);
    }
    if (address) {
        conditions.push(`address LIKE '%${address}%'`);
    }
    if (bedrooms) {
        conditions.push(`bedrooms = ${bedrooms}`);
    }
    if (price) {
        conditions.push(`price <= ${price}`);
    }
    
    query += conditions.join(' AND ');

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).send('Error in database operation');
        } else {
            res.json(rows);
        }
    });
});
