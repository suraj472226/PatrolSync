import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AnswerSelector from './AnswerSelector';

export default function QuestionCard({
  question,
  answer,
  onAnswerChange,
  index,
  totalQuestions,
}) {
  const [comment, setComment] = useState(answer?.comment || '');
  const [showComment, setShowComment] = useState(false);
  const [photos, setPhotos] = useState(answer?.photos || []);

  const handleAnswerSelect = (value) => {
    onAnswerChange({
      ...answer,
      answer_value: value,
      comment: comment,
      photo_urls: photos,
    });
  };

  const handleCommentChange = (text) => {
    setComment(text);
    onAnswerChange({
      ...answer,
      comment: text,
    });
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permission to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      const newPhotos = [...photos, result.assets[0].uri];
      setPhotos(newPhotos);
      onAnswerChange({
        ...answer,
        photo_urls: newPhotos,
      });
    }
  };

  const removePhoto = (indexToRemove) => {
    const newPhotos = photos.filter((_, i) => i !== indexToRemove);
    setPhotos(newPhotos);
    onAnswerChange({
      ...answer,
      photo_urls: newPhotos,
    });
  };

  return (
    <View style={styles.container}>
      {/* Question Header */}
      <View style={styles.header}>
        <View style={styles.questionNumber}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>
        <View style={styles.headerRight}>
          {question.is_critical && (
            <View style={styles.criticalBadge}>
              <Ionicons name="alert-circle" size={12} color="#ef4444" />
              <Text style={styles.criticalText}>Critical</Text>
            </View>
          )}
          <Text style={styles.progress}>{index + 1}/{totalQuestions}</Text>
        </View>
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.text}</Text>

      {/* Requirements Badges */}
      <View style={styles.requirementsRow}>
        {question.requires_photo && (
          <View style={styles.requirementBadge}>
            <Ionicons name="camera" size={12} color="#3b82f6" />
            <Text style={styles.requirementText}>Photo</Text>
          </View>
        )}
        {question.requires_video && (
          <View style={styles.requirementBadge}>
            <Ionicons name="videocam" size={12} color="#3b82f6" />
            <Text style={styles.requirementText}>Video</Text>
          </View>
        )}
        {question.requires_doc && (
          <View style={styles.requirementBadge}>
            <Ionicons name="document" size={12} color="#3b82f6" />
            <Text style={styles.requirementText}>Doc</Text>
          </View>
        )}
        {question.requires_comment && (
          <View style={styles.requirementBadge}>
            <Ionicons name="chatbubble" size={12} color="#3b82f6" />
            <Text style={styles.requirementText}>Comment</Text>
          </View>
        )}
      </View>

      {/* Answer Selector */}
      <View style={styles.answerSection}>
        <AnswerSelector
          value={answer?.answer_value}
          onChange={handleAnswerSelect}
          responseType={question.response_type}
          options={question.options}
        />
      </View>

      {/* Free Text Input */}
      {question.response_type === 'Free Text' && (
        <TextInput
          style={styles.freeTextInput}
          placeholder="Enter your answer..."
          value={answer?.answer_value || ''}
          onChangeText={handleAnswerSelect}
          multiline
        />
      )}

      {/* Attachments */}
      {(question.requires_photo || question.requires_video || question.requires_doc) && (
        <View style={styles.attachmentSection}>
          <Text style={styles.attachmentLabel}>Attachments</Text>
          <View style={styles.attachmentButtons}>
            {question.requires_photo && (
              <TouchableOpacity style={styles.attachButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={20} color="#3b82f6" />
                <Text style={styles.attachButtonText}>Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <View style={styles.photoPreviewRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoPreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(i)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Comment Section */}
      <TouchableOpacity
        style={styles.commentToggle}
        onPress={() => setShowComment(!showComment)}
      >
        <Ionicons name={showComment ? "chevron-up" : "chevron-down"} size={16} color="#71717a" />
        <Text style={styles.commentToggleText}>
          {showComment ? 'Hide Comment' : 'Add Comment'}
        </Text>
      </TouchableOpacity>

      {showComment && (
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={comment}
          onChangeText={handleCommentChange}
          multiline
          numberOfLines={3}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  criticalText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  progress: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181b',
    lineHeight: 24,
    marginBottom: 12,
  },
  requirementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  requirementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  requirementText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  answerSection: {
    marginBottom: 12,
  },
  freeTextInput: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  attachmentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  attachmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525b',
    marginBottom: 8,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  attachButtonText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  photoPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  photoPreview: {
    position: 'relative',
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  commentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 4,
  },
  commentToggleText: {
    fontSize: 13,
    color: '#71717a',
  },
  commentInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
});
