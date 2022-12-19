const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

//@desc GET all notes
//@route GET /notes
//@access Private

const getAllNotes = asyncHandler(async (req, res) => {
    // Get all notes from MongoDB
    const notes = await Note.find().lean()

    // If no notes 
    if (!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

//@desc create new note
//@route POST /notes
//@access Private

const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    //confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'all fields required' })
    }



    //create and store the new note
    const note = await Note.create({ user, title, text })

    if (note) {
        res.status(201).json({ message: 'note was created' })
    } else {
        res.status(400).json({ message: 'Invalid data recieved' })
    }

})

//@desc Update a note
//@route PATCH /notes
//@access Private

const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    //confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'all fields required' })
    }

    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'cannot find note' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json({ message: `note for ${updatedNote.user} has been updated` })

})
//@desc delete a note
//@route DELETE /notes
//@access Private

const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message: 'id required ' })
    }

    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'no notes to be deleted' })
    }

    const result = await Note.deleteOne(note)

    const reply = `Note ${result.id} has been deleted`

    res.json(reply)
})


module.exports = {
    createNewNote,
    getAllNotes,
    updateNote,
    deleteNote
}