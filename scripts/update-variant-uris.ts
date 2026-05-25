/**
 * Updates token metadata URIs on an already-deployed contract (owner only).
 * Run: npx hardhat run scripts/update-variant-uris.ts --network base
 */
import hre from 'hardhat';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const APP_URL = 'https://my-mystic-crate.vercel.app';

function variantMetadataUri(id: number) {
  return `${APP_URL}/metadata/variants/${id}.json`;
}

async function main() {
  const envPath = join(process.cwd(), '.env.local');
  let contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

  if (existsSync(join(process.cwd(), 'lib', 'deployed-address.ts'))) {
    const src = readFileSync(join(process.cwd(), 'lib', 'deployed-address.ts'), 'utf8');
    const m = src.match(/0x[a-fA-F0-9]{40}/);
    if (m) contractAddress = m[0];
  }

  if (!contractAddress) {
    throw new Error('No contract address found');
  }

  const [signer] = await hre.ethers.getSigners();
  if (!signer) throw new Error('Set DEPLOYER_PRIVATE_KEY in .env.local');

  console.log('Owner wallet:', signer.address);
  console.log('Contract:', contractAddress);

  const MysticCrateNFT = await hre.ethers.getContractFactory('MysticCrateNFT');
  const contract = MysticCrateNFT.attach(contractAddress);

  const uris = Array.from({ length: 20 }, (_, i) => variantMetadataUri(i));
  const tx = await contract.setVariantURIs(uris);
  await tx.wait();
  console.log('Updated 20 variant URIs →', APP_URL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
