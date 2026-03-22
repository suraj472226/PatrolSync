import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../services/api';
import QuestionCard from '../components/checklist/QuestionCard';

export default function ChecklistScreen({ route, navigation }) {
  const { checklistId, title, responseId: initialResponseId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState(null);
  const [responseId, setResponseId] = useState(initialResponseId);
  const [answers, setAnswers] = useState({});
  const scrollRef = useRef(null);

  // Fetch checklist data
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const response = await api.get(`/mobile/checklists/${checklistId}`);
        setChecklist(response.data);

        if (response.data.response_id) {
          setResponseId(response.data.response_id);
        }

        // Initialize answers from existing data
        const initialAnswers = {};
        response.data.questions?.forEach((q) => {
          if (q.current_answer || q.current_comment || q.current_photos?.length) {
            initialAnswers[q.link_id] = {
              answer_value: q.current_answer,
              comment: q.current_comment,
              photo_urls: q.current_photos || [],
              video_urls: q.current_videos || [],
              doc_urls: q.current_docs || [],
            };
          }
        });
        setAnswers(initialAnswers);

      } catch (error) {
        console.error('Error fetching checklist:', error);
        Alert.alert('Error', 'Failed to load checklist');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchChecklist();
  }, [checklistId]);

  // Start checklist if no response exists
  const startChecklist = async () => {
    if (responseId) return responseId;

    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const response = await api.post(`/mobile/checklists/${checklistId}/start`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setResponseId(response.data.response_id);
      return response.data.response_id;
    } catch (error) {
      console.error('Error starting checklist:', error);
      throw error;
    }
  };

  // Handle answer change
  const handleAnswerChange = async (linkId, answerData) => {
    // Update local state
    setAnswers((prev) => ({
      ...prev,
      [linkId]: answerData,
    }));

    // Save to backend
    try {
      const currentResponseId = await startChecklist();

      await api.patch(`/mobile/checklists/responses/${currentResponseId}/answer`, {
        question_link_id: linkId,
        answer_value: answerData.answer_value,
        comment: answerData.comment,
        photo_urls: answerData.photo_urls,
        video_urls: answerData.video_urls,
        doc_urls: answerData.doc_urls,
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      // Don't alert for every save error, just log it
    }
  };

  // Calculate progress
  const getProgress = () => {
    if (!checklist?.questions) return 0;
    const answered = Object.keys(answers).filter((key) => answers[key]?.answer_value).length;
    return Math.round((answered / checklist.questions.length) * 100);
  };

  // Validate before submit
  const validateSubmission = () => {
    if (!checklist?.questions) return { valid: false, errors: [] };

    const errors = [];
    checklist.questions.forEach((q, index) => {
      const answer = answers[q.link_id];

      if (!answer?.answer_value) {
        errors.push(`Question ${index + 1} is not answered`);
      }

      if (q.requires_photo && (!answer?.photo_urls || answer.photo_urls.length === 0)) {
        errors.push(`Question ${index + 1} requires a photo`);
      }

      if (q.requires_comment && !answer?.comment) {
        errors.push(`Question ${index + 1} requires a comment`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // Submit checklist
  const handleSubmit = async () => {
    const validation = validateSubmission();

    if (!validation.valid) {
      Alert.alert(
        'Incomplete',
        `Please complete all required fields:\n\n${validation.errors.slice(0, 3).join('\n')}${validation.errors.length > 3 ? `\n...and ${validation.errors.length - 3} more` : ''}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Submit Checklist',
      'Are you sure you want to submit this checklist? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              const currentResponseId = await startChecklist();

              // TODO: Add signature capture
              await api.post(`/mobile/checklists/responses/${currentResponseId}/submit`, {
                signature_url: '', // Will add signature later
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              Alert.alert('Success', 'Checklist submitted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error submitting checklist:', error);
              Alert.alert('Error', 'Failed to submit checklist. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    );
  }

  const progress = getProgress();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>{title}</Text>
          <Text style={styles.progressText}>
            {Object.keys(answers).filter((k) => answers[k]?.answer_value).length} of {checklist?.questions?.length || 0} answered
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Questions */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {checklist?.questions?.map((question, index) => (
          <QuestionCard
            key={question.link_id}
            question={question}
            answer={answers[question.link_id]}
            onAnswerChange={(data) => handleAnswerChange(question.link_id, data)}
            index={index}
            totalQuestions={checklist.questions.length}
          />
        ))}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, progress < 100 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Checklist</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#71717a',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
  },
  progressText: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e4e4e7',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#86efac',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
