import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AnswerSelector({ value, onChange, responseType, options }) {
  if (responseType === 'Free Text') {
    return null; // Free text is handled by TextInput in QuestionCard
  }

  if (responseType === 'Yes / No / NA') {
    const answers = ['Yes', 'No', 'N/A'];

    return (
      <View style={styles.container}>
        {answers.map((answer) => (
          <TouchableOpacity
            key={answer}
            style={[
              styles.button,
              value === answer && styles.buttonSelected,
              value === answer && answer === 'Yes' && styles.buttonYes,
              value === answer && answer === 'No' && styles.buttonNo,
              value === answer && answer === 'N/A' && styles.buttonNA,
            ]}
            onPress={() => onChange(answer)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                value === answer && styles.buttonTextSelected,
              ]}
            >
              {answer}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // Multiple Choice
  if (responseType === 'Multiple Choice' && options && options.length > 0) {
    return (
      <View style={styles.container}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.button,
              styles.buttonWide,
              value === option && styles.buttonSelected,
            ]}
            onPress={() => onChange(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                value === option && styles.buttonTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
    borderWidth: 2,
    borderColor: '#e4e4e7',
  },
  buttonWide: {
    flex: 1,
    minWidth: '45%',
  },
  buttonSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  buttonYes: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  buttonNo: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  buttonNA: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#52525b',
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: '#18181b',
  },
});
