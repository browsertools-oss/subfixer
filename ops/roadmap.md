# Roadmap (owner-approved, Nov 8th, 2026)

Owner direction (11-15-2026): everything is designed and optimized for revenue first and foremost. The weekly planner may change the triggers, order and offers below when the evidence says revenue comes sooner; owner-only steps (sign-ins, spending, tax and payment details) stay with the owner.

Monetization model: free tools for traffic, a paid tier on the tools that get traffic. No dropshipping, no standalone apps.


## Accounts (Nov 9th, 2026)
- AdSense account created (the owner's personal Google account, publisher pub-3033001375409079). The script and ads.txt are live on both sites, the payment profile is done, and both sites were submitted for review on Nov 9th, 2026. Ads appear only after Google approves.
- Lemon Squeezy turned down the store on Nov 16th, 2026 (it is winding down and takes no new stores). Don't use Lemon Squeezy.
- Checkout provider is Polar (polar.sh), chosen by the owner Nov 16th, 2026. No Polar account exists yet; the owner creates it (GitHub sign-in, identity and payout) when the paid-tier trigger is hit. Don't open a decision issue for it before then.
- Ads go live once the owner adds the AdSense publisher ID (ca-pub-...) to the repo, and the paid tier once the Polar product exists. Traffic triggers below still decide when ads or pricing are shown.
## Paid tier (SubFixer Pro)
- Offer: batch fixing (many files at once, zip in and out), saved presets. About $4/month or $24/year.
- Checkout: Polar (merchant of record, handles sales tax, built-in license keys). Costs nothing until someone pays.
- Stays client-side: files never leave the browser. The license key only unlocks features.
- Trigger: 1,000 or more visits in the last 30 days, summed from the visitors column of ops/metrics.csv. Check it every morning run.
- Only owner decision: when the trigger is hit, open one `decision` issue titled "Paid tier ready: set up Polar and create the product" (only the owner creates the account and signs in). In it, list the product, prices and the license-key benefit to configure. Never sign up yourself, and don't open it twice.
- Everything else is yours to decide: the offer, the price, the copy and the build. Before the trigger, build the batch feature behind a flag and test it, but show no pricing.
- After he creates the product: wire Polar checkout and the license key check (Polar's public license-key validate endpoint, called from the browser), keep files client-side, and turn the flag on.

## Later
- 11-26-2026 (CEO): MKV to MP4 without re-encoding, keeping text subtitles as mov_text (/mkv-to-mp4/), the widest phrase family our MKV and MP4 code can reach. Remux is also a Pro candidate (batch, many files) once the Pro trigger comes.
- The same paid-tier pattern on the file-tools site once it has traffic.

## Ads (first revenue)
- Trigger: about 300 visits a month in ops/metrics.csv and most tool pages indexed. AdSense was already applied for on Nov 9th, 2026 (code and ads.txt are live). Once it is approved and earning, open one `decision` issue asking the owner to add his AdSense tax info. Never sign in yourself.
- After approval: fill the existing empty ad slot below the tool, one unit per page, never above the drop zone.
