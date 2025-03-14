import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadFile, AnalysisResult } from '../services/api';

const steps = [
  'Upload File',
  'Initial Analysis',
  'Structure Analysis',
  'Decompilation',
  'Results',
];

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    setError(null);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 95));
      }, 100);

      // Actually upload the file
      const result = await uploadFile(uploadedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setAnalysis(result);
      setActiveStep(1);
      simulateAnalysis();
    } catch (err) {
      setError('Error uploading file. Please try again.');
      setFile(null);
      setUploadProgress(0);
    }
  }, []);

  const simulateAnalysis = () => {
    let currentStep = 1;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setActiveStep(currentStep);
        currentStep += 1;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const renderAnalysisResults = () => {
    if (!analysis) return null;

    return (
      <Box sx={{ mt: 4, textAlign: 'left' }}>
        <Typography variant="h6" gutterBottom>
          Analysis Results
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          File Information:
        </Typography>
        <Typography variant="body2">
          Name: {analysis.fileInfo.name}<br />
          Size: {analysis.fileInfo.size} bytes<br />
          Type: {analysis.fileInfo.type}
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
          Structure:
        </Typography>
        <Typography variant="body2" component="pre" sx={{ 
          backgroundColor: 'background.paper',
          p: 2,
          borderRadius: 1,
          overflowX: 'auto'
        }}>
          {JSON.stringify(analysis.structure, null, 2)}
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
          Decompilation:
        </Typography>
        <Typography variant="body2" component="pre" sx={{
          backgroundColor: 'background.paper',
          p: 2,
          borderRadius: 1,
          overflowX: 'auto'
        }}>
          {analysis.decompilation}
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
          Recommendations:
        </Typography>
        <ul>
          {analysis.recommendations.map((rec, index) => (
            <li key={index}>
              <Typography variant="body2">{rec}</Typography>
            </li>
          ))}
        </ul>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!file ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 6,
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.500',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop your file here
          </Typography>
          <Typography variant="body2" color="textSecondary">
            or click to select a file
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ width: '100%' }}>
          {uploadProgress < 100 ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Uploading: {file.name}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          ) : (
            <Box sx={{ width: '100%', mt: 4 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {activeStep === steps.length - 1 && renderAnalysisResults()}
              
              {activeStep === steps.length - 1 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setFile(null);
                    setActiveStep(0);
                    setUploadProgress(0);
                    setAnalysis(null);
                  }}
                  sx={{ mt: 4 }}
                >
                  Analyze Another File
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload; 