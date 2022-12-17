const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')

//@desc GET all notes
//@route GET /notes
//@access Private

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()

    //check to see if we have notes 
    if (!notes?.length) {
        res.status(400).json({ message: 'no notes found' })
    }

    //add a username to each note before sending the response 
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
        res.status(400).json({ message: 'all fields required' })
    }

    const noteObject = { user, title, text }

    //create and store the new note
    const note = await Note.create(noteObject)

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
    if (!id || !user || !title || !text || !completed) {
        res.status(400).json({ message: 'all fields required' })
    }

    const note = await Note.findById(id).exec()

    if (!note) {
        res.status(400).json({ message: 'cannot find note' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await Note.save()

    res.json({ message: `note for ${updatedNote.user} has been updated` })

})
//@desc delete a note
//@route DELETE /notes
//@access Private

const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) {
        res.status(400).json({ message: 'id required ' })
    }

    const note = await Note.findById(id).exec()

    if (!note) {
        res.status(400).json({ message: 'no notes to be deleted' })
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