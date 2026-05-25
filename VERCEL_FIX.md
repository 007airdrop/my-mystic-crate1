# Fix: Farcaster shows OLD app (two Vercel projects)

Farcaster is tied to **`https://my-mystic-crate.vercel.app`** (see `public/.well-known/farcaster.json`).

The project **`my-mystic-crate-mfx9`** is a duplicate — it gets new GitHub deploys, but **Farcaster never uses that URL**.

## Do this once (5 minutes)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open project **`my-mystic-crate`** (NOT `my-mystic-crate-mfx9`)
3. **Settings → Git** → connect repo `007airdrop/my-mystic-crate`, branch `main`
4. **Deployments** → **Redeploy** latest (or wait for auto-deploy after push)
5. Optional: delete or pause **`my-mystic-crate-mfx9`** to avoid confusion

## Vercel env (project `my-mystic-crate`)

Add:

```
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xa136B5d667ca3cd208595863B1797bfFAdf0720b
```

Then redeploy again.

## After deploy

- Open https://my-mystic-crate.vercel.app — you should see bottom tabs: Check-in, Spin, Crate, Items, Ranks
- In Warpcast: close mini app completely and open again
