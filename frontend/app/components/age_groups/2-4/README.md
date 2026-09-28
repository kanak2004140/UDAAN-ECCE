# UDAAN — 2–4 Little Explorers

This is the first visual prototype for the 2–4 age world.

## Important backend-safety rule

The component does NOT define the ECCE learning hierarchy.

It only receives:

```ts
subjects: LearningSubject[]
```

The current `app/learn/2-4/page.tsx` uses preview subjects so the page can be viewed before API integration.

Later the flow should be:

```text
Child
  ↓
age_group = 2–4
  ↓
Curriculum
  ↓
Subject
  ↓
Topic
  ↓
Learning Object
  ↓
Activity
  ↓
Activity Content
  ↓
Content Variant / Language
```

The visual world should stay unchanged while the data source changes from preview data to the existing backend API.

## Asset note

The preview is intentionally self-contained and uses CSS/HTML-friendly visuals rather than adding a new animation dependency.
