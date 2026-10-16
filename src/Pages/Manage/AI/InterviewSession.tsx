import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Progress,
  Segmented,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SafetyCertificateOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useAppSelector } from '../../../Redux/Store/hooks';
import AIWorkspaceNav from './AIWorkspaceNav';
import { interviewApi, InterviewResource, ManifestGroup, MediaTrack } from './interview-api';
import { pendingFor, PendingMedia, savePending, uploadPending } from './interview-media';
import { UrlPrefix } from '../../../Config/constValue';
import './interview-workbench.css';

const terminal = new Set(['completed', 'expired', 'cancelled', 'approved', 'rejected', 'adopted']);

function visibleStatus(session: InterviewResource) {
  if (['approved', 'rejected', 'adopted', 'failed'].includes(session.state)) return session.state;
  return session.effective_status;
}

function canRenew(session: InterviewResource) {
  return (
    session.role === 'teacher' &&
    (['expired', 'cancelled'].includes(session.effective_status) || session.state === 'rejected')
  );
}

export default function InterviewSession() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const ownerId = useAppSelector((state) => state.UserReducer.userInfo?.userId ?? '');
  const [reviewForm] = Form.useForm();
  const [session, setSession] = useState<InterviewResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [checks, setChecks] = useState({
    https: window.isSecureContext,
    camera: false,
    microphone: false,
    screen: false,
    single_display: false,
  });
  const [activeTrack, setActiveTrack] = useState<MediaTrack>('video');
  const [recording, setRecording] = useState(false);
  const [recordingPending, setRecordingPending] = useState(false);
  const [uploading, setUploading] = useState({ done: 0, total: 0 });
  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureGeneration = useRef(0);
  const capturePending = useRef(false);
  const captureContextRef = useRef('');
  const loadSequence = useRef(0);
  const trackNames: Record<MediaTrack, string> = {
    audio: t('aiInterviewTrackAudio'),
    video: t('aiInterviewTrackVideo'),
    screen: t('aiInterviewTrackScreen'),
  };
  const statusLabels: Record<string, string> = {
    pending: t('aiInterviewStatusPending'),
    running: t('aiInterviewStatusRunning'),
    awaiting_answer: t('aiInterviewStatusAwaitingAnswer'),
    completed: t('aiInterviewStatusCompleted'),
    expired: t('aiInterviewStatusExpired'),
    cancelled: t('aiInterviewStatusCancelled'),
    approved: t('aiInterviewStatusApproved'),
    rejected: t('aiInterviewStatusRejected'),
    adopted: t('aiInterviewStatusAdopted'),
    failed: t('aiInterviewStatusFailed'),
  };

  const load = useCallback(
    async (quiet = false) => {
      const sequence = ++loadSequence.current;
      if (!quiet) setLoading(true);
      try {
        const result = await interviewApi.session(id);
        if (sequence === loadSequence.current) {
          setSession(result);
          const required = result.data.media_policy?.required_tracks || [];
          if (required.length && !required.includes(activeTrack)) setActiveTrack(required[0]);
          if (result.data.candidate && !reviewForm.isFieldsTouched()) {
            reviewForm.setFieldsValue({
              notes: '',
              criteria: result.data.candidate.criteria.map((item) => ({
                name: item.name,
                score: item.score,
              })),
            });
          }
        }
      } catch (reason) {
        if (sequence === loadSequence.current) setError(String(reason));
      } finally {
        if (sequence === loadSequence.current) setLoading(false);
      }
    },
    [activeTrack, id, reviewForm],
  );

  useEffect(() => {
    void load();
    return () => {
      loadSequence.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!session || terminal.has(session.effective_status)) return;
    const timer = window.setInterval(() => void load(true), 2500);
    return () => window.clearInterval(timer);
  }, [load, session]);

  const turnSequence = Math.max(0, (session?.data.turns.length || 1) - 1);
  const canAnswer = Boolean(
    session &&
    session.id === id &&
    ownerId &&
    session.data.student_id === ownerId &&
    session.role === 'student' &&
    session.state === 'ready' &&
    session.effective_status === 'awaiting_answer' &&
    session.data.status === 'awaiting_answer' &&
    session.data.turns[turnSequence]?.answer === null,
  );
  const captureContext = canAnswer ? JSON.stringify([id, ownerId, turnSequence, activeTrack]) : '';
  captureContextRef.current = captureContext;
  const turnManifest =
    session?.media_manifest?.groups.filter((group) => group.turn_sequence === turnSequence) || [];

  useEffect(() => {
    setRecording(false);
    setRecordingPending(false);
    return () => {
      captureGeneration.current += 1;
      capturePending.current = false;
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (previewRef.current) previewRef.current.srcObject = null;
    };
  }, [captureContext]);

  async function testCameraAndMicrophone() {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const next = {
        camera: stream.getVideoTracks().length > 0,
        microphone: stream.getAudioTracks().length > 0,
      };
      stream.getTracks().forEach((track) => track.stop());
      setChecks((value) => ({ ...value, ...next, https: window.isSecureContext }));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function testScreen() {
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const available = stream.getVideoTracks().length > 0;
      stream.getTracks().forEach((track) => track.stop());
      setChecks((value) => ({ ...value, screen: available }));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function beginInterview() {
    setBusy(true);
    try {
      await interviewApi.preflight(id, checks);
      await load();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (!captureContext || capturePending.current || recorderRef.current) return;
    const generation = ++captureGeneration.current;
    const isCurrent = () =>
      generation === captureGeneration.current && captureContext === captureContextRef.current;
    capturePending.current = true;
    setRecordingPending(true);
    setError('');
    let stream: MediaStream | undefined;
    try {
      stream =
        activeTrack === 'screen'
          ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
          : await navigator.mediaDevices.getUserMedia({
              video: activeTrack === 'video',
              audio: true,
            });
      if (!isCurrent()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const preferred = activeTrack === 'audio' ? 'audio/webm' : 'video/webm';
      const options = MediaRecorder.isTypeSupported(preferred)
        ? { mimeType: preferred }
        : undefined;
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];
      const started = Date.now();
      recorder.ondataavailable = (event) => {
        if (isCurrent() && event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        if (!isCurrent()) return;
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorderRef.current = null;
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (previewRef.current) previewRef.current.srcObject = null;
        setRecording(false);
        void persistRecording(activeTrack, chunks, Date.now() - started, isCurrent);
      };
      recorderRef.current = recorder;
      streamRef.current = stream;
      if (previewRef.current && activeTrack !== 'audio') {
        previewRef.current.srcObject = stream;
        void previewRef.current.play().catch(() => undefined);
      }
      recorder.start(10000);
      setRecording(true);
    } catch (reason) {
      stream?.getTracks().forEach((track) => track.stop());
      if (isCurrent()) {
        recorderRef.current = null;
        streamRef.current = null;
        setError(String(reason));
      }
    } finally {
      if (isCurrent()) {
        capturePending.current = false;
        setRecordingPending(false);
      }
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
  }

  async function persistRecording(
    track: MediaTrack,
    blobs: Blob[],
    elapsedMs: number,
    isCurrent: () => boolean,
  ) {
    if (!isCurrent()) return;
    const elapsed = Math.max(1000, elapsedMs);
    if (!blobs.length) {
      setError(t('aiInterviewNoRecording'));
      return;
    }
    const recordingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = Math.max(1, Math.ceil(elapsed / blobs.length));
    try {
      for (let index = 0; index < blobs.length; index += 1) {
        if (!isCurrent()) return;
        const suffix = track === 'audio' ? 'webm' : 'webm';
        await savePending({
          key: `${id}:${turnSequence}:${track}:${recordingId}:${index}`,
          ownerId,
          resourceId: id,
          turnSequence,
          track,
          segmentIndex: index,
          segmentCount: blobs.length,
          startedMs: index * duration,
          durationMs: duration,
          filename: `${track}-${index}.${suffix}`,
          blob: blobs[index],
        });
      }
      if (isCurrent()) await retryPendingMedia(isCurrent);
    } catch (reason) {
      if (isCurrent()) setError(String(reason));
    }
  }

  async function addManualFile(file: File) {
    const item: PendingMedia = {
      key: `${id}:${turnSequence}:${activeTrack}:manual:${Date.now()}`,
      ownerId,
      resourceId: id,
      turnSequence,
      track: activeTrack,
      segmentIndex: 0,
      segmentCount: 1,
      startedMs: 0,
      durationMs: 1000,
      filename: file.name,
      blob: file,
    };
    setBusy(true);
    try {
      await savePending(item);
      await retryPendingMedia();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function retryPendingMedia(isCurrent: () => boolean = () => true) {
    if (!ownerId) {
      setError(t('aiInterviewNoAuthCache'));
      return;
    }
    const pending = await pendingFor(ownerId, id, turnSequence);
    if (!isCurrent()) return;
    if (!pending.length) {
      await load(true);
      return;
    }
    setUploading({ done: 0, total: pending.length });
    let done = 0;
    for (const item of pending) {
      if (!isCurrent()) return;
      await uploadPending(item);
      if (!isCurrent()) return;
      done += 1;
      setUploading({ done, total: pending.length });
    }
    await load(true);
  }

  async function submitAnswer() {
    if (!session) return;
    const groups =
      session.media_manifest?.groups.filter((group) => group.turn_sequence === turnSequence) || [];
    const fileIds = groups.flatMap((group) => group.segments.map((item) => item.file_id));
    setBusy(true);
    try {
      await interviewApi.answer(id, turnSequence, session.version, answer, fileIds);
      setAnswer('');
      await load();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function retryJob() {
    setBusy(true);
    try {
      await interviewApi.retryJob(id);
      await load();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function renewInterview() {
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const renewed = await interviewApi.renew(id, session.version, 72);
      history.push(`${UrlPrefix}/practice/interviews/${renewed.id}`);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function cancelInterview() {
    setBusy(true);
    setError('');
    try {
      await interviewApi.cancel(id);
      await load();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(decision: 'approve' | 'reject') {
    if (!session) return;
    const values = await reviewForm.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    try {
      await interviewApi.review(id, session.version, decision, values.notes, values.criteria || []);
      await load();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function adoptGrade(overwriteManual: boolean) {
    if (!session?.data.teacher_review) return;
    setBusy(true);
    try {
      await interviewApi.adopt(
        id,
        session.version,
        session.data.teacher_review.notes,
        overwriteManual,
      );
      await load();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !session) {
    return (
      <div className="ai-interview-loading">
        <Spin size="large" />
      </div>
    );
  }
  if (!session) {
    return <Alert type="error" showIcon message={error || t('aiInterviewNotFound')} />;
  }

  const { data } = session;
  const currentTurn = data.turns[turnSequence];
  const requiredComplete = session.media_manifest?.complete ?? false;
  const checkComplete = Object.values(checks).every(Boolean);
  const nativeBound = Boolean(data.native_source || data.native_source_bound);

  return (
    <Layout className="ai-interview-shell">
      <AIWorkspaceNav />
      <main className="ai-interview-main ai-interview-session">
        <header className="ai-interview-header">
          <Space align="start">
            <Link to={`${UrlPrefix}/practice/interviews`} aria-label={t('aiInterviewBack')}>
              <ArrowLeftOutlined />
            </Link>
            <div>
              <Typography.Title level={2}>{data.title}</Typography.Title>
              <Space wrap>
                <Tag>
                  {session.role === 'student'
                    ? t('aiInterviewRoleStudent')
                    : t('aiInterviewRoleTeacher')}
                </Tag>
                <Tag color={session.effective_status === 'awaiting_answer' ? 'gold' : 'blue'}>
                  {statusLabels[visibleStatus(session)] || visibleStatus(session)}
                </Tag>
                {nativeBound && <Tag color="green">{t('aiInterviewBound')}</Tag>}
              </Space>
            </div>
          </Space>
          <Space>
            {session.job?.status === 'failed' && (
              <Button icon={<RedoOutlined />} loading={busy} onClick={() => void retryJob()}>
                {t('aiInterviewRetryGeneration')}
              </Button>
            )}
            {canRenew(session) && (
              <Button icon={<RedoOutlined />} loading={busy} onClick={() => void renewInterview()}>
                {t('aiInterviewReinvite')}
              </Button>
            )}
            {session.role === 'teacher' && !terminal.has(session.effective_status) && (
              <Button danger loading={busy} onClick={() => void cancelInterview()}>
                {t('aiInterviewCancel')}
              </Button>
            )}
          </Space>
        </header>

        {error && (
          <Alert showIcon closable type="error" message={error} onClose={() => setError('')} />
        )}
        {session.job?.status === 'failed' && (
          <Alert
            showIcon
            type="error"
            message={t('aiInterviewGenerationFailed')}
            description={session.job.error}
          />
        )}
        {session.job?.status === 'blocked' && (
          <Alert
            showIcon
            type="warning"
            message={t('aiInterviewGenerationBlocked')}
            description={t('aiInterviewGenerationBlockedDescription')}
          />
        )}
        {session.effective_status === 'expired' && (
          <Alert showIcon type="warning" message={t('aiInterviewInvitationExpired')} />
        )}
        {session.effective_status === 'cancelled' && (
          <Alert showIcon type="info" message={t('aiInterviewCancelled')} />
        )}
        {session.state === 'rejected' && (
          <Alert showIcon type="warning" message={t('aiInterviewRejected')} />
        )}
        {session.state === 'adopted' && (
          <Alert showIcon type="success" message={t('aiInterviewAdopted')} />
        )}
        {data.evidence_policy && (
          <Alert
            showIcon
            type="info"
            message={t('aiInterviewEvidencePrivacy')}
            description={t('aiInterviewEvidencePrivacyDescription')}
          />
        )}

        <section className="ai-interview-band">
          <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
            <Descriptions.Item label={t('aiInterviewStudent')}>
              {data.student_username} · {data.student_id}
            </Descriptions.Item>
            <Descriptions.Item label={t('aiInterviewDeadline')}>
              {new Date(data.expires_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('aiInterviewDurationLabel')}>
              {t('aiInterviewDuration', { count: data.duration_minutes })}
            </Descriptions.Item>
            <Descriptions.Item label={t('aiInterviewQuestionsLabel')}>
              {data.turns.length} / {data.max_questions}
            </Descriptions.Item>
          </Descriptions>
        </section>

        <div className="ai-interview-session-grid">
          <section className="ai-interview-primary">
            {session.role === 'student' && data.status === 'pending' && (
              <div className="ai-interview-preflight">
                <div className="ai-interview-section-heading">
                  <Typography.Title level={4}>{t('aiInterviewDevicePreflight')}</Typography.Title>
                  <SafetyCertificateOutlined />
                </div>
                <div className="ai-interview-checks">
                  <span>
                    {checks.https ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                    {t('aiInterviewSecureConnection')}
                  </span>
                  <span>
                    {checks.camera ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                    {t('aiInterviewCamera')}
                  </span>
                  <span>
                    {checks.microphone ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                    {t('aiInterviewMicrophone')}
                  </span>
                  <span>
                    {checks.screen ? <CheckCircleOutlined /> : <CloseCircleOutlined />}{' '}
                    {t('aiInterviewScreenShare')}
                  </span>
                </div>
                <Space wrap>
                  <Button
                    icon={<VideoCameraOutlined />}
                    loading={busy}
                    onClick={() => void testCameraAndMicrophone()}
                  >
                    {t('aiInterviewTestCameraMicrophone')}
                  </Button>
                  <Button loading={busy} onClick={() => void testScreen()}>
                    {t('aiInterviewTestScreenShare')}
                  </Button>
                  <Checkbox
                    checked={checks.single_display}
                    onChange={(event) =>
                      setChecks((value) => ({ ...value, single_display: event.target.checked }))
                    }
                  >
                    {t('aiInterviewSingleDisplay')}
                  </Checkbox>
                  <Button
                    type="primary"
                    disabled={!checkComplete}
                    loading={busy}
                    onClick={() => void beginInterview()}
                  >
                    {t('aiInterviewBegin')}
                  </Button>
                </Space>
              </div>
            )}

            {currentTurn ? (
              <div className="ai-interview-turn">
                <Typography.Text type="secondary">
                  {t('aiInterviewQuestionNumber', { number: turnSequence + 1 })}
                </Typography.Text>
                <Typography.Title level={3}>{currentTurn.question}</Typography.Title>
                {currentTurn.source_type && currentTurn.source_type !== 'none' && (
                  <Tag>
                    {currentTurn.source_type} · {currentTurn.source_start_line}-
                    {currentTurn.source_end_line}
                  </Tag>
                )}
                {currentTurn.answer !== null && <blockquote>{currentTurn.answer}</blockquote>}
                {currentTurn.evaluation && <Alert type="info" message={currentTurn.evaluation} />}
              </div>
            ) : data.status !== 'pending' ? (
              <div className="ai-interview-generating">
                <Spin />
                <Typography.Text>{t('aiInterviewGeneratingQuestion')}</Typography.Text>
              </div>
            ) : null}

            {canAnswer && currentTurn && (
              <div className="ai-interview-answer-panel">
                <Divider />
                <Typography.Title level={4}>{t('aiInterviewAnswerEvidence')}</Typography.Title>
                <Segmented<MediaTrack>
                  value={activeTrack}
                  disabled={recording || recordingPending}
                  options={(data.media_policy?.required_tracks || ['video']).map((track) => ({
                    value: track,
                    label: trackNames[track],
                  }))}
                  onChange={setActiveTrack}
                />
                <video ref={previewRef} className="ai-interview-preview" muted playsInline />
                <Space wrap>
                  {!recording ? (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      loading={recordingPending}
                      onClick={() => void startRecording()}
                    >
                      {t('aiInterviewRecordTrack', { track: trackNames[activeTrack] })}
                    </Button>
                  ) : (
                    <Button danger icon={<PauseCircleOutlined />} onClick={stopRecording}>
                      {t('aiInterviewStopRecording')}
                    </Button>
                  )}
                  <Button icon={<CloudUploadOutlined />} onClick={() => void retryPendingMedia()}>
                    {t('aiInterviewRetryPending')}
                  </Button>
                  <label className="ai-interview-file-button">
                    {t('aiInterviewUploadMedia')}
                    <input
                      type="file"
                      accept="video/webm,video/mp4,audio/webm,audio/wav,audio/mpeg"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void addManualFile(file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                </Space>
                {uploading.total > 0 && uploading.done < uploading.total && (
                  <Progress percent={Math.round((100 * uploading.done) / uploading.total)} />
                )}
                <MediaManifest groups={turnManifest} />
                <Input.TextArea
                  aria-label={t('aiInterviewAnswer')}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  autoSize={{ minRows: 4, maxRows: 12 }}
                  maxLength={50000}
                />
                <Button
                  type="primary"
                  loading={busy}
                  disabled={!answer.trim() || !requiredComplete || recording}
                  onClick={() => void submitAnswer()}
                >
                  {t('aiInterviewSubmitQuestion')}
                </Button>
              </div>
            )}

            {data.status === 'completed' && data.candidate && session.role === 'teacher' && (
              <TeacherReviewPanel
                session={session}
                form={reviewForm}
                busy={busy}
                onReview={submitReview}
                onAdopt={adoptGrade}
              />
            )}
          </section>

          <aside className="ai-interview-evidence">
            <Typography.Title level={4}>{t('aiInterviewEvidenceTimeline')}</Typography.Title>
            {data.turns.length ? (
              <Timeline
                items={data.turns.map((turn, index) => ({
                  color: turn.answer === null ? 'gold' : 'green',
                  children: (
                    <div className="ai-interview-timeline-item">
                      <Typography.Text strong>
                        {t('aiInterviewQuestionNumber', { number: index + 1 })}
                      </Typography.Text>
                      <Typography.Text>{turn.question}</Typography.Text>
                      <MediaManifest
                        compact
                        groups={(session.media_manifest?.groups || []).filter(
                          (group) => group.turn_sequence === index,
                        )}
                      />
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('aiInterviewNoQuestions')}
              />
            )}
          </aside>
        </div>
      </main>
    </Layout>
  );
}

function MediaManifest({
  groups,
  compact = false,
}: {
  groups: ManifestGroup[];
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const trackNames: Record<MediaTrack, string> = {
    audio: t('aiInterviewTrackAudio'),
    video: t('aiInterviewTrackVideo'),
    screen: t('aiInterviewTrackScreen'),
  };
  if (!groups.length)
    return compact ? null : (
      <Alert type="warning" showIcon message={t('aiInterviewNoMediaEvidence')} />
    );
  return (
    <div className={compact ? 'ai-interview-manifest compact' : 'ai-interview-manifest'}>
      {groups.map((group) => (
        <div key={`${group.turn_sequence}-${group.track}`} className="ai-interview-track">
          <div className="ai-interview-track-status">
            <Typography.Text strong>{trackNames[group.track]}</Typography.Text>
            {group.complete ? (
              <Tag color="green">
                {t('aiInterviewCompleteSegments', { count: group.present_segments.length })}
              </Tag>
            ) : (
              <Tag color="red">
                {t('aiInterviewMissingSegments', {
                  segments: group.missing_segments.join(', ') || t('aiInterviewNotUploaded'),
                })}
              </Tag>
            )}
          </div>
          {!compact &&
            group.segments.map((segment) =>
              segment.track === 'audio' ? (
                <audio key={segment.file_id} controls preload="metadata" src={segment.url} />
              ) : (
                <video key={segment.file_id} controls preload="metadata" src={segment.url} />
              ),
            )}
        </div>
      ))}
    </div>
  );
}

function TeacherReviewPanel({
  session,
  form,
  busy,
  onReview,
  onAdopt,
}: {
  session: InterviewResource;
  form: ReturnType<typeof Form.useForm>[0];
  busy: boolean;
  onReview: (decision: 'approve' | 'reject') => Promise<void>;
  onAdopt: (overwriteManual: boolean) => Promise<void>;
}) {
  const { t } = useTranslation();
  const candidate = session.data.candidate!;
  const review = session.data.teacher_review;
  const [overwriteManual, setOverwriteManual] = useState(false);
  return (
    <div className="ai-interview-review">
      <Divider />
      <div className="ai-interview-section-heading">
        <Typography.Title level={4}>{t('aiInterviewTeacherReview')}</Typography.Title>
        <Tag color={candidate.integrity_conclusion === 'pass' ? 'green' : 'gold'}>
          {t('aiInterviewIntegrity', { value: candidate.integrity_conclusion })}
        </Tag>
      </div>
      <Alert
        type="info"
        message={t('aiInterviewCandidateScore', {
          score: candidate.score.toFixed(1),
          confidence: Math.round(candidate.confidence * 100),
        })}
        description={candidate.summary}
      />
      {review ? (
        <div className="ai-interview-reviewed">
          <Descriptions column={1} size="small">
            {review.criteria.map((item) => (
              <Descriptions.Item key={item.name} label={item.name}>
                {item.score} / {item.max_score}
              </Descriptions.Item>
            ))}
            <Descriptions.Item label={t('aiInterviewReviewNotes')}>
              {review.notes}
            </Descriptions.Item>
          </Descriptions>
          {review.decision === 'approve' &&
            (session.data.native_source || session.data.native_source_bound) &&
            session.state !== 'adopted' && (
              <Space direction="vertical" align="start">
                <Checkbox
                  checked={overwriteManual}
                  onChange={(event) => setOverwriteManual(event.target.checked)}
                >
                  {t('aiInterviewOverwriteManual')}
                </Checkbox>
                <Button type="primary" loading={busy} onClick={() => void onAdopt(overwriteManual)}>
                  {t('aiInterviewAdoptNative')}
                </Button>
              </Space>
            )}
          {session.state === 'adopted' && <Tag color="green">{t('aiInterviewAdoptedNative')}</Tag>}
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Form.List name="criteria">
            {(fields) =>
              fields.map((field, index) => {
                const rubric = session.data.rubric[index];
                return (
                  <div className="ai-interview-score-row" key={field.key}>
                    <Typography.Text>{rubric.name}</Typography.Text>
                    <Form.Item name={[field.name, 'name']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'score']} rules={[{ required: true }]}>
                      <InputNumber
                        min={0}
                        max={rubric.max_score}
                        suffix={`/ ${rubric.max_score}`}
                      />
                    </Form.Item>
                  </div>
                );
              })
            }
          </Form.List>
          <Form.Item name="notes" label={t('aiInterviewReviewNotes')} rules={[{ required: true }]}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} maxLength={4000} />
          </Form.Item>
          <Space>
            <Button
              type="primary"
              loading={busy}
              icon={<CheckCircleOutlined />}
              onClick={() => void onReview('approve')}
            >
              {t('aiInterviewApproveCandidate')}
            </Button>
            <Button
              danger
              loading={busy}
              icon={<CloseCircleOutlined />}
              onClick={() => void onReview('reject')}
            >
              {t('aiInterviewReturnCandidate')}
            </Button>
          </Space>
        </Form>
      )}
    </div>
  );
}
