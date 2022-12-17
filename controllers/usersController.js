const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrpyt = require('bcrypt')


//@desc GET all users
//@route GET /users
//@access Private

const getAllUsers = asyncHandler(async (req, res) => {
    //get all users /lean gives us the POJO
    const users = await User.find().select('-password').lean()

    //check to see if we have users 
    if (!users?.length) { //if the users have any length using optional chaining
        return res.status(400).json({ message: 'No users found' })
    }
    res.json(users)
})


//@desc Create new user
//@route POST /users
//@access Private

const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    //confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'all fields are required' })
    }

    //check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'username already taken ' })
    }

    //hash password
    const hashedPwd = await bcrpyt.hash(password, 10) //salt rounds

    //defining our user object before we save it
    const userObject = { username, "password": hashedPwd, roles }

    //create and store the new user
    const user = await User.create(userObject)

    if (user) { //user was created
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data recieved ' })
    }



})


//@desc Update a user
//@route PATCH /users
//@access Private

const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body

    //confirm data 
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'all fields required' })
    }

    const user = await User.findById(id).exec() //we are passing in a value and we need to return the promise. we dont use lean because we need the mongo document that has save and other methods attached to it 

    if (!user) {
        return res.status(400).json({ message: 'user not found' })

    }

    //check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()
    //Allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) { //if it's not equal to the id that was recieved as a variable frm the req body then we have a duplicate but if it is equal to that id that means we are working on the correct doucment to update
        return res.status(409).json({ message: 'duplicate username' })
    }

    //update our user object with the information we recieved 
    user.username = username
    user.roles = roles
    user.active = active

    //if we have  a password then we can update the password
    if (password) {
        //hash password
        user.password = await bcrpyt.hash(password, 10) //salt rounds
    }

    const updatedUser = await user.save() //we can call save on the user document because we didnt request the lean method

    res.json({ message: `${updatedUser.username} updated` })
})

//@desc Delete a user
//@route DELETE /users
//@access Private

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message: 'user id required' })
    }

    //we do not want to delete a user if they still have notes assigned 
    const note = await Note.findOne({ user: id }).lean().exec()

    if (note) {
        return res.status(400).json({ message: 'User still has an assigned note' })
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'user not found' })
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with id ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}