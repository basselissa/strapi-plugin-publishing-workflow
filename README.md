# Publishing Workflow

A [Strapi v5](https://strapi.io) plugin that adds multi-stage publishing workflows to any content type. Instead of the default draft/published toggle, documents move through a sequence of custom stages (e.g. `Draft` → `In Review` → `Approved`), and publishing is only allowed once a document reaches a stage marked as publishable.

## Features

- **Custom workflows per content type** — define one or more named stages, each with an order, a color, and a `canPublish` flag.
- **Publish gating** — a document can only be published from a stage where `canPublish` is `true`. Attempting to publish from any other stage is rejected with a clear validation error.
- **Per-stage role restrictions** — optionally restrict which admin roles are allowed to move a document into a given stage.
- **Audit history** — every stage transition is recorded with who made it, when, and an optional comment.
- **Webhooks** — notify external systems on `on_stage_change` and `on_publish_rejected` events, with an optional bearer-token secret per webhook.
- **Role-based permissions** — read/create/update/delete/transition are separate, assignable permissions in Strapi's Roles & Permissions settings, so you can give reviewers transition rights without giving them workflow-management access.
- **Admin UI** — a Settings page for managing workflows, stages, and webhooks, plus a widget injected into every content type's edit view showing the current stage and a control to move it forward.

## Requirements

- Strapi `^5.52.2`
- Node `>=20`
- React `^18.3.1` (matches Strapi's own admin panel)

## Installation

This plugin isn't published to a package registry yet. To use it in a Strapi project, clone it directly into that project's plugin folder:

```bash
git clone <this-repo-url> src/plugins/publishing-workflow
cd src/plugins/publishing-workflow
npm install
npm run build
```

Then enable it in `config/plugins.ts` (or `.js`):

```ts
export default () => ({
  'publishing-workflow': {
    enabled: true,
    resolve: './src/plugins/publishing-workflow',
  },
});
```

Restart the Strapi app. On boot, the plugin registers its own content types (workflows, stages, workflow state, history, webhook configs) — no manual migration is needed.

## Setting up a workflow

1. Open **Settings → Publishing Workflow** (or the top-level "Publishing Workflow" menu entry) in the admin panel.
2. Click **Create New Workflow**, give it a name, and list the content type UIDs it should apply to (e.g. `api::article.article`), comma-separated.
3. Inside the workflow, click **Add Stage** for each step in your process. Set:
   - **Order** — position in the sequence (lowest first; a document with no state defaults to the lowest-order stage).
   - **Can Publish** — whether documents may be published while in this stage.
   - Optionally restrict the stage to specific admin roles.
4. Open any entry of a targeted content type in the Content Manager. A **Publishing Workflow** panel appears in the right sidebar showing the current stage, with a dropdown and comment box to move it to another stage.
5. Attempting to publish a document that isn't in a publishable stage fails with `Cannot publish document in stage: <name>` until it's moved into one that is.

## Permissions

The plugin registers five permission actions under **Settings → Roles → \<role\> → Plugins → Publishing workflow**:

| Action | Controls |
|---|---|
| `read` | Viewing workflows, stages, webhooks, a document's current stage, and its history |
| `create` | Creating workflows, stages, webhooks |
| `update` | Editing workflows, stages, webhooks |
| `delete` | Deleting workflows, stages, webhooks |
| `transition` | Moving a document from one stage to another |

None of these are granted by default (aside from Super Admin) — assign them explicitly to any role that should manage workflows or perform transitions.

## Webhooks

Configure a webhook under the workflow settings with a target URL and the events it should receive:

- `on_stage_change` — fired after a successful transition. Payload includes `entryDocumentId`, `contentType`, `fromStage`, `toStage`, `user`, and `comment`.
- `on_publish_rejected` — fired when a publish attempt is blocked. Payload includes `documentId`, `contentType`, and `stage`.

If a webhook has a secret set, it's sent as `Authorization: Bearer <secret>` on every request. The secret is write-only — it's never returned by the API once set (list/read responses only expose a `hasSecret` boolean).

## Data model

The plugin adds these collection types (all internal — not shown in the main Content Manager list except workflows, which are manageable from the plugin's own Settings page):

- `workflow` — name, description, target content type UIDs, related stages.
- `workflow-stage` — name, color, order, `canPublish`, optional `allowedRoles`, belongs to a workflow.
- `workflow-state` — the current stage for a given `(contentType, entryDocumentId)` pair.
- `workflow-history` — an append-only log of every transition.
- `webhook-config` — name, URL, secret, subscribed events, enabled flag.

## API

All routes are admin-panel routes (require an authenticated admin session plus the matching permission above):

| Method | Path | Permission |
|---|---|---|
| GET | `/publishing-workflow/state/:contentType/:documentId` | `read` |
| POST | `/publishing-workflow/transition` | `transition` |
| GET | `/publishing-workflow/history/:contentType/:documentId` | `read` |
| GET/POST | `/publishing-workflow/workflows` | `read` / `create` |
| PUT/DELETE | `/publishing-workflow/workflows/:id` | `update` / `delete` |
| GET/POST | `/publishing-workflow/stages` | `read` / `create` |
| PUT/DELETE | `/publishing-workflow/stages/:id` | `update` / `delete` |
| GET/POST | `/publishing-workflow/webhooks` | `read` / `create` |
| PUT/DELETE | `/publishing-workflow/webhooks/:id` | `update` / `delete` |

## Notes and limitations

- If a content type is targeted by more than one workflow, which one applies is undefined — keep workflow-to-content-type assignment 1:1.
- Only the `publish` action is gated; there's no equivalent restriction on `unpublish` or `update`.
- No bulk actions yet — transitions are one document at a time.

## License

MIT
