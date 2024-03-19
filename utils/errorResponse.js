const res400 = (res, msg) => res.status(400).json({ message: msg});

const res500 = (res) => res.status(500).json({"message":"Internal server error occurred"})

module.exports = { res400, res500 };