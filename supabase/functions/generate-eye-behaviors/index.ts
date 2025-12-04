// One-Time Eye Behavior Generation Function
// Run this once to generate the behavior library using OpenAI
// The output should be saved to src/lib/eyeBehaviorLibrary.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const systemPrompt = `You are an expert in creating emotionally intelligent AI eye behavior systems. Your task is to generate a comprehensive library of eye behavior scenarios for an AI assistant named AYN.

Each behavior should define:
1. A unique ID and descriptive name
2. Trigger conditions (what context triggers this behavior)
3. Eye behavior outputs (emotion, gaze pattern, blink pattern, pupil dilation, micro-movements)
4. Duration, cooldown, and transition speed

Available emotions: calm, happy, excited, thinking, curious, frustrated
Available gaze patterns: center, follow_mouse, wander, focus_input, look_away, scan_screen
Available blink patterns: none, normal, slow, rapid, double, sleepy
Available pupil states: contracted, normal, dilated, very_dilated
Available transition speeds: instant, fast, normal, slow

Context signals available:
- typingSpeed (chars/sec), typingPauseDuration (ms), deletionCount
- mouseDistanceFromEye (px), mouseVelocity (px/s), isMouseIdle
- idleDuration (ms), currentMode, lastAction, timeSinceLastAction (ms)
- messageCount, hasActiveResponse, isWaitingForResponse

Generate behaviors that make the eye feel:
- Emotionally intelligent and empathetic
- Responsive but not overwhelming
- Natural and human-like
- Contextually appropriate

Output valid JSON array of behavior objects.`;

const userPrompt = `Generate 50+ eye behavior scenarios covering these categories:

1. TYPING BEHAVIORS (10+)
   - Fast excited typing
   - Slow thoughtful typing
   - Hesitant/pausing typing
   - Frustrated deleting
   - Confident streaming

2. MOUSE BEHAVIORS (8+)
   - Mouse approaching eye
   - Mouse hovering over eye
   - Fast mouse movement
   - Mouse idle far away
   - Mouse circling eye

3. IDLE BEHAVIORS (8+)
   - Short idle (5-15s)
   - Medium idle (15-30s) - curious
   - Long idle (30s+) - sleepy
   - Check-in blink moments
   - Daydreaming wander

4. ACTION RESPONSE BEHAVIORS (10+)
   - Just sent message
   - Just received response
   - Waiting for response
   - Suggestion clicked
   - File uploaded
   - Mode changed
   - Error occurred

5. CONVERSATION CONTEXT (8+)
   - First interaction welcome
   - Deep conversation focus
   - Quick back-and-forth
   - User asking questions
   - User giving commands

6. MODE-SPECIFIC (6+)
   - Vision mode (visual scanning)
   - Research mode (deep focus)
   - Creative mode (energetic)
   - PDF mode (reading)
   - General mode (balanced)

Make each behavior feel distinct and purposeful. Include a default fallback behavior.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Generating eye behavior library...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Successfully generated behavior library');

    return new Response(JSON.stringify({ 
      success: true,
      behaviors: generatedContent,
      usage: data.usage,
      message: 'Save the behaviors array to src/lib/eyeBehaviorLibrary.ts'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating behaviors:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
