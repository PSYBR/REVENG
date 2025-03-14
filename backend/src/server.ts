import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeFile } from './analyzer';

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure CORS with specific options
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
}).single('file');

// File upload endpoint with enhanced error handling
app.post('/api/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error',
        details: err.message 
      });
    } else if (err) {
      console.error('Unknown error:', err);
      return res.status(500).json({ 
        error: 'Unknown error occurred',
        details: err.message 
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('File received:', req.file.originalname);
      const filePath = req.file.path;
      const analysis = await analyzeFile(filePath);
      
      // Clean up the uploaded file after analysis
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      res.json({
        message: 'File uploaded and analyzed successfully',
        analysis,
      });
    } catch (error: any) {
      console.error('Error processing file:', error);
      res.status(500).json({ 
        error: 'Error processing file',
        details: error.message 
      });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Upload directory: ${uploadsDir}`);
}); 