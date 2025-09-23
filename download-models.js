const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'client', 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

async function downloadModel(modelName) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + modelName;
    const filePath = path.join(modelsDir, modelName);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${modelName} already exists`);
      resolve();
      return;
    }
    
    console.log(`Downloading ${modelName}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${modelName}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${modelName}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete incomplete file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllModels() {
  console.log('Starting face-api.js models download...');
  
  try {
    for (const model of models) {
      await downloadModel(model);
    }
    console.log('\n🎉 All models downloaded successfully!');
    console.log('You can now use real facial recognition in the app.');
  } catch (error) {
    console.error('❌ Error downloading models:', error.message);
    console.log('\n⚠️  Models download failed. The app will use fallback detection.');
  }
}

downloadAllModels();
