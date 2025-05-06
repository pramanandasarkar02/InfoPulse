import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyDXCaA27v-tNLfCmJ3I9sHgux8Rhd_9K74"

async function summarizeText(text) {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Please summarize the following text: ${text}`;

  try {
    const result = await model.generateContent(prompt);
    const summary = result.response.candidates[0].content.parts[0].text;
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}

// Example usage:
const longText = `This is a very long paragraph of text that needs to be summarized. It contains many details and explanations about a certain topic. The goal is to extract the most important information and present it in a concise and easy-to-understand manner. Summarization can be useful in various situations, such as quickly grasping the main points of a document or creating brief overviews for reports and presentations. The Gemini API provides powerful capabilities for natural language processing, including text summarization, making it a valuable tool for developers looking to integrate AI into their applications.`;

summarizeText(longText).then(summary => {
  if (summary) {
    console.log("Generated Summary:", summary);
  }
});