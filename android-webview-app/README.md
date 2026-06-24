# StudyTrack Android

This is a small Android WebView wrapper for the hosted StudyTrack app.

Configure the private server URL in `local.properties` (this file is ignored by Git):

```text
studytrack.app.url=https://your-domain.example
```

Build a debug APK:

```powershell
gradle assembleDebug
```

Output:

```text
app/build/outputs/apk/debug/app-debug.apk
```
