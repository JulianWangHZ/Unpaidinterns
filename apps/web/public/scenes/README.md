# Scene models

Each scene folder can hold its own character models. Anything missing falls back to the built-in figure.

1. Put `.glb` files in the scene folder, for example `park/mascot.glb`.
2. List them in that folder's `manifest.json`, one per state group:

```json
{
  "characters": {
    "working": { "file": "staff.glb" },
    "needsYou": { "file": "mascot.glb", "scale": 1.1 },
    "resting": { "file": "visitor.glb" },
    "trouble": { "file": "clown.glb" }
  }
}
```

Model requirements:

- Binary glTF (`.glb`), file names made of letters, numbers, `-` and `_`.
- About 1 unit tall, feet at the origin, facing +Z.
- Under 5k triangles; textures up to 1024 px.
- Animation clips named `idle`, `think`, `type`, `wave`, `stretch`, `slump`, `walk`. Missing clips fall back to `idle`.
