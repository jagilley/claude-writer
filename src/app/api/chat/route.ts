import { NextRequest, NextResponse } from 'next/server';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { ModelSettings } from '@/lib/types';

export const maxDuration = 300; // 5 minutes max for streaming responses

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      documentContent,
      documentPath,
      selectedText,
      chatHistory,
      modelSettings
    }: {
      prompt: string;
      documentContent: string;
      documentPath: string;
      selectedText?: string;
      chatHistory: Array<{ role: string; content: string }>;
      modelSettings: ModelSettings;
    } = await request.json();

    // Build the system context
    let systemContext = `You are an AI writing assistant helping with creative writing. You are working on a document located at: ${documentPath}

The current document content is:
<document>
${documentContent}
</document>
`;

    if (selectedText) {
      systemContext += `
The user has selected the following text for focused editing:
<selected_text>
${selectedText}
</selected_text>
`;
    }

    // Build the full prompt with chat history context
    let fullPrompt = systemContext + '\n\n';

    if (chatHistory && chatHistory.length > 0) {
      fullPrompt += 'Previous conversation:\n';
      for (const msg of chatHistory) {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }
      fullPrompt += '\n';
    }

    fullPrompt += `User: ${prompt}\n\nAssistant:`;

    // Build query options based on model settings
    const queryOptions: Record<string, unknown> = {
      allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep'],
      model: modelSettings.modelId || 'claude-sonnet-4-20250514',
      permissionMode: 'acceptEdits',
    };

    // Add thinking configuration if enabled
    if (modelSettings.thinkingMode === 'enabled') {
      queryOptions.thinking = {
        type: 'enabled',
        budget_tokens: modelSettings.thinkingBudget || 10000,
      };
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const message of query({
            prompt: fullPrompt,
            options: queryOptions,
          })) {
            // Handle different message types from the SDK
            if ('type' in message) {
              if (message.type === 'assistant' && 'content' in message) {
                // Extract text content from the message
                const content = message.content;
                if (Array.isArray(content)) {
                  for (const block of content) {
                    if (block.type === 'text') {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`));
                    } else if (block.type === 'thinking') {
                      // Stream thinking content with a different type
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'thinking', content: block.thinking })}\n\n`));
                    } else if (block.type === 'tool_use') {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_use', tool: block.name, input: block.input })}\n\n`));
                    }
                  }
                }
              } else if (message.type === 'result') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'result', content: (message as { result?: string }).result })}\n\n`));
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: String(error) })}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
