import {
  fetchDigitalAsset,
  findMetadataPda,
  mplTokenMetadata,
  verifyCollection,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile("../../Desktop/wallet-keypair.json");

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user :", user.publicKey.toBase58());

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));
console.log("Set up umi instance for user");

const collectionAddress = publicKey(
  "DRBoZLvRhsMiXeHBY6zxfcdP5BgScntKoRexDfsvZiLZ"
);

const nftAddress = publicKey("CqcVfR9uiA32nYqAty3AbyhzuVBtPmJfJrXt9FSY4mXs");
const transaction = await verifyCollectionV1(umi, {
  metadata: findMetadataPda(umi, { mint: nftAddress }),
  collectionMint: collectionAddress,
  authority: umi.identity,
});

transaction.sendAndConfirm(umi);
console.log("Collection verified successfully:", collectionAddress);
console.log("Explorer link:", getExplorerLink("address", nftAddress, "devnet"));
