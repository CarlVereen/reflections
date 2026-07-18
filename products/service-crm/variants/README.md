# Niche variants

The engine (`../Code.gs`) is shared. A niche edition is just a different **CONFIG
block** at the top of the script — so one bug fix covers every variant.

## Current variants

| Variant | Product name | Accent | Config file |
|---|---|---|---|
| Universal | Service Pro CRM | Amber `#b8823a` | *(default in `Code.gs`)* |
| Cleaning | Cleaning Business CRM | Teal `#2f9e9e` | `cleaning.gs` |
| Lawn Care | Lawn Care CRM | Green `#4f8f3a` | `lawncare.gs` |

## Fulfilling a variant sale (~3 min)

1. Make a copy of the Universal **master** sheet → rename it (e.g. "Cleaning Business CRM — MASTER").
2. `Extensions ▸ Apps Script`. In `Code.gs`, delete the existing `CONFIG = { … }` block
   and paste the variant's block from the matching file here.
3. Reload the sheet → `⚡ CRM ▸ Set up / rebuild database`. The whole product re-skins:
   dashboard title, accent color, and service dropdowns all update.
4. Fulfill the sale as usual (copy → share link → deliver).

## Adding a new niche later

Copy `cleaning.gs`, change `productName`, the two accent colors, and the `services`
list. That's a whole new product in about 2 minutes.
