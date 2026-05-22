import axios from 'axios';

export interface DefectDetection {
  class_name: string;
  confidence: number;
  bbox: number[];
}

export interface AnalysisResult {
  defects: DefectDetection[];
  quality: string;
  score: number;
}

// For roasted coffee the API might return different structure, define accordingly
export interface RoastAnalysisSummary {
  summary: string;
  detectedBeans: number;
}

export interface RoastAnalysisResult {
  roastAnalysis: RoastAnalysisSummary;
  defects: DefectDetection[];
  annotatedImage?: string; // base64 image string if returned
}

const API_URL = 'https://400e-34-90-117-7.ngrok-free.app';

// Green bean analysis service
export async function analyzeCoffeeBeans(imageData: string): Promise<AnalysisResult> {
  try {
    // Convert base64 string to blob
    const base64Response = await fetch(imageData);
    const blob = await base64Response.blob();

    // Prepare form data
    const formData = new FormData();
    formData.append('file', blob, 'green-beans.jpg');

    const response = await axios.post(`${API_URL}/analyze-green-beans`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { quality_score, detections } = response.data;

    return {
      defects: detections.map((d: any) => ({
        class_name: d.class,
        confidence: d.confidence,
        bbox: d.bbox,
      })),
      quality: determineQuality(quality_score),
      score: quality_score,
    };
  } catch (error) {
    console.error('Error analyzing coffee beans:', error);
    throw error;
  }
}

// Roasted coffee analysis service
export async function analyzeRoast(imageData: string): Promise<RoastAnalysisResult> {
  try {
    const base64Response = await fetch(imageData);
    const blob = await base64Response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'roasted-coffee.jpg');

    const response = await axios.post(`${API_URL}/analyze-roasted-coffee`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Adapt this to match your backend response exactly
    const { roastAnalysis, detections, annotatedImage } = response.data;

    return {
      roastAnalysis,
      defects: detections.map((d: any) => ({
        class_name: d.class,
        confidence: d.confidence,
        bbox: d.bbox,
      })),
      annotatedImage, // optional base64 image from backend
    };
  } catch (error) {
    console.error('Error analyzing roast:', error);
    throw error;
  }
}

// Quality determination helper for green beans
function determineQuality(score: number): string {
  if (score >= 90) return "Premium";
  if (score >= 75) return "High Quality";
  if (score >= 60) return "Standard";
  if (score >= 40) return "Commercial";
  return "Low Quality";
}
