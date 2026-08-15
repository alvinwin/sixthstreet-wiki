# sixth street image workflow

For iterative hero-image work in this repository:

1. Consult the current official OpenAI image-generation guidance before the first edit in a working sequence.
2. Make one controlled image change at a time with the image-generation skill.
3. Inspect the rendered output before proposing or generating another pass.
4. Name visible defects concretely, including pseudo-text, repeated micro-patterns, drift, crop safety, contrast, and material inconsistency.
5. Continue from the last user-accepted image, not automatically from the newest image.
6. Preserve explicit invariants on every edit and do not integrate an image into the site until Alvin accepts it.

Official guidance supports explicit change-versus-preserve constraints and small iterative edits:
https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
