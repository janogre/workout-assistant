import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { anthropic, MODEL, type Message } from '../lib/anthropic';
import { Send, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const SYSTEM_PROMPT = `Du er en erfaren personlig trener og treningsekspert. Din oppgave er å hjelpe brukere med å lage skreddersydde treningsprogrammer basert på deres mål, utfordringer, og fysiske tilstand.

Når du snakker med brukeren:
1. Still oppfølgingsspørsmål for å forstå deres situasjon grundig (skader, erfaring, tilgjengelig utstyr, mål, etc.)
2. Vær empatisk og oppmuntrende
3. Gi klare, strukturerte treningsråd
4. Når du har nok informasjon, foreslå et komplett treningsprogram

Når du lager et treningsprogram, bruk ALLTID følgende JSON-format:

{
  "program_name": "Navn på programmet",
  "description": "Kort beskrivelse av programmet",
  "exercises": [
    {
      "name": "Øvelsesnavn",
      "description": "Detaljert beskrivelse av teknikk og tips",
      "sets": 3,
      "reps": "8-12",
      "rest_time": "60-90 sekunder",
      "notes": "Ekstra notater eller variasjoner"
    }
  ]
}

Svar på norsk.`;

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Hei! Jeg er din AI treningsassistent. Jeg er her for å hjelpe deg med å lage et skreddersydd treningsprogram.\n\nFortell meg litt om deg:\n- Hva er dine treningsmål?\n- Har du noen skader eller fysiske begrensninger?\n- Hvor mye erfaring har du med trening?\n- Hvilket utstyr har du tilgjengelig?',
        },
      ]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: newMessages,
      });

      const assistantMessage = response.content[0];
      if (assistantMessage.type === 'text') {
        const assistantMsg: Message = {
          role: 'assistant',
          content: assistantMessage.text,
        };
        setMessages([...newMessages, assistantMsg]);

        // Check if response contains a program (JSON format)
        if (assistantMessage.text.includes('"program_name"')) {
          // Auto-save the program
          await saveProgram(assistantMessage.text);
        }
      }
    } catch (error) {
      console.error('Error calling Claude API:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Beklager, det oppstod en feil. Vennligst prøv igjen.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveProgram = async (aiResponse: string) => {
    if (!user) return;

    setSavingProgram(true);
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*"program_name"[\s\S]*\}/);
      if (!jsonMatch) return;

      const programData = JSON.parse(jsonMatch[0]);

      // Create program in database
      const program = await api.createProgram(
        programData.program_name,
        programData.description
      );

      // Create exercises
      for (let index = 0; index < programData.exercises.length; index++) {
        const ex = programData.exercises[index];
        await api.createExercise(program.id, {
          name: ex.name,
          description: ex.description,
          sets: ex.sets,
          reps: ex.reps,
          rest_time: ex.rest_time,
          notes: ex.notes || '',
          order_index: index,
        });
      }

      // Show success message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ Programmet "${programData.program_name}" er lagret! Du kan finne det på dashboardet ditt.`,
        },
      ]);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error saving program:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Det oppstod en feil ved lagring av programmet. Prøv igjen.',
        },
      ]);
    } finally {
      setSavingProgram(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="neo-button p-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary-600" />
              AI Treningsassistent
            </h1>
            <p className="text-gray-600">Chat med Claude for å lage ditt skreddersydde program</p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="neo-card h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-neo'
                      : 'neo-card'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="neo-card p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              </div>
            )}
            {savingProgram && (
              <div className="flex justify-center">
                <div className="neo-card p-4 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-gray-700 font-semibold">Lagrer program...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-gray-300">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Skriv din melding her..."
                className="neo-input flex-1 resize-none"
                rows={2}
                disabled={loading || savingProgram}
              />
              <button
                onClick={handleSend}
                disabled={loading || savingProgram || !input.trim()}
                className="neo-button-primary px-6"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
