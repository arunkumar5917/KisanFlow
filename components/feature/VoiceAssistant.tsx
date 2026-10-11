import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { parseVoiceInput, generateVoiceResponse, type VoiceResponse } from '../../services/voiceService';

interface Props {
  context: {
    tokenNumber?: string;
    queuePosition?: number;
    estimatedWait?: number;
    paymentStatus?: string;
  };
  onNavigate?: (intent: string) => void;
}

export function VoiceAssistant({ context, onNavigate }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<VoiceResponse | null>(null);
  const [language, setLanguage] = useState<'en' | 'ta'>('ta');

  const handleStartListening = () => {
    setIsListening(true);
    setTranscript('...');
    setTimeout(() => {
      setIsListening(false);
      setTranscript('என் டோக்கன் எப்போது வரும்?');
      const cmd = parseVoiceInput('என் டோக்கன் எப்போது வரும்?');
      const resp = generateVoiceResponse(cmd, { ...context, language });
      setResponse(resp);
    }, 2000);
  };

  const handleTextSubmit = () => {
    if (!transcript.trim()) return;
    const cmd = parseVoiceInput(transcript);
    const resp = generateVoiceResponse(cmd, { ...context, language });
    setResponse(resp);
    onNavigate?.(cmd.intent);
  };

  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.header}>
        <MaterialIcons name="mic" size={22} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Voice Assistant</Text>
          <Text style={styles.titleTa}>குரல் உதவியாளர்</Text>
        </View>
        <View style={styles.langToggle}>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('ta')}
            style={[styles.langBtn, language === 'ta' && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === 'ta' && styles.langTextActive]}>TA</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={transcript}
          onChangeText={setTranscript}
          placeholder={language === 'ta' ? 'உரையை உள்ளிடுங்கள்...' : 'Type your question...'}
          placeholderTextColor={Colors.textMuted}
        />
        <Pressable onPress={handleTextSubmit} style={styles.sendBtn}>
          <MaterialIcons name="send" size={18} color={Colors.textWhite} />
        </Pressable>
      </View>

      <Pressable
        onPress={handleStartListening}
        style={({ pressed }) => [
          styles.micBtn,
          isListening && styles.micBtnActive,
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons
          name={isListening ? 'mic' : 'mic-none'}
          size={32}
          color={isListening ? Colors.textWhite : Colors.primary}
        />
        <Text style={[styles.micText, isListening && styles.micTextActive]}>
          {isListening ? 'Listening...' : 'Tap to Speak'}
        </Text>
      </Pressable>

      {response && (
        <View style={styles.responseBox}>
          <MaterialIcons name="record-voice-over" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.responseText}>{language === 'ta' ? response.textTa : response.text}</Text>
            {language !== 'ta' && (
              <Text style={styles.responseTextTa}>{response.textTa}</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.suggestions}>
        <Text style={styles.suggestionLabel}>Quick Questions:</Text>
        <View style={styles.suggestionRow}>
          {[
            language === 'ta' ? 'என் டோக்கன் என்ன?' : 'Check my token',
            language === 'ta' ? 'காத்திருப்பு நேரம்?' : 'How long to wait?',
            language === 'ta' ? 'கட்டணம் நிலை?' : 'Payment status',
          ].map((q, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setTranscript(q);
                const cmd = parseVoiceInput(q);
                const resp = generateVoiceResponse(cmd, { ...context, language });
                setResponse(resp);
              }}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{q}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  titleTa: { fontSize: FontSize.xs, color: Colors.textMuted },
  langToggle: { flexDirection: 'row', gap: 4, backgroundColor: Colors.surfaceTint, borderRadius: Radius.pill, padding: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  langBtnActive: { backgroundColor: Colors.primary },
  langText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  langTextActive: { color: Colors.textWhite },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  textInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 10, fontSize: FontSize.sm, color: Colors.textPrimary,
  },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, width: 44, alignItems: 'center', justifyContent: 'center' },
  micBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceTint, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 2, borderColor: Colors.border,
  },
  micBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  micText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semiBold },
  micTextActive: { color: Colors.textWhite },
  pressed: { opacity: 0.8 },
  responseBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.primary + '10', borderRadius: Radius.md, padding: Spacing.sm,
  },
  responseText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semiBold },
  responseTextTa: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  suggestions: { marginTop: Spacing.xs },
  suggestionLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestionChip: {
    backgroundColor: Colors.surfaceTint, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border,
  },
  suggestionText: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
