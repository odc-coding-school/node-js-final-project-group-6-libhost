app.get('/api/search', (req, res) => {
    const { location, bedrooms, price, available } = req.query;
    let query = "SELECT * FROM accommodations WHERE ";
    const conditions = [];

    if (location) {
        conditions.push(`location LIKE '%${location}%'`);
    }
    if (bedrooms) {
        conditions.push(`bedrooms = ${bedrooms}`);
    }
    if (price) {
        conditions.push(`price <= ${price}`);
    }
    if (available) {
        conditions.push(`available = ${available}`);
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
