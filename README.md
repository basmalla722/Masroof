# Masroof

> A spending tracker that tells you what to do before you run out of money.

**[Live demo →](https://masroof-sigma.vercel.app/)** · **[Source code →](https://github.com/basmalla722/Masroof)**

![Dashboard](docs/dashboard.png)

## Why Masroof?

Most expense trackers are a table and a total. The part that is actually hard is
the advice: is this month fine, or is it already too late?

Masroof takes expenses, a budget per category, and a monthly income, then
produces a small set of concrete warnings — over budget, on track to overshoot,
one category eating the month, spending above income, and what is safe to spend
per day for the rest of the month.

The insights are the product, not the chart. Everything is written in plain
English on purpose.

## Privacy

No account, no backend, no server-side storage. Data is stored locally in your
browser using `localStorage`, and it never leaves your device. Clearing your
browser data clears your expenses, and there is no sync between devices.

## Features

**Expenses**
- Add, edit and delete expenses with title, amount, date and category
- Filter by category, search by name
- Validation with inline errors, focus moved to the first problem, and a shake
- Clear all with a confirmation step

**Budgets**
- A monthly limit per category, including limits on your own category names
- Per-limit delete, plus clear all
- The bar turns red once you are over

**Insights**
- Over budget, and by how much
- On track to overshoot, projected to the end of the month
- One category taking more than a third of the total
- Spending above your monthly income
- Safe daily spend for the rest of the month
- Dismiss one insight or clear them all; dismissed ones stay gone

**Interface**
- Four views: Dashboard, Expenses, Budgets, Insights, with deep links (`#/budgets`)
- Charts with no chart library: donut, category bars with limit markers, and a
  day-by-day cumulative line with a dashed pace line
- Light and dark themes, remembered between visits
- Responsive from 320px up
- Scroll reveal and soft parallax, both respecting reduced motion

## Tech stack

| | |
|---|---|
| React 18 | hooks only, no classes |
| Vite 6 | build and dev server |
| CSS | custom properties, no framework |
| State | React Context, three providers |
| Charts | hand-written SVG |
| Storage | `localStorage` behind one hook |
| Dependencies in `package.json` | `react`, `react-dom`. That is it. |

## Screenshots

| Expenses | Budgets |
|---|---|
| ![Expenses](docs/expenses.png) | ![Budgets](docs/budgets.png) |

| Insights | Dashboard |
|---|---|
| ![Insights](docs/insights.png) | ![Dashboard](docs/dashboard.png) |

## Architecture

```
src/
  main.jsx                            provider order: preferences > data > categories
  App.jsx                             layout, routing, theme
  index.css                          all styling, design tokens, responsive, reduced motion
  data.js                            default categories, palette, colour from name
  insights.js                        every spending rule, pure functions
  advisor.css                        styles for the unfinished advisor only
  context/
    PreferencesContext.jsx           theme preference
    DataContext.jsx                  transactions, budget, income + all mutations
    CategoriesContext.jsx            the five default categories
  hooks/
    useLocalStorage.js               persistence
    useInView.js                     IntersectionObserver, used by two components
    useHashRoute.js                  routing on window.location.hash
    useMotion.js                     reduced-motion handling
    Soft.jsx                         reveal then scroll-linked parallax
  utils/
    format.js                        currency, dates, month keys
  components/
    states.jsx                       empty, no results, error, skeleton
    TransactionForm.jsx              add and edit
    TransactionList.jsx              list, search, filter, delete
    BudgetPanel.jsx                  limits
    IncomePanel.jsx                  income and safe daily spend
    InsightsPanel.jsx                insights with dismiss
    Summary.jsx                      headline totals on the dashboard
    Reveal.jsx                       per-item reveal
    Header.jsx                       brand, theme toggle, navigation
    Logo.jsx                         inline SVG
    AdvisorChat.jsx                  NOT MOUNTED, see Planned / unfinished
    charts/
      DonutChart.jsx                 category share, one circle + dasharray
      CategoryBars.jsx               spend per category with limit markers
      DailyTrend.jsx                 cumulative line with dashed pace line
  views/
    Dashboard.jsx                    charts and summary
    Expenses.jsx                     form and list
    Budgets.jsx                      income, limits, comparison
    Insights.jsx                     grouped rules
  services/
    gemini.js                        NOT MOUNTED, see Planned / unfinished
    tools.js                         NOT MOUNTED, see Planned / unfinished
```

This tree is every file under `src/`. The three marked `NOT MOUNTED` are not
imported by the running app; they are listed here so the tree matches the
repository exactly.

### Data flow

`DataContext` is the only place data changes. Views never call `setState` on
transactions directly, they call the actions it exposes:

```
addTransaction  updateTransaction  deleteTransaction  deleteAllTransactions
setBudgetLimit  deleteBudgetLimit  clearBudget  setIncome
```

`insights.js` is a pure function of `(transactions, budget, month, income,
categories)`. It has no React in it, which is what makes the rules easy to test
and easy to reuse, and it is what a Gemini advisor would sit on top of if that
part of the project is ever finished.

## Decisions and challenges

**No chart library.** Recharts is 100 kB+ and a lot more than three small
charts. The donut is a single circle with `stroke-dasharray`, the bars are
divs, and the day-by-day line is a path built from cumulative sums. The whole
app ships 58 kB of gzipped JavaScript and 4 kB of gzipped CSS.

**Custom categories that do not pollute the list.** Picking `Other` lets you type
a name. The name is stored on that expense only, so you can log "Haircut" once
without "Haircut" appearing in the dropdown for the rest of your life. Names that
exist in your data get a colour derived from the name itself, so the same
category is always the same colour.

**The old localStorage keys were renamed.** The app moved from `expense-tracker-*`
to `masroof-*`. `DataProvider` migrates every old value on first load, writes the
new key, and only then clears the old one, so nothing is lost and a refresh
cannot break it. `index.html` also reads the old theme key during its inline
pre-paint script so returning visitors do not get a light-mode flash.

**The scroll animation took two attempts.** The first version used a CSS
transition to drive a value that JavaScript was also writing, which made
everything feel like jelly. The fix was a `ready` class that removes the
transition once the reveal has finished, so the scroll handler can write
`transform` directly with no smoothing in the way. Scroll work is
`requestAnimationFrame`-throttled and the listeners are passive.

**Animations are not decoration.** Every animation here either shows where
something came from or confirms something happened. There is no in-app switch for
them: `prefers-reduced-motion` is the only control, and when the OS asks for
reduced motion the animations stop. There is deliberately no way to override
that from inside the app.

**Colour is derived, not stored.** A custom category name is hashed into a
ten-colour palette, so it always gets a stable colour and never collides with a
neighbour's.

## Accessibility

- Skip link, labelled navigation, `aria-current` on the active tab
- Every interactive element reachable and visible on keyboard focus
- Icon-only buttons carry `aria-label` and `title`
- Form errors are text, not just a red border, and focus moves to the first one
- `prefers-reduced-motion` disables animation, and there is no in-app override

## Running it

```bash
npm install
npm run dev
```

```bash
npm run build      # production build into dist/
npm run preview    # serve the build locally
```

On Windows, `start.bat` installs nothing but starts the dev server and opens the
browser.

## Deploying

The build output is a static `dist/` folder, so any static host works.
`vercel.json` and `public/_redirects` are already set up for Vercel and Netlify.

## Planned / unfinished

These files are in the repository but are **not part of the running app**. They
are not imported by any view and you will not find them in the live demo.

| File | State |
|---|---|
| `src/services/gemini.js` | Gemini API client. Needs `VITE_GEMINI_API_KEY` in `.env.local`. |
| `src/services/tools.js` | Tool definitions the advisor would call. |
| `src/components/AdvisorChat.jsx` | Advisor chat UI. Not mounted. |
| `src/advisor.css` | Styles for that UI only. |

`.env*` is gitignored; `.env.example` is committed and documents the variable
name. Nothing about this feature is wired into the live demo, and no API key is
in the repository.
