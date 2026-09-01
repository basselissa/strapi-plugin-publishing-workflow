const permission = (action: string) => [
  'admin::isAuthenticatedAdmin',
  {
    name: 'admin::hasPermissions',
    config: { actions: [`plugin::publishing-workflow.${action}`] },
  },
];

export default {
  'content-api': {
    type: 'content-api',
    routes: [],
  },
  admin: {
    type: 'admin',
    routes: [
      // Workflow state
      {
        method: 'GET',
        path: '/state/:contentType/:documentId',
        handler: 'workflow.getState',
        config: { policies: permission('read') },
      },
      {
        method: 'POST',
        path: '/transition',
        handler: 'workflow.transition',
        config: { policies: permission('transition') },
      },
      {
        method: 'GET',
        path: '/history/:contentType/:documentId',
        handler: 'workflow.getHistory',
        config: { policies: permission('read') },
      },
      // Workflows CRUD
      {
        method: 'GET',
        path: '/workflows',
        handler: 'workflow.listWorkflows',
        config: { policies: permission('read') },
      },
      {
        method: 'POST',
        path: '/workflows',
        handler: 'workflow.createWorkflow',
        config: { policies: permission('create') },
      },
      {
        method: 'PUT',
        path: '/workflows/:id',
        handler: 'workflow.updateWorkflow',
        config: { policies: permission('update') },
      },
      {
        method: 'DELETE',
        path: '/workflows/:id',
        handler: 'workflow.deleteWorkflow',
        config: { policies: permission('delete') },
      },
      // Stages CRUD
      {
        method: 'GET',
        path: '/stages',
        handler: 'workflow.listStages',
        config: { policies: permission('read') },
      },
      {
        method: 'POST',
        path: '/stages',
        handler: 'workflow.createStage',
        config: { policies: permission('create') },
      },
      {
        method: 'PUT',
        path: '/stages/:id',
        handler: 'workflow.updateStage',
        config: { policies: permission('update') },
      },
      {
        method: 'DELETE',
        path: '/stages/:id',
        handler: 'workflow.deleteStage',
        config: { policies: permission('delete') },
      },
      // Webhook configs CRUD
      {
        method: 'GET',
        path: '/webhooks',
        handler: 'workflow.listWebhooks',
        config: { policies: permission('read') },
      },
      {
        method: 'POST',
        path: '/webhooks',
        handler: 'workflow.createWebhook',
        config: { policies: permission('create') },
      },
      {
        method: 'PUT',
        path: '/webhooks/:id',
        handler: 'workflow.updateWebhook',
        config: { policies: permission('update') },
      },
      {
        method: 'DELETE',
        path: '/webhooks/:id',
        handler: 'workflow.deleteWebhook',
        config: { policies: permission('delete') },
      },
    ],
  },
};
