import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('http://localhost:8000/process-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process image')
      }

      const data = await response.json()
      setAnalysisResults(data)
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try again.')
    }
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsWebcamActive(true)
      }
    } catch (error) {
      console.error('Error accessing webcam:', error)
      alert('Error accessing webcam. Please make sure you have granted camera permissions.')
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setIsWebcamActive(false)
    }
  }

  const captureImage = async () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0)

    // Convert canvas to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))
    const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' })
    
    setSelectedFile(file)
    setUploadedImage(canvas.toDataURL('image/jpeg'))
  }

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Coffee Bean Quality Grader</h1>
        
        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Upload Image</h2>
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  setSelectedFile(file);
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    setUploadedImage(e.target.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">Click to select or drag and drop an image</p>
                <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, GIF</p>
              </div>
            </div>
            {uploadedImage && (
              <div className="mt-4 w-full max-w-md">
                <img
                  src={uploadedImage}
                  alt="Uploaded coffee beans"
                  className="w-full rounded-lg shadow-md"
                />
                <button
                  onClick={handleImageUpload}
                  className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Analyze Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Webcam Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Webcam Analysis</h2>
          <div className="flex flex-col items-center gap-4">
            {!isWebcamActive ? (
              <button
                onClick={startWebcam}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Start Webcam
              </button>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="max-w-md rounded-lg shadow-md"
                />
                <div className="flex gap-4">
                  <button
                    onClick={captureImage}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Capture Image
                  </button>
                  <button
                    onClick={stopWebcam}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Stop Webcam
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Analysis Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold">Quality Score</h3>
                <p className="text-2xl">{analysisResults.quality_score.toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold">Total Beans</h3>
                <p className="text-2xl">{analysisResults.total_beans}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold">Defective Beans</h3>
                <p className="text-2xl">{analysisResults.defective_beans}</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Detections</h3>
              <div className="space-y-2">
                {analysisResults.detections.map((detection, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded">
                    <p>Class: {detection.class}</p>
                    <p>Confidence: {(detection.confidence * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App 