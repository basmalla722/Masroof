# Masroof

Track what you spend.

A small expense tracker built with React and Vite. You add your expenses, set
limits per category, and the app tells you what your spending is doing — before
you run out of money, not after.

No backend and no account. Everything stays in the browser with `localStorage`.

## What it does

- **Add, edit and delete expenses** with a title, amount, date and category.
- **Filter and search** the list by category or by text.
- **Category budgets.** Set a monthly limit for any category and see the bar
  fill up.
- **Your own categories.** Pick `Other` in the dropdown and type a name. It is
  saved on that expense only — it does not permanently change the category list.
- **Monthly income.** Put in your income and the app shows what is left, plus
  the amount you can safely spend per day for the rest of the month.
- **Insights.** Plain-language warnings: over budget, on track to overshoot, a
  category taking over the month, categories with no limit, and spending above
  your income. Each one can be dismissed on its own or cleared at once.
- **Light and dark mode**, remembered between visits.

## Tech

- React 18 (hooks only, no class components)
- Vite 6
- Plain CSS with custom properties for the two themes
- `localStorage` for persistence, wrapped in one small `useLocalStorage` hook
- `IntersectionObserver` for the scroll animations

There is no state management library and no UI library. The categories live in
a React Context so every component reads from one source.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL. For a production build:

```bash
npm run build
npm run preview
```

`start.bat` does both steps for you if you are on Windows.

## Project structure

```
src/
  App.jsx                  state, filtering, and the layout
  data.js                  default categories and the colour helper
  insights.js              all of the spending rules
  components/              the cards on the page
  context/                 CategoriesContext
  hooks/                   useLocalStorage, Soft (scroll animation)
  services/                Gemini advisor, kept for later
```

## Notes

- The Gemini advisor UI is not enabled yet. The code is in `src/services/` and
  needs a `VITE_GEMINI_API_KEY` in `.env.local` if you want to bring it back.
- The `localStorage` keys are still named `expense-tracker-*` from before the
  rename to Masroof, so old data keeps working.
