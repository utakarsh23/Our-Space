require("dotenv").config();


module.exports = function (req, res, next) {
    const clientKey = req.header("x-api-key");
    console.log("checking key")
    const allowedKeys = [
        process.env.SECRET_KEY_1,
        process.env.SECRET_KEY_2
    ];
    console.log(1)
    console.log(clientKey)

    if (!clientKey || !allowedKeys.includes(clientKey)) {
        return res.status(403).json({ error: "Forbidden: Invalid key" });
    }

    console.log("checked")
    next();
};