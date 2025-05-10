import { ChatOpenAI } from "@langchain/openai";

const API_KEY = "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"

console.log("in LLM world");

const model = new ChatOpenAI({
    openAIApiKey: API_KEY,
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    maxTokens: 1000,
    verbose: true
});

export async function getLLMResponse(userMessage) {
    console.log("IN getLLMResponse");
    try {
        const response = await model.invoke(userMessage);
        return response.content;
    } catch (error) {
        console.error("Error getting LLM response:", error);
        return "Sorry, I encountered an error processing your request.";
    }
}

//DEMO's OF OTHER MODELS FOR OPENAI
//const response = await model.invoke("Write me a recipe for banana bread");
//console.log(response.content);

//FOR model.stream / model.streamlog
/*
const response = await model.stream("Write me a Haiku poem");
for await(const chunk of response){
    console.log(chunk?.content);
}*/