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

## The ML is the interesting part

The app answers one question: *it is day 14 and I have spent this much, what will
I finish the month at?* The first version used a rule:

```js
projected = (spent / daysElapsed) * daysInMonth
```

That rule assumes a month is flat, and months are not. Day 3 looks cheap when it
carries almost no information, and a payday splurge gets extrapolated across the
rest of the month. So it is a **trained model** now, not a formula:

| | MAE on 4,792 unseen users | MAPE |
|---|---|---|
| naive spend-rate rule | 1146.7 | 19.4% |
| **linear regression (shipped)** | **838.9** | **15.9%** |
| quadratic regression | 791.7 | 14.4% |
| gradient boosting | 807.2 | 14.7% |

**26.8% lower error than the rule it replaced.** Twelve features, trained on
4,000 simulated users, exported as twelve coefficients and an intercept. There is
no ML library in the browser: inference is a dot product, so the project still
ships with two dependencies.

The training data is synthetic and the UI says so on the card that shows the
number. Why the shipped model is the linear one, how the features are built, and
how the model refuses to answer outside the range it was trained on: in
[The projection model](#the-projection-model).

## The projection model

The app has to answer one question: *it is day 14 and I have spent this much,
what will I finish the month at?*

The first version answered it with a rule:

```js
projected = (spent / daysElapsed) * daysInMonth
```

That assumes spending is flat across the month, and it is not. People get paid
at the start, weekends cost more, and the last few days are usually quiet. The
rule gets the early month badly wrong, which is exactly when someone most wants
to know if they are in trouble.

So the rule was replaced with a model.

**How it works.** `model/generate_data.py` simulates 4,000 synthetic users
living through 30-day months: an income level, a category mix, a payday bump, a
weekend bump, a quiet end of month, and a per-user "discipline" parameter.
`model/train.py` learns to predict the final month total from what is known on
day N, and exports the coefficients to `src/ml/weights.js`.

**The result**, on 4,792 observations from users the model never saw during
training:

| model | MAE | MAPE |
|---|---|---|
| naive spend-rate rule | 1146.7 | 19.4% |
| **linear regression (shipped)** | **838.9** | **15.9%** |
| quadratic regression | 791.7 | 14.4% |
| gradient boosting | 807.2 | 14.7% |

**26.8% lower error than the rule it replaced.**

Where the difference comes from, on a 6,000 income:

| | spent so far | naive | model |
|---|---|---|---|
| day 3, slow start | 210 | 2,100 | **3,474** |
| day 15, payday splurge | 4,100 | 8,200 | **7,238** |
| day 28, nearly done | 5,200 | 5,571 | **5,760** |

On day 3 the rule says you are fine because three quiet days look cheap. The
model knows three days tells you almost nothing. After a payday splurge the
rule catastrophically overshoots, because it assumes the splurge continues. The
model pulls back.

**Why a linear model and not gradient boosting.** Boosting was measured and it
was *worse* than linear regression on this data, which says the relationship is
close to linear and the extra machinery buys nothing. Shipping a linear model
also means inference is a dot product, so the browser needs no ML library at
all and the dependency count stays at two. The quadratic model was 3% better
than linear, not enough to justify hand-maintaining 90 coefficients in two
languages that have to stay in sync.

**What this does not prove.** The training data is synthetic. These numbers
show the pipeline works and that the features carry real signal, on data shaped
the way real spending is shaped. They are not a claim about how well the model
predicts a real person's month, and it will not be, because a model trained on
invented users has never seen a real one. The honest next step is to log
projections and outcomes from actual users, then retrain on that. The feature
extractor's input is already the shape that data would take.

There is no API key and no server involved. The model ships as 13 numbers (12
coefficients and an intercept) and inference is a dot product over a 12-element
vector.
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
| Tests | 32, on Node's built-in runner. No framework. |
| CI | GitHub Actions: install, test, build |

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
    ProjectionPanel.jsx              model projection next to the old rule
    InsightsPanel.jsx                insights with dismiss
    Summary.jsx                      headline totals on the dashboard
    Reveal.jsx                       per-item reveal
    Header.jsx                       brand, theme toggle, navigation
    Logo.jsx                         inline SVG
    charts/
      DonutChart.jsx                 category share, one circle + dasharray
      CategoryBars.jsx               spend per category with limit markers
      DailyTrend.jsx                 cumulative line with dashed pace line
  views/
    Dashboard.jsx                    charts and summary
    Expenses.jsx                     form and list
    Budgets.jsx                      income, limits, comparison
    Insights.jsx                     grouped rules
  ml/
    monthKey.js                      the current month as YYYY-MM
    month.js                         month spend to model input, shared by all callers
    features.js                      builds the model input vector
    predict.js                       inference, with naive fallback
    weights.js                       GENERATED by model/train.py, do not edit
test/
  features.test.js                   feature vector, no NaN on bad input
  predict.test.js                    model beats the rule, band narrows
  insights.test.js                   every spending rule
  month.test.js                       month totals and the shared projection input
model/
  generate_data.py                   synthetic spending generator
  train.py                           fits, scores and compares models, exports weights
  report.txt                         the numbers quoted below
  requirements.txt                   pinned, for reproducing the training
```

The `src/` tree is complete. The Gemini advisor that used to sit here was 308
lines that no view imported, so it was deleted rather than shipped and
documented as "planned". `modelInfo` is the one deliberate exception to
"nothing unreferenced": it is re-exported from `insights.js` for a view that
labels the projection, and is currently read only by the test suite.

Outside `src/`, the model is trained in Python. `npm run train` regenerates
`src/ml/weights.js` from scratch. The training data itself is not committed; it
is regenerated from a fixed seed.

### Data flow

`DataContext` is the only place data changes. Views never call `setState` on
transactions directly, they call the actions it exposes:

```
addTransaction  updateTransaction  deleteTransaction  deleteAllTransactions
setBudgetLimit  deleteBudgetLimit  clearBudget  setIncome
```

`insights.js` is a pure function of `(transactions, budget, month, income,
categories)`. It has no React in it, which is what makes the rules easy to test
and easy to reuse, and it is what the projection model sits on top of.


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

## Testing

```bash
npm test
```

32 tests, no test framework installed. They run on Node's built-in runner
(`node --test`) because every testable line in this project is a pure function
over plain data. The one deliberate constraint: the trained weights are emitted
as a `.js` module rather than `.json` specifically so `node --test` can import
them without import attributes and no bundler. That is what keeps the dependency
count at two.

| File | What it holds the line on |
|---|---|
| `test/features.test.js` | the feature vector matches the declared names, and no input produces `NaN` |
| `test/predict.test.js` | the model still beats the rule it replaced, a projection is never below money already spent, the error band narrows late in the month |
| `test/insights.test.js` | each spending rule fires when it should and stays quiet when it should not, no insight body can leak `NaN`, and a modelled number must carry a provenance note |

Two of these are regression guards rather than unit tests. `predict.test.js`
asserts the exact MAE pair from `model/report.txt`, and CI re-checks it, so
editing `features.js` or reordering the feature list without retraining fails
the build instead of quietly producing plausible wrong numbers in the browser.

CI (`.github/workflows/ci.yml`) runs `npm ci`, `npm test` and `npm run build` on
every push to `main` and on every pull request.

To retrain and confirm the numbers reproduce:

```bash
pip install -r model/requirements.txt
npm run train
```

## Known limits

- **The training data is synthetic.** The numbers prove the pipeline works and
  that the features carry signal. They are not a claim about anyone's real
  month, and the projection is not advice. The honest next step is logging
  predictions and outcomes from real users, then retraining on that.
- No component or DOM tests. The pure logic is covered; React rendering is not. The one known exception is .insight-note, which is asserted in `test/insights.test.js` but has no rendering test.
- No ESLint or Prettier config yet.
- Screenshots in this README predate the footer removal and the model, so they
  show an older build.

## License

MIT. See [LICENSE](LICENSE).
