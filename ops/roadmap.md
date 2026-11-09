# Roadmap (owner-approved, Nov 8th, 2026)

Monetization model: free tools for traffic, a paid tier on the tools that get traffic. No dropshipping, no standalone apps.


## Accounts (Nov 9th, 2026)
- AdSense account created (the owner's personal Google account, publisher pub-3033001375409079). The script and ads.txt are live on both sites, the payment profile is done, and both sites were submitted for review on Nov 9th, 2026. Ads appear only after Google approves.
- Lemon Squeezy store "SubFixer" (subfixer.lemonsqueezy.com) exists. Identity and bank (****8448) were submitted Nov 9th, 2026 and are under review; the owner still has to submit tax info. Don't open decision issues for either signup.
- Ads go live once the owner adds the AdSense publisher ID (ca-pub-...) to the repo, and the paid tier once the Lemon Squeezy product exists. Traffic triggers below still decide when ads or pricing are shown.
## Paid tier (SubFixer Pro)
- Offer: batch fixing (many files at once, zip in and out), saved presets. About $4/month or $24/year.
- Checkout: Lemon Squeezy (merchant of record, handles sales tax). Costs nothing until someone pays.
- Stays client-side: files never leave the browser. The license key only unlocks features.
- Trigger: 1,000 or more visits in the last 30 days, summed from the visitors column of ops/metrics.csv. Check it every morning run.
- Only owner decision: when the trigger is hit, open one `decision` issue titled "Paid tier ready: create the Lemon Squeezy account and product" (it needs his identity, bank and tax details). Never sign up yourself, and don't open it twice.
- Everything else is yours to decide: the offer, the price, the copy and the build. Before the trigger, build the batch feature behind a flag and test it, but show no pricing.
- After he creates the product: wire the checkout and license key check, keep files client-side, and turn the flag on.

## Later
- The same paid-tier pattern on the file-tools site once it has traffic.

## Ads (first revenue)
- Trigger: about 300 visits a month in ops/metrics.csv and most tool pages indexed. Then open one `decision` issue asking the owner to apply for Google AdSense (it needs his identity and tax details). Never sign up yourself.
- After approval: fill the existing empty ad slot below the tool, one unit per page, never above the drop zone.
