import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Flex,
  Field,
  TextInput,
  Toggle,
  Modal,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
  MultiSelect,
  MultiSelectOption,
} from '@strapi/design-system';
import { Pencil, Trash, Plus, ChevronDown, ChevronUp } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';

const DEFAULT_COLORS = ['#cbd5e1', '#fde047', '#86efac', '#93c5fd', '#f9a8d4', '#a5b4fc', '#fdba74'];

function StageRow({ stage, roles, onEdit, onDelete }: any) {
  const allowedRoleNames = (stage.allowedRoles || [])
    .map((roleId: number) => roles.find((r: any) => r.id === roleId)?.name)
    .filter(Boolean);

  return (
    <Tr>
      <Td><Typography variant="omega">{stage.name}</Typography></Td>
      <Td>
        <Box
          style={{
            display: 'inline-block',
            width: 20,
            height: 20,
            borderRadius: 4,
            backgroundColor: stage.color || '#cbd5e1',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
      </Td>
      <Td><Typography variant="omega">{stage.order}</Typography></Td>
      <Td>
        <Badge active={stage.canPublish}>{stage.canPublish ? 'Yes' : 'No'}</Badge>
      </Td>
      <Td>
        {allowedRoleNames.length > 0 ? (
          <Flex gap={1} wrap="wrap">
            {allowedRoleNames.map((name: string) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </Flex>
        ) : (
          <Typography variant="pi" textColor="neutral500">Any role</Typography>
        )}
      </Td>
      <Td>
        <Flex gap={2}>
          <IconButton onClick={() => onEdit(stage)} label="Edit"><Pencil /></IconButton>
          <IconButton onClick={() => onDelete(stage)} label="Delete"><Trash /></IconButton>
        </Flex>
      </Td>
    </Tr>
  );
}

function StageModal({ isOpen, onClose, onSave, stage, workflowId, roles }: any) {
  const [name, setName] = useState(stage?.name || '');
  const [color, setColor] = useState(stage?.color || '#cbd5e1');
  const [order, setOrder] = useState(stage?.order ?? 0);
  const [canPublish, setCanPublish] = useState(stage?.canPublish ?? false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(
    (stage?.allowedRoles || []).map((id: number) => String(id))
  );

  useEffect(() => {
    setName(stage?.name || '');
    setColor(stage?.color || '#cbd5e1');
    setOrder(stage?.order ?? 0);
    setCanPublish(stage?.canPublish ?? false);
    setAllowedRoles((stage?.allowedRoles || []).map((id: number) => String(id)));
  }, [stage]);

  const handleSave = () => {
    onSave({
      name,
      color,
      order: Number(order),
      canPublish,
      allowedRoles: allowedRoles.length > 0 ? allowedRoles.map(Number) : null,
      workflowId,
      id: stage?.documentId,
    });
  };

  if (!isOpen) return null;

  return (
    <Modal.Root open={isOpen} onOpenChange={onClose}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>{stage ? 'Edit Stage' : 'New Stage'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={4}>
            <Field.Root>
              <Field.Label>Stage Name</Field.Label>
              <TextInput
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="e.g. In Review"
              />
            </Field.Root>

            <Box>
              <Typography variant="pi" fontWeight="bold" textColor="neutral800">Color</Typography>
              <Flex gap={2} marginTop={1} wrap="wrap">
                {DEFAULT_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: color === c ? '3px solid #4945ff' : '2px solid rgba(0,0,0,0.1)',
                    }}
                  />
                ))}
              </Flex>
            </Box>

            <Field.Root>
              <Field.Label>Order</Field.Label>
              <TextInput
                type="number"
                value={String(order)}
                onChange={(e: any) => setOrder(e.target.value)}
              />
            </Field.Root>

            <Flex alignItems="center" gap={3}>
              <Toggle
                checked={canPublish}
                onChange={() => setCanPublish((p: boolean) => !p)}
                onLabel="Can Publish"
                offLabel="Locked"
              />
              <Typography variant="pi" textColor="neutral600">
                {canPublish ? 'Documents in this stage can be published' : 'Documents in this stage cannot be published'}
              </Typography>
            </Flex>

            <Field.Root
              hint={
                roles.length > 0
                  ? 'Only the selected roles will be able to move a document into this stage. Leave empty to allow anyone with transition permission.'
                  : 'No admin roles available to pick from — this requires the core "Roles: Read" permission (Settings → Roles). Leave empty to allow any role with transition permission.'
              }
            >
              <Field.Label>Allowed Roles</Field.Label>
              {roles.length > 0 && (
                <MultiSelect
                  placeholder="Any role can transition into this stage"
                  value={allowedRoles}
                  onChange={setAllowedRoles}
                >
                  {roles.map((role: any) => (
                    <MultiSelectOption key={role.id} value={String(role.id)}>
                      {role.name}
                    </MultiSelectOption>
                  ))}
                </MultiSelect>
              )}
              <Field.Hint />
            </Field.Root>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose} variant="tertiary">Cancel</Button>
          <Button onClick={handleSave}>Save Stage</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

function WorkflowCard({ workflow, onDeleteWorkflow, fetchClient, roles }: any) {
  const [stages, setStages] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);

  const loadStages = async () => {
    const res = await fetchClient.get('/publishing-workflow/stages');
    const all: any[] = (res.data as any)?.data || [];
    setStages(all.filter((s: any) => s.workflow?.documentId === workflow.documentId));
  };

  useEffect(() => {
    loadStages();
  }, [workflow.documentId]);

  const handleSaveStage = async (stageData: any) => {
    if (stageData.id) {
      await fetchClient.put(`/publishing-workflow/stages/${stageData.id}`, stageData);
    } else {
      await fetchClient.post('/publishing-workflow/stages', { body: stageData });
    }
    setStageModalOpen(false);
    setEditingStage(null);
    loadStages();
  };

  const handleDeleteStage = async (stage: any) => {
    await fetchClient.del(`/publishing-workflow/stages/${stage.documentId}`);
    loadStages();
  };

  return (
    <Box padding={4} background="neutral0" borderColor="neutral200" hasRadius marginBottom={4}>
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="beta" fontWeight="bold">{workflow.name}</Typography>
          <Box marginTop={1}>
            <Typography variant="pi" textColor="neutral600">
              Target types: {(workflow.targetContentTypes || []).join(', ') || 'None configured'}
            </Typography>
          </Box>
        </Box>
        <Flex gap={2}>
          <IconButton onClick={() => setExpanded((e: boolean) => !e)} label="Toggle">
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
          <IconButton onClick={() => onDeleteWorkflow(workflow)} label="Delete Workflow"><Trash /></IconButton>
        </Flex>
      </Flex>

      {expanded && (
        <Box marginTop={4}>
          <Divider />
          <Flex justifyContent="space-between" alignItems="center" marginTop={3} marginBottom={2}>
            <Typography variant="omega" fontWeight="bold">Stages</Typography>
            <Button
              size="S"
              startIcon={<Plus />}
              onClick={() => { setEditingStage(null); setStageModalOpen(true); }}
            >
              Add Stage
            </Button>
          </Flex>
          {stages.length === 0 ? (
            <Typography variant="pi" textColor="neutral500">No stages yet. Click "Add Stage" to create your first!</Typography>
          ) : (
            <Table colCount={6} rowCount={stages.length}>
              <Thead>
                <Tr>
                  <Th><Typography variant="sigma">Name</Typography></Th>
                  <Th><Typography variant="sigma">Color</Typography></Th>
                  <Th><Typography variant="sigma">Order</Typography></Th>
                  <Th><Typography variant="sigma">Can Publish</Typography></Th>
                  <Th><Typography variant="sigma">Allowed Roles</Typography></Th>
                  <Th><Typography variant="sigma">Actions</Typography></Th>
                </Tr>
              </Thead>
              <Tbody>
                {stages
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((stage: any) => (
                    <StageRow
                      key={stage.documentId}
                      stage={stage}
                      roles={roles}
                      onEdit={(s: any) => { setEditingStage(s); setStageModalOpen(true); }}
                      onDelete={handleDeleteStage}
                    />
                  ))}
              </Tbody>
            </Table>
          )}
        </Box>
      )}

      <StageModal
        isOpen={stageModalOpen}
        onClose={() => { setStageModalOpen(false); setEditingStage(null); }}
        onSave={handleSaveStage}
        stage={editingStage}
        workflowId={workflow.documentId}
        roles={roles}
      />
    </Box>
  );
}

export default function Settings() {
  const { get, post, del } = useFetchClient();
  const fetchClient = {
    get,
    post,
    put: async (url: string, data: any) => post(url, { body: data }),
    del,
  };

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowTypes, setNewWorkflowTypes] = useState('');
  const [creating, setCreating] = useState(false);

  const loadWorkflows = async () => {
    const res = await get('/publishing-workflow/workflows');
    setWorkflows((res.data as any)?.data || []);
  };

  const loadRoles = async () => {
    try {
      const res = await get('/admin/roles');
      setRoles((res.data as any)?.data || []);
    } catch {
      // User likely lacks the core "Roles: Read" permission — the Allowed
      // Roles picker will fall back to a disabled state with an explanation.
      setRoles([]);
    }
  };

  useEffect(() => {
    loadWorkflows();
    loadRoles();
  }, []);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName) return;
    setCreating(true);
    try {
      const types = newWorkflowTypes.split(',').map((s) => s.trim()).filter(Boolean);
      await post('/publishing-workflow/workflows', {
        body: { name: newWorkflowName, targetContentTypes: types }
      });
      setNewWorkflowName('');
      setNewWorkflowTypes('');
      loadWorkflows();
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkflow = async (workflow: any) => {
    await del(`/publishing-workflow/workflows/${workflow.documentId}`);
    loadWorkflows();
  };

  return (
    <Box padding={8} background="neutral100">
      <Box marginBottom={6}>
        <Typography variant="alpha">Publishing Workflow</Typography>
        <Box marginTop={1}>
          <Typography variant="epsilon" textColor="neutral600">
            Manage workflows, stages, and publishing permissions for your content types.
          </Typography>
        </Box>
      </Box>

      {/* Create new workflow */}
      <Box padding={4} background="neutral0" borderColor="neutral200" hasRadius marginBottom={6}>
        <Box marginBottom={3}>
          <Typography variant="beta" fontWeight="bold">Create New Workflow</Typography>
        </Box>
        <Flex gap={3} alignItems="flex-end" wrap="wrap">
          <Field.Root>
            <Field.Label>Workflow Name</Field.Label>
            <TextInput
              value={newWorkflowName}
              onChange={(e: any) => setNewWorkflowName(e.target.value)}
              placeholder="e.g. Blog Workflow"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Target Content Types</Field.Label>
            <Typography variant="pi" textColor="neutral500">Comma-separated Strapi UIDs, e.g. api::article.article</Typography>
            <TextInput
              value={newWorkflowTypes}
              onChange={(e: any) => setNewWorkflowTypes(e.target.value)}
              placeholder="api::article.article"
            />
          </Field.Root>
          <Button startIcon={<Plus />} onClick={handleCreateWorkflow} loading={creating}>
            Create Workflow
          </Button>
        </Flex>
      </Box>

      {workflows.length === 0 ? (
        <Box padding={4} background="neutral0" hasRadius borderColor="neutral200">
          <Typography variant="pi" textColor="neutral500">No workflows yet. Create one above to get started!</Typography>
        </Box>
      ) : (
        workflows.map((wf: any) => (
          <WorkflowCard
            key={wf.documentId}
            workflow={wf}
            onDeleteWorkflow={handleDeleteWorkflow}
            fetchClient={fetchClient}
            roles={roles}
          />
        ))
      )}
    </Box>
  );
}
