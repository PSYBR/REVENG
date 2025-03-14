"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const analyzer_1 = require("./analyzer");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure CORS with specific options
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // Vite's default port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));
app.use(express_1.default.json());
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
}).single('file');
// File upload endpoint with enhanced error handling
app.post('/api/upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err instanceof multer_1.default.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({
                error: 'File upload error',
                details: err.message
            });
        }
        else if (err) {
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
            const analysis = await (0, analyzer_1.analyzeFile)(filePath);
            // Clean up the uploaded file after analysis
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error('Error deleting file:', err);
            });
            res.json({
                message: 'File uploaded and analyzed successfully',
                analysis,
            });
        }
        catch (error) {
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
