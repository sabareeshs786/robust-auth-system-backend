const res204 = (res) => res.status(204).json({"message": "You are already logged out"});

module.exports = {res204};