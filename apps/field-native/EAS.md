# EAS build runbook

Expo Go (the pre-built app from the Play Store / App Store) stopped
supporting remote push notifications in SDK 53, so proximity alerts
only actually deliver on a **development build** — your own compiled
APK/IPA that includes the same native modules but runs your Metro JS
bundle in dev. You install it once, then keep developing against it.

All commands below run from `apps/field-native/` unless noted.

## One-time setup

1. Create a free Expo account at https://expo.dev.
2. Login from the CLI:
   ```sh
   pnpm eas:login
   ```
3. Create the Expo project (writes `extra.eas.projectId` into
   `app.config.ts` automatically):
   ```sh
   pnpm eas:init
   ```

## First dev build (Android)

Most flexible path for testing — produces an APK you sideload:

```sh
pnpm build:dev:android
```

This kicks off a remote build on Expo's servers. First build takes
~10–15 min; watch progress at the printed URL or via
`pnpm exec eas build:list`. When it finishes, the CLI prints a QR code
and a download link. On your phone:

1. Download the APK.
2. Enable "Install unknown apps" for your browser if prompted.
3. Install the APK.
4. The app icon will read "ClearWire Field" — open it.

Now start Metro pointing at the dev-client (not Expo Go):

```sh
pnpm start:dev-client
```

The dev client opens, scans for Metro, loads your bundle. Hot reload
works identically to Expo Go. Push notifications now actually fire.

## Subsequent dev builds

Only needed if you change native code or add a new native module
(anything that isn't a pure JS change). For JS changes, the running
dev client picks up the new bundle from Metro — no rebuild required.

Rebuild triggers:
- Adding / removing an `expo-*` package that includes native code
- Changing `app.config.ts` permissions, bundle identifiers, or plugins
- Bumping Expo SDK

## iOS

```sh
pnpm build:dev:ios
```

Requires an Apple Developer account ($99/yr). The CLI walks you through
provisioning. If you don't have that yet, Android is the fastest path.

## Production build

```sh
pnpm build:production
```

Builds both iOS and Android production artifacts signed for store
distribution. Don't run until you're ready to submit.

## Troubleshooting

- **`eas: command not found`** — run `pnpm install` at the repo root
  first. `eas-cli` is a dev-dep on this package.
- **Build fails on app icons** — `app.config.ts` still points at
  `./assets/icon.png` etc. Drop real PNGs into `apps/field-native/assets/`
  before shipping, or temporarily comment those fields out.
- **Push token returns empty on the dev build** — confirm
  `extra.eas.projectId` is set in `app.config.ts` (done by
  `eas init`). The token is project-scoped in dev/prod builds.
