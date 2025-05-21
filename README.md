# AI Coffee Bean Grader

A web application that uses computer vision to grade coffee beans based on their appearance. The application captures images of coffee beans and analyzes them for quality assessment.

## Features

- Real-time webcam capture of coffee beans
- AI-powered analysis of bean quality
- Detailed grading results including:
  - Overall quality score
  - Quality classification
  - Defect detection
- Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
```

## Usage

1. Allow camera access when prompted
2. Position coffee beans in view of the camera
3. Click "Grade Beans" to capture and analyze the image
4. View the grading results in the right panel

## Note

This is a prototype version. The actual coffee bean analysis is currently simulated. Integration with a real computer vision API is planned for future versions. 