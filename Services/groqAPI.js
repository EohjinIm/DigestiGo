const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const sendMessageToGroq = async (messages, onStream) => {
    try {
        console.log('Sending request to Groq...');

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024,
                stream: true,
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        // Get the response as text
        const responseText = await response.text();
        console.log('Raw response length:', responseText.length);

        // Parse the server-sent events
        const lines = responseText.split('\n');
        let accumulatedContent = '';

        for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                    const jsonStr = line.substring(6); // Remove 'data: '
                    const data = JSON.parse(jsonStr);
                    const content = data.choices[0]?.delta?.content || '';

                    if (content) {
                        accumulatedContent += content;
                        onStream(accumulatedContent); // Send accumulated content
                    }
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                }
            }
        }

        console.log('Streaming complete');

    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
};

export const formatMessagesForGroq = (messages) => {
    return messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
    }));
};