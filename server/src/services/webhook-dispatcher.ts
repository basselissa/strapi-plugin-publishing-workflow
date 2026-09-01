import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async dispatch(event: string, payload: any) {
    try {
      // Find all enabled webhooks that listen to this event
      const webhooks = await strapi.documents('plugin::publishing-workflow.webhook-config').findMany({
        filters: { enabled: true },
      });

      // Filter webhooks manually since JSON array filtering can be tricky in some DBs
      const matchingWebhooks = (webhooks as any[]).filter((webhook) => {
        if (!webhook.events || !Array.isArray(webhook.events)) return false;
        return webhook.events.includes(event);
      });

      for (const webhook of matchingWebhooks) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (webhook.secretHeader) {
          headers['Authorization'] = `Bearer ${webhook.secretHeader}`;
        }

        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              event,
              timestamp: new Date().toISOString(),
              payload,
            }),
          });
          strapi.log.info(`[publishing-workflow] Webhook dispatched to ${webhook.url} for event ${event}`);
        } catch (fetchError) {
          strapi.log.error(`[publishing-workflow] Failed to dispatch webhook to ${webhook.url}:`, fetchError);
        }
      }
    } catch (error) {
      strapi.log.error('[publishing-workflow] Error in webhook dispatcher:', error);
    }
  },
});
