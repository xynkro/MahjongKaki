# App Store Submission Notes

## Age Rating
- 17+ (references gambling themes — mahjong is traditionally associated with wagering)
- App does NOT move money, hold money, or facilitate wagering
- App is a calculator/scorekeeper only

## Compliance
- No analytics capturing player names
- Session data stays on-device unless user opts into sync
- Original art only — no copied tile sets or sounds

## Capacitor Build
- iOS: `npx cap add ios && npx cap open ios`
- Android: `npx cap add android && npx cap open android`

## RevenueCat IAP (Phase 2)
- Product: "Pro" one-time purchase (~S$6.98)
- Features gated: AI analysis, cloud sync, themes
