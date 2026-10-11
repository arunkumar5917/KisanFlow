// Feature 10: Voice-Based Farmer Assistant Service
export interface VoiceCommand {
  intent: 'check_token' | 'check_queue' | 'check_payment' | 'reschedule' | 'nearby_centres' | 'grievance' | 'help';
  parameters: Record<string, string>;
  confidence: number;
}

export interface VoiceResponse {
  text: string;
  textTa: string;
  intent: string;
  data?: Record<string, unknown>;
}

const COMMAND_PATTERNS: Array<{ patterns: RegExp[]; intent: VoiceCommand['intent'] }> = [
  {
    patterns: [/token|டோக்கன்/i, /என்.*டோக்கன்/i, /my.*token/i],
    intent: 'check_token',
  },
  {
    patterns: [/queue|வரிசை/i, /waiting|காத்திருக்க/i, /எவ்வளவு.*நேரம்/i, /how.*long/i],
    intent: 'check_queue',
  },
  {
    patterns: [/payment|கட்டணம்/i, /bill|பில்/i, /pay|செலுத்த/i, /money|பணம்/i],
    intent: 'check_payment',
  },
  {
    patterns: [/reschedule|மாற்று/i, /change.*slot|ஸ்லாட்.*மாற்ற/i, /can.*attend.*slot/i],
    intent: 'reschedule',
  },
  {
    patterns: [/nearby|அருகில்/i, /other.*centre|மற்ற.*மையம்/i, /where.*else|வேறு.*எங்கே/i],
    intent: 'nearby_centres',
  },
  {
    patterns: [/complaint|புகார்/i, /grievance|குறை/i, /problem|சிக்கல்/i, /report|புகார்.*செய்/i],
    intent: 'grievance',
  },
  {
    patterns: [/help|உதவி/i, /what.*can.*do|என்ன.*செய்ய.*முடியும்/i, /how.*use|�ப்படி.*பயன்படுத்த/i],
    intent: 'help',
  },
];

export function parseVoiceInput(text: string): VoiceCommand {
  const normalizedText = text.toLowerCase().trim();

  for (const cmd of COMMAND_PATTERNS) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent: cmd.intent,
          parameters: { raw: text },
          confidence: 0.85 + Math.random() * 0.15,
        };
      }
    }
  }

  return {
    intent: 'help',
    parameters: { raw: text },
    confidence: 0.5,
  };
}

export function generateVoiceResponse(
  command: VoiceCommand,
  context: {
    tokenNumber?: string;
    queuePosition?: number;
    estimatedWait?: number;
    paymentStatus?: string;
    language?: 'en' | 'ta';
  },
): VoiceResponse {
  const lang = context.language || 'ta';

  switch (command.intent) {
    case 'check_token':
      if (lang === 'ta') {
        return {
          text: `Your token number is ${context.tokenNumber || 'N/A'}. Queue position: ${context.queuePosition || 'N/A'}.`,
          textTa: `உங்கள் டோக்கன் எண் ${context.tokenNumber || 'N/A'}. வரிசை நிலை: ${context.queuePosition || 'N/A'}.`,
          intent: 'check_token',
        };
      }
      return {
        text: `Your token is ${context.tokenNumber || 'N/A'}. Position in queue: ${context.queuePosition || 'N/A'}.`,
        textTa: `உங்கள் டோக்கன் ${context.tokenNumber || 'N/A'}. வரிசையில் நிலை: ${context.queuePosition || 'N/A'}.`,
        intent: 'check_token',
      };

    case 'check_queue':
      if (lang === 'ta') {
        return {
          text: `Estimated waiting time: ${context.estimatedWait || 'N/A'} minutes.`,
          textTa: `மதிப்பீட்டு காத்திருப்பு நேரம்: ${context.estimatedWait || 'N/A'} நிமிடங்கள்.`,
          intent: 'check_queue',
        };
      }
      return {
        text: `Estimated wait time is ${context.estimatedWait || 'N/A'} minutes.`,
        textTa: `மதிப்பீட்டு காத்திருப்பு நேரம் ${context.estimatedWait || 'N/A'} நிமிடங்கள்.`,
        intent: 'check_queue',
      };

    case 'check_payment':
      if (lang === 'ta') {
        return {
          text: `Payment status: ${context.paymentStatus || 'Processing'}.`,
          textTa: `கட்டண நிலை: ${context.paymentStatus || 'செயலாக்கம்'}.`,
          intent: 'check_payment',
        };
      }
      return {
        text: `Payment status: ${context.paymentStatus || 'Processing'}.`,
        textTa: `கட்டண நிலை: ${context.paymentStatus || 'செயலாக்கம்'}.`,
        intent: 'check_payment',
      };

    case 'reschedule':
      if (lang === 'ta') {
        return {
          text: 'You can reschedule your slot. Opening reschedule options now.',
          textTa: 'உங்கள் ஸ்லாட்டை மாற்றலாம். மாற்று விருப்பங்களைத் திறக்கிறோம்.',
          intent: 'reschedule',
        };
      }
      return {
        text: 'Opening slot reschedule options.',
        textTa: 'ஸ்லாட் மாற்று விருப்பங்களைத் திறக்கிறோம்.',
        intent: 'reschedule',
      };

    case 'nearby_centres':
      if (lang === 'ta') {
        return {
          text: 'Finding nearby procurement centres with shorter wait times.',
          textTa: 'குறைந்த காத்திருப்பு நேரத்துடன் அருகிலுள்ள கொள்முதல் மையங்களைக் கண்டறிகிறோம்.',
          intent: 'nearby_centres',
        };
      }
      return {
        text: 'Finding nearby centres with shorter queues.',
        textTa: 'குறைந்த வரிசையுடன் அருகிலுள்ள மையங்களைக் கண்டறிகிறோம்.',
        intent: 'nearby_centres',
      };

    case 'grievance':
      if (lang === 'ta') {
        return {
          text: 'Opening grievance form. Please describe your issue.',
          textTa: 'புகார் படிவத்தைத் திறக்கிறோம். உங்கள் சிக்கலை விவரியுங்கள்.',
          intent: 'grievance',
        };
      }
      return {
        text: 'Opening grievance form. Please describe your issue.',
        textTa: 'புகார் படிவத்தைத் திறக்கிறோம். உங்கள் சிக்கலை விவரியுங்கள்.',
        intent: 'grievance',
      };

    default:
      if (lang === 'ta') {
        return {
          text: 'You can ask about your token, queue, payment, or reschedule. Try saying "Check my token".',
          textTa: 'உங்கள் டோக்கன், வரிசை, கட்டணம் அல்லது மாற்றம் பற்றி கேட்கலாம். "என் டோக்கன் சரிபார்" என்று சொல்லுங்கள்.',
          intent: 'help',
        };
      }
      return {
        text: 'You can ask about your token, queue, payment, or reschedule. Try "Check my token".',
        textTa: 'உங்கள் டோக்கன், வரிசை, கட்டணம் அல்லது மாற்றம் பற்றி கேட்கலாம். "என் டோக்கன் சரிபார்" என்று சொல்லுங்கள்.',
        intent: 'help',
      };
  }
}
