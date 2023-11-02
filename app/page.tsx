'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      <div className="container mx-auto px-10 md:px-28">
        <h1 className="text-4xl font-bold text-center pt-20 pb-6">20 Questions with a crypto-enabled LLM</h1>
        <h2 className="text-md md:text-xl font-light text-center pb-8 px-8 lg:px-26">I'm thinking of a word. You can ask up to 20 yes-or-no questions, like "Is it a type of machine?" If you can correctly guess the word, I'll send you a special NFT. Let's play.</h2>
        <p className="text-xs font-extralight text-gray-500 text-center px-8">
          This demo was built with just Next.js, OpenAI's API, and{' '}
          <a 
            href="https://syndicate.io"
            className="text-blue-500 hover:underline"
            target="_blank"
          >
            Syndicate's Transaction Cloud API
          </a>
        </p>
      </div>
      <div className="flex flex-col w-full max-w-md pt-20 pb-48 mx-auto stretch">
        {messages.length > 0
          ? messages.map((m, index) => (
              <div key={index} className="whitespace-pre-wrap py-1">
                {m.role === 'user' ? <span className="text-lg font-bold text-cyan-600">You: </span>: <span className="text-lg font-bold text-purple-600">LLM: </span>}
                {m.role === 'assistant' ? m.content : m.content}
              </div>
            ))
          : null}

        <form onSubmit={handleSubmit}>
          <input
            className="fixed bottom-10 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
            value={input}
            placeholder="Ask your question..."
            onChange={handleInputChange}
          />
        </form>
      </div>
    </div>
  );
}

