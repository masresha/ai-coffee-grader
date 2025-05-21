import { useState, useRef } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Paper,
  Grid,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import Webcam from 'react-webcam';
import { styled } from '@mui/material/styles';
import { analyzeCoffeeBeans, DefectDetection, analyzeRoast } from './services/coffeeAnalysis';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StopIcon from '@mui/icons-material/Stop';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  textAlign: 'center',
}));

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

interface GradingResult {
  quality: string;
  defects: DefectDetection[];
  score: number;
}

interface RoastAnalysisResult {
  roastLevel: string;
  consistency: number;
  visualCharacteristics: {
    color: string;
    surfaceTexture: string;
    oilContent: string;
  };
  physicalCharacteristics: {
    beanSize: string;
    beanDensity: string;
    beanShape: string;
  };
  chemicalIndicators: {
    aroma: string;
    acidity: string;
    body: string;
  };
}

function App() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzingRoast, setIsAnalyzingRoast] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [roastAnalysisResult, setRoastAnalysisResult] = useState<RoastAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setIsCapturing(true);
    setError(null);

    try {
      const result = await analyzeCoffeeBeans(previewUrl!);
      setGradingResult({
        quality: result.quality,
        defects: result.defects,
        score: result.score,
      });
    } catch (err) {
      setError('Failed to analyze coffee beans. Please try again.');
      console.error(err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRoastAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzingRoast(true);
    setError(null);

    try {
      const result = await analyzeRoast(previewUrl!);
      setRoastAnalysisResult({
        roastLevel: 'Medium', // These would come from your backend
        consistency: 85,
        visualCharacteristics: {
          color: 'Medium Brown',
          surfaceTexture: 'Smooth',
          oilContent: 'Moderate'
        },
        physicalCharacteristics: {
          beanSize: 'Uniform',
          beanDensity: 'Medium',
          beanShape: 'Regular'
        },
        chemicalIndicators: {
          aroma: 'Balanced',
          acidity: 'Medium',
          body: 'Medium'
        }
      });
    } catch (err) {
      setError('Failed to analyze roasted coffee beans. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzingRoast(false);
    }
  };

  const startWebcam = () => {
    setIsWebcamActive(true);
  };

  const stopWebcam = () => {
    setIsWebcamActive(false);
  };

  const captureImage = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError('Failed to capture image');
        return;
      }

      setIsCapturing(true);
      setError(null);
      
      try {
        const result = await analyzeCoffeeBeans(imageSrc);
        setGradingResult({
          quality: result.quality,
          defects: result.defects,
          score: result.score,
        });
      } catch (err) {
        setError('Failed to analyze coffee beans. Please try again.');
        console.error(err);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          AI Coffee Bean Grader
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Upload Image
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <UploadBox onClick={() => fileInputRef.current?.click()}>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Click to select or drag and drop an image
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports JPG, PNG, GIF
                </Typography>
              </UploadBox>
              {previewUrl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', borderRadius: 8 }}
                  />
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleImageUpload}
                      disabled={isCapturing}
                    >
                      {isCapturing ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          Analyzing Green Beans...
                        </>
                      ) : (
                        'Grade Green Beans'
                      )}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleRoastAnalysis}
                      disabled={isAnalyzingRoast}
                    >
                      {isAnalyzingRoast ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          Analyzing Roast...
                        </>
                      ) : (
                        'Analyze Roast'
                      )}
                    </Button>
                  </Box>
                </Box>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Webcam Capture
              </Typography>
              {!isWebcamActive ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={startWebcam}
                  startIcon={<PhotoCameraIcon />}
                >
                  Start Webcam
                </Button>
              ) : (
                <Box>
                  <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={captureImage}
                      disabled={isCapturing}
                      startIcon={<PhotoCameraIcon />}
                    >
                      {isCapturing ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          Analyzing...
                        </>
                      ) : (
                        'Capture & Grade'
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={stopWebcam}
                      startIcon={<StopIcon />}
                    >
                      Stop Webcam
                    </Button>
                  </Box>
                </Box>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              {gradingResult && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    Green Bean Analysis
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    Score: {gradingResult.score}/100
                  </Typography>
                  <Typography variant="h5" gutterBottom>
                    Quality: {gradingResult.quality}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Defects Found:
                  </Typography>
                  {gradingResult.defects.length > 0 ? (
                    <ul>
                      {gradingResult.defects.map((defect, index) => (
                        <li key={index}>
                          {defect.class_name} (Confidence: {Math.round(defect.confidence * 100)}%)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography variant="body1" color="success.main">
                      No defects detected
                    </Typography>
                  )}
                </Box>
              )}

              {roastAnalysisResult && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Roast Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Roast Level: {roastAnalysisResult.roastLevel}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                          Consistency: {roastAnalysisResult.consistency}%
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Visual Characteristics
                        </Typography>
                        <Typography variant="body2">
                          Color: {roastAnalysisResult.visualCharacteristics.color}
                        </Typography>
                        <Typography variant="body2">
                          Surface: {roastAnalysisResult.visualCharacteristics.surfaceTexture}
                        </Typography>
                        <Typography variant="body2">
                          Oil Content: {roastAnalysisResult.visualCharacteristics.oilContent}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Physical Characteristics
                        </Typography>
                        <Typography variant="body2">
                          Bean Size: {roastAnalysisResult.physicalCharacteristics.beanSize}
                        </Typography>
                        <Typography variant="body2">
                          Density: {roastAnalysisResult.physicalCharacteristics.beanDensity}
                        </Typography>
                        <Typography variant="body2">
                          Shape: {roastAnalysisResult.physicalCharacteristics.beanShape}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Chemical Indicators
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2">
                              Aroma: {roastAnalysisResult.chemicalIndicators.aroma}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2">
                              Acidity: {roastAnalysisResult.chemicalIndicators.acidity}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2">
                              Body: {roastAnalysisResult.chemicalIndicators.body}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {!gradingResult && !roastAnalysisResult && (
                <Typography variant="body1" color="text.secondary">
                  Upload an image or use webcam to see analysis results
                </Typography>
              )}
            </StyledPaper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default App; 