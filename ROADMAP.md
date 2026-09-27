# Roadmap — the parts you build

Version 1 is working. Everything below is yours to write. Do them in order, one commit
each, and the commit message is the story you tell in an interview.

## Level 1 — make it yours

- [ ] **Edit / update a transaction.** Right now a transaction can only be added or deleted.
      Add a pencil button next to each row that fills the form with that transaction so it
      can be re-saved. Keep the form in one component — do not build a modal yet.
- [ ] **Filter by category.** Buttons above the list. "All" plus one per category.
- [ ] **Filter by month.** A `<select>` listing the months that actually contain
      transactions, built from the data rather than hardcoded.

## Level 2 — the data gets real

- [ ] **Edit and delete should be undoable.** Show a "Deleted" toast with an *Undo* button
      for a few seconds instead of deleting immediately.
- [ ] **Sort.** Let the user sort by newest, oldest, or highest amount.
- [ ] **Search.** Filter the list by name as the user types.

## Level 3 — make it look worth screenshotting

- [ ] **A real chart.** Install `recharts` (`npm install recharts`) and draw a pie chart of
      spending per category, or a bar chart of the last 6 months. Put it in the Summary card.
- [ ] **A budget.** Let the user set a monthly limit per category. When they go over, show a
      warning. Decide for yourself: change the bar colour, or show text — and be able to say why.
- [ ] **Dark mode.** A toggle in the header. The colour variables at the top of
      `src/index.css` already make this easy — add a `.dark` class on `<html>` and override
      them.

## Level 4 — the serious version

- [ ] **Firebase.** Create a free project at console.firebase.google.com, enable email/password
      auth and Firestore, then move the data from `localStorage` to Firestore with one user
      per account. Put the config in `import.meta.env` — read
      `src/hooks/useLocalStorage.js` first to see why the current approach was a deliberate
      shortcut, and be ready to explain that trade-off in an interview.
- [ ] **Deploy it.** `npm run build`, then deploy the `dist/` folder to Vercel or Netlify
      (both have a free tier). A live link on your CV is worth more than a screenshot.

## When you are done

Write the README yourself, in your own words. Include one screenshot, the feature list, and —
the part most people skip — **one thing that was harder than expected and how you solved it**.
That last section is what interviewers actually read.
