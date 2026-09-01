import { useState, useEffect } from 'react';
import { unstable_useContentManagerContext, useFetchClient } from '@strapi/strapi/admin';
import {
  Box,
  Typography,
  Button,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  Divider,
  Flex,
  Badge,
} from '@strapi/design-system';

export const ContentManagerWidget = () => {
  const { slug, id, isCreatingEntry } = unstable_useContentManagerContext();
  const { get, post } = useFetchClient();

  const [workflowData, setWorkflowData] = useState<any>(null);
  const [selectedStage, setSelectedStage] = useState<any>('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchState = async () => {
    if (!id || isCreatingEntry) return;
    try {
      const res = await get(`/publishing-workflow/state/${slug}/${id}`);
      setWorkflowData(res.data);
    } catch {
      // No workflow for this content type – don't show the widget
    }
  };

  useEffect(() => {
    fetchState();
  }, [slug, id, isCreatingEntry]);

  const handleTransition = async () => {
    if (!selectedStage) return;
    setLoading(true);
    try {
      await post('/publishing-workflow/transition', {
        contentType: slug,
        documentId: id,
        targetStageId: selectedStage,
        comment,
      });
      setComment('');
      setSelectedStage('');
      await fetchState();
    } finally {
      setLoading(false);
    }
  };

  if (isCreatingEntry) {
    return (
      <Box padding={4} background="neutral0" borderColor="neutral200" hasRadius marginBottom={4}>
        <Typography variant="pi" textColor="neutral500">
          Save the document first to see workflow status.
        </Typography>
      </Box>
    );
  }

  if (!workflowData || !workflowData.stages || workflowData.stages.length === 0) {
    return null; // No workflow configured for this content type
  }

  const { state, stages } = workflowData;
  const currentStage = state?.stage || stages[0];

  return (
    <Box
      padding={4}
      background="neutral0"
      borderColor="neutral200"
      hasRadius
      marginBottom={4}
      style={{ borderRadius: '8px' }}
    >
      <Typography variant="omega" fontWeight="bold" textColor="neutral800">
        Publishing Workflow
      </Typography>

      {/* Current Stage Badge */}
      <Box marginTop={3}>
        <Typography variant="pi" textColor="neutral600" marginBottom={1}>Current Stage</Typography>
        <Flex gap={2} alignItems="center" marginTop={1}>
          <Box
            padding={1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 8,
              backgroundColor: currentStage?.color || '#e2e8f0',
              borderRadius: 4,
            }}
          >
            <Typography variant="pi" fontWeight="bold" textColor="neutral800">
              {currentStage?.name || 'No Stage'}
            </Typography>
          </Box>
          {currentStage?.canPublish ? (
            <Badge active>Publishable</Badge>
          ) : (
            <Badge>Locked</Badge>
          )}
        </Flex>
      </Box>

      <Box marginTop={4} marginBottom={4}>
        <Divider />
      </Box>

      {/* Transition Controls */}
      <Box>
        <Typography variant="pi" fontWeight="bold" textColor="neutral800">
          Move to Stage
        </Typography>
        <Box marginTop={2}>
          <SingleSelect
            placeholder="Select next stage..."
            value={selectedStage}
            onChange={(val: any) => setSelectedStage(val)}
          >
            {stages.map((stage: any) => (
              <SingleSelectOption key={stage.documentId} value={stage.documentId}>
                {stage.name}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Box>
        <Box marginTop={2}>
          <TextInput
            placeholder="Add a reviewer note (optional)..."
            value={comment}
            onChange={(e: any) => setComment(e.target.value)}
          />
        </Box>
        <Box marginTop={2}>
          <Button
            fullWidth
            onClick={handleTransition}
            disabled={!selectedStage || loading}
            loading={loading}
          >
            Move Stage
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
