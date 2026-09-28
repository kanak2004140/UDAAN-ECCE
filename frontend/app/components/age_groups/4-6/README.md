# UDAAN — 4–6 Curious Learners

This is the 4–6 visual prototype.

The experience is intentionally a little more structured than the 2–4 world:
- larger learning-world cards
- readable labels
- audio/read-to-me action
- adventure progress map
- reward/progress feedback

The component accepts `subjects` as props.

The preview subjects in `app/learn/4-6/page.tsx` are UI-only placeholders. Do not seed these into the database.

Future data flow:

Child -> age group -> Curriculum -> Subject -> Topic -> Learning Object -> Activity -> Activity Content -> Content Variant/Language

Keep the existing backend and database as the source of truth.
