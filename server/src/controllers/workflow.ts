import type { Core } from '@strapi/strapi';

// Never expose the raw secret value over the API once it's been set.
const sanitizeWebhook = (webhook: any) => ({
  ...webhook,
  secretHeader: undefined,
  hasSecret: Boolean(webhook.secretHeader),
});

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  // ------- Document Workflow State -------
  async getState(ctx: any) {
    try {
      const { contentType, documentId } = ctx.params;
      const state = await strapi
        .plugin('publishing-workflow')
        .service('workflow')
        .getDocumentState(contentType, documentId);

      const workflow = await strapi
        .plugin('publishing-workflow')
        .service('workflow')
        .getWorkflowForContentType(contentType);

      ctx.body = { state, stages: workflow?.stages || [] };
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async transition(ctx: any) {
    try {
      const { contentType, documentId, targetStageId, comment } = ctx.request.body;
      const user = ctx.state.user;

      const newState = await strapi
        .plugin('publishing-workflow')
        .service('workflow')
        .transitionDocument(contentType, documentId, targetStageId, user, comment);

      ctx.body = { state: newState };
    } catch (err: any) {
      ctx.throw(400, err.message);
    }
  },

  async getHistory(ctx: any) {
    try {
      const { contentType, documentId } = ctx.params;
      const history = await strapi.documents('plugin::publishing-workflow.workflow-history').findMany({
        filters: { contentType, entryDocumentId: documentId } as any,
        populate: ['fromStage', 'toStage'],
        sort: ['createdAt:desc'],
      });

      ctx.body = { history };
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  // ------- Workflow CRUD -------
  async listWorkflows(ctx: any) {
    const workflows = await strapi.documents('plugin::publishing-workflow.workflow').findMany({
      populate: ['stages'],
    });
    ctx.body = { data: workflows };
  },

  async createWorkflow(ctx: any) {
    const { name, description, targetContentTypes } = ctx.request.body;
    const workflow = await strapi.documents('plugin::publishing-workflow.workflow').create({
      data: { name, description, targetContentTypes },
    });
    ctx.body = { data: workflow };
  },

  async updateWorkflow(ctx: any) {
    const { id } = ctx.params;
    const { name, description, targetContentTypes } = ctx.request.body;
    const workflow = await strapi.documents('plugin::publishing-workflow.workflow').update({
      documentId: id,
      data: { name, description, targetContentTypes } as any,
    });
    ctx.body = { data: workflow };
  },

  async deleteWorkflow(ctx: any) {
    const { id } = ctx.params;
    await strapi.documents('plugin::publishing-workflow.workflow').delete({ documentId: id });
    ctx.body = { ok: true };
  },

  // ------- Stage CRUD -------
  async listStages(ctx: any) {
    const stages = await strapi.documents('plugin::publishing-workflow.workflow-stage').findMany({
      sort: ['order:asc'],
      populate: ['workflow'],
    });
    ctx.body = { data: stages };
  },

  async createStage(ctx: any) {
    const { name, color, order, canPublish, workflowId, allowedRoles } = ctx.request.body;
    const stage = await strapi.documents('plugin::publishing-workflow.workflow-stage').create({
      data: { name, color, order, canPublish, workflow: workflowId, allowedRoles },
    });
    ctx.body = { data: stage };
  },

  async updateStage(ctx: any) {
    const { id } = ctx.params;
    const { name, color, order, canPublish, allowedRoles } = ctx.request.body;
    const stage = await strapi.documents('plugin::publishing-workflow.workflow-stage').update({
      documentId: id,
      data: { name, color, order, canPublish, allowedRoles } as any,
    });
    ctx.body = { data: stage };
  },

  async deleteStage(ctx: any) {
    const { id } = ctx.params;
    await strapi.documents('plugin::publishing-workflow.workflow-stage').delete({ documentId: id });
    ctx.body = { ok: true };
  },

  // ------- Webhook CRUD -------
  async listWebhooks(ctx: any) {
    const webhooks = await strapi.documents('plugin::publishing-workflow.webhook-config').findMany({});
    ctx.body = { data: (webhooks as any[]).map(sanitizeWebhook) };
  },

  async createWebhook(ctx: any) {
    const { name, url, secretHeader, events, enabled } = ctx.request.body;
    const webhook = await strapi.documents('plugin::publishing-workflow.webhook-config').create({
      data: { name, url, secretHeader, events, enabled },
    });
    ctx.body = { data: sanitizeWebhook(webhook) };
  },

  async updateWebhook(ctx: any) {
    const { id } = ctx.params;
    const { name, url, secretHeader, events, enabled } = ctx.request.body;
    const webhook = await strapi.documents('plugin::publishing-workflow.webhook-config').update({
      documentId: id,
      data: { name, url, secretHeader, events, enabled } as any,
    });
    ctx.body = { data: sanitizeWebhook(webhook) };
  },

  async deleteWebhook(ctx: any) {
    const { id } = ctx.params;
    await strapi.documents('plugin::publishing-workflow.webhook-config').delete({ documentId: id });
    ctx.body = { ok: true };
  },
});
