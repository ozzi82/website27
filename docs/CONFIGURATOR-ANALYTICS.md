# How many people use the configurator

The configurator already reports these events to Google Analytics 4 (through Tag Manager), only for visitors who accepted cookies:

| Event | Meaning | Extra info |
|---|---|---|
| `configurator_artwork` | Someone typed text or uploaded artwork and saw their sign | `source`: text / upload |
| `configurator_system` | Switched to another sign type | `configuration` |
| `configurator_option` | Changed a setting (size, depth, colours, background, day/night, vinyl...) | `option`, `value`, `configuration` |
| `configurator_building_view` / `_download` | Opened / saved the glass-tower picture | `configuration` |
| `configurator_photo_view` / `_measured` / `_download` | Used their own building photo / set a true size / saved the picture | `configuration` |
| `configurator_quote_click` | Clicked Get a Quote from the configurator | `configuration` |
| `generate_lead` | Quote form sent (also covers non-configurator leads) | |

## Reports to build in GA4 (Explore, free-form / funnel)
1. **Users who built a sign:** Explore, Free form, metric Total users, filter event name = `configurator_artwork`. Add breakdown by `source`.
2. **Funnel:** Explore, Funnel exploration: `page_view` (page = /configurator) -> `configurator_artwork` -> `configurator_option` -> `configurator_quote_click` -> `generate_lead`.
3. **Most chosen sign types:** event `configurator_system`, breakdown by custom dimension `configuration`.
4. **What people change:** event `configurator_option`, breakdown by `option` and `value`.
5. **Feature use:** counts of `configurator_building_view` and `configurator_photo_view`.

To break down by `configuration`, `option`, `value` and `source`, register them once in GA4: Admin -> Custom definitions -> Create custom dimension (scope: Event) with the same names.

## Caveat
Numbers only include visitors who accepted the cookie banner (Consent Mode v2), so real usage is higher than GA4 shows. For a total-visits count regardless of consent, add a cookie-free counter (for example Cloudflare Web Analytics, already available on the free plan) and compare the two.
