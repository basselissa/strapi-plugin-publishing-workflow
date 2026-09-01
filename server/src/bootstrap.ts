import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.documents.use(async (ctx: any, next: any) => {
    // Only intercept publish actions
    if (ctx.action === 'publish') {
      const { uid, params } = ctx;
      const { documentId } = params;

      // Check if this content type has a workflow assigned
      const workflowService = strapi.plugin('publishing-workflow').service('workflow');
      const workflow = await workflowService.getWorkflowForContentType(uid);
      
      if (workflow) {
        // Fetch current document state
        const state = await workflowService.getDocumentState(uid, documentId);
        
        if (state && state.stage) {
          if (state.stage.canPublish === false) {
            
            // Dispatch webhook for blocked publication
            const webhookDispatcher = strapi.plugin('publishing-workflow').service('webhook-dispatcher');
            await webhookDispatcher.dispatch('on_publish_rejected', {
              documentId,
              contentType: uid,
              stage: state.stage.name
            });

            // Throw a validation error to block publication
            throw new errors.ValidationError(`Cannot publish document in stage: ${state.stage.name}`);
          }
        }
      }
    }

    // Call next to continue the operation
    return next(ctx);
  });
};