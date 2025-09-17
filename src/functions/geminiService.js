const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: "./src/config/config.env" });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Load the healthcare prompt from prompt.txt file
 */
function loadHealthcarePrompt() {
  try {
    const promptPath = path.join(__dirname, '../../prompt.txt');
    const prompt = fs.readFileSync(promptPath, 'utf8');
    return prompt.trim();
  } catch (error) {
    console.log('Could not load prompt.txt, using default prompt');
    return "You are Denial Appeal Assistant, a healthcare outpatient clinic assistant and billing/coding expert. Your role is to analyze payer denials and chart documentation to determine the single best next step: Appeal, Corrected Claim, or Void Claim.";
  }
}


/**
 * Process base64 images for Gemini API
 */
async function processImages(base64Images) {
  const processedImages = [];
  
  for (const image of base64Images) {
    try {
      console.log(`Processing base64 image: ${image.originalname} (${image.type})`);
      
      processedImages.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType
        }
      });
      
      console.log(`Successfully processed image with mimeType: ${image.mimeType}`);
    } catch (error) {
      console.error(`Failed to process image ${image.originalname}:`, error.message);
      // Continue with other images even if one fails
    }
  }
  
  return processedImages;
}

/**
 * Send prompt to Gemini with optional base64 images
 */
async function sendPromptWithImagesGemini(promptText, base64Images = []) {
  try {
    console.log('=== GEMINI API CALL START ===');
    console.log('Model: gemini-2.0-flash-exp');
    console.log('Prompt text length:', promptText.length);
    console.log('Number of base64 images:', base64Images.length);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Prepare content array starting with text
    const content = [promptText];
    
    // Process and add images if provided
    if (base64Images.length > 0) {
      console.log('Processing base64 images for Gemini...');
      const processedImages = await processImages(base64Images);
      console.log(`Successfully processed ${processedImages.length} images`);
      
      // Add processed images to content array
      content.push(...processedImages);
    } else {
      console.log('No images to process');
    }
    
    console.log('Sending request to Gemini...');
    console.log('Content array length:', content.length);
    console.log('Content types:', content.map(item => 
      typeof item === 'string' ? 'text' : 'image'
    ));
    
    const startTime = Date.now();
    
    // Send request to Gemini
    const result = await model.generateContent(content);
    const response = await result.response;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Gemini API call completed in ${duration}ms`);
    console.log('Response candidates:', result.response.candidates?.length || 0);
    
    const responseText = response.text();
    console.log('=== GEMINI API CALL END ===');
    
    return responseText;
    
  } catch (error) {
    console.error('=== GEMINI API ERROR ===');
    console.error('Error calling Gemini API:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    console.error('=== END GEMINI API ERROR ===');
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

/**
 * Analyze case with Gemini AI
 */
async function analyzeCaseWithGemini(caseData, base64Images = []) {
  try {
    console.log('=== GEMINI ANALYSIS START ===');
    console.log('Case Data received:', JSON.stringify(caseData, null, 2));
    console.log('Base64 images count:', base64Images.length);
    
    // Load the healthcare prompt
    const basePrompt = loadHealthcarePrompt();
    console.log('Base prompt loaded, length:', basePrompt.length);
    
    // Prepare the form data prompt
    const formDataPrompt = `
    
    CLAIM INFORMATION:
    Current Claim: ${caseData.currentClaim}
    Previous Claim DOS: ${caseData.previousClaimDOS || 'Not provided'}
    Previous Claim CPT: ${caseData.previousClaimCPT || 'Not provided'}
    Primary Payer: ${caseData.primaryPayer}
    
    DENIAL INFORMATION:
    ${caseData.denialText || 'No denial text provided - check uploaded denial screenshots for denial reason codes'}
    
    ENCOUNTER INFORMATION:
    ${caseData.encounterText || 'No encounter text provided - check uploaded encounter screenshots for chart documentation'}
    
    DIAGNOSIS INFORMATION:
    ${caseData.diagnosisText || 'No diagnosis text provided - check uploaded diagnosis screenshots for diagnosis codes and pointers'}
    
    UPLOADED IMAGES:
    - Total Images: ${base64Images.length}
    - Denial Screenshots: ${base64Images.filter(img => img.type === 'denial').length} images (should contain Remittance Advice with reason/remark codes)
    - Encounter Screenshots: ${base64Images.filter(img => img.type === 'encounter').length} images (should contain chart/documentation for the DOS)
    - Diagnosis Screenshots: ${base64Images.filter(img => img.type === 'diagnosis').length} images (should contain diagnosis codes and pointers)
    
    IMPORTANT: Analyze the uploaded images along with the provided text information. The images may contain critical information that is not in the text fields. Look for:
    - Denial reason codes and remark codes in denial screenshots
    - Chart documentation and clinical notes in encounter screenshots  
    - Diagnosis codes and diagnosis pointers in diagnosis screenshots
    - Claim form details showing CPTs, modifiers, units, and diagnosis pointers
    
    Based on ALL available information (text + images), determine the best next step: Appeal, Corrected Claim, or Void Claim.
    `;
    
    const fullPrompt = basePrompt ;
    
    console.log('=== GEMINI INPUT PROMPT ===');
    console.log('Full prompt length:', fullPrompt.length);
    console.log('Full prompt content:');
    console.log(fullPrompt);
    console.log('=== END GEMINI INPUT ===');
    
    // Log image details
    console.log('Base64 images details:');
    base64Images.forEach((img, index) => {
      console.log(`Image ${index + 1}: ${img.originalname} (${img.type}) - ${img.mimeType}`);
    });
    
    // Send to Gemini
    console.log('Sending request to Gemini API...');
    const response = await sendPromptWithImagesGemini(fullPrompt, base64Images);
    
    console.log('=== GEMINI OUTPUT ===');
    console.log('Response length:', response.length);
    console.log('Raw response:');
    console.log(response);
    console.log('=== END GEMINI OUTPUT ===');
    
    // Try to parse as JSON to validate structure
    try {
      let jsonString = response;
      
      // Check if response is wrapped in markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
        console.log('Extracted JSON from markdown code block');
        console.log('Extracted JSON string:', jsonString);
      }
      
      const parsedResponse = JSON.parse(jsonString);
      console.log('Successfully parsed JSON response:', JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.log('Response is not valid JSON, treating as text:', parseError.message);
      console.log('Raw response for debugging:', response);
      
      // Try alternative JSON extraction methods
      try {
        // Try to find JSON without markdown
        const jsonMatch2 = response.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          const jsonString2 = jsonMatch2[0];
          console.log('Trying alternative JSON extraction:', jsonString2);
          const parsedResponse2 = JSON.parse(jsonString2);
          console.log('Successfully parsed with alternative method:', JSON.stringify(parsedResponse2, null, 2));
        }
      } catch (altError) {
        console.log('Alternative JSON extraction also failed:', altError.message);
      }
    }
    
    console.log('=== GEMINI ANALYSIS END ===');
    
    return response;
    
  } catch (error) {
    console.error('Error in analyzeCaseWithGemini:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = {
  analyzeCaseWithGemini,
  sendPromptWithImagesGemini,
  loadHealthcarePrompt
};
