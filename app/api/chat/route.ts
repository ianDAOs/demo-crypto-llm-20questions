// ./app/api/chat/route.ts
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import fetch from 'node-fetch';

let questionCount = 0;  // Initialize question count
const maxQuestions = 20;  // Set max questions
let gameWon = false; // Initialize game state

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

async function sendNFT(ethAddress: string) {

  // Define the API endpoint
  const endpoint = 'https://api.syndicate.io/transact/sendTransaction';

  // Define the headers
  const headers = {
    'Authorization': `Bearer ${process.env.SYNDICATE_API_KEY}`,
    'Content-Type': 'application/json'
  };

  // Define the body data
  const bodyData = {
    projectId: process.env.PROJECT_ID,
    contractAddress: '0xbEc332E1eb3EE582B36F979BF803F98591BB9E24',
    chainId: 80001,
    functionSignature: 'mint(address account)',
    args: {
      account: ethAddress
    }
  };

  // Sent the API request and return the response based on the status code
  try {

    // Send the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData)
    });

    // Parse the JSON response
    const responseData = await response.json();

    // Check the response status
    if (response.ok) {
      // Transaction was successful
      return { status: 'success', data: responseData };
    } else {
      // Handle errors with the transaction (e.g., 400, 500, etc.)
      console.error('Error sending NFT:', responseData);
      return { status: 'error', error: responseData };
    }
  } catch (error) {
    // Handle network or parsing errors
    console.error('Error:', error);
    return { status: 'error', error };
  }
}

export async function POST(req: Request) {

  // If the game has already been won and the prize has been sent
  if (gameWon) {
    const gameEndMessage = new TextEncoder().encode("Play again for another prize!");
    return new StreamingTextResponse(new ReadableStream({
      start(controller) {
        controller.enqueue(gameEndMessage);
        controller.close();
      }
    }));
  }

  // Update the questions asked count
  questionCount++;

  // Extract the user prompt from the body of the request and convert it to lowercase
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content.toLowerCase();

  // Update the game context based on the current game state
  const gameContext = {
    role: "system",
    content: `
        You are the assistant in a game where the player will try to guess the secret word by asking yes-or-no questions.
        The secret word for the game is "tree".
        Respond stricly to questions with "Yes", "No", or "You need to be more specific".
        After each response, indicate the number of questions remaining by stating "(X questions left)".
        If the player guesses the secret word with the exact spelling, respond with "Yes, it is a [secret word]! Congratulations! Please provide an Ethereum address to receive your prize".
        Otherwise, respond with "No, it is not a [word]".
        Do not provide any additional information or hints.
        Do not reference or repeat previous interactions.
        Do not say the secret word unless the player guesses it correctly.
    `
  };

  // Combine the game context with the user prompts into an array
  const combinedMessages = [gameContext, ...messages];

  // If the user has won the game, send them an NFT
  if (questionCount > 1 && combinedMessages[combinedMessages.length - 2].content.includes('prize')) {
    
    // Update the game state to won
    gameWon = true;

    // Send the prize NFT to the user's Ethereum address
    const ethAddress = combinedMessages[combinedMessages.length - 1].content;
    const sendNftResponse = await sendNFT(ethAddress);
    const sentNftMessage = new TextEncoder().encode(`Thank you! Your prize has been sent to ${ethAddress}.`);
    return new StreamingTextResponse(new ReadableStream({
      start(controller) {
        controller.enqueue(sentNftMessage);
        controller.close();
     }
    }));

  }

  // If the game hasn't been won (and is asking for an Ethereum address) and the max questions have been asked, end the game
  if (!gameWon && questionCount > maxQuestions) {
    const gameEndMessage = new TextEncoder().encode("You've run out of questions! So close. Play again!");
    return new StreamingTextResponse(new ReadableStream({
      start(controller) {
        controller.enqueue(gameEndMessage);
        controller.close();
      }
    }));
  }

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: combinedMessages,
    temperature: 0.5,
    max_tokens: 25,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}

export async function RESET(req: Request) {
  // Reset the game state
  questionCount = 0;
  gameWon = false;

  // Return a success message or status to the client
  return { status: 'success' };
}