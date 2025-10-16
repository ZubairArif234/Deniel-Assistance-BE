const OpenAI = require("openai");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: "./src/config/config.env" });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Load the healthcare prompt from prompt.txt file
 */
function loadHealthcarePrompt() {
  try {
    const promptPath = path.join(__dirname, "../../prompt.txt");
    const prompt = fs.readFileSync(promptPath, "utf8");
    return prompt.trim();
  } catch (error) {
    console.log("Could not load prompt.txt, using default prompt");
    return "You are Denial Appeal Assistant, a healthcare outpatient clinic assistant and billing/coding expert. Your role is to analyze payer denials and chart documentation to determine the single best next step: Appeal, Corrected Claim, or Void Claim.";
  }
}

/**
 * Process base64 images for OpenAI API
 */
async function processImages(base64Images) {
  const processedImages = [];
  
  for (const image of base64Images) {
    try {
      console.log(`Processing base64 image: ${image.originalname} (${image.type})`);
      
      // Handle different possible base64 formats
      let base64Data = image.base64 || image.data;
      
      // Remove any existing data URI prefix if present
      if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
      }
      
      // Remove any whitespace or newlines
      base64Data = base64Data.replace(/\s/g, '');
      
      // Reconstruct with proper data URI format
      const dataUri = `data:${image.mimeType};base64,${base64Data}`;
      
      // Log first 100 chars to verify format
      console.log(`Data URI format: ${dataUri.substring(0, 100)}...`);
      console.log(`Base64 data length: ${base64Data.length}`);
      
      processedImages.push({
        type: "image_url",
        image_url: {
          url: dataUri,
          detail: "high" // Use "high" for detailed medical document analysis
        }
      });
      
      console.log(`Successfully processed image with mimeType: ${image.mimeType}`);
    } catch (error) {
      console.error(`Failed to process image ${image.originalname}:`, error.message);
      console.error(`Image object keys:`, Object.keys(image));
      // Continue with other images even if one fails
    }
  }
  
  console.log(`Total processed images: ${processedImages.length}`);
  return processedImages;
}

/**
 * Send prompt to OpenAI with optional base64 images
 */
async function sendPromptWithImagesOpenAI(promptText, base64Images = []) {
  try {
    console.log("=== OPENAI API CALL START ===");
    console.log("Model: gpt-4o"); // Changed to gpt-4o for better vision
    console.log("Prompt text length:", promptText.length);
    console.log("Number of base64 images:", base64Images.length);
    
    // Prepare content array starting with text
    const contentArray = [
      {
        type: "text",
        text: promptText
      }
    ];
    
    // Process and add images if provided
    if (base64Images.length > 0) {
      console.log("Processing base64 images for OpenAI...");
      const processedImages = await processImages(base64Images);
      console.log(`Successfully processed ${processedImages.length} images`);
      
      if (processedImages.length === 0) {
        console.warn("WARNING: No images were successfully processed!");
      }
      
      // Add processed images to content array
      contentArray.push(...processedImages);
    } else {
      console.log("No images to process");
    }
    
    console.log("Sending request to OpenAI...");
    console.log("Content array length:", contentArray.length);
    console.log("Content types:", contentArray.map(item => item.type));
    
    const startTime = Date.now();
    
    // Send request to OpenAI with gpt-4o (better vision)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o instead of gpt-4o-mini for better vision
      messages: [
        {
          role: "system",
          content: "You are Denial Appeal Assistant, a healthcare billing/coding expert specialized in payer denial analysis. You MUST carefully read and analyze ALL uploaded images along with the text. The images contain critical medical billing information including denial codes, chart documentation, and diagnosis codes that you need to extract and analyze."
        },
        {
          role: "user",
          content: contentArray
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`OpenAI API call completed in ${duration}ms`);
    console.log("Response choices:", completion.choices?.length || 0);
    console.log("Finish reason:", completion.choices[0]?.finish_reason);
    
    const responseText = completion.choices[0].message.content.trim();
    console.log("=== OPENAI API CALL END ===");
    
    return responseText;
    
  } catch (error) {
    console.error("=== OPENAI API ERROR ===");
    console.error("Error calling OpenAI API:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error status:", error.status);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    console.error("=== END OPENAI API ERROR ===");
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Analyze case with OpenAI
 */
async function analyzeCaseWithOpenAI(caseData, base64Images = []) {
  try {
    console.log("=== OPENAI ANALYSIS START ===");
    console.log("Case Data received:", JSON.stringify(caseData, null, 2));
    console.log("Base64 images count:", base64Images.length);
    
    // Load the healthcare prompt
    const basePrompt = loadHealthcarePrompt();
    console.log("Base prompt loaded, length:", basePrompt.length);
    
    // Prepare the form data prompt
    const formDataPrompt = `
    
CLAIM INFORMATION:
Current Claim: ${caseData.currentClaim}
Previous Claim DOS: ${caseData.previousClaimDOS || "Not provided"}
Previous Claim CPT: ${caseData.previousClaimCPT || "Not provided"}
Primary Payer: ${caseData.primaryPayer}

DENIAL INFORMATION:
${caseData.denialText || "No denial text provided - check uploaded denial screenshots for denial reason codes"}

ENCOUNTER INFORMATION:
${caseData.encounterText || "No encounter text provided - check uploaded encounter screenshots for chart documentation"}

DIAGNOSIS INFORMATION:
${caseData.diagnosisText || "No diagnosis text provided - check uploaded diagnosis screenshots for diagnosis codes and pointers"}

UPLOADED IMAGES:
- Total Images: ${base64Images.length}
- Denial Screenshots: ${base64Images.filter(img => img.type === "denial").length} images (should contain Remittance Advice with reason/remark codes)
- Encounter Screenshots: ${base64Images.filter(img => img.type === "encounter").length} images (should contain chart/documentation for the DOS)
- Diagnosis Screenshots: ${base64Images.filter(img => img.type === "diagnosis").length} images (should contain diagnosis codes and pointers)

IMPORTANT: Analyze the uploaded images along with the provided text information. The images may contain critical information that is not in the text fields. Look for:
- Denial reason codes and remark codes in denial screenshots
- Chart documentation and clinical notes in encounter screenshots  
- Diagnosis codes and diagnosis pointers in diagnosis screenshots
- Claim form details showing CPTs, modifiers, units, and diagnosis pointers

Based on ALL available information (text + images), determine the best next step: Appeal, Corrected Claim, or Void Claim.

Return your answer in **valid JSON** format as:
{
  "decision": "Appeal" | "Corrected Claim" | "Void Claim",
  "reason": "Explain why this is the best choice based on the denial codes, chart documentation, and diagnosis information",
  "improvements": ["List any recommendations or corrections needed"]
}
`;
    
    const fullPrompt = basePrompt + formDataPrompt;
    
    console.log("=== OPENAI INPUT PROMPT ===");
    console.log("Full prompt length:", fullPrompt.length);
    console.log("Full prompt content:");
    console.log(fullPrompt);
    console.log("=== END OPENAI INPUT ===");
    
    // Log image details
    console.log("Base64 images details:");
    base64Images.forEach((img, index) => {
      console.log(`Image ${index + 1}: ${img.originalname} (${img.type}) - ${img.mimeType}`);
      console.log(`  - Has base64 property: ${!!img.base64}`);
      console.log(`  - Has data property: ${!!img.data}`);
      console.log(`  - Base64 length: ${(img.base64 || img.data || '').length}`);
    });
    
    // Send to OpenAI
    console.log("Sending request to OpenAI API...");
    const response = await sendPromptWithImagesOpenAI(fullPrompt, base64Images);
    
    console.log("=== OPENAI OUTPUT ===");
    console.log("Response length:", response.length);
    console.log("Raw response:");
    console.log(response);
    console.log("=== END OPENAI OUTPUT ===");
    
    // Try to parse as JSON to validate structure
    try {
      let jsonString = response;
      
      // Check if response is wrapped in markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
        console.log("Extracted JSON from markdown code block");
        console.log("Extracted JSON string:", jsonString);
      }
      
      const parsedResponse = JSON.parse(jsonString);
      console.log("Successfully parsed JSON response:", JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.log("Response is not valid JSON, treating as text:", parseError.message);
      console.log("Raw response for debugging:", response);
      
      // Try alternative JSON extraction methods
      try {
        // Try to find JSON without markdown
        const jsonMatch2 = response.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          const jsonString2 = jsonMatch2[0];
          console.log("Trying alternative JSON extraction:", jsonString2);
          const parsedResponse2 = JSON.parse(jsonString2);
          console.log("Successfully parsed with alternative method:", JSON.stringify(parsedResponse2, null, 2));
        }
      } catch (altError) {
        console.log("Alternative JSON extraction also failed:", altError.message);
      }
    }
    
    console.log("=== OPENAI ANALYSIS END ===");
    
    return response;
    
  } catch (error) {
    console.error("Error in analyzeCaseWithOpenAI:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

module.exports = {
  analyzeCaseWithOpenAI,
  sendPromptWithImagesOpenAI,
  loadHealthcarePrompt
};