const Note = require('../models/Note');
const Subscription = require('../models/Subscription');

const checkPremium = async (req, res, next) => {
  if (req.user.role === 'Student' && !req.user.isPremium) {
    return res.status(403).json({ message: 'Premium subscription required for this action' });
  }
  next();
};

const generateNotes = async (req, res) => {
  // Proxy to Python API would use axios, for now we will assume the frontend calls Python API directly
  // and saves it directly to Node via editNotes or similar. Or we can just import axios.
  res.status(501).json({ message: 'Use direct Python endpoint or refactor Axios proxy' });
};

const saveNotes = async (req, res) => {
  const { videoId, content } = req.body;
  try {
    let note = await Note.findOne({ videoId });
    if (!note) {
      note = await Note.create({ videoId, title: 'AI Summary', content, version: 1, editedByTeacher: true });
    } else {
      note.content = content;
      note.editedByTeacher = true;
      note.version += 1;
      await note.save();
    }
    res.json({ message: 'Note saved correctly', note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotes = async (req, res) => {
  try {
    if (req.user.role === 'Student') {
      if (!req.user.isPremium) {
        return res.status(403).json({ message: 'Premium Required: Please upgrade on your Dashboard to view AI generate notes.' });
      }
    }
    const notes = await Note.find({ videoId: req.params.videoId });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateNotes, saveNotes, getNotes, checkPremium };
