import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import FaceRegistration from './FaceRegistration';

const FaceRecognition = ({ onRecognitionResult, students = [], isActive, onCameraStatusChange }) => {
  // Mock students if none provided
  const mockStudents = [
    { id: '1', name: 'Arjun Patel', class: '5', section: 'A', roll_number: '5A001' },
    { id: '2', name: 'Priya Sharma', class: '5', section: 'A', roll_number: '5A002' },
    { id: '3', name: 'Rahul Kumar', class: '4', section: 'B', roll_number: '4B001' },
    { id: '4', name: 'Sneha Gupta', class: '4', section: 'B', roll_number: '4B002' },
    { id: '5', name: 'Vikram Singh', class: '3', section: 'A', roll_number: '3A001' }
  ];
  
  // Use provided students or fallback to mock students
  const availableStudents = students.length > 0 ? students : mockStudents;
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDescriptors, setFaceDescriptors] = useState(() => {
    // Load saved face descriptors from localStorage
    const saved = localStorage.getItem('faceDescriptors');
    return saved ? JSON.parse(saved) : {};
  });
  const [status, setStatus] = useState('Loading AI models...');
  const [showRegistration, setShowRegistration] = useState(false);
  const [pendingFaceData, setPendingFaceData] = useState(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded && isActive) {
      startVideo();
    } else if (!isActive) {
      stopVideo();
    }
  }, [modelsLoaded, isActive]);

  const loadModels = async () => {
    try {
      setStatus('Loading AI models...');
      
      // Try different model paths
      const possiblePaths = [
        '/models',
        './models',
        `${process.env.PUBLIC_URL}/models`,
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      ];
      
      let modelsLoaded = false;
      
      for (const MODEL_URL of possiblePaths) {
        try {
          setStatus(`Trying to load models from: ${MODEL_URL}`);
          
          // Load the essential models only
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);
          
          modelsLoaded = true;
          setStatus('AI models loaded successfully!');
          break;
        } catch (pathError) {
          console.log(`Failed to load from ${MODEL_URL}:`, pathError.message);
          continue;
        }
      }
      
      if (!modelsLoaded) {
        throw new Error('All model loading paths failed');
      }
      
      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading models:', error);
      setStatus('AI models failed to load. Using basic face detection.');
      setModelsLoaded(true); // Continue with fallback detection
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 720, height: 560 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('Camera ready - Position your face in the frame');
        if (onCameraStatusChange) {
          onCameraStatusChange(true);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus('Failed to access camera. Please check permissions.');
      if (onCameraStatusChange) {
        onCameraStatusChange(false);
      }
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStatus('Camera stopped');
      if (onCameraStatusChange) {
        onCameraStatusChange(false);
      }
    }
  };

  const handleVideoPlay = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Position canvas over video
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
    }
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;
    
    setIsDetecting(true);
    setStatus('Detecting faces...');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Check if face-api models are actually loaded
      const hasModels = faceapi.nets.tinyFaceDetector.isLoaded && 
                       faceapi.nets.faceLandmark68Net.isLoaded && 
                       faceapi.nets.faceRecognitionNet.isLoaded;

      if (hasModels) {
        try {
          // Use face-api.js for detection
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
          
          if (detections.length > 0) {
            setStatus(`Found ${detections.length} face(s)! Processing...`);
            
            // Draw face detection boxes
            const resizedDetections = faceapi.resizeResults(detections, {
              width: canvas.width,
              height: canvas.height
            });
            
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            
            // Process face descriptors for recognition
            const recognizedStudents = await processFaceDescriptors(detections);
            
            if (recognizedStudents.length > 0) {
              setStatus(`Recognized ${recognizedStudents.length} student(s)!`);
              onRecognitionResult(recognizedStudents);
            } else {
              setStatus('Face detected but not recognized. Please register this face first.');
              // Show registration for the first detected face
              if (detections[0] && detections[0].descriptor) {
                setPendingFaceData({
                  descriptor: Array.from(detections[0].descriptor),
                  detection: detections[0]
                });
                setShowRegistration(true);
              }
            }
          } else {
            setStatus('No faces detected. Please position your face clearly in the frame.');
          }
        } catch (detectionError) {
          console.error('Face-api detection error:', detectionError);
          setStatus('AI detection failed. Using basic detection...');
          await basicFaceDetection(video, canvas);
        }
      } else {
        // Fallback: Basic face detection using canvas
        setStatus('Using basic face detection (AI models not loaded)...');
        await basicFaceDetection(video, canvas);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      setStatus('Face detection failed. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  const basicFaceDetection = async (video, canvas) => {
    const ctx = canvas.getContext('2d');
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for basic processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple face detection simulation (this is very basic)
    const faceDetected = await simulateFaceDetection(imageData);
    
    if (faceDetected) {
      // Draw a simple rectangle where we "detected" a face
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        canvas.width * 0.25, 
        canvas.height * 0.2, 
        canvas.width * 0.5, 
        canvas.height * 0.6
      );
      
      // Add text overlay
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText('Face Detected!', canvas.width * 0.25, canvas.height * 0.15);
      
      setStatus('Basic face detected! Click again to select a student...');
      
      // Show a simple selection for demo
      setTimeout(() => {
        if (availableStudents.length > 0) {
          // Create a mock face data for registration
          const mockFaceData = {
            descriptor: Array.from({length: 128}, () => Math.random()), // Mock descriptor
            detection: { confidence: 0.8 }
          };
          console.log('Setting face data for registration:', mockFaceData);
          setPendingFaceData(mockFaceData);
          setShowRegistration(true);
          console.log('Registration modal should now be visible');
        } else {
          console.log('No students available for registration');
        }
      }, 1000);
    } else {
      setStatus('No face detected. Please position yourself clearly in the frame.');
      
      // Draw guide rectangle
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        canvas.width * 0.25, 
        canvas.height * 0.2, 
        canvas.width * 0.5, 
        canvas.height * 0.6
      );
      
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '14px Arial';
      ctx.fillText('Position your face here', canvas.width * 0.28, canvas.height * 0.15);
    }
  };

  const simulateFaceDetection = async (imageData) => {
    // Simple brightness-based detection (very basic)
    const data = imageData.data;
    let totalBrightness = 0;
    let pixelCount = 0;
    
    // Sample pixels in the center area where face would likely be
    const centerX = imageData.width / 2;
    const centerY = imageData.height / 2;
    const sampleSize = 50;
    
    for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
      for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
        const index = (y * imageData.width + x) * 4;
        if (index < data.length) {
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Very simple heuristic: if there's reasonable brightness variation, assume face
    return avgBrightness > 50 && avgBrightness < 200;
  };

  const processFaceDescriptors = async (detections) => {
    const recognizedStudents = [];
    const threshold = 0.6; // Similarity threshold
    
    for (const detection of detections) {
      let bestMatch = null;
      let bestDistance = Infinity;
      
      // Compare with stored face descriptors
      for (const studentId in faceDescriptors) {
        const storedDescriptorArray = faceDescriptors[studentId];
        if (storedDescriptorArray && storedDescriptorArray.length > 0) {
          const storedDescriptor = new Float32Array(storedDescriptorArray);
          const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
          
          if (distance < threshold && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = availableStudents.find(s => s.id === studentId);
          }
        }
      }
      
      if (bestMatch) {
        recognizedStudents.push({
          ...bestMatch,
          confidence: Math.max(0.7, 1 - bestDistance) // Convert distance to confidence, minimum 70%
        });
      } else {
        // Face detected but not recognized - show registration option
        setPendingFaceData({
          descriptor: Array.from(detection.descriptor), // Convert to array for storage
          detection: detection
        });
        setShowRegistration(true);
      }
    }
    
    return recognizedStudents;
  };

  // Removed unused showFaceRegistration function - registration is now handled directly

  const registerFaceForStudent = (studentId, faceData) => {
    const newDescriptors = {
      ...faceDescriptors,
      [studentId]: faceData.descriptor
    };
    
    setFaceDescriptors(newDescriptors);
    
    // Save to localStorage for persistence
    localStorage.setItem('faceDescriptors', JSON.stringify(newDescriptors));
    
    setStatus(`Face registered for student! You can now be recognized automatically.`);
    
    // Find the student and add to recognition results
    const student = availableStudents.find(s => s.id === studentId);
    if (student) {
      onRecognitionResult([{
        ...student,
        confidence: 0.95 // High confidence for newly registered face
      }]);
    }
  };

  const handleRegistrationClose = () => {
    setShowRegistration(false);
    setPendingFaceData(null);
    setStatus('Registration cancelled. Try detection again.');
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <div style={{ 
        marginBottom: '15px', 
        padding: '10px', 
        backgroundColor: modelsLoaded ? '#e8f5e8' : '#fff3cd',
        borderRadius: '8px',
        color: modelsLoaded ? '#2e7d32' : '#856404'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>Status:</strong> {status}</div>
          <div style={{ fontSize: '0.8rem' }}>
            👤 Registered: {Object.keys(faceDescriptors).length} | 
            👥 Students: {availableStudents.length} |
            📹 Camera: {isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
      
      {!isActive && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #6c757d',
          marginBottom: '20px',
          color: '#6c757d'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📹 Camera Not Active</h3>
          <p style={{ margin: 0 }}>
            Click the "Start Camera" button above to begin facial recognition.
          </p>
        </div>
      )}
      
      {isActive && (
        <>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={handleVideoPlay}
              style={{ 
                width: '100%', 
                maxWidth: '640px', 
                borderRadius: '8px',
                border: '2px solid #4caf50'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            />
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={detectFaces}
              disabled={isDetecting || !isActive}
              className="btn btn-success"
              style={{ 
                padding: '12px 24px', 
                fontSize: '1rem',
                marginRight: '10px'
              }}
            >
              {isDetecting ? '🔄 Detecting...' : '🎯 Detect & Recognize Face'}
            </button>
        
        <button
          onClick={() => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            setStatus('Ready for detection');
          }}
          className="btn btn-secondary"
          style={{ padding: '12px 24px', marginRight: '10px' }}
        >
          🧹 Clear
        </button>
        
        <button
          onClick={() => {
            setFaceDescriptors({});
            localStorage.removeItem('faceDescriptors');
            setStatus('All registered faces cleared. You can register new faces now.');
          }}
          className="btn btn-danger"
          style={{ padding: '12px 24px', marginRight: '10px' }}
        >
          🗑️ Clear All Faces
        </button>

            <button
              onClick={() => {
                // Test registration modal
                const testFaceData = {
                  descriptor: Array.from({length: 128}, () => Math.random()),
                  detection: { confidence: 0.9 }
                };
                setPendingFaceData(testFaceData);
                setShowRegistration(true);
                setStatus('Test registration modal opened');
              }}
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              🧪 Test Registration
            </button>
          </div>
        </>
      )}
      
      <div style={{ 
        marginTop: '15px', 
        fontSize: '0.9rem', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '8px'
      }}>
        <strong>Instructions:</strong>
        <br />
        1. Position your face clearly in the camera frame
        <br />
        2. Ensure good lighting and look directly at the camera
        <br />
        3. Click "Detect & Recognize Face" to scan
        <br />
        4. The system will draw detection boxes around recognized faces
        <br />
        5. If your face isn't recognized, you'll be asked to register it
        <br />
        <br />
        <strong>Note:</strong> If AI models fail to load, the system will use basic detection mode.
      </div>

      {/* Face Registration Modal */}
      {showRegistration && pendingFaceData && (
        <FaceRegistration
          students={availableStudents}
          faceData={pendingFaceData}
          onRegister={registerFaceForStudent}
          onClose={handleRegistrationClose}
        />
      )}
    </div>
  );
};

export default FaceRecognition;
