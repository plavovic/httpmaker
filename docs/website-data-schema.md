# Website data schema

`WebsiteJSON` is the persisted frontend document rendered and edited by HTTPMAKER. It contains `schemaVersion: 1`, optional preset/customization metadata, the website theme, and an ordered non-empty array of sections. Registered section types are navbar, hero, about, carousel, features, contact, and footer.

Persisted section data includes the ID, type, variant, common content props, and optional background, element styles, element links, section animation settings, and custom string content. Theme colors and CSS-like values intentionally accept strings because the editor supports open-ended CSS values, local asset references, paths, hashes, mail links, and telephone links.

Temporary editor state is not part of `WebsiteJSON`. Selection, active tabs, viewport mode, open panels, drag state, history controls, saving state, and AI preview state stay in editor components and hooks.

## Versioning and validation

`CURRENT_WEBSITE_SCHEMA_VERSION` is currently `1`. The root schema requires that exact value. `upgradeLegacyWebsiteData` only adds version 1 to the pre-version localStorage shape; it is a small compatibility bridge, not a general migration system. Unsupported future versions fail validation.

Use `safelyParseWebsiteData(input)` at untrusted boundaries such as localStorage, imported JSON, future API responses, database records, or AI output. Use `parseWebsiteData(input)` when invalid data is a programming error, as with default data. The editor does not delete invalid localStorage values.

## Extending persisted data

To add a section type, first add its TypeScript discriminator and renderer registration, then add its literal schema to `schemas/section.schema.ts` and include it in `websiteSectionSchema`. If its content shape differs, define that real shape in its branch rather than widening every section.

To persist a new element-style property, add it to `EditableElementStyle` and `editableElementStyleSchema` with constraints matching the editor control. For another persisted field, update both the domain type and its closest modular schema, then update the initial/template data if the field is required.

Run `npm run test:website-schema`, `npm run test:ai-stage2`, `npm run test:ai-stage3`, TypeScript checking, and a production build after schema changes. Manually verify loading valid and invalid localStorage data, editing/applying Website JSON, undo/redo, section duplication/deletion/reordering, styling, links, animations, presets, preview, and export.

Backend work is intentionally excluded. These schemas add no database, authentication, API, storage service, or project CRUD implementation.
