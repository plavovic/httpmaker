# Website history manual tests

The project currently has no automated test runner. The reducer is exported as
`websiteHistoryReducer` from `hooks/useWebsiteHistory.ts` so reducer tests can be
added without rendering React when a test setup is introduced.

1. Type a sentence in one content field. Confirm one Undo restores the value
   from before typing and the tooltip names that field.
2. Pause for more than 1.2 seconds and type again. Confirm the two bursts undo
   separately.
3. Edit two different fields without pausing. Confirm they undo separately.
4. Change one style control repeatedly, then change a different style control.
   Confirm each control has its own grouped history entry.
5. Duplicate, move, change the variant of, and delete a section. Confirm each
   action produces one labeled Undo entry and Redo restores it.
6. Apply one design preset. Confirm it produces exactly one history entry.
7. Apply a theme palette. Confirm it produces exactly one history entry.
8. Trigger a mock AI prompt. Confirm it produces at most one `ai` entry and a
   no-op prompt produces none.
9. Undo after deleting the selected section. Confirm the restored selection is
   valid. Redo the deletion and confirm a valid fallback section is selected.
10. Undo an element change after its element is no longer available. Confirm
    the section stays selected and the invalid element selection is cleared.
11. Focus an input, textarea, select, or contenteditable element and use its
    native Undo/Redo shortcut. Confirm website history does not intercept it.
12. Outside form controls, confirm Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z redoes,
    and Ctrl+Y redoes on Windows/Linux.
13. Undo once, make a new change, and confirm the previous redo branch clears.
14. Submit an update that returns a structurally identical cloned website.
    Confirm it creates no history entry.
15. Call `clearHistory` and confirm the current website remains while Undo and
    Redo become unavailable. Call `resetHistory` with another website and
    confirm it becomes current with empty history.
16. Configure `maxHistory` to a small value, exceed it, and confirm only that
    number of past entries remains available.
