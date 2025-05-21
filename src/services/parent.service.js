const { Parent } = require("../models")


const createParent = async (parentBody) => {
    return await Parent.create(parentBody)
}

module.exports = {
    createParent
}