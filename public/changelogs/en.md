## Kikitan is finally v1.1!

This marks an important milestone in the development cycle of Kikitan. While there are still issues such as misrecognition and mistranslation, these will be addressed in a later update. Recognition may remain as is for a while, but translation should hopefully see significant improvements and increased customizability!

### Performance and Stability Updates
- The loading and refreshing speed of Kikitan has drastically improved. You will notice the difference as soon as you open the application.
- The project has been converted from JavaScript and Next to TypeScript and Vite + React. This has cleaned up the entire codebase, allowing me to optimize and fix many existing issues.

### Bug Fixes
- The issue with percentage signs breaking translations has been resolved.
- The language swap button was incorrectly swapping languages. I switched to a dictionary-based system rather than an array-based one to fix this issue.
- The translation or speech detection feature was randomly stopping. This has been addressed by rewriting the entire detection and translation logic.

### UI Updates
- Updates are now automatic. When an update is downloading, users will be notified by a popup.
- A new setting has been added in the language options: "When translating to English, change the pronouns in the translation for gender-neutral languages."

If you encounter any issues, please contact me on X (@marquina_osu) or Discord (sergiomarquina).