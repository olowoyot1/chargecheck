# OAATZ ChargeCheck

A Nigeria-first statement review tool from OAATZ Cosult Ltd.

## Current MVP
- Import CSV and Excel (.xls/.xlsx) statements in the browser.
- Normalise common date, narration, debit, credit and reference column names.
- Flag possible exact duplicate debits.
- Highlight fee-like descriptions for manual review.
- Highlight repeated merchant/description patterns.
- Export a plain-text review summary.

## Privacy
Statement parsing and analysis run in the user's browser. The current MVP does not upload statements, create user accounts, or retain case history. Never request bank passwords, PINs, OTPs, BVN or NIN.

## Important limitations
- A flag is an item to investigate, not proof of fraud or an incorrect charge.
- PDF statement layouts are not yet supported by bank-specific parsers. Scanned PDFs/OCR are not supported.
- Bank statement column formats vary; test and add parsers using consented, anonymised samples before claiming broad compatibility.
- No complaint is automatically submitted to a bank or regulator.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Build
```bash
npm run build
```

## Next milestones
1. Validate parsers against anonymised statements from multiple Nigerian banks and fintechs.
2. Add bank-specific text-PDF parsers and robust date/amount validation.
3. Add user authentication and case history only after privacy/security design.
4. Generate structured complaint packs and maintain an up-to-date directory of official complaint channels.
5. Complete NDPA/privacy, security and commercial-readiness review before launch.

Do not deploy this MVP as a production financial service without security, privacy and legal review.