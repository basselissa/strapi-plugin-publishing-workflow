import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getWorkflowForContentType(contentType: string) {
    const workflows = await strapi.documents('plugin::publishing-workflow.workflow').findMany({
      populate: ['stages'],
    });

    for (const wf of workflows as any[]) {
      if (wf.targetContentTypes && Array.isArray(wf.targetContentTypes) && wf.targetContentTypes.includes(contentType)) {
        return wf;
      }
    }
    return null;
  },

  async getDocumentState(contentType: string, entryDocumentId: string) {
    const state = await strapi.documents('plugin::publishing-workflow.workflow-state').findFirst({
      filters: { contentType, entryDocumentId } as any,
      populate: ['stage'],
    });

    if (state) return state;

    // If no state exists, return the first stage of the matched workflow
    const workflow = await this.getWorkflowForContentType(contentType);
    if (workflow && workflow.stages && workflow.stages.length > 0) {
      workflow.stages.sort((a: any, b: any) => a.order - b.order);
      return { stage: workflow.stages[0], entryDocumentId, contentType, id: null };
    }

    return null;
  },

  async transitionDocument(contentType: string, entryDocumentId: string, toStageId: string, user: any, comment: string) {
    // 1. Get current state
    const currentState: any = await this.getDocumentState(contentType, entryDocumentId);
    if (!currentState) {
      throw new Error('Workflow not found for this document');
    }

    const workflow = await this.getWorkflowForContentType(contentType);
    if (!workflow) {
      throw new Error('No workflow defined for this content type');
    }

    // 2. Validate toStageId belongs to workflow
    const targetStage = workflow.stages.find((s: any) => s.documentId === toStageId);
    if (!targetStage) {
      throw new Error('Invalid target stage');
    }

    // 3. Optional: Validate user roles
    if (targetStage.allowedRoles && Array.isArray(targetStage.allowedRoles) && targetStage.allowedRoles.length > 0) {
      const userRoles = user?.roles?.map((r: any) => r.id) || [];
      const hasPermission = targetStage.allowedRoles.some((roleId: any) => userRoles.includes(roleId));
      if (!hasPermission) {
        throw new Error('You do not have permission to transition to this stage');
      }
    }

    // 4. Update or Create Workflow State
    let stateEntry;
    if (currentState.id) {
      // Existing state — update it (documentId here is the Strapi built-in ID of the state record)
      stateEntry = await strapi.documents('plugin::publishing-workflow.workflow-state').update({
        documentId: currentState.documentId, // Strapi's own built-in documentId for the state record
        data: {
          stage: targetStage.documentId,
          notes: comment,
        } as any
      });
    } else {
      stateEntry = await strapi.documents('plugin::publishing-workflow.workflow-state').create({
        data: {
          entryDocumentId,  // our renamed field
          contentType,
          stage: targetStage.documentId,
          notes: comment,
        } as any
      });
    }

    // 5. Create Audit History
    await strapi.documents('plugin::publishing-workflow.workflow-history').create({
      data: {
        entryDocumentId,   // our renamed field
        contentType,
        fromStage: currentState.stage?.documentId || null,
        toStage: targetStage.documentId,
        performedBy: user?.id,
        comment,
      } as any
    });

    // 6. Dispatch Webhook
    const webhookDispatcher = strapi.plugin('publishing-workflow').service('webhook-dispatcher');
    await webhookDispatcher.dispatch('on_stage_change', {
      entryDocumentId,
      contentType,
      fromStage: currentState.stage?.name,
      toStage: targetStage.name,
      user: user?.email || user?.username,
      comment
    });

    return stateEntry;
  }
});
