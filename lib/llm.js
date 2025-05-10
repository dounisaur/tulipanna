import { ChatOpenAI } from "@langchain/openai";

const API_KEY = "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";

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

//const response = await model.invoke("Write me a recipe for banana bread");
//console.log(response.content);

//FOR model.stream / model.streamlog
/*
const response = await model.stream("Write me a Haiku poem");
for await(const chunk of response){
    console.log(chunk?.content);
}*/