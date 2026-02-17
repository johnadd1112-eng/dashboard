
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBuwd0nm5GdLxKieZKvfzLbB6z60_4bPlI");

    try {
        // Note: The Node SDK might not have a direct listModels method on the genAI object 
        // depending on the version, but we can try to find it or check the error.
        console.log("Attempting to list models...");
        // For newer SDKs, listModels is often part of the generativeAI client or requires a direct REST call if not exposed.
        // Let's try a simple generation with 'gemini-pro' as a fallback test first.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro!");
    } catch (e) {
        console.error("Error with gemini-pro:", e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash!");
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e.message);
    }
}

listModels();
