import workflow from './workflow/schema.json';
import workflowStage from './workflow-stage/schema.json';
import workflowState from './workflow-state/schema.json';
import workflowHistory from './workflow-history/schema.json';
import webhookConfig from './webhook-config/schema.json';

export default {
  workflow: { schema: workflow },
  'workflow-stage': { schema: workflowStage },
  'workflow-state': { schema: workflowState },
  'workflow-history': { schema: workflowHistory },
  'webhook-config': { schema: webhookConfig },
};