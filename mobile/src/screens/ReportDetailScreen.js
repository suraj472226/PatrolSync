import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function ReportDetailScreen({ route }) {
  const { type, id, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/mobile/activity/${type}/${id}`);
        setDetail(response.data);
      } catch (error) {
        console.error('Error fetching detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [type, id]);

  const getTypeColor = () => {
    switch (type) {
      case 'patrol': return '#22c55e';
      case 'checklist': return '#8b5cf6';
      case 'incident': return '#f59e0b';
      case 'sos': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'patrol': return 'checkmark-circle';
      case 'checklist': return 'clipboard';
      case 'incident': return 'warning';
      case 'sos': return 'alert-circle';
      default: return 'document';
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTimeline = () => {
    if (!detail?.timeline || detail.timeline.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Timeline</Text>
        <View style={styles.timeline}>
          {detail.timeline.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                <View style={[styles.timelineDot, { backgroundColor: getTypeColor() }]} />
                {index < detail.timeline.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineEvent}>{event.event}</Text>
                {event.description && (
                  <Text style={styles.timelineDescription}>{event.description}</Text>
                )}
                <Text style={styles.timelineTime}>{formatDateTime(event.timestamp)}</Text>
                {event.actor && (
                  <Text style={styles.timelineActor}>By: {event.actor}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPatrolDetail = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checkpoint Details</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Site" value={detail.site_name} />
          <DetailRow label="Address" value={detail.site_address || '-'} />
          <DetailRow label="Scan Time" value={formatDateTime(detail.scan_time)} />
          <DetailRow label="Scan Method" value={detail.scan_type} />
        </View>
      </View>

      {detail.photo_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          <Image source={{ uri: detail.photo_url }} style={styles.photoImage} />
        </View>
      )}

      {renderTimeline()}
    </>
  );

  const renderChecklistDetail = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Checklist Summary</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Checklist" value={detail.checklist_title} />
          <DetailRow label="Status" value={detail.status} />
          <DetailRow label="Submitted" value={formatDateTime(detail.submitted_at)} />
          <DetailRow label="Site" value={detail.site_name || '-'} />
          <DetailRow
            label="Completion"
            value={`${detail.answered_questions}/${detail.total_questions} questions`}
          />
        </View>
      </View>

      {detail.answers_summary && detail.answers_summary.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Answers</Text>
          {detail.answers_summary.map((answer, index) => (
            <View key={index} style={styles.answerCard}>
              <Text style={styles.answerQuestion}>{answer.question}</Text>
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Answer:</Text>
                <Text style={styles.answerValue}>{answer.answer || '-'}</Text>
              </View>
              {answer.comment && (
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Comment:</Text>
                  <Text style={styles.answerComment}>{answer.comment}</Text>
                </View>
              )}
              {answer.has_attachments && (
                <View style={styles.attachmentBadge}>
                  <Ionicons name="attach" size={14} color="#3b82f6" />
                  <Text style={styles.attachmentText}>Has attachments</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {detail.signature_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <Image source={{ uri: detail.signature_url }} style={styles.signatureImage} />
        </View>
      )}

      {renderTimeline()}
    </>
  );

  const renderIncidentDetail = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident Details</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Category" value={detail.category} />
          <DetailRow label="Status" value={detail.is_resolved ? 'Resolved' : 'Pending'} />
          <DetailRow label="Reported" value={formatDateTime(detail.reported_at)} />
          <DetailRow label="Site" value={detail.site_name || '-'} />
          <DetailRow
            label="Location"
            value={`${detail.latitude?.toFixed(6)}, ${detail.longitude?.toFixed(6)}`}
          />
        </View>
      </View>

      {detail.remarks && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remarks</Text>
          <Text style={styles.remarksText}>{detail.remarks}</Text>
        </View>
      )}

      {detail.photo_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          <Image source={{ uri: detail.photo_url }} style={styles.photoImage} />
        </View>
      )}

      {renderTimeline()}
    </>
  );

  const renderSOSDetail = () => (
    <>
      <View style={[styles.section, styles.sosWarning]}>
        <Ionicons name="alert-circle" size={32} color="#ef4444" />
        <Text style={styles.sosTitle}>Emergency SOS Alert</Text>
        <Text style={styles.sosStatus}>Status: {detail.status.replace('_', ' ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Details</Text>
        <View style={styles.detailCard}>
          <DetailRow label="Triggered" value={formatDateTime(detail.triggered_at)} />
          <DetailRow
            label="Location"
            value={`${detail.latitude?.toFixed(6)}, ${detail.longitude?.toFixed(6)}`}
          />
          {detail.address && <DetailRow label="Address" value={detail.address} />}
          {detail.acknowledged_at && (
            <DetailRow label="Acknowledged" value={formatDateTime(detail.acknowledged_at)} />
          )}
          {detail.acknowledged_by_name && (
            <DetailRow label="Acknowledged By" value={detail.acknowledged_by_name} />
          )}
          {detail.resolved_at && (
            <DetailRow label="Resolved" value={formatDateTime(detail.resolved_at)} />
          )}
        </View>
      </View>

      {detail.resolution_notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution Notes</Text>
          <Text style={styles.remarksText}>{detail.resolution_notes}</Text>
        </View>
      )}

      {renderTimeline()}
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load details</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: getTypeColor() + '20' }]}>
          <Ionicons name={getTypeIcon()} size={32} color={getTypeColor()} />
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerType}>{type.charAt(0).toUpperCase() + type.slice(1)} Report</Text>
      </View>

      {/* Render type-specific content */}
      {type === 'patrol' && renderPatrolDetail()}
      {type === 'checklist' && renderChecklistDetail()}
      {type === 'incident' && renderIncidentDetail()}
      {type === 'sos' && renderSOSDetail()}
    </ScrollView>
  );
}

// Detail Row Component
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#71717a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
  },
  headerType: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#71717a',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  remarksText: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#3f3f46',
    lineHeight: 22,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e4e4e7',
  },
  signatureImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  answerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  answerQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  answerLabel: {
    fontSize: 13,
    color: '#71717a',
    width: 70,
  },
  answerValue: {
    fontSize: 13,
    color: '#18181b',
    fontWeight: '500',
  },
  answerComment: {
    fontSize: 13,
    color: '#52525b',
    flex: 1,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  sosWarning: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 8,
  },
  sosStatus: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  timeline: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLine: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#e4e4e7',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 8,
  },
  timelineEvent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181b',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
  },
  timelineActor: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
});
